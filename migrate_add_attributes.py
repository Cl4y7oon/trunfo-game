"""Migração para adicionar novos atributos ao banco de dados."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "trunfo.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Adicionar colunas em votes
    new_vote_cols = ["fofoqueira", "mentirosa", "boa_energia"]
    for col in new_vote_cols:
        try:
            cursor.execute(f"ALTER TABLE votes ADD COLUMN {col} INTEGER NOT NULL DEFAULT 10")
            print(f"Adicionado {col} em votes")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print(f"{col} ja existe em votes")
            else:
                raise

    # Adicionar colunas em character_stats
    new_stat_cols = ["fofoqueira", "mentirosa", "boa_energia"]
    for col in new_stat_cols:
        try:
            cursor.execute(f"ALTER TABLE character_stats ADD COLUMN {col} REAL DEFAULT 0")
            print(f"Adicionado {col} em character_stats")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print(f"{col} ja existe em character_stats")
            else:
                raise

    conn.commit()
    conn.close()
    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    migrate()
