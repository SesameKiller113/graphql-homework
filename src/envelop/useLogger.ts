import type { Plugin } from '@envelop/core';
import { Logger } from '../logger';
import { ContextType } from '../types';

export const useLogger = (): Plugin<ContextType> => {
  return {
    onParse({ context, extendContext }) {
      const logger = new Logger();
      logger.setRequestId(context.requestId);
      extendContext({ logger: logger });
    },
  };
};
