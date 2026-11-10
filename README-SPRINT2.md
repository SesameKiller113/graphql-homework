# Sprint 2

## Purpose

You're tasked with integrating an external REST API into the existing GraphQL Yoga server using **GraphQL Mesh v0**.

---

> Ticket 8: NASA Near Earth Objects (NEO) Feed Integration

Integrate the [NASA NEO Feed API](https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY) into the existing GraphQL Yoga schema using GraphQL Mesh v0.

### Requirements

- Use `@graphql-mesh/cli` and `@graphql-mesh/json-schema` (v0) to configure a Mesh source that fetches from the NASA NEO Feed endpoint.
- The NASA API accepts `start_date`, `end_date`, and `api_key` as query parameters.
- Wire the generated Mesh SDK into the existing Yoga server and expose a new query:

  ```graphql
  nearEarthObjects(startDate: String!, endDate: String!): NearEarthObjectFeed
  ```

- Write a resolver for `nearEarthObjects` that calls the Mesh SDK, receives the raw NASA response, and returns it mapped to the `NearEarthObjectFeed` shape. The resolver is responsible for invoking the Mesh SDK method and transforming the result — do not perform the NASA API call directly inside the resolver.

- **Only expose the following fields** on the GraphQL schema — omit everything else from the NASA response:

  ```
  NearEarthObjectFeed
    elementCount: Int
    objects: [NearEarthObject]

  NearEarthObject
    id: String
    name: String
    isPotentiallyHazardousAsteroid: Boolean
    estimatedDiameterMinKm: Float
    estimatedDiameterMaxKm: Float
    closeApproachDate: String
    relativeVelocityKph: String
    missDistanceKm: String
  ```

- The `objects` field should be a flat list across all dates in the response (i.e. flatten `near_earth_objects` which is keyed by date).
- Use `DEMO_KEY` as the api key — do not hardcode any other secrets.
- Add a `.meshrc.yml` (or `.meshrc.json`) configuration file at the root of the project.

### Things to think about

- How does the `json-schema` handler infer a GraphQL schema from a sample JSON response? What configuration does it need?
- How do you apply field-level filtering or renaming between the Mesh-generated schema and the schema you expose to consumers?
- Where is the right place to perform the date-keyed flatten so it stays out of the resolver logic?
- How would you cache the NASA response to avoid hammering the rate-limited `DEMO_KEY`?

### Resources

- GraphQL Mesh v0 docs: <https://the-guild.dev/graphql/mesh/docs>
- JSON Schema handler: <https://the-guild.dev/graphql/mesh/docs/handlers/json-schema>
- GraphQL Yoga (v5): <https://the-guild.dev/graphql/yoga-server/docs>
