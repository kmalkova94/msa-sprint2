CREATE TABLE IF NOT EXISTS booking (
    id SERIAL PRIMARY KEY,
    user_id varchar(255),
    hotel_id varchar(255),
    promo_code varchar(255),
    discount_percent DOUBLE PRECISION,
    price DOUBLE PRECISION,
    created_at TIMESTAMP,
);