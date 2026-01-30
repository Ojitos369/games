import pandas as pd
import uuid
import sys
from core.bases.utils import ClassBase
from core.conf.settings import MEDIA_DIR, MYE

class CargarNivelesRushHour(ClassBase):
    def __init__(self):
        self.file_path = MEDIA_DIR + "/txt/rush.txt"
        self.batch_size = 10000 # Lote grande para eficiencia
        self.create_conexion()

    def load_file(self):
        with open(self.file_path, "r") as f:
            lines = f.readlines()
        df = pd.DataFrame(lines, columns=["line"])
        df = df["line"].str.split(" ", expand=True)
        df.columns = ["optimo", "layout", "extra"]
        del df["extra"]
        self.df = df.to_dict(orient='records')

    def cargar_niveles(self):
        query = """
        INSERT INTO rush_hour_levels
        (optimo, layout, movimientos_usuario_minimo)
        VALUES 
        (:optimo, :layout, -1)
        """
        if not (self.conexion.ejecutar_multiple(query, self.df)):
            self.conexion.rollback()
            self.conexion.commit()
            raise MYE("Error al cargar los niveles")
        self.conexion.commit()


if __name__ == "__main__":
    try:
        cargar_niveles = CargarNivelesRushHour()
        cargar_niveles.load_file()
        cargar_niveles.cargar_niveles()
        print("Niveles cargados exitosamente")
    except Exception as e:
        print(e)
