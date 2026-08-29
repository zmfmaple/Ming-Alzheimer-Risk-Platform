import sqlite3

from database import DATABASE_PATH

path = DATABASE_PATH
print('DB PATH:', path)
conn = sqlite3.connect(path)
cur = conn.cursor()
cur.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name")
rows = cur.fetchall()
print('TABLES:')
for r in rows:
    print(' ', r)

for name, type_ in rows:
    print('\n--', name)
    try:
        cur.execute(f'SELECT * FROM {name} LIMIT 5')
        cols = [d[0] for d in cur.description]
        print(cols)
        for row in cur.fetchall():
            print(row)
    except Exception as e:
        print('ERROR reading', name, e)
conn.close()
