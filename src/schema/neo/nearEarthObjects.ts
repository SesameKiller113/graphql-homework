import { GraphQLError } from 'graphql';
import { ContextType } from '../../types';
import { mapNasaFeed } from './mapFeed';
import { NearEarthObjectFeed, NearEarthObjectsArgs } from './types';

type CachedFeed = {
  feed: NearEarthObjectFeed;
  expiresAt: number;
};

export const nasaFeedCache = new Map<string, CachedFeed>();

export const nearEarthObjects = async (
  _: unknown,
  args: NearEarthObjectsArgs,
  context: ContextType,
): Promise<NearEarthObjectFeed> => {
  context.logger.info('nearEarthObjects', { event: 'Enter resolver' });
  const key = `${args.startDate}:${args.endDate}`;
  const now = Date.now();
  for (const [cachedKey, entry] of nasaFeedCache) {
    if (entry.expiresAt <= now) {
      nasaFeedCache.delete(cachedKey);
    }
  }
  const cached = nasaFeedCache.get(key);
  if (cached) {
    context.logger.info('nearEarthObjects', { event: 'Returning cached NASA feed' });
    return cached.feed;
  }

  try {
    const { getMeshSDK } = await import('../../.mesh');
    const result = await getMeshSDK().NasaNeoFeed(args);
    if (!result.nasaFeed) {
      throw new Error('NASA feed was not returned');
    }
    const feed = mapNasaFeed(result.nasaFeed);
    nasaFeedCache.set(key, { feed, expiresAt: Date.now() + 60_000 });
    context.logger.info('nearEarthObjects', { event: 'Returning NASA feed' });
    return feed;
  } catch {
    context.logger.error('nearEarthObjects', { event: 'NASA request failed' });
    throw new GraphQLError('Unable to retrieve NASA near-Earth object data', {
      extensions: { code: 'UPSTREAM_SERVICE_ERROR' },
    });
  }
};
