import type { Plugin } from 'graphql-yoga';
import { Logger } from '../logger';
import { ContextType } from '../types';

export const useLogger = (): Plugin<ContextType> => {
  return {
    onEnveloped({ context, extendContext }) {
      if (!context) return;
      const logger = new Logger();
      logger.setRequestId(context.requestId);
      logger.setClient(context.request.headers.get('client')?.trim() || null);
      extendContext({ logger: logger });
    },
  };
};
