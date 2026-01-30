import mysql.connector
import uuid
import sys
# pip install mysql-connector-python

# --- CREDENCIALES DE HOSTINGER ---
db_config = {
    "host": "srv735.hstgr.io", 
    "user": "u345534273_rush_db",
    "password": "Rus4_db$",
    "database": "u345534273_rush_db"
}

def setup_and_upload(file_path):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("--- Configurando Tablas ---")
        # Tabla de Niveles (con índices para 2M de registros)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS niveles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid VARCHAR(36) UNIQUE,
                optimo INT,
                layout VARCHAR(36),
                extra VARCHAR(100),
                plays_count INT DEFAULT 0,
                last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_uuid (uuid),
                INDEX idx_plays (plays_count)
            )
        """)

        # Tabla de Usuarios
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Tabla de Récords
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nivel_id INT,
                user_id INT,
                moves INT,
                time_seconds INT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nivel_id) REFERENCES niveles(id),
                FOREIGN KEY (user_id) REFERENCES usuarios(id)
            )
        """)

        print("--- Leyendo Archivo ---")
        with open(file_path, "r") as f:
            lines = f.readlines()
            
        total = len(lines)
        print(f"Subiendo {total} niveles...")
        
        sql = "INSERT INTO niveles (uuid, optimo, layout, extra) VALUES (%s, %s, %s, %s)"
        batch_size = 10000 # Lote grande para eficiencia
        
        for i in range(0, total, batch_size):
            batch_data = []
            for line in lines[i:i+batch_size]:
                parts = line.strip().split(" ")
                if len(parts) >= 2:
                    level_uuid = str(uuid.uuid4())
                    optimo = int(parts[0])
                    layout = parts[1]
                    extra = parts[2] if len(parts) > 2 else ""
                    batch_data.append((level_uuid, optimo, layout, extra))
            
            cursor.executemany(sql, batch_data)
            conn.commit()
            print(f"Progreso: {min(i + batch_size, total)} / {total}")

        print("¡Migración completada con éxito!")
        
    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    # Asegúrate de que el archivo se llame rush.txt
    setup_and_upload("rush.txt")
