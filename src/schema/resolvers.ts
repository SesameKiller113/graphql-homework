import { createAddress, getAddress } from './address/address';
import { Address, Args, CreateAddressArgs } from './address/types';
import { ContextType } from '../types';

export const resolvers = {
  Query: {
    address: (parent: unknown, args: Args, context: ContextType): Promise<Address> => {
      return getAddress(parent, args, context);
    },
  },
  Mutation: {
    createAddress: (parent: unknown, args: CreateAddressArgs, context: ContextType): Promise<Address> => {
      return createAddress(parent, args, context);
    },
  },
};
