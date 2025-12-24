import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`

  extend schema
      @link(url: "https://specs.apollo.dev/federation/v2.0",
            import: ["@key", "@external", "@shareable", "@extends", "@requires"])

  enum BookingStatus {
    CONFIRMED
    PENDING
    CANCELLED
    COMPLETED
  }

  type Booking @key(fields: "id") {
    id: ID!
    userId: String!
    hotelId: String!
    promoCode: String
    discountPercent: Int
    checkIn: String!
    checkOut: String!
    status: BookingStatus!
    hotel: Hotel
  }

  type Hotel @key(fields: "id") {
      id: ID!
   }

  type Query {
    bookingsByUser(userId: String!): [Booking!]!
  }
`;

const mockBookings = [
  {
    id: 'booking-1',
    userId: 'user-123',
    hotelId: 'hotel-777',
    promoCode: 'SUMMER2024',
    discountPercent: 10,
    checkIn: '2024-07-01',
    checkOut: '2024-07-07',
    status: 'CONFIRMED'
  },
  {
    id: 'booking-2',
    userId: 'user-123',
    hotelId: 'hotel-888',
    promoCode: null,
    discountPercent: 0,
    checkIn: '2024-08-15',
    checkOut: '2024-08-20',
    status: 'PENDING'
  },
  {
    id: 'booking-3',
    userId: 'user-456',  // Другой пользователь
    hotelId: 'hotel-999',
    promoCode: 'WINTER2024',
    discountPercent: 15,
    checkIn: '2024-12-24',
    checkOut: '2024-12-30',
    status: 'CONFIRMED'
  }
];

const resolvers = {
  Query: {
    bookingsByUser: async (_, { userId }, { req }) => {
        console.log(`[ACL] Запрос bookingsByUser для userId: ${userId}`);

        console.log(`[ACL] Запрос бронирований для пользователя: ${userId}`);
        console.log(`[ACL] Заголовок userid из контекста: ${req.headers.userid}`);

		const userIdFromHeader = req.headers.userid;
        if (!userIdFromHeader) {
            console.log('[ACL ERROR] Заголовок userid отсутствует');
            throw new Error('Access denied: userid header required');
        }
        if (userIdFromHeader !== userId) {
            console.log(`[ACL ERROR] Попытка доступа к чужим данным: header=${userIdFromHeader}, запрос=${userId}`);
            throw new Error('Access denied: you can only view your own bookings');
        }
        try {
            console.log(`[API] Вызов монолита для пользователя ${userId}`);
            const response = await fetch(`http://monolith:8080/api/bookings?userId=${userId}`);

            if (!response.ok) {
                throw new Error(`Monolith API error: ${response.status}`);
            }

            const bookings = await response.json();
            console.log(`[API] Получено бронирований: ${bookings.length}`);

            return bookings.map(booking => ({
                id: booking.bookingId || `booking-${Math.random().toString(36).substr(2, 9)}`,
                userId: booking.userId,
                hotelId: booking.hotelId,
                promoCode: booking.promoCode || null,
                discountPercent: booking.discountPercent || 0,
                checkIn: booking.checkIn || '2024-01-01',
                checkOut: booking.checkOut || '2024-01-07',
                status: booking.status || 'PENDING'
            }));

        } catch (error) {
            console.error('[API ERROR] Ошибка при вызове монолита:', error.message);

            console.log('[FALLBACK] Используем заглушки для бронирований');
            return getMockBookings(userId);
        }
    },
    booking: async (_, { id }, { req }) => {
        console.log(`[ACL] Запрос booking для id: ${id}`);

        // ACL: Проверяем авторизацию
        const userIdFromHeader = req.headers.userid;
        if (!userIdFromHeader) {
            throw new Error('Access denied: userid header required');
        }

        try {
            // Вариант 1: Вызов REST API монолита
            const response = await fetch(`http://monolith:8080/api/bookings/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Monolith API error: ${response.status}`);
            }

            const booking = await response.json();

            // ACL: Проверяем, что пользователь запрашивает свое бронирование
            if (booking.userId !== userIdFromHeader) {
                console.log(`[ACL ERROR] Попытка доступа к чужому бронированию: ${id}`);
                throw new Error('Access denied: you can only view your own bookings');
            }

            return {
                id: booking.bookingId || id,
                userId: booking.userId,
                hotelId: booking.hotelId,
                promoCode: booking.promoCode || null,
                discountPercent: booking.discountPercent || 0,
                checkIn: booking.checkIn || '2024-01-01',
                checkOut: booking.checkOut || '2024-01-07',
                status: booking.status || 'PENDING'
            };

        } catch (error) {
            console.error('[API ERROR] Ошибка при вызове монолита:', error.message);

            // Вариант 2: Заглушка
            const mockBooking = getMockBookingById(id, userIdFromHeader);
            if (!mockBooking) {
                return null;
            }

            // ACL: Проверяем доступ к заглушке
            if (mockBooking.userId !== userIdFromHeader) {
                throw new Error('Access denied: you can only view your own bookings');
            }

            return mockBooking;
        }
    }
  },
  Booking: {
        __resolveReference: async (reference, { req }) => {
        console.log(`[Federation] Resolve reference для booking: ${reference.id}`);

        try {
            const userIdFromHeader = req?.headers?.userid;

            if (userIdFromHeader) {
                console.log(`[Federation Debug] Запрос от пользователя: ${userIdFromHeader}`);
            }

            const response = await fetch(`http://monolith:8080/api/bookings/${reference.id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Monolith API error: ${response.status}`);
            }

            const booking = await response.json();

            //return booking;
            /*return {
                id: booking.bookingId || reference.id,
                userId: booking.userId,
                hotelId: booking.hotelId,
                promoCode: booking.promoCode || null,
                discountPercent: booking.discountPercent || 0,
                checkIn: booking.checkIn || '2024-01-01',
                checkOut: booking.checkOut || '2024-01-07',
                status: booking.status || 'PENDING'
            };*/

        } catch (error) {
            console.error('[Federation ERROR] Ошибка при разрешении ссылки:', error.message);

            const mockBooking = getMockBookingById(reference.id);
            if (!mockBooking) {
                return null;
            }
            return mockBooking;
        }
    },
    hotel: (booking) => {
          console.log(`[Booking Subgraph] Resolving hotel for booking ${booking.id}`);
          // Просто возвращаем ссылку на Hotel
          return { __typename: "Hotel", id: booking.hotelId };
        }
  }
};

function getMockBookings(userId) {
  const mockBookings = [
    {
      id: `booking-${userId}-1`,
      userId: userId,
      hotelId: 'hotel-777',
      promoCode: 'SUMMER2024',
      discountPercent: 10,
      checkIn: '2024-07-01',
      checkOut: '2024-07-07',
    },
    {
      id: `booking-${userId}-2`,
      userId: userId,
      hotelId: 'hotel-888',
      promoCode: null,
      discountPercent: 0,
      checkIn: '2024-08-15',
      checkOut: '2024-08-20',
    },
    {
      id: `booking-${userId}-3`,
      userId: userId,
      hotelId: 'hotel-999',
      promoCode: 'WINTER2024',
      discountPercent: 15,
      checkIn: '2024-12-24',
      checkOut: '2024-12-30',
    },
  ];

  return mockBookings.filter(booking => booking.userId === userId);
}

function getMockBookingById(id, expectedUserId = null) {
  const allMockBookings = [
    {
      id: 'booking-user1-1',
      userId: 'user1',
      hotelId: 'hotel-777',
      promoCode: 'SUMMER2024',
      discountPercent: 10,
      checkIn: '2024-07-01',
      checkOut: '2024-07-07',
      status: 'CONFIRMED',
    },
    {
      id: 'booking-user1-2',
      userId: 'user1',
      hotelId: 'hotel-888',
      promoCode: null,
      discountPercent: 0,
      checkIn: '2024-08-15',
      checkOut: '2024-08-20',
      status: 'PENDING',
    },
    {
      id: 'booking-user2-1',
      userId: 'user2',
      hotelId: 'hotel-999',
      promoCode: 'WINTER2024',
      discountPercent: 15,
      checkIn: '2024-12-24',
      checkOut: '2024-12-30',
      status: 'CONFIRMED',
    },
  ];

  const booking = allMockBookings.find(b => b.id === id);

  if (booking && expectedUserId && booking.userId !== expectedUserId) {
    console.log(`[ACL WARNING] Бронирование ${id} принадлежит пользователю ${booking.userId}, запросил ${expectedUserId}`);
    return null;
  }

  return booking || null;
}

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4001 },
  context: async ({ req }) => ({ req }),
}).then(() => {
  console.log('✅ Booking subgraph ready at http://localhost:4001/');
});
