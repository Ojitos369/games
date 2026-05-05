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

def _clamp_int(value, default, min_v, max_v):
    try:
        v = int(value)
    except (TypeError, ValueError):
        return default
    return max(min_v, min(max_v, v))


def _resolve_user_from_request(conexion, d2d, request):
    if request is None:
        return None
    try:
        token = request.cookies.get('gamestka', '') or request.headers.get('authorization', '')
    except Exception:
        token = ''
    if not token:
        return None
    query = """
        SELECT u.id, u.username FROM sessiones s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token = :token
        ORDER BY s.created_at DESC LIMIT 1
    """
    rows = d2d(conexion.consulta_asociativa(query, {'token': token}))
    return rows[0] if rows else None


TARJETA_SORT_MAP = {
    'name_asc': 't.nombre ASC',
    'name_desc': 't.nombre DESC',
    'recent': 't.created_at DESC NULLS LAST, t.nombre ASC',
    'oldest': 't.created_at ASC NULLS LAST, t.nombre ASC',
}


class ListTarjetas(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        user = _resolve_user_from_request(self.conexion, self.d2d, self.request)
        current_user_id = user['id'] if user else None

        q_filter = (self.data.get('q', '') or '').strip()
        tags_raw = self.data.get('tags', '') or ''
        tag_mode = (self.data.get('tag_mode', 'any') or 'any').lower()
        if tag_mode not in ('any', 'all'):
            tag_mode = 'any'
        scope = (self.data.get('scope', 'all') or 'all').lower()
        if scope not in ('all', 'mine', 'no_image', 'no_tags'):
            scope = 'all'
        sort_by = (self.data.get('sort_by', 'name_asc') or 'name_asc').lower()
        order_sql = TARJETA_SORT_MAP.get(sort_by, TARJETA_SORT_MAP['name_asc'])

        page = _clamp_int(self.data.get('page', 1), 1, 1, 10_000)
        page_size = _clamp_int(self.data.get('page_size', 48), 48, 1, 200)
        offset = (page - 1) * page_size

        params = {}
        where = []

        if q_filter:
            where.append("(t.nombre ILIKE :q OR COALESCE(t.descripcion,'') ILIKE :q)")
            params['q'] = f'%{q_filter}%'

        tag_names = [x.strip().upper() for x in tags_raw.split(',') if x.strip()]
        if tag_names:
            params['tag_names'] = tag_names
            if tag_mode == 'all':
                where.append("""
                    NOT EXISTS (
                        SELECT 1 FROM unnest(:tag_names) AS need(name)
                        WHERE NOT EXISTS (
                            SELECT 1 FROM adivina_tarjetas_tags tt2
                            JOIN adivina_tags tg2 ON tg2.id = tt2.tag_id
                            WHERE tt2.tarjeta_id = t.id AND UPPER(tg2.nombre) = need.name
                        )
                    )
                """)
            else:
                where.append("""
                    EXISTS (
                        SELECT 1 FROM adivina_tarjetas_tags tt2
                        JOIN adivina_tags tg2 ON tg2.id = tt2.tag_id
                        WHERE tt2.tarjeta_id = t.id AND UPPER(tg2.nombre) = ANY(:tag_names)
                    )
                """)

        if scope == 'mine':
            if not current_user_id:
                self.response = {
                    "tarjetas": [], "total": 0, "page": page,
                    "page_size": page_size, "pages": 0,
                    "scope_counts": {"all": 0, "mine": 0, "no_image": 0, "no_tags": 0},
                }
                return
            where.append("t.creador_id = :scope_uid")
            params['scope_uid'] = current_user_id
        elif scope == 'no_image':
            where.append("(t.imagen IS NULL OR t.imagen = '')")
        elif scope == 'no_tags':
            where.append("NOT EXISTS (SELECT 1 FROM adivina_tarjetas_tags tt3 WHERE tt3.tarjeta_id = t.id)")

        where_sql = ("WHERE " + " AND ".join(where)) if where else ""

        count_query = f"""
            SELECT COUNT(*) AS total
            FROM adivina_tarjetas t
            {where_sql}
        """
        total_rows = self.d2d(self.conexion.consulta_asociativa(count_query, params))
        total = int(total_rows[0]['total']) if total_rows else 0

        params['_limit'] = page_size
        params['_offset'] = offset

        list_query = f"""
            WITH paged AS (
                SELECT t.id
                FROM adivina_tarjetas t
                {where_sql}
                ORDER BY {order_sql}
                LIMIT :_limit OFFSET :_offset
            )
            SELECT t.id, t.nombre, t.descripcion, t.imagen, t.creador_id,
                   u.username as creador_username,
                   t.created_at,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object('id', tg.id, 'nombre', tg.nombre))
                       FILTER (WHERE tg.id IS NOT NULL), '[]'
                   ) as tags
            FROM paged p
            JOIN adivina_tarjetas t ON t.id = p.id
            LEFT JOIN usuarios u ON u.id = t.creador_id
            LEFT JOIN adivina_tarjetas_tags tt ON tt.tarjeta_id = t.id
            LEFT JOIN adivina_tags tg ON tg.id = tt.tag_id
            GROUP BY t.id, u.username
            ORDER BY {order_sql}
        """
        data = self.d2d(self.conexion.consulta_asociativa(list_query, params))
        for tarjeta in data:
            if tarjeta.get('imagen'):
                tarjeta['imagen_url'] = f"/media/images/adivina/{tarjeta['id']}/{tarjeta['imagen']}"
            else:
                tarjeta['imagen_url'] = None

        counts_params = {}
        mine_sql = "0"
        if current_user_id:
            mine_sql = "(SELECT COUNT(*) FROM adivina_tarjetas WHERE creador_id = :uid)"
            counts_params['uid'] = current_user_id
        counts_query = f"""
            SELECT
                (SELECT COUNT(*) FROM adivina_tarjetas) as total_all,
                {mine_sql} as total_mine,
                (SELECT COUNT(*) FROM adivina_tarjetas WHERE imagen IS NULL OR imagen = '') as total_no_image,
                (SELECT COUNT(*) FROM adivina_tarjetas t
                 WHERE NOT EXISTS (SELECT 1 FROM adivina_tarjetas_tags tt WHERE tt.tarjeta_id = t.id)
                ) as total_no_tags
        """
        counts_rows = self.d2d(self.conexion.consulta_asociativa(counts_query, counts_params))
        counts = counts_rows[0] if counts_rows else {}

        pages = (total + page_size - 1) // page_size if page_size else 1

        self.response = {
            "tarjetas": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
            "scope_counts": {
                "all": int(counts.get('total_all') or 0),
                "mine": int(counts.get('total_mine') or 0),
                "no_image": int(counts.get('total_no_image') or 0),
                "no_tags": int(counts.get('total_no_tags') or 0),
            },
        }


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

DECK_SORT_MAP = {
    'name_asc': 'nombre ASC',
    'name_desc': 'nombre DESC',
    'recent': 'created_at DESC NULLS LAST, nombre ASC',
    'oldest': 'created_at ASC NULLS LAST, nombre ASC',
    'biggest': 'tarjetas_count DESC, nombre ASC',
    'smallest': 'tarjetas_count ASC, nombre ASC',
}


class ListDecks(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        q_filter = (self.data.get('q', '') or '').strip()
        scope = (self.data.get('scope', 'all') or 'all').lower()
        if scope not in ('all', 'owned', 'imported'):
            scope = 'all'
        sort_by = (self.data.get('sort_by', 'name_asc') or 'name_asc').lower()
        order_sql = DECK_SORT_MAP.get(sort_by, DECK_SORT_MAP['name_asc'])

        page = _clamp_int(self.data.get('page', 1), 1, 1, 10_000)
        page_size = _clamp_int(self.data.get('page_size', 24), 24, 1, 200)
        offset = (page - 1) * page_size

        params = {'uid': user['id']}
        union_parts = []

        owned_part = """
            SELECT d.id, d.nombre, d.descripcion, d.created_at, d.publico,
                   (SELECT COUNT(*) FROM adivina_decks_tarjetas dt WHERE dt.deck_id = d.id) as tarjetas_count,
                   TRUE::boolean as is_owner,
                   FALSE::boolean as linked,
                   NULL::VARCHAR as import_id,
                   u.username as creador_username
            FROM adivina_decks d
            LEFT JOIN usuarios u ON u.id = d.creador_id
            WHERE d.creador_id = :uid
        """
        imported_part = """
            SELECT d.id, d.nombre, d.descripcion, d.created_at, d.publico,
                   (SELECT COUNT(*) FROM adivina_decks_tarjetas dt WHERE dt.deck_id = d.id) as tarjetas_count,
                   FALSE::boolean as is_owner,
                   TRUE::boolean as linked,
                   di.id::VARCHAR as import_id,
                   u.username as creador_username
            FROM adivina_decks_importados di
            JOIN adivina_decks d ON d.id = di.deck_id
            LEFT JOIN usuarios u ON u.id = d.creador_id
            WHERE di.usuario_id = :uid
        """

        if scope in ('all', 'owned'):
            union_parts.append(owned_part)
        if scope in ('all', 'imported'):
            union_parts.append(imported_part)

        union_sql = "\nUNION ALL\n".join(union_parts) if union_parts else "SELECT NULL WHERE FALSE"

        wrapper_where = []
        if q_filter:
            wrapper_where.append("(nombre ILIKE :q OR COALESCE(descripcion,'') ILIKE :q OR COALESCE(creador_username,'') ILIKE :q)")
            params['q'] = f'%{q_filter}%'
        wrapper_where_sql = ("WHERE " + " AND ".join(wrapper_where)) if wrapper_where else ""

        count_query = f"""
            SELECT COUNT(*) as total FROM ( {union_sql} ) AS combined
            {wrapper_where_sql}
        """
        total_rows = self.d2d(self.conexion.consulta_asociativa(count_query, params))
        total = int(total_rows[0]['total']) if total_rows else 0

        params['_limit'] = page_size
        params['_offset'] = offset

        list_query = f"""
            SELECT * FROM ( {union_sql} ) AS combined
            {wrapper_where_sql}
            ORDER BY {order_sql}
            LIMIT :_limit OFFSET :_offset
        """
        data = self.d2d(self.conexion.consulta_asociativa(list_query, params))

        owned_count_rows = self.d2d(self.conexion.consulta_asociativa(
            "SELECT COUNT(*) AS c FROM adivina_decks WHERE creador_id = :uid",
            {'uid': user['id']}
        ))
        imported_count_rows = self.d2d(self.conexion.consulta_asociativa(
            "SELECT COUNT(*) AS c FROM adivina_decks_importados WHERE usuario_id = :uid",
            {'uid': user['id']}
        ))
        owned_count = int(owned_count_rows[0]['c']) if owned_count_rows else 0
        imported_count = int(imported_count_rows[0]['c']) if imported_count_rows else 0

        pages = (total + page_size - 1) // page_size if page_size else 1

        self.response = {
            "decks": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
            "scope_counts": {
                "all": owned_count + imported_count,
                "owned": owned_count,
                "imported": imported_count,
            },
        }


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


PUBLIC_DECK_SORT_MAP = {
    'name_asc': 'd.nombre ASC',
    'name_desc': 'd.nombre DESC',
    'recent': 'd.created_at DESC NULLS LAST, d.nombre ASC',
    'oldest': 'd.created_at ASC NULLS LAST, d.nombre ASC',
    'biggest': 'tarjetas_count DESC, d.nombre ASC',
    'popular': 'imports_count DESC, d.nombre ASC',
}


class DecksPublicos(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)

        q_filter = (self.data.get('q', '') or '').strip()
        sort_by = (self.data.get('sort_by', 'recent') or 'recent').lower()
        order_sql = PUBLIC_DECK_SORT_MAP.get(sort_by, PUBLIC_DECK_SORT_MAP['recent'])
        only_new = (self.data.get('only_new', '') or '').lower() in ('1', 'true', 'yes')

        page = _clamp_int(self.data.get('page', 1), 1, 1, 10_000)
        page_size = _clamp_int(self.data.get('page_size', 24), 24, 1, 200)
        offset = (page - 1) * page_size

        params = {'uid': user['id']}
        where = ["d.publico = TRUE", "d.creador_id != :uid"]

        if q_filter:
            where.append("(d.nombre ILIKE :q OR COALESCE(d.descripcion,'') ILIKE :q OR COALESCE(u.username,'') ILIKE :q)")
            params['q'] = f'%{q_filter}%'

        if only_new:
            where.append("""NOT EXISTS (
                SELECT 1 FROM adivina_decks_importados di_n
                WHERE di_n.deck_id = d.id AND di_n.usuario_id = :uid
            )""")

        where_sql = "WHERE " + " AND ".join(where)

        count_query = f"""
            SELECT COUNT(*) AS total
            FROM adivina_decks d
            LEFT JOIN usuarios u ON u.id = d.creador_id
            {where_sql}
        """
        total_rows = self.d2d(self.conexion.consulta_asociativa(count_query, params))
        total = int(total_rows[0]['total']) if total_rows else 0

        params['_limit'] = page_size
        params['_offset'] = offset

        list_query = f"""
            SELECT d.id, d.nombre, d.descripcion, d.created_at,
                   (SELECT COUNT(*) FROM adivina_decks_tarjetas dt WHERE dt.deck_id = d.id) AS tarjetas_count,
                   (SELECT COUNT(*) FROM adivina_decks_importados di_c WHERE di_c.deck_id = d.id) AS imports_count,
                   u.username as creador_username,
                   EXISTS(
                       SELECT 1 FROM adivina_decks_importados di2
                       WHERE di2.deck_id = d.id AND di2.usuario_id = :uid
                   ) as ya_importado
            FROM adivina_decks d
            LEFT JOIN usuarios u ON u.id = d.creador_id
            {where_sql}
            ORDER BY {order_sql}
            LIMIT :_limit OFFSET :_offset
        """
        data = self.d2d(self.conexion.consulta_asociativa(list_query, params))

        pages = (total + page_size - 1) // page_size if page_size else 1

        self.response = {
            "decks": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
        }


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


class ReaperturarSala(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        user = get_usuario_from_token(self.conexion, self.d2d, self.token, self.MYE)
        codigo = self.data.get('codigo', '').strip().upper()
        if not codigo:
            raise self.MYE("Código requerido")

        # Verificar si ya existe una sala activa con ese código
        check = self.conexion.consulta_asociativa(
            "SELECT id FROM adivina_salas WHERE codigo = :codigo AND estado != 'terminado'",
            {'codigo': codigo}
        )
        if self.d2d(check):
            raise self.MYE("Ya existe una sala activa con este código")

        # Crear la sala con el código solicitado
        sala_id = self.get_id()
        nombre = f"Sala de {user['username']} (Reaperturada)"
        
        self.conexion.ejecutar(
            """INSERT INTO adivina_salas (id, codigo, nombre, creador_id, visibilidad, max_jugadores)
               VALUES (:id, :codigo, :nombre, :creador_id, 'publica', 8)""",
            {'id': sala_id, 'codigo': codigo, 'nombre': nombre,
             'creador_id': user['id']}
        )

        jugador_id = self.get_id()
        self.conexion.ejecutar(
            "INSERT INTO adivina_salas_jugadores (id, sala_id, usuario_id) VALUES (:id, :sala_id, :usuario_id)",
            {'id': jugador_id, 'sala_id': sala_id, 'usuario_id': user['id']}
        )

        self.response = {"message": "Sala reaperturada", "sala_id": sala_id, "codigo": codigo}
