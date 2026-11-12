import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parse } from 'graphql';
import { AddressStore, addressStore } from '../../src/schema/address/store';
import { Address } from '../../src/schema/address/types';
import { executor } from '../exectuor';

const existingAddresses = {
  jack: { street: '123 Street St.', city: 'Sometown', zipcode: '43215' },
};
const address: Address = { street: '1 Test St.', city: 'Boston', state: 'MA', zipcode: '02101' };
const mutation = parse(`
  mutation CreateAddress($username: String!, $address: AddressInput!) {
    createAddress(username: $username, address: $address) {
      street city state zipcode
    }
  }
`);
const query = parse(`
  query GetAddress($username: String!) {
    address(username: $username) { street city state zipcode }
  }
`);

const create = (username: string, input: Address = address) =>
  executor({ document: mutation, variables: { username, address: input } });

describe('createAddress', () => {
  let directory: string;
  let filePath: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'address-test-'));
    filePath = path.join(directory, 'addresses.json');
    await writeFile(filePath, JSON.stringify(existingAddresses));
    const store = new AddressStore(filePath);
    jest.spyOn(addressStore, 'get').mockImplementation(username => store.get(username));
    jest.spyOn(addressStore, 'create').mockImplementation((username, input) => store.create(username, input));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  test('saves a new address, preserves existing records and allows querying it', async () => {
    expect(await create('tom')).toEqual({ data: { createAddress: address } });
    expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual({ ...existingAddresses, tom: address });
    expect(await executor({ document: query, variables: { username: 'tom' } })).toEqual({
      data: { address },
    });
  });

  test('rejects an existing username without changing its address', async () => {
    const before = await readFile(filePath, 'utf8');
    expect(await create('jack')).toMatchObject({
      data: { createAddress: null },
      errors: [{ message: 'An address already exists for this username' }],
    });
    expect(await readFile(filePath, 'utf8')).toBe(before);
    expect(await create('tom')).toEqual({ data: { createAddress: address } });
  });

  test('accepts an address without state', async () => {
    const input = { street: '1 Test St.', city: 'Boston', zipcode: '02101' };
    expect(await create('tom', input)).toEqual({ data: { createAddress: { ...input, state: null } } });
    expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual({ ...existingAddresses, tom: input });
  });

  test('rejects a missing required address field before saving', async () => {
    const result = await executor({
      document: mutation,
      variables: { username: 'tom', address: { city: 'Boston', zipcode: '02101' } },
    });
    expect(result).toMatchObject({ errors: expect.any(Array) });
    expect(addressStore.create).not.toHaveBeenCalled();
    expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual(existingAddresses);
  });

  test('preserves both addresses when two requests arrive together', async () => {
    await Promise.all([create('tom'), create('sam')]);
    expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual({
      ...existingAddresses, tom: address, sam: address,
    });
  });

  test('allows only one concurrent create for the same username', async () => {
    const results = await Promise.all([create('tom'), create('tom')]);
    expect(results).toEqual(expect.arrayContaining([
      { data: { createAddress: address } },
      expect.objectContaining({ errors: expect.any(Array), data: { createAddress: null } }),
    ]));
    expect(JSON.parse(await readFile(filePath, 'utf8'))).toEqual({ ...existingAddresses, tom: address });
  });
});
