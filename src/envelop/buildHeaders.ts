import type { Plugin } from 'graphql-yoga';
import { v4 as uuid } from 'uuid';
import { ContextType } from '../types';

export const buildHeaders = (): Plugin<ContextType> => {
  return {
    onExecute({ extendContext }) {
      const requestId = uuid();
      extendContext({ requestId: requestId });
    },
  };
};
