import random
from core.bases.apis import ConexionApi, SessionApi, BaseApi, pln, prod_mode, dev_mode

class GetRandomLevel(ConexionApi):
    def main(self):
        level = self.data.get('level', random.randint(1, 60))
        query = """
        SELECT random() rdn, t.*
        FROM rush_hour_levels t
        WHERE optimo = :level
        ORDER by 1
        LIMIT 1
        """
        nivel = self.conexion.consulta_asociativa(query, {'level': level})
        self.response = {
            "nivel": nivel.to_dict("records")[0]
        }


class GetTopLevel(ConexionApi):
    def main(self):
        top = self.data.get('top', 10)