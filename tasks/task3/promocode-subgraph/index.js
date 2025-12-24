import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

// 1. Определяем схему для Federation 2
const typeDefs = gql`
  # В Federation 2 добавляем @link директиву
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@shareable", "@override", "@external", "@requires", "@provides"])

  type DiscountInfo {
    isValid: Boolean!
    originalDiscount: Float!
    finalDiscount: Float!
    description: String
    expiresAt: String
    applicableHotels: [ID!]!
  }

  # Расширяем тип Booking из booking-subgraph
  extend type Booking @key(fields: "id") {
    id: ID! @external
    promoCode: String @external
    discountPercent: Int! @override(from: "booking")
    discountInfo: DiscountInfo @requires(fields: "promoCode")
  }

  type Query {
    validatePromoCode(code: String!, hotelId: ID): DiscountInfo!
    activePromoCodes: [DiscountInfo!]!
  }
`;

// 2. Заглушки для промокодов
const mockPromoCodes = {
  'SUMMER2024': {
    code: 'SUMMER2024',
    discountPercent: 10,
    active: true,
    vipOnly: false,
    description: 'Летняя скидка 2024',
    expiresAt: '2024-08-31',
    applicableHotels: ['hotel-777', 'hotel-888']
  },
  'WINTER2024': {
    code: 'WINTER2024',
    discountPercent: 15,
    active: true,
    vipOnly: true,
    description: 'Зимняя скидка 2024',
    expiresAt: '2024-12-31',
    applicableHotels: ['hotel-999']
  },
  'EXPIRED': {
    code: 'EXPIRED',
    discountPercent: 20,
    active: false,
    vipOnly: false,
    description: 'Просроченный промокод',
    expiresAt: '2023-12-31',
    applicableHotels: []
  }
};

// 3. Резолверы
const resolvers = {
  Booking: {
    // Переопределяем discountPercent из booking-subgraph
    discountPercent: async (booking) => {
      console.log(`[PROMO] Расчет скидки для бронирования ${booking.id}, промокод: ${booking.promoCode}`);

      if (!booking.promoCode) {
        return 0; // Нет промокода - нет скидки
      }

      const promo = mockPromoCodes[booking.promoCode];
      if (!promo || !promo.active) {
        return 0; // Промокод не найден или не активен
      }

      return promo.discountPercent;
    },

    // Возвращаем информацию о промокоде
    discountInfo: async (booking) => {
      if (!booking.promoCode) {
        return null;
      }

      const promo = mockPromoCodes[booking.promoCode];

      if (!promo) {
        return {
          isValid: false,
          originalDiscount: 0,
          finalDiscount: 0,
          description: 'Промокод не найден',
          expiresAt: null,
          applicableHotels: []
        };
      }

      return {
        isValid: promo.active,
        originalDiscount: 0, // Базовый discount из booking
        finalDiscount: promo.discountPercent,
        description: promo.description,
        expiresAt: promo.expiresAt,
        applicableHotels: promo.applicableHotels
      };
    }
  },

  Query: {
    validatePromoCode: async (_, { code, hotelId }) => {
      console.log(`[PROMO] Проверка промокода: ${code} для отеля: ${hotelId}`);

      const promo = mockPromoCodes[code];

      if (!promo) {
        return {
          isValid: false,
          originalDiscount: 0,
          finalDiscount: 0,
          description: 'Промокод не найден',
          expiresAt: null,
          applicableHotels: []
        };
      }

      // Проверяем, применим ли промокод к отелю
      const isApplicable = !hotelId ||
        promo.applicableHotels.length === 0 ||
        promo.applicableHotels.includes(hotelId);

      return {
        isValid: promo.active && isApplicable,
        originalDiscount: 0,
        finalDiscount: promo.discountPercent,
        description: promo.description,
        expiresAt: promo.expiresAt,
        applicableHotels: promo.applicableHotels
      };
    },

    activePromoCodes: async () => {
      const activeCodes = Object.values(mockPromoCodes)
        .filter(promo => promo.active)
        .map(promo => ({
          isValid: true,
          originalDiscount: 0,
          finalDiscount: promo.discountPercent,
          description: promo.description,
          expiresAt: promo.expiresAt,
          applicableHotels: promo.applicableHotels
        }));

      return activeCodes;
    }
  }
};

// 4. Создаем и запускаем сервер
const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
  listen: { port: 4003 },
}).then(() => {
  console.log('✅ Promocode subgraph готов на http://localhost:4003/');
});