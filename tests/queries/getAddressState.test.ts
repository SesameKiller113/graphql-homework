import { parse } from 'graphql';
import { executor } from '../exectuor';
import { addressStore } from '../../src/schema/address/store';
import { Addresses } from '../../src/schema/address/types';

const addresses: Addresses = {
  withState: {
    street: '123 Test St.',
    city: 'Testville',
    state: 'CA',
    zipcode: '90001',
  },
  withoutState: {
    street: '123 Test St.',
    city: 'Testville',
    zipcode: '90001',
  },
};

const query = parse(`
  query GetAddress($username: String!) {
    address(username: $username) {
      street
      city
      state
      zipcode
    }
  }
`);

describe('address state', () => {
  beforeEach(() => {
    jest.spyOn(addressStore, 'get').mockImplementation(async username => addresses[username] ?? null);
  });

  afterEach(() => jest.restoreAllMocks());

  test('returns state when the address has one', async () => {
    const result = await executor({ document: query, variables: { username: 'withState' } });

    expect(result).toEqual({
      data: {
        address: {
          street: '123 Test St.',
          city: 'Testville',
          state: 'CA',
          zipcode: '90001',
        },
      },
    });
  });

  test('returns null when the address has no state', async () => {
    const result = await executor({ document: query, variables: { username: 'withoutState' } });

    expect(result).toEqual({
      data: {
        address: {
          street: '123 Test St.',
          city: 'Testville',
          state: null,
          zipcode: '90001',
        },
      },
    });
  });
});
