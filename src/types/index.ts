import { Logger } from '../logger';

export type ContextType = {
  client: string;
  requestId: string;
  logger: Logger;
};
