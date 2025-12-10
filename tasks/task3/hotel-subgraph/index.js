import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    stars: Int
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]
  }
`;

function getMockHotelById(id) {
  const mockHotels = {
    'hotel-777': {
      id: 'hotel-777',
      name: 'Hilton Plaza',
      city: 'Seoul',
      rating: 4.6,
      pricePerNight: 8700,
      address: '123 Gangnam-gu, Seoul, South Korea',
      operational: true,
      fullyBooked: false,
      description: 'Роскошный отель в центре Сеула',
    },
    'hotel-888': {
      id: 'hotel-888',
      name: 'Lotte City',
      city: 'Seoul',
      rating: 4.3,
      pricePerNight: 7400,
      address: '456 Jung-gu, Seoul, South Korea',
      operational: true,
      fullyBooked: true,
      description: 'Современный отель с видом на город',
    },
    'hotel-999': {
      id: 'hotel-999',
      name: 'Marriott Gangnam',
      city: 'Seoul',
      rating: 4.1,
      pricePerNight: 9100,
      address: '789 Gangnam-daero, Seoul, South Korea',
      operational: true,
      fullyBooked: false,
      description: 'Пятизвездочный отель с SPA',
    },
    'hotel-111': {
      id: 'hotel-111',
      name: 'Grand Hyatt',
      city: 'Tokyo',
      rating: 4.8,
      pricePerNight: 12000,
      address: '1-2-3 Shinjuku, Tokyo, Japan',
      operational: true,
      fullyBooked: false,
      description: 'Элегантный отель в центре Токио',
    },
  };

  return mockHotels[id] || null;
}

function getMockHotelsByCity(city) {
  const allHotels = [
    getMockHotelById('hotel-777'),
    getMockHotelById('hotel-888'),
    getMockHotelById('hotel-999'),
    getMockHotelById('hotel-111'),
  ].filter(Boolean);

  return allHotels.filter(hotel =>
    hotel.city.toLowerCase() === city.toLowerCase()
  );
}

const resolvers = {
  Hotel: {
    __resolveReference: async ({ id }) => {
      // TODO: Реальный вызов к hotel-сервису или заглушка
    },
  },
  Query: {
    hotelsByIds: async (_, { ids }) => {
      // TODO: Заглушка или REST-запрос
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4002 },
}).then(() => {
  console.log('✅ Hotel subgraph ready at http://localhost:4002/');
});
