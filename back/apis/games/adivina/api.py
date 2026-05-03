import os
import random
import string
from core.bases.apis import BaseApi, ConexionApi, SessionApi
from core.conf.settings import MEDIA_DIR


def get_usuario_from_token(conexion, d2d, token, MYE):
    query = """
        SELECT u.id, u.username FROM sessiones s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token = :token
        ORDER BY s.created_at DESC LIMIT 1
    """
    result = conexion.consulta_asociativa(query, {'token': token})
    users = d2d(result)
    if not users:
        raise MYE("Sesión no válida")
    return users[0]


def validate_admin(conexion, d2d, token, MYE):
    user = get_usuario_from_token(conexion, d2d, token, MYE)
    if user['username'] != 'test':
        raise MYE("No tienes permisos para esta acción")


def validate_creator_or_admin(conexion, d2d, token, owner_id, MYE):
    user = get_usuario_from_token(conexion, d2d, token, MYE)
    if user['id'] != owner_id and user['username'] != 'test':
        raise MYE("No tienes permisos para editar este recurso")
    return user


def generate_sala_code(length=6):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


# ─────────────────────────── TAGS ────────────────────────────

class ListTags(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        query = """
            SELECT t.id, t.nombre,
                   COUNT(DISTINCT tt.tarjeta_id) as tarjetas_count
            FROM adivina_tags t
            LEFT JOIN adivina_tarjetas_tags tt ON tt.tag_id = t.id
            GROUP BY t.id
            ORDER BY t.nombre
        """
        result = self.conexion.consulta_asociativa(query)
        self.response = {"tags": self.d2d(result)}


class CreateTag(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        nombre = self.data.get('nombre', '').strip().upper()
        if not nombre:
            raise self.MYE("El nombre es requerido")

        # Verificar si ya existe
        check = self.conexion.consulta_asociativa(
            "SELECT id FROM adivina_tags WHERE UPPER(nombre) = :nombre",
            {'nombre': nombre}
        )
        existing = self.d2d(check)
        if existing:
            self.response = {"message": "Tag ya existe", "id": existing[0]['id'], "exists": True}
            return

        tag_id = self.get_id()
        query = "INSERT INTO adivina_tags (id, nombre) VALUES (:id, :nombre)"
        self.conexion.ejecutar(query, {'id': tag_id, 'nombre': nombre})
        self.response = {"message": "Tag creado", "id": tag_id}


class DeleteTag(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        tag_id = self.data.get('tag_id', '')
        if not tag_id:
            raise self.MYE("ID requerido")
        self.conexion.ejecutar("DELETE FROM adivina_tags WHERE id = :id", {'id': tag_id})
        self.response = {"message": "Tag eliminado"}


# ─────────────────────────── TARJETAS ────────────────────────────

class ListTarjetas(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        tags_filter = self.data.get('tags', '')
        q_filter = self.data.get('q', '').strip()

        params = {}
        where_clauses = []

        if q_filter:
            where_clauses.append("(t.nombre ILIKE :q OR t.descripcion ILIKE :q)")
            params['q'] = f'%{q_filter}%'

        if tags_filter:
            tag_names = [x.strip().upper() for x in tags_filter.split(',') if x.strip()]
            if tag_names:
                where_clauses.append("""
                    t.id IN (
                        SELECT tt2.tarjeta_id FROM adivina_tarjetas_tags tt2
                        JOIN adivina_tags tg2 ON tg2.id = tt2.tag_id
                        WHERE UPPER(tg2.nombre) = ANY(:tag_names)
                    )
                """)
                params['tag_names'] = tag_names

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        query = f"""
            SELECT t.id, t.nombre, t.descripcion, t.imagen, t.creador_id,
                   u.username as creador_username,
                   t.created_at,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object('id', tg.id, 'nombre', tg.nombre))
                       FILTER (WHERE tg.id IS NOT NULL), '[]'
                   ) as tags
            FROM adivina_tarjetas t
            LEFT JOIN usuarios u ON u.id = t.creador_id
            LEFT JOIN adivina_tarjetas_tags tt ON tt.tarjeta_id = t.id
            LEFT JOIN adivina_tags tg ON tg.id = tt.tag_id
            {where_sql}
            GROUP BY t.id, u.username
            ORDER BY t.nombre
        """
        result = self.conexion.consulta_asociativa(query, params)
        data = self.d2d(result)

        for tarjeta in data:
            if tarjeta.get('imagen'):
                tarjeta['imagen_url'] = f"/media/images/adivina/{tarjeta['id']}/{tarjeta['imagen']}"
            else:
                tarjeta['imagen_url'] = None

        self.response = {"tarjetas": data}


class CreateTarjeta(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        nombre = self.data.get('nombre', '').strip()
        descripcion = self.data.get('descripcion', '')
        tags = self.data.get('tags', [])

        if not nombre:
            raise self.MYE("El nombre es requerido")

        tarjeta_id = self.get_id()
        query = """
            INSERT INTO adivina_tarjetas (id, nombre, descripcion, creador_id)
            VALUES (:id, :nombre, :descripcion, :creador_id)
        """
        self.conexion.ejecutar(query, {
            'id': tarjeta_id, 'nombre': nombre,
            'descripcion': descripcion, 'creador_id': user['id']
        })

        for tag_id in tags:
            tt_id = self.get_id()
            self.conexion.ejecutar(
                "INSERT INTO adivina_tarjetas_tags (id, tarjeta_id, tag_id) VALUES (:id, :tarjeta_id, :tag_id)",
                {'id': tt_id, 'tarjeta_id': tarjeta_id, 'tag_id': tag_id}
            )

        img_dir = os.path.join(MEDIA_DIR, 'images', 'adivina', tarjeta_id)
        os.makedirs(img_dir, exist_ok=True)

        self.response = {"message": "Tarjeta creada", "id": tarjeta_id}


class UpdateTarjeta(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        tarjeta_id = self.data.get('tarjeta_id', '')
        if not tarjeta_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_tarjetas WHERE id = :id",
            {'id': tarjeta_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Tarjeta no encontrada")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)

        nombre = self.data.get('nombre', '').strip()
        descripcion = self.data.get('descripcion', '')
        tags = self.data.get('tags', [])

        if not nombre:
            raise self.MYE("El nombre es requerido")

        self.conexion.ejecutar(
            "UPDATE adivina_tarjetas SET nombre = :nombre, descripcion = :descripcion WHERE id = :id",
            {'id': tarjeta_id, 'nombre': nombre, 'descripcion': descripcion}
        )

        self.conexion.ejecutar(
            "DELETE FROM adivina_tarjetas_tags WHERE tarjeta_id = :tarjeta_id",
            {'tarjeta_id': tarjeta_id}
        )
        for tag_id in tags:
            tt_id = self.get_id()
            self.conexion.ejecutar(
                "INSERT INTO adivina_tarjetas_tags (id, tarjeta_id, tag_id) VALUES (:id, :tarjeta_id, :tag_id)",
                {'id': tt_id, 'tarjeta_id': tarjeta_id, 'tag_id': tag_id}
            )

        self.response = {"message": "Tarjeta actualizada"}


class DeleteTarjeta(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        tarjeta_id = self.data.get('tarjeta_id', '')
        if not tarjeta_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_tarjetas WHERE id = :id",
            {'id': tarjeta_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Tarjeta no encontrada")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)

        import shutil
        img_dir = os.path.join(MEDIA_DIR, 'images', 'adivina', tarjeta_id)
        if os.path.exists(img_dir):
            shutil.rmtree(img_dir)

        self.conexion.ejecutar("DELETE FROM adivina_tarjetas WHERE id = :id", {'id': tarjeta_id})
        self.response = {"message": "Tarjeta eliminada"}


class UploadTarjetaImagen(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    async def run(self):
        self.get_client_ip()
        self.get_get_data()
        await self.get_post_data()
        try:
            from starlette.concurrency import run_in_threadpool
            await run_in_threadpool(self.validate_session)
            result = await self.main_async()
            return result or self.response
        except Exception as e:
            self.errors(e)
        finally:
            self.close_conexion()

    async def main_async(self):
        from starlette.concurrency import run_in_threadpool
        tarjeta_id = self.data.get('tarjeta_id', '')
        file = self.data.get('file')
        if not tarjeta_id or not file:
            raise self.MYE("tarjeta_id y archivo requeridos")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_tarjetas WHERE id = :id",
            {'id': tarjeta_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Tarjeta no encontrada")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)

        img_dir = os.path.join(MEDIA_DIR, 'images', 'adivina', tarjeta_id)
        os.makedirs(img_dir, exist_ok=True)

        filename = file.filename
        file_path = os.path.join(img_dir, filename)
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)

        self.conexion.ejecutar(
            "UPDATE adivina_tarjetas SET imagen = :imagen WHERE id = :id",
            {'imagen': filename, 'id': tarjeta_id}
        )

        self.response = {
            "message": "Imagen subida",
            "imagen_url": f"/media/images/adivina/{tarjeta_id}/{filename}"
        }


# ─────────────────────────── DECKS ────────────────────────────

class ListDecks(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        query = """
            SELECT d.id, d.nombre, d.descripcion, d.created_at, d.publico,
                   COUNT(dt.id) as tarjetas_count,
                   TRUE::boolean as is_owner,
                   FALSE::boolean as linked,
                   NULL::VARCHAR as import_id,
                   u.username as creador_username
            FROM adivina_decks d
            LEFT JOIN adivina_decks_tarjetas dt ON dt.deck_id = d.id
            LEFT JOIN usuarios u ON u.id = d.creador_id
            WHERE d.creador_id = :uid
            GROUP BY d.id, u.username

            UNION ALL

            SELECT d.id, d.nombre, d.descripcion, d.created_at, d.publico,
                   COUNT(dt.id) as tarjetas_count,
                   FALSE::boolean as is_owner,
                   TRUE::boolean as linked,
                   di.id::VARCHAR as import_id,
                   u.username as creador_username
            FROM adivina_decks_importados di
            JOIN adivina_decks d ON d.id = di.deck_id
            LEFT JOIN adivina_decks_tarjetas dt ON dt.deck_id = d.id
            LEFT JOIN usuarios u ON u.id = d.creador_id
            WHERE di.usuario_id = :uid
            GROUP BY d.id, di.id, u.username

            ORDER BY nombre
        """
        result = self.conexion.consulta_asociativa(query, {'uid': user['id']})
        self.response = {"decks": self.d2d(result)}


class CreateDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        nombre = self.data.get('nombre', '').strip()
        descripcion = self.data.get('descripcion', '')
        tarjeta_ids = self.data.get('tarjeta_ids', [])

        if not nombre:
            raise self.MYE("El nombre es requerido")

        deck_id = self.get_id()
        self.conexion.ejecutar(
            "INSERT INTO adivina_decks (id, nombre, descripcion, creador_id) VALUES (:id, :nombre, :descripcion, :creador_id)",
            {'id': deck_id, 'nombre': nombre, 'descripcion': descripcion, 'creador_id': user['id']}
        )

        for index, tarjeta_id in enumerate(tarjeta_ids):
            dt_id = self.get_id()
            self.conexion.ejecutar(
                "INSERT INTO adivina_decks_tarjetas (id, deck_id, tarjeta_id, orden) VALUES (:id, :deck_id, :tarjeta_id, :orden)",
                {'id': dt_id, 'deck_id': deck_id, 'tarjeta_id': tarjeta_id, 'orden': index}
            )

        self.response = {"message": "Deck creado", "id": deck_id}


class UpdateDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_decks WHERE id = :id",
            {'id': deck_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Deck no encontrado")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)

        nombre = self.data.get('nombre', '').strip()
        descripcion = self.data.get('descripcion', '')
        tarjeta_ids = self.data.get('tarjeta_ids', [])

        if not nombre:
            raise self.MYE("El nombre es requerido")

        self.conexion.ejecutar(
            "UPDATE adivina_decks SET nombre = :nombre, descripcion = :descripcion WHERE id = :id",
            {'id': deck_id, 'nombre': nombre, 'descripcion': descripcion}
        )

        self.conexion.ejecutar(
            "DELETE FROM adivina_decks_tarjetas WHERE deck_id = :deck_id",
            {'deck_id': deck_id}
        )
        for index, tarjeta_id in enumerate(tarjeta_ids):
            dt_id = self.get_id()
            self.conexion.ejecutar(
                "INSERT INTO adivina_decks_tarjetas (id, deck_id, tarjeta_id, orden) VALUES (:id, :deck_id, :tarjeta_id, :orden)",
                {'id': dt_id, 'deck_id': deck_id, 'tarjeta_id': tarjeta_id, 'orden': index}
            )

        self.response = {"message": "Deck actualizado"}


class DeleteDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_decks WHERE id = :id",
            {'id': deck_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Deck no encontrado")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)
        self.conexion.ejecutar("DELETE FROM adivina_decks WHERE id = :id", {'id': deck_id})
        self.response = {"message": "Deck eliminado"}


class GetDeckTarjetas(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        query = """
            SELECT t.id, t.nombre, t.descripcion, t.imagen,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object('id', tg.id, 'nombre', tg.nombre))
                       FILTER (WHERE tg.id IS NOT NULL), '[]'
                   ) as tags
            FROM adivina_decks_tarjetas dt
            JOIN adivina_tarjetas t ON t.id = dt.tarjeta_id
            LEFT JOIN adivina_tarjetas_tags tt ON tt.tarjeta_id = t.id
            LEFT JOIN adivina_tags tg ON tg.id = tt.tag_id
            WHERE dt.deck_id = :deck_id
            GROUP BY t.id, dt.orden
            ORDER BY dt.orden ASC, t.nombre
        """
        result = self.conexion.consulta_asociativa(query, {'deck_id': deck_id})
        data = self.d2d(result)
        for t in data:
            if t.get('imagen'):
                t['imagen_url'] = f"/media/images/adivina/{t['id']}/{t['imagen']}"
            else:
                t['imagen_url'] = None
        self.response = {"tarjetas": data}


class PublicarDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        deck_id = self.data.get('deck_id', '')
        publico = bool(self.data.get('publico', True))
        if not deck_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT creador_id FROM adivina_decks WHERE id = :id",
            {'id': deck_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Deck no encontrado")

        validate_creator_or_admin(self.conexion, self.d2d, self.token, rows[0]['creador_id'], self.MYE)
        self.conexion.ejecutar(
            "UPDATE adivina_decks SET publico = :publico WHERE id = :id",
            {'id': deck_id, 'publico': publico}
        )
        self.response = {"message": "Deck actualizado", "publico": publico}


class DecksPublicos(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        query = """
            SELECT d.id, d.nombre, d.descripcion, d.created_at,
                   COUNT(dt.id) as tarjetas_count,
                   u.username as creador_username,
                   EXISTS(
                       SELECT 1 FROM adivina_decks_importados di2
                       WHERE di2.deck_id = d.id AND di2.usuario_id = :uid
                   ) as ya_importado
            FROM adivina_decks d
            LEFT JOIN adivina_decks_tarjetas dt ON dt.deck_id = d.id
            LEFT JOIN usuarios u ON u.id = d.creador_id
            WHERE d.publico = TRUE AND d.creador_id != :uid
            GROUP BY d.id, u.username
            ORDER BY d.nombre
        """
        result = self.conexion.consulta_asociativa(query, {'uid': user['id']})
        self.response = {"decks": self.d2d(result)}


class ImportarDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT id, publico, creador_id FROM adivina_decks WHERE id = :id",
            {'id': deck_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Deck no encontrado")
        if not rows[0]['publico']:
            raise self.MYE("Este deck no es público")
        if rows[0]['creador_id'] == user['id']:
            raise self.MYE("No puedes importar tu propio deck")

        check = self.conexion.consulta_asociativa(
            "SELECT id FROM adivina_decks_importados WHERE deck_id = :deck_id AND usuario_id = :uid",
            {'deck_id': deck_id, 'uid': user['id']}
        )
        if self.d2d(check):
            raise self.MYE("Ya tienes este deck importado")

        import_id = self.get_id()
        self.conexion.ejecutar(
            "INSERT INTO adivina_decks_importados (id, deck_id, usuario_id) VALUES (:id, :deck_id, :uid)",
            {'id': import_id, 'deck_id': deck_id, 'uid': user['id']}
        )
        self.response = {"message": "Deck importado", "id": import_id}


class DesvincularDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        self.conexion.ejecutar(
            "DELETE FROM adivina_decks_importados WHERE deck_id = :deck_id AND usuario_id = :uid",
            {'deck_id': deck_id, 'uid': user['id']}
        )
        self.response = {"message": "Deck desvinculado"}


class CopiarDeck(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)
        deck_id = self.data.get('deck_id', '')
        if not deck_id:
            raise self.MYE("ID requerido")

        result = self.conexion.consulta_asociativa(
            "SELECT id, nombre, descripcion FROM adivina_decks WHERE id = :id",
            {'id': deck_id}
        )
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Deck no encontrado")

        original = rows[0]
        new_deck_id = self.get_id()
        self.conexion.ejecutar(
            "INSERT INTO adivina_decks (id, nombre, descripcion, creador_id, publico) VALUES (:id, :nombre, :desc, :uid, FALSE)",
            {'id': new_deck_id, 'nombre': f"Copia de {original['nombre']}", 'desc': original['descripcion'], 'uid': user['id']}
        )

        tarjetas_result = self.conexion.consulta_asociativa(
            "SELECT tarjeta_id, orden FROM adivina_decks_tarjetas WHERE deck_id = :deck_id ORDER BY orden",
            {'deck_id': deck_id}
        )
        for t in self.d2d(tarjetas_result):
            dt_id = self.get_id()
            self.conexion.ejecutar(
                "INSERT INTO adivina_decks_tarjetas (id, deck_id, tarjeta_id, orden) VALUES (:id, :deck_id, :tarjeta_id, :orden)",
                {'id': dt_id, 'deck_id': new_deck_id, 'tarjeta_id': t['tarjeta_id'], 'orden': t['orden']}
            )

        # Remove link if user had this deck imported
        self.conexion.ejecutar(
            "DELETE FROM adivina_decks_importados WHERE deck_id = :deck_id AND usuario_id = :uid",
            {'deck_id': deck_id, 'uid': user['id']}
        )

        self.response = {"message": "Deck copiado", "id": new_deck_id}


# ─────────────────────────── SALAS ────────────────────────────

class ListSalas(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        query = """
            SELECT s.id, s.codigo, s.nombre, s.estado, s.visibilidad, s.max_jugadores, s.created_at,
                   u.username as creador_username,
                   COUNT(sj.id) as jugadores_count
            FROM adivina_salas s
            LEFT JOIN usuarios u ON u.id = s.creador_id
            LEFT JOIN adivina_salas_jugadores sj ON sj.sala_id = s.id
            WHERE s.estado = 'esperando' AND s.visibilidad = 'publica'
            GROUP BY s.id, u.username
            ORDER BY s.created_at DESC
        """
        result = self.conexion.consulta_asociativa(query)
        self.response = {"salas": self.d2d(result)}


class CreateSala(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        nombre = self.data.get('nombre', '').strip() or f"Sala de {user['username']}"
        max_jugadores = int(self.data.get('max_jugadores', 8))

        # Generate unique code
        for _ in range(10):
            codigo = generate_sala_code()
            check = self.conexion.consulta_asociativa(
                "SELECT id FROM adivina_salas WHERE codigo = :codigo",
                {'codigo': codigo}
            )
            if not self.d2d(check):
                break

        sala_id = self.get_id()
        visibilidad = self.data.get('visibilidad', 'publica')
        if visibilidad not in ('publica', 'privada'):
            visibilidad = 'publica'

        self.conexion.ejecutar(
            """INSERT INTO adivina_salas (id, codigo, nombre, creador_id, visibilidad, max_jugadores)
               VALUES (:id, :codigo, :nombre, :creador_id, :visibilidad, :max_jugadores)""",
            {'id': sala_id, 'codigo': codigo, 'nombre': nombre,
             'creador_id': user['id'], 'visibilidad': visibilidad, 'max_jugadores': max_jugadores}
        )

        jugador_id = self.get_id()
        self.conexion.ejecutar(
            "INSERT INTO adivina_salas_jugadores (id, sala_id, usuario_id) VALUES (:id, :sala_id, :usuario_id)",
            {'id': jugador_id, 'sala_id': sala_id, 'usuario_id': user['id']}
        )

        self.response = {"message": "Sala creada", "sala_id": sala_id, "codigo": codigo}


class GetSala(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        codigo = self.data.get('codigo', '')
        if not codigo:
            raise self.MYE("Código requerido")

        query = """
            SELECT s.id, s.codigo, s.nombre, s.estado, s.visibilidad, s.max_jugadores,
                   s.creador_id, u.username as creador_username, s.created_at
            FROM adivina_salas s
            LEFT JOIN usuarios u ON u.id = s.creador_id
            WHERE s.codigo = :codigo
        """
        result = self.conexion.consulta_asociativa(query, {'codigo': codigo})
        rows = self.d2d(result)
        if not rows:
            raise self.MYE("Sala no encontrada")

        self.response = {"sala": rows[0]}
