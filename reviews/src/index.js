import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { closeDatabase, initializeDatabase } from "./db.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

await initializeDatabase();

const server = new ApolloServer({
  typeDefs,
  resolvers
});

const { url } = await startStandaloneServer(server, {
  listen: {
    port: process.env.PORT ? Number(process.env.PORT) : 4003
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await closeDatabase();
    process.exit(0);
  });
}

console.log(`Reviews GraphQL server ready at ${url}`);
