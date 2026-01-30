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
    passwd VARCHAR(50),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessiones (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    usuario_od VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEX idx_sessiones_usuario ON sessiones(usuario_od);
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

-- CREATE INDEX idx_jugadas_level_score ON rush_hour_jugadas(level_id, moves, time_seconds);