import random
from core.bases.apis import ConexionApi, SessionApi, BaseApi, pln, prod_mode, dev_mode


class GetLevel(ConexionApi):
    """Obtiene un nivel por ID (uuid), por optimo (dificultad) o aleatorio."""
    def main(self):
        level_id = self.data.get('id', None)
        optimo = self.data.get('optimo', None)

        if level_id:
            query = """
            SELECT * FROM rush_hour_levels
            WHERE id = :level_id
            """
            result = self.conexion.consulta_asociativa(query, {'level_id': level_id})
        elif optimo:
            query = """
            SELECT * FROM rush_hour_levels
            WHERE optimo = :optimo
            ORDER BY random()
            LIMIT 1
            """
            result = self.conexion.consulta_asociativa(query, {'optimo': int(optimo)})
        else:
            random_optimo = random.randint(10, 60)
            query = """
            SELECT * FROM rush_hour_levels
            WHERE optimo = :optimo
            ORDER BY random()
            LIMIT 1
            """
            result = self.conexion.consulta_asociativa(query, {'optimo': random_optimo})

            if result.empty:
                query = """
                SELECT * FROM rush_hour_levels
                ORDER BY random()
                LIMIT 1
                """
                result = self.conexion.consulta_asociativa(query)

        if result.empty:
            raise self.MYE("Nivel no encontrado con los criterios dados.")

        nivel = self.d2d(result)[0]

        # Incrementar plays_count
        update_query = """
        UPDATE rush_hour_levels
        SET plays_count = plays_count + 1, last_played = NOW()
        WHERE id = :level_id
        """
        self.conexion.ejecutar(update_query, {'level_id': nivel['id']})

        self.response = {"nivel": nivel}

    def validate_session(self):
        # TODO: Implementar validación de sesión cuando se integren usuarios
        pass


class SaveRecord(ConexionApi):
    """Guarda el récord de un jugador al completar un nivel."""
    def main(self):
        username = (self.data.get('username', '') or '').strip().lower()
        level_id = self.data.get('level_id', '')
        moves = int(self.data.get('moves', 0))
        seconds = int(self.data.get('seconds', 0))

        if not username or not level_id:
            raise self.MYE("Datos de guardado inválidos.")

        # Asegurar que el usuario existe
        check_user = """
        SELECT id FROM usuarios WHERE username = :username
        """
        user_result = self.conexion.consulta_asociativa(check_user, {'username': username})

        if user_result.empty:
            insert_user = """
            INSERT INTO usuarios (username) VALUES (:username)
            RETURNING id
            """
            user_result = self.conexion.consulta_asociativa(insert_user, {'username': username})
        else:
            update_user = """
            UPDATE usuarios SET last_login = NOW() WHERE username = :username
            """
            self.conexion.ejecutar(update_user, {'username': username})

        user_id = self.d2d(user_result)[0]['id']

        # Insertar récord
        insert_record = """
        INSERT INTO rush_hour_jugadas (level_id, user_id, moves, time_seconds)
        VALUES (:level_id, :user_id, :moves, :time_seconds)
        """
        self.conexion.ejecutar(insert_record, {
            'level_id': level_id,
            'user_id': user_id,
            'moves': moves,
            'time_seconds': seconds
        })

        self.response = {"status": "success"}

    def validate_session(self):
        # TODO: Implementar validación de sesión cuando se integren usuarios
        pass


class GetRecords(ConexionApi):
    """Obtiene el Top 10 de un nivel específico."""
    def main(self):
        level_id = self.data.get('level_id', '')
        if not level_id:
            raise self.MYE("ID de nivel requerido.")

        query = """
        SELECT u.username, MIN(r.moves) as moves, MIN(r.time_seconds) as time_seconds,
               MAX(r.timestamp) as timestamp
        FROM rush_hour_jugadas r
        JOIN usuarios u ON r.user_id = u.id
        WHERE r.level_id = :level_id
        GROUP BY u.id, u.username
        ORDER BY moves ASC, time_seconds ASC
        LIMIT 10
        """
        result = self.conexion.consulta_asociativa(query, {'level_id': level_id})
        records = self.d2d(result)

        self.response = {"world": records}

    def validate_session(self):
        pass


class GetUserRecords(ConexionApi):
    """Obtiene los records de un usuario específico."""
    def main(self):
        username = (self.data.get('username', '') or '').strip().lower()
        if not username:
            raise self.MYE("Username requerido.")

        query = """
        SELECT r.level_id as nivel_id, l.optimo, r.moves, r.time_seconds,
               TO_CHAR(r.timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp
        FROM rush_hour_jugadas r
        JOIN usuarios u ON r.user_id = u.id
        JOIN rush_hour_levels l ON r.level_id = l.id
        WHERE u.username = :username
        ORDER BY r.timestamp DESC
        LIMIT 50
        """
        result = self.conexion.consulta_asociativa(query, {'username': username})
        records = self.d2d(result)

        self.response = {"records": records}

    def validate_session(self):
        pass


class GetTopPlayers(ConexionApi):
    """Ranking de jugadores con más niveles resueltos (Leyendas)."""
    def main(self):
        query = """
        SELECT u.username, COUNT(r.id) as total
        FROM rush_hour_jugadas r
        JOIN usuarios u ON r.user_id = u.id
        GROUP BY u.id, u.username
        ORDER BY total DESC
        LIMIT 10
        """
        result = self.conexion.consulta_asociativa(query)
        players = self.d2d(result)

        self.response = {"players": players}

    def validate_session(self):
        pass


class GetTrending(ConexionApi):
    """Niveles más populares y últimos jugados."""
    def main(self):
        # 10 más populares
        popular_query = """
        SELECT id, optimo, plays_count
        FROM rush_hour_levels
        ORDER BY plays_count DESC
        LIMIT 10
        """
        popular_result = self.conexion.consulta_asociativa(popular_query)
        popular = self.d2d(popular_result)

        # 10 últimos jugados
        recent_query = """
        SELECT id, optimo, plays_count, last_played
        FROM rush_hour_levels
        WHERE last_played IS NOT NULL
        ORDER BY last_played DESC
        LIMIT 10
        """
        recent_result = self.conexion.consulta_asociativa(recent_query)
        recent = self.d2d(recent_result)

        self.response = {"popular": popular, "recent": recent}

    def validate_session(self):
        pass
