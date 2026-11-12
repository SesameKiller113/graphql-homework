import type { Plugin } from 'graphql-yoga';
import { v4 as uuid } from 'uuid';
import { ContextType } from '../types';

export const buildHeaders = (): Plugin<ContextType> => {
  return {
    onEnveloped({ context, extendContext }) {
      if (!context) return;
      const requestId = uuid();
      extendContext({ requestId: requestId });
    },
  };
};
