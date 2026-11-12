import { GraphQLError, getOperationAST } from 'graphql';
import type { Plugin } from 'graphql-yoga';
import { ContextType } from '../types';

export const useClientHeader = (): Plugin<ContextType> => ({
  onContextBuilding({ context, extendContext }) {
    const client = context.request.headers.get('client')?.trim();
    if (!client) {
      throw new GraphQLError('The client header is required', {
        extensions: { code: 'BAD_USER_INPUT', http: { status: 400 } },
      });
    }
    extendContext({ client });
  },
  onExecute({ args }) {
    const operation = getOperationAST(args.document, args.operationName);
    if (args.contextValue.client === 'strata' && operation && operation.operation !== 'query') {
      throw new GraphQLError('Client strata can only execute queries', {
        extensions: { code: 'FORBIDDEN', http: { status: 403 } },
      });
    }
  },
});
