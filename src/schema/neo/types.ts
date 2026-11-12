import type { NasaNeoFeedQuery } from '../../.mesh';

export type NearEarthObjectsArgs = {
  startDate: string;
  endDate: string;
};

export type NasaFeed = NonNullable<NasaNeoFeedQuery['nasaFeed']>;

export type NasaObject = {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: {
    close_approach_date: string;
    relative_velocity: { kilometers_per_hour: string };
    miss_distance: { kilometers: string };
  }[];
};

export type NearEarthObject = {
  id: string;
  name: string;
  isPotentiallyHazardousAsteroid: boolean;
  estimatedDiameterMinKm: number;
  estimatedDiameterMaxKm: number;
  closeApproachDate: string | null;
  relativeVelocityKph: string | null;
  missDistanceKm: string | null;
};

export type NearEarthObjectFeed = {
  elementCount: number;
  objects: NearEarthObject[];
};
