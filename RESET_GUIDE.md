# 🔄 Guía de Reset - Error 500 en Importación

## Problema
Cuando intentes importar datos desde CSV, recibes error 500. Esto ocurre porque las tablas de inventario no existen o están corruptas.

## Solución Rápida (Recomendado)

### Paso 1: Detener los contenedores
```bash
cd /home/jmv74211/projects/sell-buy
docker-compose down
```

### Paso 2: Eliminar volúmenes de PostgreSQL (limpia la BD completamente)
```bash
docker volume rm sell-buy_postgres_data
# O si tienes otro nombre de volumen:
docker volume ls | grep postgres
docker volume rm <nombre_del_volumen>
```

### Paso 3: Reconstruir e iniciar
```bash
docker-compose up -d --build
```

### Paso 4: Esperar a que PostgreSQL inicie
```bash
# Espera ~10 segundos, luego verifica
docker-compose logs postgres

# O en otra terminal, cuando esté listo, verás algo como:
# "database system is ready to accept connections"
```

### Paso 5: Verificar que todo funciona
```bash
# Verifica que el backend está corriendo
curl http://localhost:8000/health

# Debería retornar:
# {"status":"ok","service":"SellBuy API"}
```

Como alternativa, si NO quieres perder datos existentes en la BD:

## Opción 2: Reset Solo de Inventario (Mantiene otros datos)

```bash
# Entra al contenedor
docker-compose exec backend bash

# Corre el script de reset dentro del contenedor
cd /home/jmv74211/projects/sell-buy/backend
python << 'EOF'
from app.database import engine
from app import models
from sqlalchemy import text

# Agrega esto solo para ciertas tablas
connection = engine.connect()
try:
    connection.execute(text('DROP TABLE IF EXISTS articles CASCADE'))
    connection.execute(text('DROP TABLE IF EXISTS platform_ranges CASCADE'))
    connection.commit()
except:
    pass
finally:
    connection.close()

models.Base.metadata.create_all(bind=engine)
print("✅ Reset complete!")
EOF

# Salir del contenedor
exit

# Reinicia el backend
docker-compose restart backend
```

## Verificación Post-Reset

### 1. Verifica que las tablas existen
```bash
docker-compose exec postgres psql -U postgres sellbuy_db -c "\dt"
```

Deberías ver:
```
 public | articles           | table | postgres
 public | estimations        | table | postgres
 public | platform_ranges    | table | postgres
 public | purchases          | table | postgres
 public | sales              | table | postgres
 public | users              | table | postgres
```

### 2. Verifica que hay datos iniciales
```bash
docker-compose exec postgres psql -U postgres sellbuy_db -c "SELECT COUNT(*) FROM platform_ranges;"
# Debería mostrar: count
#                  13

docker-compose exec postgres psql -U postgres sellbuy_db -c "SELECT COUNT(*) FROM articles;"
# Debería mostrar: count
#                  14+
```

### 3. Verifica endpoints de API
```bash
# Plataformas
curl http://localhost:8000/api/inventory/platforms | head -20

# Artículos
curl http://localhost:8000/api/inventory/articles | head -20

# Debe retornar JSON, no error 500
```

## Ahora Prueba la Importación

### 1. Prepara un CSV simple
```csv
COD_ART,ARTÍCULO,PRECIO COMPRA,ESTIMACIÓN VENTA,REVENDIDO POR,GANANCIA ESTIMADA,GANANCIA NETA,FECHA COMPRA,FECHA VENTA
5000,Metal Gear Solid Collection,36,43,43,7,7,07-02-2026,24-02-2026
7009,Pokemon Leyendas ZA,35,40,40,5,5,11-02-2026,10-04-2026
```

Guarda como: `/tmp/test_import.csv`

### 2. Importa desde la API (cURL)
```bash
# Primero, obtén un token:
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_name":"admin","password":"admin123"}' | jq -r '.access_token')

# Luego importa el CSV
curl -X POST http://localhost:8000/api/import/csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_import.csv"
```

### 3. Verifica en el Frontend
```
1. Abre http://localhost:3000/purchases
2. Debería mostrar las compras importadas
3. El campo "Código del Artículo" debería tener valores
```

## Si Sigue Fallando

### Revisa Logs del Backend
```bash
docker-compose logs -f backend

# Busca por "ERROR" o "Exception"
# Copia el error completo
```

### Revisa Logs de PostgreSQL
```bash
docker-compose logs -f postgres

# Busca por "ERROR" o "FATAL"
```

### Reinicia Todo Limpio
```bash
# Nuclear option - borra todo
docker-compose down -v
docker volume prune -f

# Reconstruye
docker-compose up -d --build

# Espera 15 segundos
sleep 15

# Verifica
curl http://localhost:8000/health
```

## Estructura de Tablas Correcta

### Tabla: articles
```
 article_code | integer  | primary key
 article_name | varchar  | not null
 platform_id  | integer  | foreign key -> platform_ranges.id
 created_at   | datetime |
```

### Tabla: purchases
```
 id           | integer  | primary key
 user_id      | integer  | foreign key -> users.id
 article_name | varchar  | not null
 article_code | integer  | NULLABLE (NO FK!) ← Este cambio es importante
 purchase_date| datetime | not null
 amount       | numeric  | not null
 created_at   | datetime |
```

El cambio clave: `article_code` ya no es una FK, solo un Campo Integer opcional. Esto evita errores 500 cuando es NULL.

## Troubleshooting Rápido

| Síntoma | Solución |
|---------|----------|
| `Error 500` al importar | Run: `docker-compose down -v && docker-compose up -d --build` |
| Tablas no existen | Backend auto-crea al startup |
| Datos iniciales vacíos | Backend auto-puebla al startup |
| PostgreSQL no inicia | Espera 15-30 segundos, revisa logs: `docker-compose logs postgres` |
| FK constraint violation | Ya está arreglado en nuevo modelo - sin FK en article_code |
| CSV header no encontrado | Asegura que tienes columna "ARTÍCULO" o "ARTICULO" |

## Conclusión

✅ **Cambios realizados:**
1. Modelo Article simplificado (sin relación bidi con Purchase)
2. Purchase.article_code es ahora Integer simple, NO FK
3. main.py auto-inicializa datos en startup
4. reset_db.sh disponible para resetear manual

✅ **Esto debería resolver el error 500**

Si aún tienes problemas, revisa los logs y comparte el error específico.
