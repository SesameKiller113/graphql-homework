import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { GraphQLError } from 'graphql';
import { Address, Addresses } from './types';

export class AddressStore {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private filePath: string) {}

  private async read(): Promise<Addresses> {
    return JSON.parse(await readFile(this.filePath, 'utf8'));
  }

  async get(username: string): Promise<Address | null> {
    const addresses = await this.read();
    return Object.prototype.hasOwnProperty.call(addresses, username) ? addresses[username] : null;
  }

  create(username: string, address: Address): Promise<Address> {
    const operation = this.writeQueue.then(async () => {
      const addresses = await this.read();
      if (Object.prototype.hasOwnProperty.call(addresses, username)) {
        throw new GraphQLError('An address already exists for this username', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updatedAddresses = { ...addresses, [username]: address };
      const temporaryPath = `${this.filePath}.tmp`;
      try {
        await writeFile(temporaryPath, JSON.stringify(updatedAddresses, null, 2), 'utf8');
        await rename(temporaryPath, this.filePath);
      } finally {
        await rm(temporaryPath, { force: true });
      }
      return address;
    });

    this.writeQueue = operation.then(() => undefined).catch(() => undefined);
    return operation;
  }
}

export const addressStore = new AddressStore(path.join(__dirname, '../../../data/addresses.json'));
