import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'booking', url: 'http://booking-subgraph:4001' },
    { name: 'hotel', url: 'http://hotel-subgraph:4002' },
    // { name: 'promocode', url: 'http://promocode-subgraph:4003' }
  ],
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // Передаем заголовки из контекста в подграфы
        if (context?.req?.headers?.userid) {
          request.http.headers.set('userid', context.req.headers.userid);
        }
        if (context?.req?.headers?.authorization) {
          request.http.headers.set('authorization', context.req.headers.authorization);
        }
      },
    });
  },
});

const server = new ApolloServer({
  gateway,
  introspection: true,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => ({ req }),
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
}).catch((error) => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});