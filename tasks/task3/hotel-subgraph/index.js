import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
    extend schema
        @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@external", "@shareable", "@extends", "@requires"])

  type Hotel @key(fields: "id") {
    id: ID!
    name: String
    city: String
    rating: Float
  }

  type Query {
    hotelsByIds(ids: [ID!]!): [Hotel]
  }
`;

function getMockHotelById(id) {
  const mockHotels = {
    'test-hotel-1': {
      id: 'test-hotel-1',
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

class HotelLoader {
  constructor() {
    this.cache = new Map();
  }

  // Загружаем несколько отелей за один раз
  async loadMany(ids) {
    console.log(`[BATCH] Загружаем отели: ${ids.join(', ')}`);

    const results = [];

    for (const id of ids) {
      // Проверяем кеш
      if (this.cache.has(id)) {
        console.log(`[CACHE HIT] Отель ${id} найден в кеше`);
        results.push(this.cache.get(id));
        continue;
      }

      // Имитируем запрос к API (можно заменить на реальный вызов)
      // Например: fetch(`http://monolith:8080/api/hotels/${id}`)
      const hotel = getMockHotelById(id);

      if (hotel) {
        // Сохраняем в кеш
        this.cache.set(id, hotel);
        results.push(hotel);
      } else {
        results.push(null);
      }
    }

    return results;
  }

  // Загружаем один отель
  async load(id) {
    const results = await this.loadMany([id]);
    return results[0];
  }
}

const hotelLoader = new HotelLoader();

const resolvers = {
  Hotel: {
    __resolveReference: async (reference) => {
      // TODO: Реальный вызов к hotel-сервису или заглушка
      console.log(`[Hotel] __resolveReference called for ID: ${reference.id}`);
      const hotel = await hotelLoader.load(reference.id);
      if (!hotel) {
              console.error(`[Hotel] ERROR: No hotel found for ID: ${reference.id}`);
              return null;
      }

      console.log(`[Hotel] Returning hotel:`, hotel);
      return hotel;
    },
  },
  Booking: {
      hotel: (booking) => {
        console.log(`[Hotel Subgraph] Resolving hotel for booking ${booking.id} with hotelId: ${booking.hotelId}`);
        // The booking object here comes from the booking subgraph via @external fields
        if (!booking.hotelId) {
                console.error(`[Hotel] ERROR: booking.hotelId is undefined!`);
                return null;
        }
        return { __typename: "Hotel", id: booking.hotelId };
      },
  },
  Query: {
    hotelsByIds: async (_, { ids }) => {
      // TODO: Заглушка или REST-запрос
      return await hotelLoader.loadMany(ids);
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
