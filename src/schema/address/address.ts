import { Address, Args, CreateAddressArgs } from './types';
import { GraphQLError } from 'graphql';
import { ContextType } from '../../types';
import { addressStore } from './store';

export const getAddress = async (_: unknown, args: Args, context: ContextType): Promise<Address> => {
  context.logger.info('getAddress', { event: 'Enter resolver' });
  const address = await addressStore.get(args.username);
  if (address) {
    context.logger.info('getAddress', { event: 'Returning address' });
    return address;
  }
  context.logger.error('getAddress', { event: 'No address found' });
  throw new GraphQLError('No address found in getAddress resolver');
};

export const createAddress = async (_: unknown, args: CreateAddressArgs, context: ContextType): Promise<Address> => {
  context.logger.info('createAddress', { event: 'Enter resolver' });
  try {
    const address = await addressStore.create(args.username, args.address);
    context.logger.info('createAddress', { event: 'Address created' });
    return address;
  } catch (error) {
    context.logger.error('createAddress', { event: 'Failed to create address' });
    throw error;
  }
};
