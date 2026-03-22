# 🐳 Guía Docker - Sell & Buy Platform

## Descripción General

Esta aplicación está completamente dockerizada con los siguientes servicios:

- **PostgreSQL** (Base de datos)
- **FastAPI** (Backend API)
- **React** (Frontend web)
- **Nginx** (Reverse proxy - opcional para producción)

---

## 📋 Requisitos Previos

### Instalación de Docker

#### Windows
1. Descarga [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Ejecuta el instalador
3. Reinicia la computadora
4. Verifica: `docker --version`

#### macOS
```bash
brew install docker docker-compose
# O descarga Docker Desktop desde https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian)
```bash
# Instalar Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

Verifica la instalación:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Inicio Rápido

### 1. Clonar o abrir el proyecto
```bash
cd sell_buy
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.docker .env

# Editar .env con tus valores (opcional, ya tiene defaults seguros)
# Cambiar SECRET_KEY en producción
```

### 3. Iniciar todos los servicios
```bash
docker-compose up -d
```

Esto levanta:
- PostgreSQL en `localhost:5432`
- Backend en `localhost:8000`
- Frontend en `localhost:5173`

### 4. Verificar estado
```bash
docker-compose ps
```

Salida esperada:
```
CONTAINER ID   IMAGE              COMMAND                  STATUS
abc123         sellbuy-frontend   "nginx -g daemon..."     Up 2 minutes
def456         sellbuy-backend    "python -m unicorn..."   Up 2 minutes  
ghi789         sellbuy-db         "postgres"               Up 2 minutes
```

### 5. Acceder a la aplicación
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Backend Health: http://localhost:8000/docs

---

## 📚 Comandos Útiles

### Ver logs
```bash
# Todos los servicios
docker-compose logs

# Solo backend
docker-compose logs backend

# Solo frontend
docker-compose logs frontend

# Solo database
docker-compose logs db

# En tiempo real (-f)
docker-compose logs -f backend
```

### Detener servicios
```bash
# Parar sin eliminar volúmenes
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Eliminar también volúmenes (CUIDADO: elimina datos)
docker-compose down -v
```

### Reiniciar servicios
```bash
# Reiniciar todos
docker-compose restart

# Reiniciar uno específico
docker-compose restart backend
```

### Ejecutar comandos en contenedores
```bash
# Bash en backend
docker-compose exec backend bash

# Bash en database
docker-compose exec db bash

# Ejecutar comando específico
docker-compose exec backend python -m pytest

# Shell de PostgreSQL
docker-compose exec db psql -U sellbuy_user -d sellbuy
```

### Reconstruir imágenes
```bash
# Reconstruir todos los servicios
docker-compose build

# Reconstruir sin caché
docker-compose build --no-cache

# Reconstruir solo uno
docker-compose build backend
```

### Visualizar variables de entorno
```bash
docker-compose config
```

### Limpiar todo (incluyendo imágenes no usadas)
```bash
docker system prune -a
docker volume prune
```

---

## 🔧 Configuración Detallada

### Variables de Entorno (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@db:5432/sellbuy

# Backend
SECRET_KEY=tu-clave-secreta-larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production

# Frontend
VITE_API_URL=http://backend:8000
NODE_ENV=production
```

**IMPORTANTE:** En producción, cambia `SECRET_KEY` a un valor único y seguro.

Genera una clave segura:
```bash
# Linux/Mac
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📊 Estructura de Red Docker

```
┌─────────────────────────────────────────────┐
│         sellbuy-network (bridge)            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │          │  │          │  │          │ │
│  │  Frontend│  │ Backend  │  │Database  │ │
│  │ (Nginx)  │  │(FastAPI) │  │(Postgre)│ │
│  │ :80/:5173│  │ :8000    │  │ :5432   │ │
│  │          │  │          │  │          │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │              │       │
│       └─────────────┼──────────────┘       │
│                     │                      │
└─────────────────────┼──────────────────────┘
                      │
                Host Network
```

### Comunicación entre servicios
- Frontend → Backend: `http://backend:8000`
- Backend → Database: `postgresql://sellbuy_user:pass@db:5432/sellbuy`
- Hacia afuera: Puertos específicos (5173, 8000, 5432)

---

## 🔐 Seguridad

### Mejores Prácticas

1. **Cambiar contraseñas por defecto**
   ```env
   POSTGRES_PASSWORD=tu-contraseña-segura
   SECRET_KEY=tu-clave-secreta-aleatoria
   ```

2. **Usar secrets en producción**
   ```bash
   docker-compose -f docker-compose.yml --secret-file .env up
   ```

3. **Variables sensibles no en .env**
   Usa Docker secrets o AWS Secrets Manager

4. **Nginx SSL en producción**
   Descomenta las líneas SSL en `nginx/nginx.conf`

5. **Rate limiting habilitado**
   Configurable en nginx.conf (100 req/s para API)

---

## 📈 Monitoreo y Debugging

### Ver consumo de recursos
```bash
docker stats

# Salida:
# CONTAINER ID   MEM USAGE       MEM %    CPU %
# abc123         150 MiB        1.5%     0.1%
# def456         200 MiB        2.0%     0.2%
# ghi789         80 MiB         0.8%     0.0%
```

### Ver eventos del contenedor
```bash
docker-compose events
```

### Inspeccionar contenedor
```bash
docker inspect sellbuy-backend
```

### Ver uso de disco
```bash
docker system df
```

---

## 🐛 Troubleshooting

### Frontend no conecta con Backend

**Error:** `ERROR: Cannot GET /api/...`

**Solución:**
```bash
# 1. Verificar que backend está corriendo
docker-compose ps backend

# 2. Verificar logs de frontend
docker-compose logs frontend

# 3. Revisar VITE_API_URL en .env
# En desarrollo: http://localhost:8000
# En Docker: http://backend:8000
```

### Base de datos no arranca

**Error:** `FATAL: database "sellbuy" does not exist`

**Solución:**
```bash
# 1. Eliminar volumen y reiniciar
docker-compose down -v
docker-compose up -d db

# 2. Esperar a que inicie (aprox 30 seg)
docker-compose logs db

# 3. Reiniciar backend
docker-compose restart backend
```

### Puerto ya en uso

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solución:**
```bash
# Encontrar qué usa el puerto
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# O cambiar puerto en docker-compose.yml
# Cambiar "8000:8000" a "8001:8000"
```

### Contenedor se detiene constantemente

**Solución:**
```bash
# Ver logs detallados
docker-compose logs backend --tail=50

# Revisar healthcheck
docker-compose exec backend curl localhost:8000/docs

# Reconstruir si hay cambios en código
docker-compose build backend
docker-compose up -d backend
```

### Cambios en código no se ven

**Solución:**
```bash
# Frontend y backend tienen volúmenes configurados
# Los cambios deberían reflejarse automáticamente

# Si no funciona:
docker-compose restart backend
docker-compose restart frontend

# O reconstruir
docker-compose build --no-cache
docker-compose up -d
```

---

## 🏗️ Producción

### Usar docker-compose.prod.yml

Crea un archivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Desde secrets
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    restart: always

  backend:
    environment:
      ENVIRONMENT: production
      SECRET_KEY: ${SECRET_KEY}
    restart: always
    command: uvicorn main:app --host 0.0.0.0 --port 8000

  frontend:
    restart: always

  nginx:
    profiles: []  # Habilitar en producción
    restart: always
```

### Ejecutar en producción

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Backups de base de datos

```bash
# Hacer backup
docker-compose exec db pg_dump -U sellbuy_user sellbuy > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U sellbuy_user sellbuy < backup.sql
```

### Actualizar aplicación

```bash
# Descargar cambios
git pull origin main

# Reconstruir imágenes
docker-compose build

# Reiniciar servicios
docker-compose up -d
```

---

## 📦 Publicar a Registry (Docker Hub / ECR)

### Docker Hub

```bash
# Login
docker login

# Taggear imagen
docker tag sellbuy-backend:latest jmv74/sellbuy-backend:latest
docker tag sellbuy-frontend:latest jmv74/sellbuy-frontend:latest

# Push
docker push jmv74/sellbuy-backend:latest
docker push jmv74/sellbuy-frontend:latest

# Usar en docker-compose.yml
# image: jmv74/sellbuy-backend:latest
```

---

## 🚢 Deployment en Plataformas

### AWS ECS

```bash
# Crear cluster
aws ecs create-cluster --cluster-name sellbuy-prod

# Registrar task definition
aws ecs register-task-definition --cli-input-json file://task-def.json

# Crear servicio
aws ecs create-service --cluster sellbuy-prod --service-name sellbuy-api --task-definition sellbuy-api --desired-count 2
```

### Heroku

```bash
# Crear app
heroku create sellbuy

# Agregar plugin container registry
heroku plugins:install @heroku-cli/plugin-container-registry

# Login y push
heroku container:login
heroku container:push web --app sellbuy

# Release
heroku container:release web --app sellbuy
```

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml sellbuy-app

# Ver status
docker stack services sellbuy-app
```

---

## 📋 Checklist de Deployment

- [ ] Variables de entorno configuradas (.env)
- [ ] SECRET_KEY cambiado a valor seguro
- [ ] POSTGRES_PASSWORD es fuerte
- [ ] Puertos correctos en docker-compose
- [ ] Volúmenes para datos persistentes
- [ ] Health checks configurados
- [ ] Logs centralizados
- [ ] Backups de base de datos
- [ ] SSL/TLS en producción
- [ ] Rate limiting habilitado
- [ ] CORS configurado correctamente
- [ ] Variables VITE_ correctas para frontend

---

## 🔗 Referencias Útiles

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Nginx Docker](https://hub.docker.com/_/nginx)

---

## 💡 Tips & Tricks

### Abrir shell interactiva
```bash
docker-compose exec backend bash
docker-compose exec db psql -U sellbuy_user -d sellbuy
```

### Ver el contenido de un volumen
```bash
docker run --rm -v sellbuy_postgres_data:/data -it alpine ls -la /data
```

### Copiar archivos desde contenedor
```bash
docker cp sellbuy-backend:/app/logs/app.log ./local-logs.log
```

### Actualizar imagen sin detener servicio
```bash
docker-compose build backend --no-cache
docker-compose up -d backend
```

### Monitorear en tiempo real
```bash
watch -n 1 'docker stats --no-stream'
```

---

**Última actualización:** Marzo 2026  
**Versión Docker:** 3.8 (Compose File Format)
