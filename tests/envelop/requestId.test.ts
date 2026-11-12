import { createYoga } from 'graphql-yoga';
import type { Plugin } from 'graphql-yoga';
import winston from 'winston';
import plugins from '../../src/envelop';
import { genSchema } from '../../src/schema';
import { addressStore } from '../../src/schema/address/store';
import { Logger } from '../../src/logger';
import { ContextType } from '../../src/types';

const query = '{ address(username: "jack") { city } }';
const mutation = `mutation {
  createAddress(username: "request-id-test", address: {
    street: "1 Test St.", city: "Boston", zipcode: "02101"
  }) { city }
}`;

const send = async (yoga: ReturnType<typeof createYoga>, source: string, client: string = 'test') => {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', client },
    body: JSON.stringify({ query: source }),
  });
  return response.json();
};

describe('requestId and client logging', () => {
  let entries: { requestId: string; client: string | null; level: string; event?: string }[];
  let contexts: ContextType[];
  let yoga: ReturnType<typeof createYoga>;

  beforeEach(() => {
    entries = [];
    contexts = [];
    jest.spyOn(winston.transports.Console.prototype, 'log').mockImplementation((info, callback) => {
      entries.push(JSON.parse((info as Record<symbol, string>)[Symbol.for('message')]));
      if (typeof callback === 'function') callback();
    });
    const address = { street: '1 Test St.', city: 'Boston', zipcode: '02101' };
    jest.spyOn(addressStore, 'get').mockResolvedValue(address);
    jest.spyOn(addressStore, 'create').mockResolvedValue(address);
    const observer: Plugin<ContextType> = {
      onExecute({ args }) {
        contexts.push(args.contextValue);
      },
    };
    yoga = createYoga({ schema: genSchema(), plugins: [...plugins, observer] });
  });

  afterEach(() => jest.restoreAllMocks());

  test('sets the ID before resolvers run and includes it in query and mutation logs', async () => {
    expect(await send(yoga, query)).toEqual({ data: { address: { city: 'Boston' } } });
    const queryId = contexts[0].requestId;
    expect(queryId).toEqual(expect.any(String));
    expect(queryId).not.toBe('');
    expect(contexts[0].logger.requestId).toBe(queryId);
    expect(entries).toHaveLength(2);
    expect(entries.every(entry => entry.requestId === queryId && entry.client === 'test')).toBe(true);
    entries = [];

    expect(await send(yoga, mutation)).toEqual({ data: { createAddress: { city: 'Boston' } } });
    const mutationId = contexts[1].requestId;
    expect(mutationId).not.toBe(queryId);
    expect(contexts[1].logger.requestId).toBe(mutationId);
    expect(entries).toHaveLength(2);
    expect(entries.every(entry => entry.requestId === mutationId && entry.client === 'test')).toBe(true);
  });

  test('keeps IDs and clients separate when the same query is repeated', async () => {
    await send(yoga, query, 'interview');
    const firstLogs = entries.slice();
    await send(yoga, query, 'strata');
    const secondLogs = entries.slice(firstLogs.length);
    expect(contexts[1].requestId).not.toBe(contexts[0].requestId);
    expect(contexts[1].logger).not.toBe(contexts[0].logger);
    expect(firstLogs).toHaveLength(2);
    expect(secondLogs).toHaveLength(2);
    expect(firstLogs.every(entry => entry.requestId === contexts[0].requestId && entry.client === 'interview')).toBe(true);
    expect(secondLogs.every(entry => entry.requestId === contexts[1].requestId && entry.client === 'strata')).toBe(true);
  });

  test('includes the request ID when an address is not found', async () => {
    jest.mocked(addressStore.get).mockResolvedValue(null);
    const result = await send(yoga, query);
    expect(result).toMatchObject({ errors: [{ message: 'No address found in getAddress resolver' }] });
    expect(entries).toHaveLength(2);
    expect(entries[1].level).toBe('error');
    expect(contexts[0].requestId).toEqual(expect.any(String));
    expect(entries.every(entry => entry.requestId === contexts[0].requestId && entry.client === 'test')).toBe(true);
  });

  test('includes the ID and caller metadata at each log level', () => {
    const logger = new Logger();
    logger.setRequestId('test-request');
    logger.setClient('test-client');
    logger.info('info message', { event: 'test' });
    logger.error('error message', { event: 'test' });
    logger.warn('warning message', { event: 'test' });
    expect(entries.map(entry => entry.level)).toEqual(['info', 'error', 'warn']);
    expect(entries.every(entry => entry.requestId === 'test-request' && entry.client === 'test-client' && entry.event === 'test')).toBe(true);
  });
});
