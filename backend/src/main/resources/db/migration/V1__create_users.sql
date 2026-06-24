CREATE TABLE users (
    id            BIGSERIAL     PRIMARY KEY,
    email         VARCHAR(256)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    display_name  VARCHAR(50)   NOT NULL UNIQUE,
    avatar_url    TEXT,
    bio           VARCHAR(160),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);
