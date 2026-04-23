-- postgresql
/* 
dr rm -f games-dbl && \
dr run --name games-dbl -d \
    -e POSTGRES_DB=games \
    -e POSTGRES_USER=games \
    -e POSTGRES_PASSWORD=games \
    -e TZ=America/Mexico_City \
    -p 5433:5432 \
    postgres

docker exec -it games-dbl psql -U games -d games

export DB_HOST="localhost"
export DB_USER="games"
export DB_PASSWORD="games"
export DB_NAME="games"
export DB_PORT="5433"

*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE usuarios (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    passwd VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessiones (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    usuario_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX idx_sessiones_usuario ON sessiones(usuario_id);
-- CREATE INDEX idx_sessiones_token ON sessiones(token);


CREATE TABLE rush_hour_levels (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    optimo INTEGER NOT NULL,
    layout VARCHAR(50) NOT NULL,
    plays_count INTEGER DEFAULT 0,
    last_played TIMESTAMP WITH TIME ZONE,
    movimientos_usuario_minimo INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX idx_levels_uuid ON rush_hour_levels(id);
-- CREATE INDEX idx_levels_optimo ON rush_hour_levels(optimo);
-- CREATE INDEX idx_levels_plays ON rush_hour_levels(plays_count);


CREATE TABLE rush_hour_jugadas (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    level_id VARCHAR(36) REFERENCES rush_hour_levels(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    moves INTEGER NOT NULL,
    time_seconds INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios
(username, passwd)
VALUES
('ojitos369', '$argon2id$v=19$m=65536,t=3,p=4$x/gfY+z93/ufk9L6/x8j5A$hSRMbAE7gsevFAi3RJkVUtY1bmr3M9TAs5uNI0EDOhc');

INSERT INTO usuarios
(username, passwd)
VALUES
('test', '$argon2id$v=19$m=65536,t=3,p=4$8r63FgLgfI/xvjdmDKF0rg$Z2qMlvUv0QukeCVP16zMTRzcT4X2f6NZs2NQ6AYxkFk');


-- CREATE INDEX idx_jugadas_level_score ON rush_hour_jugadas(level_id, moves, time_seconds);


-- ===================== GAME LIBRARY =====================

CREATE TABLE juegos (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    jugadores_min INTEGER DEFAULT 1,
    jugadores_max INTEGER DEFAULT 1,
    url VARCHAR(255),
    calificacion DECIMAL(3,1) DEFAULT 0,
    destacado BOOLEAN DEFAULT FALSE,
    etiqueta VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE juegos_categorias (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    juego_id VARCHAR(36) REFERENCES juegos(id) ON DELETE CASCADE,
    categoria_id VARCHAR(36) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE(juego_id, categoria_id)
);

CREATE TABLE juegos_imagenes (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    juego_id VARCHAR(36) REFERENCES juegos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'screenshot',
    es_portada BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);