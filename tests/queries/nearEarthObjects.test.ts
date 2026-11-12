import { fetch, Response } from '@whatwg-node/fetch';
import { GraphQLObjectType } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { getBuiltMesh } from '../../src/.mesh';
import { genSchema } from '../../src/schema';
import plugins from '../../src/envelop';
import { nasaFeedCache } from '../../src/schema/neo/nearEarthObjects';

jest.mock('@whatwg-node/fetch', () => ({
  ...jest.requireActual('@whatwg-node/fetch'),
  fetch: jest.fn(),
}));

const firstObject = {
  id: '1001',
  name: 'Test asteroid A',
  links: { self: 'https://example.com/asteroid' },
  is_potentially_hazardous_asteroid: false,
  estimated_diameter: { kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.2 } },
  close_approach_data: [{
    close_approach_date: '2026-10-01',
    relative_velocity: { kilometers_per_hour: '12345.6' },
    miss_distance: { kilometers: '456789.1' },
  }],
};
const secondObject = {
  ...firstObject,
  id: '1002',
  name: 'Test asteroid B',
  close_approach_data: [{ ...firstObject.close_approach_data[0], close_approach_date: '2026-10-02' }],
};
const feed = {
  element_count: 2,
  near_earth_objects: { '2026-10-01': [firstObject], '2026-10-02': [secondObject] },
};
const query = `{
  nearEarthObjects(startDate: "2026-10-01", endDate: "2026-10-02") {
    elementCount
    objects {
      id name isPotentiallyHazardousAsteroid estimatedDiameterMinKm estimatedDiameterMaxKm
      closeApproachDate relativeVelocityKph missDistanceKm
    }
  }
}`;
const fetchNasa = jest.mocked(fetch);
const yoga = createYoga({ schema: genSchema(), plugins });

const send = async (source: string = query) => {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', client: 'test' },
    body: JSON.stringify({ query: source }),
  });
  return response.json();
};

describe('nearEarthObjects', () => {
  beforeEach(() => {
    nasaFeedCache.clear();
    fetchNasa.mockReset();
    fetchNasa.mockImplementation(async () => new Response(JSON.stringify(feed), {
      headers: { 'content-type': 'application/json' },
    }));
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => { await (await getBuiltMesh()).destroy(); });

  test('calls NASA through Mesh and flattens both dates into the requested fields', async () => {
    expect(await send()).toEqual({
      data: {
        nearEarthObjects: {
          elementCount: 2,
          objects: [{
            id: '1001', name: 'Test asteroid A', isPotentiallyHazardousAsteroid: false,
            estimatedDiameterMinKm: 0.1, estimatedDiameterMaxKm: 0.2,
            closeApproachDate: '2026-10-01', relativeVelocityKph: '12345.6', missDistanceKm: '456789.1',
          }, {
            id: '1002', name: 'Test asteroid B', isPotentiallyHazardousAsteroid: false,
            estimatedDiameterMinKm: 0.1, estimatedDiameterMaxKm: 0.2,
            closeApproachDate: '2026-10-02', relativeVelocityKph: '12345.6', missDistanceKm: '456789.1',
          }],
        },
      },
      metadata: { requestId: expect.any(String) },
    });
    expect(fetchNasa).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchNasa.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.nasa.gov/neo/rest/v1/feed');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start_date: '2026-10-01', end_date: '2026-10-02', api_key: 'DEMO_KEY',
    });
  });

  test('returns an empty list when NASA has no objects', async () => {
    fetchNasa.mockResolvedValueOnce(new Response(JSON.stringify({ element_count: 0, near_earth_objects: {} }), {
      headers: { 'content-type': 'application/json' },
    }));
    expect(await send()).toEqual({
      data: { nearEarthObjects: { elementCount: 0, objects: [] } },
      metadata: { requestId: expect.any(String) },
    });
  });

  test('returns a friendly error when NASA fails', async () => {
    fetchNasa.mockResolvedValueOnce(new Response('Service unavailable', { status: 503 }));
    expect(await send()).toMatchObject({
      data: { nearEarthObjects: null },
      errors: [{
        message: 'Unable to retrieve NASA near-Earth object data',
        extensions: { code: 'UPSTREAM_SERVICE_ERROR' },
      }],
      metadata: { requestId: expect.any(String) },
    });
    const retry = await send();
    expect(retry.errors).toBeUndefined();
    expect(retry.data.nearEarthObjects.elementCount).toBe(2);
    expect(fetchNasa).toHaveBeenCalledTimes(2);
  });

  test('reuses the same date range but keeps a new request ID for each response', async () => {
    const first = await send();
    const second = await send();
    expect(second.data).toEqual(first.data);
    expect(second.metadata.requestId).not.toBe(first.metadata.requestId);
    expect(fetchNasa).toHaveBeenCalledTimes(1);

    await send(query.replace('2026-10-02', '2026-10-03'));
    expect(fetchNasa).toHaveBeenCalledTimes(2);
  });

  test('fetches again after the cached feed expires', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    await send();
    now.mockReturnValue(60_999);
    await send();
    expect(fetchNasa).toHaveBeenCalledTimes(1);

    now.mockReturnValue(61_000);
    await send();
    expect(fetchNasa).toHaveBeenCalledTimes(2);
  });

  test('exposes only the public NASA fields', async () => {
    const schema = await genSchema();
    const fields = (schema.getType('NearEarthObject') as GraphQLObjectType).getFields();
    expect(Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, String(field.type)]))).toEqual({
      id: 'String', name: 'String', isPotentiallyHazardousAsteroid: 'Boolean',
      estimatedDiameterMinKm: 'Float', estimatedDiameterMaxKm: 'Float',
      closeApproachDate: 'String', relativeVelocityKph: 'String', missDistanceKm: 'String',
    });
    expect(schema.getQueryType()!.getFields().nasaFeed).toBeUndefined();
  });
});
