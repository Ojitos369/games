import sys
from core.bases.apis import pln
from core.utils.db import DbConnect

db = DbConnect()
query = """
CREATE TABLE IF NOT EXISTS usuarios_favoritos (
    id VARCHAR(36) DEFAULT uuid_generate_v4() UNIQUE NOT NULL PRIMARY KEY,
    usuario_id VARCHAR(36) REFERENCES usuarios(id) ON DELETE CASCADE,
    juego_id VARCHAR(36) REFERENCES juegos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, juego_id)
);
"""
db.ejecutar(query)
print("Table usuarios_favoritos created")
