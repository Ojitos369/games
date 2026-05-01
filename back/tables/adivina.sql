-- ============================================================
-- ADIVINA EL PERSONAJE
-- ============================================================

-- Character cards catalog
CREATE TABLE IF NOT EXISTS adivina_cards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_by  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Tags for cards
CREATE TABLE IF NOT EXISTS adivina_card_tags (
    card_id UUID REFERENCES adivina_cards(id) ON DELETE CASCADE,
    tag     VARCHAR(100) NOT NULL,
    PRIMARY KEY (card_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_adivina_card_tags_tag ON adivina_card_tags(tag);

-- Decks (saved card collections)
CREATE TABLE IF NOT EXISTS adivina_decks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_public   BOOLEAN DEFAULT FALSE,
    created_by  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Deck-Card junction
CREATE TABLE IF NOT EXISTS adivina_deck_cards (
    deck_id UUID REFERENCES adivina_decks(id) ON DELETE CASCADE,
    card_id UUID REFERENCES adivina_cards(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, card_id)
);

-- Room records (active state lives in memory; this is for history/stats)
CREATE TABLE IF NOT EXISTS adivina_rooms (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code       VARCHAR(10) UNIQUE NOT NULL,
    created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    status     VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at  TIMESTAMP
);

-- Completed game records
CREATE TABLE IF NOT EXISTS adivina_games (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID REFERENCES adivina_rooms(id) ON DELETE SET NULL,
    winner_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    players     JSONB,
    started_at  TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);
