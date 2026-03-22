# 🎯 Docker Commands Reference - Sell & Buy Platform

## Quick Start (El Más Importante)

### Opción 1: Hacer Dev (Recomendado)
```bash
make dev              # Linux/Mac
docker.bat dev        # Windows
./docker.sh dev       # Shell script
```

### Opción 2: Manual
```bash
# Crear archivo .env
cp .env.docker .env

# Iniciar servicios
docker-compose -f docker-compose.dev.yml up -d

# Acceder
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000/docs
```

---

## Archivos Docker Explicados

### docker-compose.yml
**Uso:** Producción y desarrollo
```bash
docker-compose up -d          # Levantar
docker-compose down           # Parar
docker-compose logs -f        # Ver logs
docker-compose ps             # Estado
```

### docker-compose.dev.yml
**Uso:** Desarrollo con hot reload
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### docker-compose.prod.yml
**Uso:** Producción con SSL
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📦 Imágenes Docker

### Backend (FastAPI)
```
Dockerfile (backend/)
├─ Stage 1: Builder
│  ├─ python:3.11-slim
│  ├─ pip install -r requirements.txt
│  └─ Crea /opt/venv
│
└─ Stage 2: Runtime
   ├─ Copia /opt/venv desde builder
   ├─ Expone 8000
   └─ Ejecuta uvicorn
```

**Tamaño:** ~400 MB

**Build:**
```bash
docker build -t sellbuy-backend:latest ./backend

# Multietapa (recomendado):
docker build --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t sellbuy-backend:latest ./backend
```

### Frontend (React + Nginx)
```
Dockerfile (frontend/)
├─ Stage 1: Builder Node
│  ├─ node:20-alpine
│  ├─ npm ci
│  ├─ npm run build
│  └─ Genera dist/
│
└─ Stage 2: Nginx
   ├─ nginx:alpine
   ├─ Copia dist/ desde builder
   ├─ Configura SPA routing
   └─ Expone 80
```

**Tamaño:** ~50 MB

**Build:**
```bash
docker build -t sellbuy-frontend:latest ./frontend

# Optimizado:
docker build --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t sellbuy-frontend:latest ./frontend
```

### Database (PostgreSQL)
```
Imagen: postgres:16-alpine
- Puerto: 5432
- Volume: postgres_data/
- Health: pg_isready
```

**Tamaño:** ~120 MB

---

## 🔧 Comandos Prácticos

### Ver Estado
```bash
# Contenedores corriendo
docker-compose ps

# Uso de recursos
docker stats

# Detalles de un contenedor
docker inspect sellbuy-backend
```

### Logs
```bash
# Todos
docker-compose logs

# Seguir en tiempo real
docker-compose logs -f

# Últimas 50 líneas
docker-compose logs --tail=50

# Solo backend
docker-compose logs backend

# Grep en logs
docker-compose logs backend | grep ERROR
```

### Ejecutar Comandos
```bash
# Shell en backend
docker-compose exec backend bash
docker-compose exec backend python -c "import sys; print(sys.version)"

# PostgreSQL CLI
docker-compose exec db psql -U sellbuy_user -d sellbuy
docker-compose exec db psql -U sellbuy_user -d sellbuy -c "SELECT COUNT(*) FROM users;"

# Ver variables de entorno
docker-compose exec backend env | grep DATABASE
```

### Archivos
```bash
# Copiar FROM contenedor TO host
docker cp sellbuy-backend:/app/logs ./local-logs

# Copiar FROM host TO contenedor
docker cp ./archivo.py sellbuy-backend:/app/

# Ver contenido de volumen
docker run --rm -v sellbuy_postgres_data:/data -it alpine ls -la /data
```

---

## 🔄 Ciclo de Desarrollo

### 1. Primer Inicio
```bash
# Crear .env
cp .env.docker .env

# Descargar imágenes base
docker-compose pull

# Construir imágenes locales
docker-compose build

# Levantar servicios
docker-compose up -d

# Esperar ~30 seg a que inicie todo
docker-compose logs -f backend | grep "Uvicorn running"
```

### 2. Desarrollo (Con cambios)
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Editar código
# backend/app/models.py
# frontend/src/App.tsx

# Los cambios se aplican automáticamente (hot reload)
# No necesitas reconstruir!
```

### 3. Cambios en Dependencias
```bash
# Backend (agregar paquete a requirements.txt)
docker-compose exec backend pip install nuevo-paquete
docker-compose restart backend

# Frontend (agregar paquete a package.json)
docker-compose exec frontend npm install nuevo-paquete
# npm run dev se reinicia automáticamente
```

### 4. Reconstruir Imágenes
```bash
# Si cambias Dockerfile
docker-compose build backend
docker-compose up -d backend

# Sin caché
docker-compose build --no-cache backend
```

### 5. Backup de Datos
```bash
# Crear backup
docker-compose exec -T db pg_dump -U sellbuy_user sellbuy > backup_$(date +%s).sql

# Restaurar
docker-compose exec -T db psql -U sellbuy_user sellbuy < backup_1234567890.sql
```

---

## 🐛 Problemas Comunes y Soluciones

### El contenedor se detiene inmediatamente
```bash
# Ver por qué se detiene
docker-compose logs backend

# Errores comunes:
# - "Cannot connect to database" → Esperar a que BD inicie
# - "Port 8000 already in use" → Cambiar puerto en docker-compose.yml
# - "Module not found" → Reconstruir: docker-compose build backend
```

### Frontend no conecta con Backend
```bash
# 1. Verificar que backend está corriendo
docker-compose ps

# 2. Verificar logs del frontend
docker-compose logs frontend

# 3. Verificar VITE_API_URL
docker-compose config | grep VITE_API_URL

# 4. Testear conexión
docker-compose exec frontend curl http://backend:8000/docs

# 5. Si necesita cambiar URL:
# Editar docker-compose.yml o .env
# VITE_API_URL=http://localhost:8000  (para desarrollo)
# VITE_API_URL=http://tu-dominio.com  (para producción)
```

### Base de datos da error
```bash
# Ver logs de BD
docker-compose logs db

# Verificar que está saludable
docker-compose ps  # Status debe ser "Up" con health "healthy"

# Esperar a que inicie
sleep 10
docker-compose restart backend

# Si sigue fallando, reiniciar BD
docker-compose restart db
docker-compose restart backend
```

### Puerto ya está en uso
```bash
# Encontrar qué ocupa el puerto
lsof -i :8000              # macOS/Linux
netstat -ano | findstr 8000 # Windows

# Cambiar puerto en docker-compose.yml
# "8001:8000" en lugar de "8000:8000"

# O parar el servicio que lo ocupa
kill -9 <PID>              # macOS/Linux
taskkill /PID <PID> /F     # Windows
```

### Cambios en código no se ven
```bash
# Los volúmenes están configurados para hot reload
# Si aún no funciona:

# 1. Verificar volúmenes
docker-compose config | grep -A3 volumes

# 2. Reiniciar servicios
docker-compose restart backend frontend

# 3. Si es cambio en requirements.txt o package.json
docker-compose down
docker-compose build
docker-compose up -d
```

### Espacio en disco lleno
```bash
# Limpiar imágenes no usadas
docker system prune

# Limpiar también volúmenes (CUIDADO - datos se pierden)
docker system prune -a --volumes

# Ver tamaño de volúmenes
docker system df

# Limpiar logs viejos
docker exec $(docker ps -q) sh -c 'truncate -s 0 /var/log/messages'
```

---

## 🚀 Deployment en Producción

### Usando docker-compose.prod.yml

```bash
# 1. Cambiar variables de entorno (IMPORTANTE)
cat > .env << EOF
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -hex 32)
VITE_API_URL=https://tu-dominio.com
EOF

# 2. Configurar SSL (obtener certificados)
# Usar Let's Encrypt: certbot certonly --standalone -d tu-dominio.com
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/key.pem

# 3. Levantar con configuración de producción
docker-compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               up -d

# 4. Verificar logs
docker-compose logs -f

# 5. Hacer backup inicial
docker-compose exec -T db pg_dump -U prod_user sellbuy > backup_inicial.sql
```

### Health Checks en Producción

```bash
# Backend
curl http://localhost:8000/docs

# Frontend
curl http://localhost/health

# Database
docker-compose exec db pg_isready -U prod_user

# Ver estado
docker-compose ps
# Status debe ser "Up" y Health "healthy"
```

### Monitoreo Continuo

```bash
# Ver recursos en tiempo real
watch -n 1 'docker stats --no-stream'

# Ver errores en logs
docker-compose logs --tail=100 | grep ERROR

# Ver cambios en los contenedores
docker events --filter type=container
```

---

## 📊 Referencia Rápida de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 8000 | http://localhost:8000 |
| Nginx | 80 | http://localhost |
| Nginx | 443 | https://localhost |
| PostgreSQL | 5432 | localhost:5432 |

---

## 🔐 Variables de Entorno

### Desarrollo (.env.docker)
```env
POSTGRES_USER=sellbuy_user
POSTGRES_PASSWORD=sellbuy_password_secure
POSTGRES_DB=sellbuy
DATABASE_URL=postgresql://sellbuy_user:sellbuy_password_secure@db:5432/sellbuy
SECRET_KEY=dev-key-not-secure-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
VITE_API_URL=http://localhost:8000
NODE_ENV=development
```

### Producción (cambiar valores!)
```env
POSTGRES_USER=prod_user_random_name
POSTGRES_PASSWORD=<long-random-string>
POSTGRES_DB=sellbuy
DATABASE_URL=postgresql://prod_user:password@db:5432/sellbuy
SECRET_KEY=<32-bytes-random-hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
VITE_API_URL=https://api.tu-dominio.com
NODE_ENV=production
```

**Generar valores seguros:**
```bash
# Contraseña
openssl rand -base64 32

# Secret key
openssl rand -hex 32

# User random
date +%s | sha256sum | base64 | head -c 20
```

---

## 📚 Archivos de Referencia

- `DOCKER.md` - Guía completa (500+ líneas)
- `DOCKER_SETUP.md` - Setup desglosado
- `docker-compose.yml` - Configuración con comentarios
- `docker-compose.dev.yml` - Configuración desarrollo
- `docker-compose.prod.yml` - Configuración producción
- `Makefile` - Comandos útiles (Unix/Mac)
- `docker.bat` - Comandos útiles (Windows)
- `docker.sh` - Script shell completo

---

## ✨ Tips & Tricks

### Alias útiles para bash
```bash
# Agregar a ~/.bashrc o ~/.zshrc
alias dc='docker-compose'
alias dcl='docker-compose logs -f'
alias dce='docker-compose exec'
alias dcps='docker-compose ps'

# Uso: dc up -d, dcl backend, dce backend bash
```

### Conexión remota a BD
```bash
# Desde máquina local (tunnel SSH)
ssh -L 5432:localhost:5432 usuario@servidor.com

# Luego conectar desde pgAdmin
# Host: localhost
# Puerto: 5432
# Usuario: sellbuy_user
# Contraseña: [la de .env]
```

### Backup automático
```bash
# Agregar a crontab (Linux/Mac)
0 2 * * * cd /ruta/sell_buy && docker-compose exec -T db pg_dump -U sellbuy_user sellbuy > backups/auto_$(date +\%Y\%m\%d).sql

# Cada día a las 2 AM hace backup
```

---

**Última actualización:** Marzo 2026  
**Estado:** 🟢 Docker completamente configurado y listo
