import { NasaFeed, NasaObject, NearEarthObjectFeed } from './types';

export const mapNasaFeed = (feed: NasaFeed): NearEarthObjectFeed => {
  const groups = feed.near_earth_objects as Record<string, NasaObject[]>;
  const objects = Object.values(groups).flat().map(object => {
    const diameter = object.estimated_diameter.kilometers;
    const approach = object.close_approach_data[0];

    return {
      id: object.id,
      name: object.name,
      isPotentiallyHazardousAsteroid: object.is_potentially_hazardous_asteroid,
      estimatedDiameterMinKm: diameter.estimated_diameter_min,
      estimatedDiameterMaxKm: diameter.estimated_diameter_max,
      closeApproachDate: approach?.close_approach_date ?? null,
      relativeVelocityKph: approach?.relative_velocity.kilometers_per_hour ?? null,
      missDistanceKm: approach?.miss_distance.kilometers ?? null,
    };
  });

  return { elementCount: feed.element_count, objects };
};
