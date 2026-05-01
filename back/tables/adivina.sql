-- postgresql
-- Adivina el Personaje - Schema

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
