import os
import shutil
from core.bases.apis import BaseApi, ConexionApi, SessionApi, pln
from core.conf.settings import MEDIA_DIR


def validate_admin(conexion, d2d, token, MYE):
    """Shared admin validation helper"""
    query = """
        SELECT u.username FROM sessiones s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token = :token
        ORDER BY s.created_at DESC LIMIT 1
    """
    result = conexion.consulta_asociativa(query, {'token': token})
    users = d2d(result)
    if not users or users[0]['username'] != 'test':
        raise MYE("No tienes permisos para esta acción")


class ListJuegos(ConexionApi):
    def validate_session(self):
        cookies = self.request.cookies
        mi_cookie = cookies.get('gamestka', '')
        auth_code = self.request.headers.get("authorization", None)
        self.token = mi_cookie or auth_code

    def main(self):
        usuario_id = None
        if self.token:
            query = """
                SELECT u.id FROM sessiones s
                JOIN usuarios u ON u.id = s.usuario_id
                WHERE s.token = :token
                ORDER BY s.created_at DESC LIMIT 1
            """
            result = self.conexion.consulta_asociativa(query, {'token': self.token})
            users = self.d2d(result)
            if users:
                usuario_id = users[0]['id']

        query = """
            SELECT j.id, j.nombre, j.descripcion, j.jugadores_min, j.jugadores_max,
                   j.url, j.calificacion, j.destacado, j.etiqueta,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object('id', c.id, 'nombre', c.nombre))
                       FILTER (WHERE c.id IS NOT NULL), '[]'
                   ) as categorias,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object(
                           'id', ji.id, 'nombre', ji.nombre, 'tipo', ji.tipo,
                           'es_portada', ji.es_portada, 'orden', ji.orden
                       ))
                       FILTER (WHERE ji.id IS NOT NULL), '[]'
                   ) as imagenes,
                   EXISTS(SELECT 1 FROM usuarios_favoritos uf WHERE uf.juego_id = j.id AND uf.usuario_id = :usuario_id) as es_favorito
            FROM juegos j
            LEFT JOIN juegos_categorias jc ON jc.juego_id = j.id
            LEFT JOIN categorias c ON c.id = jc.categoria_id
            LEFT JOIN juegos_imagenes ji ON ji.juego_id = j.id
            GROUP BY j.id
            ORDER BY j.destacado DESC, j.calificacion DESC, j.nombre
        """
        result = self.conexion.consulta_asociativa(query, {'usuario_id': usuario_id})
        data = self.d2d(result)

        # Add image URLs
        for juego in data:
            for img in juego.get('imagenes', []):
                if img and img.get('nombre'):
                    img['url'] = f"/media/images/games/{juego['id']}/{img['nombre']}"

        self.response = {"juegos": data}


class CreateJuego(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)

        nombre = self.data.get('nombre', '')
        descripcion = self.data.get('descripcion', '')
        jugadores_min = self.data.get('jugadores_min', 1)
        jugadores_max = self.data.get('jugadores_max', 1)
        url = self.data.get('url', '')
        calificacion = self.data.get('calificacion', 0)
        destacado = self.data.get('destacado', False)
        etiqueta = self.data.get('etiqueta', '')
        categorias = self.data.get('categorias', [])

        if not nombre:
            raise self.MYE("El nombre es requerido")

        juego_id = self.get_id()
        query = """
            INSERT INTO juegos (id, nombre, descripcion, jugadores_min, jugadores_max, url, calificacion, destacado, etiqueta)
            VALUES (:id, :nombre, :descripcion, :jugadores_min, :jugadores_max, :url, :calificacion, :destacado, :etiqueta)
        """
        self.conexion.ejecutar(query, {
            'id': juego_id, 'nombre': nombre, 'descripcion': descripcion,
            'jugadores_min': jugadores_min, 'jugadores_max': jugadores_max,
            'url': url, 'calificacion': calificacion, 'destacado': destacado,
            'etiqueta': etiqueta
        })

        # Associate categories
        for cat_id in categorias:
            jc_id = self.get_id()
            query = """
                INSERT INTO juegos_categorias (id, juego_id, categoria_id)
                VALUES (:id, :juego_id, :categoria_id)
            """
            self.conexion.ejecutar(query, {
                'id': jc_id, 'juego_id': juego_id, 'categoria_id': cat_id
            })

        # Create image directory
        img_dir = os.path.join(MEDIA_DIR, 'images', 'games', juego_id)
        os.makedirs(img_dir, exist_ok=True)

        self.response = {"message": "Juego creado", "id": juego_id}


class UpdateJuego(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)

        juego_id = self.data.get('juego_id', '')
        nombre = self.data.get('nombre', '')
        descripcion = self.data.get('descripcion', '')
        jugadores_min = self.data.get('jugadores_min', 1)
        jugadores_max = self.data.get('jugadores_max', 1)
        url = self.data.get('url', '')
        calificacion = self.data.get('calificacion', 0)
        destacado = self.data.get('destacado', False)
        etiqueta = self.data.get('etiqueta', '')
        categorias = self.data.get('categorias', [])

        if not juego_id or not nombre:
            raise self.MYE("ID y nombre son requeridos")

        query = """
            UPDATE juegos SET nombre = :nombre, descripcion = :descripcion,
            jugadores_min = :jugadores_min, jugadores_max = :jugadores_max,
            url = :url, calificacion = :calificacion, destacado = :destacado, etiqueta = :etiqueta
            WHERE id = :id
        """
        self.conexion.ejecutar(query, {
            'id': juego_id, 'nombre': nombre, 'descripcion': descripcion,
            'jugadores_min': jugadores_min, 'jugadores_max': jugadores_max,
            'url': url, 'calificacion': calificacion, 'destacado': destacado,
            'etiqueta': etiqueta
        })

        # Recreate category associations
        self.conexion.ejecutar("DELETE FROM juegos_categorias WHERE juego_id = :juego_id", {'juego_id': juego_id})
        for cat_id in categorias:
            jc_id = self.get_id()
            query = """
                INSERT INTO juegos_categorias (id, juego_id, categoria_id)
                VALUES (:id, :juego_id, :categoria_id)
            """
            self.conexion.ejecutar(query, {
                'id': jc_id, 'juego_id': juego_id, 'categoria_id': cat_id
            })

        self.response = {"message": "Juego actualizado"}


class DeleteJuego(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        juego_id = self.data.get('juego_id', '')
        if not juego_id:
            raise self.MYE("ID es requerido")

        # Remove image directory
        img_dir = os.path.join(MEDIA_DIR, 'images', 'games', juego_id)
        if os.path.exists(img_dir):
            shutil.rmtree(img_dir)

        self.conexion.ejecutar("DELETE FROM juegos WHERE id = :id", {'id': juego_id})
        self.response = {"message": "Juego eliminado"}


class ListCategorias(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        query = """
            SELECT c.id, c.nombre,
                   COUNT(jc.id) as juegos_count
            FROM categorias c
            LEFT JOIN juegos_categorias jc ON jc.categoria_id = c.id
            GROUP BY c.id
            ORDER BY c.nombre
        """
        result = self.conexion.consulta_asociativa(query)
        self.response = {"categorias": self.d2d(result)}


class CreateCategoria(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        nombre = self.data.get('nombre', '')
        if not nombre:
            raise self.MYE("El nombre es requerido")

        cat_id = self.get_id()
        query = "INSERT INTO categorias (id, nombre) VALUES (:id, :nombre)"
        self.conexion.ejecutar(query, {'id': cat_id, 'nombre': nombre})
        self.response = {"message": "Categoría creada", "id": cat_id}


class UpdateCategoria(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        cat_id = self.data.get('categoria_id', '')
        nombre = self.data.get('nombre', '')
        if not cat_id or not nombre:
            raise self.MYE("ID y nombre son requeridos")

        query = "UPDATE categorias SET nombre = :nombre WHERE id = :id"
        self.conexion.ejecutar(query, {'id': cat_id, 'nombre': nombre})
        self.response = {"message": "Categoría actualizada"}


class DeleteCategoria(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        cat_id = self.data.get('categoria_id', '')
        if not cat_id:
            raise self.MYE("ID es requerido")

        self.conexion.ejecutar("DELETE FROM categorias WHERE id = :id", {'id': cat_id})
        self.response = {"message": "Categoría eliminada"}


class UploadImagen(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        juego_id = self.data.get('juego_id', '')
        nombre = self.data.get('nombre', '')
        tipo = self.data.get('tipo', 'screenshot')
        es_portada = self.data.get('es_portada', False)
        orden = self.data.get('orden', 0)

        if not juego_id or not nombre:
            raise self.MYE("juego_id y nombre son requeridos")

        # If setting as portada, unset other portadas
        if es_portada:
            query = "UPDATE juegos_imagenes SET es_portada = FALSE WHERE juego_id = :juego_id"
            self.conexion.ejecutar(query, {'juego_id': juego_id})

        img_id = self.get_id()
        query = """
            INSERT INTO juegos_imagenes (id, juego_id, nombre, tipo, es_portada, orden)
            VALUES (:id, :juego_id, :nombre, :tipo, :es_portada, :orden)
        """
        self.conexion.ejecutar(query, {
            'id': img_id, 'juego_id': juego_id, 'nombre': nombre,
            'tipo': tipo, 'es_portada': es_portada, 'orden': orden
        })

        self.response = {
            "message": "Imagen registrada",
            "id": img_id,
            "url": f"/media/images/games/{juego_id}/{nombre}"
        }


class DeleteImagen(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        validate_admin(self.conexion, self.d2d, self.token, self.MYE)
        imagen_id = self.data.get('imagen_id', '')
        if not imagen_id:
            raise self.MYE("imagen_id es requerido")

        # Get image info before deleting
        query = """
            SELECT ji.nombre, ji.juego_id
            FROM juegos_imagenes ji
            WHERE ji.id = :id
        """
        result = self.conexion.consulta_asociativa(query, {'id': imagen_id})
        imgs = self.d2d(result)

        if imgs:
            img = imgs[0]
            # Delete file
            img_path = os.path.join(MEDIA_DIR, 'images', 'games', img['juego_id'], img['nombre'])
            if os.path.exists(img_path):
                os.remove(img_path)

        self.conexion.ejecutar("DELETE FROM juegos_imagenes WHERE id = :id", {'id': imagen_id})
        self.response = {"message": "Imagen eliminada"}


class ToggleFavorito(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        # Get usuario_id
        query = """
            SELECT u.id FROM sessiones s
            JOIN usuarios u ON u.id = s.usuario_id
            WHERE s.token = :token
            ORDER BY s.created_at DESC LIMIT 1
        """
        result = self.conexion.consulta_asociativa(query, {'token': self.token})
        users = self.d2d(result)
        if not users:
            raise self.MYE("No autorizado")
        usuario_id = users[0]['id']

        juego_id = self.data.get('juego_id', '')
        if not juego_id:
            raise self.MYE("ID del juego requerido")

        query = "SELECT id FROM usuarios_favoritos WHERE usuario_id = :usuario_id AND juego_id = :juego_id"
        result = self.conexion.consulta_asociativa(query, {'usuario_id': usuario_id, 'juego_id': juego_id})
        favs = self.d2d(result)

        if favs:
            # Eliminar
            self.conexion.ejecutar("DELETE FROM usuarios_favoritos WHERE id = :id", {'id': favs[0]['id']})
            self.response = {"message": "Eliminado de favoritos", "favorito": False}
        else:
            # Agregar
            fav_id = self.get_id()
            query = "INSERT INTO usuarios_favoritos (id, usuario_id, juego_id) VALUES (:id, :usuario_id, :juego_id)"
            self.conexion.ejecutar(query, {'id': fav_id, 'usuario_id': usuario_id, 'juego_id': juego_id})
            self.response = {"message": "Añadido a favoritos", "favorito": True}

""" 
"""
