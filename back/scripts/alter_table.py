import sys
from core.bases.utils import ClassBase
from core.conf.settings import MYE

class AlterTable(ClassBase):
    def __init__(self):
        self.create_conexion()

    def alter(self):
        query = "ALTER TABLE adivina_decks_tarjetas ADD COLUMN orden INTEGER DEFAULT 0;"
        self.conexion.ejecutar(query, {})
        self.conexion.commit()

if __name__ == "__main__":
    try:
        a = AlterTable()
        a.alter()
        print("Column added successfully")
    except Exception as e:
        print(e)
