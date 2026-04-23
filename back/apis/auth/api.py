from core.bases.apis import BaseApi, ConexionApi, SessionApi, pln
from core.utils.security import check_password

class Login(ConexionApi):
    def main(self):
        self.show_me()
        usuario = self.data.get('usuario', '')
        passwd = self.data.get('passwd', '')

        if not usuario or not passwd:
            raise self.MYE("Usuario y contraseña son requeridos")

        query = """
            SELECT id, username, passwd
            FROM usuarios
            WHERE username = :usuario
        """
        result = self.conexion.consulta_asociativa(query, {'usuario': usuario})
        users = self.d2d(result)

        if not users:
            raise self.MYE("Usuario o contraseña incorrectos")

        user = users[0]

        if not check_password(passwd, user['passwd']):
            raise self.MYE("Usuario o contraseña incorrectos")

        token = self.get_id()

        # Save session
        session_id = self.get_id()
        query = """
            INSERT INTO sessiones (id, usuario_id, token)
            VALUES (:id, :usuario_id, :token)
        """
        self.conexion.ejecutar(query, {
            'id': session_id,
            'usuario_id': user['id'],
            'token': token
        })

        # Update last login
        query = """
            UPDATE usuarios SET last_login = CURRENT_TIMESTAMP
            WHERE id = :id
        """
        self.conexion.ejecutar(query, {'id': user['id']})

        self.response = {
            "user": {
                "id": user['id'],
                "username": user['username'],
                "is_admin": user['username'] == 'test',
            },
            "token": token
        }

    def validate_session(self):
        pass


class ValidateLogin(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        query = """
            SELECT u.id, u.username
            FROM sessiones s
            JOIN usuarios u ON u.id = s.usuario_id
            WHERE s.token = :token
            ORDER BY s.created_at DESC
            LIMIT 1
        """
        result = self.conexion.consulta_asociativa(query, {'token': self.token})
        users = self.d2d(result)

        if not users:
            raise self.MYE("Sesion no valida")

        user = users[0]

        self.response = {
            "user": {
                "id": user['id'],
                "username": user['username'],
                "is_admin": user['username'] == 'test',
            },
            "token": self.token
        }


class CloseSession(SessionApi):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.create_conexion()

    def main(self):
        query = """
            DELETE FROM sessiones
            WHERE token = :token
        """
        self.conexion.ejecutar(query, {'token': self.token})
        self.conexion.commit()
        self.response = {"message": "Sesion cerrada"}


""" 
"""
