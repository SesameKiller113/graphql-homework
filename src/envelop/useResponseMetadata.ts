import { isAsyncIterable } from '@graphql-tools/utils';
import type { Plugin } from 'graphql-yoga';
import { ContextType } from '../types';

export const useResponseMetadata = (): Plugin<ContextType> => ({
  onExecutionResult({ context, result, setResult }) {
    if (isAsyncIterable(result) || !('requestId' in context) || typeof context.requestId !== 'string') return;

    const response = {
      ...result,
      metadata: { requestId: context.requestId },
    };
    setResult(response);
  },
});
