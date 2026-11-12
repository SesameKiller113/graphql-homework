import { readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { GraphQLError } from 'graphql';
import { Address, Addresses } from './types';

export class AddressStore {
  constructor(private filePath: string) {}

  private read(): Addresses {
    return JSON.parse(readFileSync(this.filePath, 'utf8'));
  }

  async get(username: string): Promise<Address | null> {
    const addresses = this.read();
    return Object.prototype.hasOwnProperty.call(addresses, username) ? addresses[username] : null;
  }

  async create(username: string, address: Address): Promise<Address> {
    const addresses = this.read();
    if (Object.prototype.hasOwnProperty.call(addresses, username)) {
      throw new GraphQLError('An address already exists for this username', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const updatedAddresses = { ...addresses, [username]: address };
    const temporaryPath = `${this.filePath}.tmp`;
    try {
      writeFileSync(temporaryPath, JSON.stringify(updatedAddresses, null, 2), 'utf8');
      renameSync(temporaryPath, this.filePath);
    } finally {
      if (existsSync(temporaryPath)) {
        unlinkSync(temporaryPath);
      }
    }
    return address;
  }
}

export const addressStore = new AddressStore(path.join(__dirname, '../../../data/addresses.json'));
