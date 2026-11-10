import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";

export const genSchema = async () => {
  const modulesTypedefs = loadFilesSync(
    `${path.join(__dirname, "../src/schema")}/**/*.graphql`
  );
  const resolverFiles = loadFilesSync(
    `${path.join(__dirname, "../src/schema")}/**/resolvers.?s`
  );
  const modulesResolvers = mergeResolvers(resolverFiles);

  const schema = makeExecutableSchema({
    typeDefs: [modulesTypedefs],
    resolvers: [modulesResolvers],
  });
  return schema;
};
