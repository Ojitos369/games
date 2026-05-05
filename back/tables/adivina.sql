-- postgresql
-- Adivina la Tarjeta - Schema

CREATE TABLE adivina_tags (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adivina_tarjetas (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    creador_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adivina_tarjetas_tags (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    tarjeta_id VARCHAR(36) REFERENCES adivina_tarjetas(id) ON DELETE CASCADE,
    tag_id VARCHAR(36) REFERENCES adivina_tags(id) ON DELETE CASCADE,
    UNIQUE(tarjeta_id, tag_id)
);

CREATE TABLE adivina_decks (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    creador_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adivina_decks_tarjetas (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    deck_id VARCHAR(36) REFERENCES adivina_decks(id) ON DELETE CASCADE,
    tarjeta_id VARCHAR(36) REFERENCES adivina_tarjetas(id) ON DELETE CASCADE,
    UNIQUE(deck_id, tarjeta_id)
);

CREATE TABLE adivina_salas (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    codigo VARCHAR(8) UNIQUE NOT NULL,
    nombre VARCHAR(150),
    creador_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'esperando',
    visibilidad VARCHAR(20) DEFAULT 'publica',
    max_jugadores INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE adivina_salas_jugadores (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    sala_id VARCHAR(36) REFERENCES adivina_salas(id) ON DELETE CASCADE,
    usuario_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sala_id, usuario_id)
);

CREATE TABLE adivina_partidas (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    sala_id VARCHAR(36) REFERENCES adivina_salas(id) ON DELETE CASCADE,
    ganador_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------ cambios de victorias por sala -----
ALTER TABLE adivina_salas_jugadores ADD COLUMN victorias INTEGER DEFAULT 0;

-- ------ cambios de adivina -----
UPDATE adivina_tags SET nombre = UPPER(nombre);
-- ------ cambios de adivina -----
ALTER TABLE adivina_decks_tarjetas ADD COLUMN orden INTEGER DEFAULT 0;

-- ------ cambios de deck sharing -----
ALTER TABLE adivina_decks ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS adivina_decks_importados (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    deck_id VARCHAR(36) NOT NULL REFERENCES adivina_decks(id) ON DELETE CASCADE,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deck_id, usuario_id)
);

-- ------ cambios de catalogo paginacion -----
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_nombre_trgm
    ON adivina_tarjetas USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_descripcion_trgm
    ON adivina_tarjetas USING gin (descripcion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_creador
    ON adivina_tarjetas (creador_id);
CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_created_at
    ON adivina_tarjetas (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adivina_decks_nombre_trgm
    ON adivina_decks USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_descripcion_trgm
    ON adivina_decks USING gin (descripcion gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_creador
    ON adivina_decks (creador_id);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_publico
    ON adivina_decks (publico) WHERE publico = TRUE;
CREATE INDEX IF NOT EXISTS idx_adivina_decks_created_at
    ON adivina_decks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_tags_tarjeta
    ON adivina_tarjetas_tags (tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_adivina_tarjetas_tags_tag
    ON adivina_tarjetas_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_tarjetas_deck
    ON adivina_decks_tarjetas (deck_id);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_tarjetas_tarjeta
    ON adivina_decks_tarjetas (tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_adivina_decks_importados_usuario
    ON adivina_decks_importados (usuario_id);
