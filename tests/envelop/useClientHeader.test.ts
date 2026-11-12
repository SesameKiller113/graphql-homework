import { createYoga } from 'graphql-yoga';
import { genSchema } from '../../src/schema';
import plugins from '../../src/envelop';
import { addressStore } from '../../src/schema/address/store';

const yoga = createYoga({ schema: genSchema(), plugins });
const address = { street: '1 Test St.', city: 'Boston', state: 'MA', zipcode: '02101' };
const query = '{ address(username: "jack") { street city state zipcode } }';
const mutation = `mutation {
  createAddress(username: "header-test", address: {
    street: "1 Test St.", city: "Boston", state: "MA", zipcode: "02101"
  }) { street city state zipcode }
}`;

const send = async (source: string, client?: string) => {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/graphql-response+json',
      ...(client === undefined ? {} : { client }),
    },
    body: JSON.stringify({ query: source }),
  });
  return { status: response.status, body: await response.json() };
};

describe('client header', () => {
  beforeEach(() => {
    jest.spyOn(addressStore, 'get').mockResolvedValue(address);
    jest.spyOn(addressStore, 'create').mockResolvedValue(address);
  });

  afterEach(() => jest.restoreAllMocks());

  test('rejects a query without client', async () => {
    const response = await send(query);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ errors: [{ message: 'The client header is required' }] });
    expect(addressStore.get).not.toHaveBeenCalled();
  });

  test('rejects a mutation without client', async () => {
    const response = await send(mutation);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ errors: [{ message: 'The client header is required' }] });
    expect(addressStore.create).not.toHaveBeenCalled();
  });

  test('allows queries from strata', async () => {
    expect(await send(query, 'strata')).toEqual({ status: 200, body: { data: { address } } });
    expect(addressStore.get).toHaveBeenCalledWith('jack');
  });

  test('rejects mutations from strata', async () => {
    const response = await send(mutation, 'strata');
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ errors: [{ message: 'Client strata can only execute queries' }] });
    expect(addressStore.create).not.toHaveBeenCalled();
  });

  test('allows queries and mutations from another client', async () => {
    expect(await send(query, 'test')).toEqual({ status: 200, body: { data: { address } } });
    expect(await send(mutation, 'test')).toEqual({ status: 200, body: { data: { createAddress: address } } });
    expect(addressStore.create).toHaveBeenCalledTimes(1);
  });
});
