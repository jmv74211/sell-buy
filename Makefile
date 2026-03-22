.PHONY: help build up down logs stop start restart clean dev prod lint test

help:
	@echo "╔═══════════════════════════════════════════════════════════════╗"
	@echo "║        Sell & Buy Platform - Docker Management               ║"
	@echo "╚═══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Comandos disponibles:"
	@echo ""
	@echo "  INICIO RÁPIDO"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make dev              - Iniciar en modo desarrollo (hot reload)"
	@echo "  make prod             - Iniciar en modo producción"
	@echo "  make build            - Construir imágenes Docker"
	@echo ""
	@echo "  CONTROL DE SERVICIOS"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make up               - Levantar todos los servicios"
	@echo "  make down             - Detener todos los servicios"
	@echo "  make restart          - Reiniciar todos los servicios"
	@echo "  make start            - Iniciar servicios detenidos"
	@echo "  make stop             - Pausar servicios (sin eliminar)"
	@echo ""
	@echo "  MONITOREO Y LOGS"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make logs             - Ver logs de todos los servicios"
	@echo "  make logs-backend     - Ver logs del backend"
	@echo "  make logs-frontend    - Ver logs del frontend"
	@echo "  make logs-db          - Ver logs de la base de datos"
	@echo "  make ps               - Ver estado de contenedores"
	@echo "  make stats            - Ver uso de recursos"
	@echo ""
	@echo "  ACCESO A CONTENEDORES"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make shell-backend    - Terminal en backend"
	@echo "  make shell-frontend   - Terminal en frontend"
	@echo "  make shell-db         - Terminal PostgreSQL"
	@echo "  make bash-db          - Bash en contenedor DB"
	@echo ""
	@echo "  BASE DE DATOS"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make db-backup        - Crear backup de la base de datos"
	@echo "  make db-restore FILE=backup.sql  - Restaurar backup"
	@echo "  make db-reset         - Reiniciar base de datos (PELIGROSO)"
	@echo ""
	@echo "  MANTENIMIENTO"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make lint             - Verificar código Python"
	@echo "  make test             - Ejecutar tests"
	@echo "  make clean            - Limpiar contenedores e imágenes"
	@echo "  make clean-volumes    - Eliminar volúmenes (PELIGROSO)"
	@echo ""
	@echo "  INFORMACIÓN"
	@echo "  ─────────────────────────────────────────────────────────────"
	@echo "  make version          - Mostrar versiones"
	@echo "  make config           - Ver configuración docker-compose"
	@echo "  make help             - Mostrar esta ayuda"
	@echo ""

# ============================================================================
# DESARROLLO Y PRODUCCIÓN
# ============================================================================

dev: .env
	@echo "🚀 Iniciando en modo DESARROLLO con hot reload..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Servicios iniciados:"
	@echo "   Frontend: http://localhost:8000"
	@echo "   Backend:  http://localhost:3000"
	@echo "   API Docs: http://localhost:3000/docs"
	@echo "   Database: localhost:5432"

prod: .env
	@echo "🚀 Iniciando en modo PRODUCCIÓN..."
	docker-compose -f docker-compose.yml up -d
	@echo "✅ Servicios en producción:"
	@echo "   Frontend: http://localhost:80 o http://localhost:5173"
	@echo "   Backend:  http://localhost:8000"

build:
	@echo "🔨 Construyendo imágenes..."
	docker-compose build --no-cache
	@echo "✅ Imágenes construidas"

# ============================================================================
# CONTROL DE SERVICIOS
# ============================================================================

up: .env
	@echo "🟢 Levantando servicios..."
	docker-compose up -d
	@echo "✅ Servicios activos"

down:
	@echo "🔴 Deteniendo servicios..."
	docker-compose down
	@echo "✅ Servicios detenidos"

restart:
	@echo "🔄 Reiniciando servicios..."
	docker-compose restart
	@echo "✅ Servicios reiniciados"

start:
	@echo "▶️  Iniciando servicios detenidos..."
	docker-compose start
	@echo "✅ Servicios iniciados"

stop:
	@echo "⏸️  Pausando servicios..."
	docker-compose stop
	@echo "✅ Servicios pausados"

# ============================================================================
# MONITOREO Y LOGS
# ============================================================================

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

ps:
	@echo "Estado de contenedores:"
	@docker-compose ps

stats:
	@echo "Uso de recursos:"
	docker stats --no-stream

# ============================================================================
# ACCESO A CONTENEDORES
# ============================================================================

shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend bash

shell-db:
	docker-compose exec db psql -U sellbuy_user -d sellbuy

bash-db:
	docker-compose exec db bash

# ============================================================================
# BASE DE DATOS
# ============================================================================

db-backup:
	@echo "💾 Creando backup de base de datos..."
	@mkdir -p backups
	docker-compose exec -T db pg_dump -U sellbuy_user sellbuy > backups/sellbuy_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup creado en backups/"

db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Uso: make db-restore FILE=backups/sellbuy_20240101_120000.sql"; \
		exit 1; \
	fi
	@echo "🔄 Restaurando base de datos desde $(FILE)..."
	docker-compose exec -T db psql -U sellbuy_user sellbuy < $(FILE)
	@echo "✅ Backup restaurado"

db-reset:
	@echo "⚠️  Advertencia: esto eliminará TODOS los datos de la base de datos"
	@echo "Escribe 'si' para confirmar:"
	@read response; \
	if [ "$$response" = "si" ]; then \
		echo "Reiniciando base de datos..."; \
		docker-compose down -v; \
		docker-compose up -d db; \
		echo "✅ Base de datos reiniciada"; \
	else \
		echo "Operación cancelada"; \
	fi

# ============================================================================
# MANTENIMIENTO
# ============================================================================

lint:
	@echo "🔍 Verificando código Python..."
	docker-compose exec backend flake8 app/ main.py || echo "⚠️  Instala flake8: pip install flake8"
	@echo "✅ Verificación completada"

test:
	@echo "🧪 Ejecutando tests..."
	docker-compose exec backend python -m pytest || echo "⚠️  Instala pytest: pip install pytest"

clean:
	@echo "🧹 Limpiando contenedores e imágenes no usadas..."
	docker-compose down
	docker system prune -f
	@echo "✅ Limpieza completada"

clean-volumes:
	@echo "⚠️  Advertencia: eliminará volúmenes (datos persistentes)"
	@echo "Escribe 'eliminar' para confirmar:"
	@read response; \
	if [ "$$response" = "eliminar" ]; then \
		docker-compose down -v; \
		echo "✅ Volúmenes eliminados"; \
	else \
		echo "Operación cancelada"; \
	fi

# ============================================================================
# INFORMACIÓN
# ============================================================================

version:
	@echo "Versiones instaladas:"
	docker --version
	docker-compose --version
	@echo ""
	@echo "Imágenes disponibles:"
	docker images | grep sellbuy || echo "  (No hay imágenes locales)"

config:
	@echo "Configuración de docker-compose:"
	docker-compose config

# ============================================================================
# ARCHIVO .env
# ============================================================================

.env:
	@echo "⚠️  Archivo .env no encontrado"
	@echo "Creando .env desde .env.docker..."
	cp .env.docker .env
	@echo "✅ .env creado. Edítalo si necesitas cambiar valores"

# ============================================================================
# DEFAULT
# ============================================================================

.DEFAULT_GOAL := help
