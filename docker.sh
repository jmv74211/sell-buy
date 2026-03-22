#!/bin/bash

# Docker Management Script for Unix/Linux
# Sell & Buy Platform

set -e

DOCKER_COMPOSE_DEV="docker-compose -f docker-compose.dev.yml"
DOCKER_COMPOSE_PROD="docker-compose -f docker-compose.yml"
DOCKER_COMPOSE="docker-compose"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    cat << EOF

╔════════════════════════════════════════════════════════════════╗
║      Sell & Buy Platform - Docker Management (Unix/Linux)     ║
╚════════════════════════════════════════════════════════════════╝

Uso: ./docker.sh COMANDO

COMANDOS:
  ${BLUE}Desarrollo y Producción${NC}
    dev              Iniciar en modo desarrollo con hot reload
    prod             Iniciar en modo producción
    up               Levantar todos los servicios
    down             Detener todos los servicios
    restart          Reiniciar todos los servicios
    build            Construir imágenes Docker

  ${BLUE}Monitoreo${NC}
    logs             Ver logs en tiempo real
    logs-backend     Ver logs del backend
    logs-frontend    Ver logs del frontend
    logs-db          Ver logs de la base de datos
    ps               Ver estado de contenedores
    stats            Ver uso de recursos

  ${BLUE}Acceso a Contenedores${NC}
    shell-backend    Terminal interactiva en backend
    shell-frontend   Terminal interactiva en frontend
    shell-db         Terminal PostgreSQL
    bash-db          Bash en contenedor DB

  ${BLUE}Base de Datos${NC}
    db-backup        Crear backup de base de datos
    db-restore FILE  Restaurar backup desde FILE
    db-reset         Reiniciar base de datos (PELIGROSO)

  ${BLUE}Mantenimiento${NC}
    clean            Limpiar contenedores e imágenes
    clean-volumes    Eliminar volúmenes (PELIGROSO)
    version          Mostrar versiones
    config           Ver configuración docker-compose

  ${BLUE}Ayuda${NC}
    help             Mostrar esta ayuda

${BLUE}Ejemplos:${NC}
  ./docker.sh dev
  ./docker.sh logs
  ./docker.sh shell-backend
  ./docker.sh db-backup
  ./docker.sh db-restore backups/sellbuy_20240101_120000.sql

EOF
}

print_section() {
    echo -e "\n${BLUE}➜${NC} $1\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

ensure_env_file() {
    if [ ! -f .env ]; then
        print_warning "Archivo .env no encontrado"
        print_section "Creando .env desde .env.docker..."
        cp .env.docker .env
        print_success "Archivo .env creado"
    fi
}

case "${1:-help}" in
    dev)
        ensure_env_file
        print_section "Iniciando en modo DESARROLLO con hot reload..."
        $DOCKER_COMPOSE_DEV up -d
        sleep 3
        print_success "Servicios iniciados"
        echo -e "\n${BLUE}URLs de acceso:${NC}"
        echo "   Frontend: ${BLUE}http://localhost:5173${NC}"
        echo "   Backend:  ${BLUE}http://localhost:8000${NC}"
        echo "   API Docs: ${BLUE}http://localhost:8000/docs${NC}"
        echo "   Database: ${BLUE}localhost:5432${NC}"
        ;;

    prod)
        ensure_env_file
        print_section "Iniciando en modo PRODUCCIÓN..."
        $DOCKER_COMPOSE_PROD up -d
        sleep 3
        print_success "Servicios en producción"
        echo -e "\n${BLUE}URLs de acceso:${NC}"
        echo "   Frontend: ${BLUE}http://localhost${NC}"
        echo "   Backend:  ${BLUE}http://localhost/api${NC}"
        ;;

    up)
        ensure_env_file
        print_section "Levantando servicios..."
        $DOCKER_COMPOSE up -d
        print_success "Servicios activos"
        ;;

    down)
        print_section "Deteniendo servicios..."
        $DOCKER_COMPOSE down
        print_success "Servicios detenidos"
        ;;

    restart)
        print_section "Reiniciando servicios..."
        $DOCKER_COMPOSE restart
        print_success "Servicios reiniciados"
        ;;

    build)
        print_section "Construyendo imágenes..."
        $DOCKER_COMPOSE build --no-cache
        print_success "Imágenes construidas"
        ;;

    logs)
        $DOCKER_COMPOSE logs -f
        ;;

    logs-backend)
        $DOCKER_COMPOSE logs -f backend
        ;;

    logs-frontend)
        $DOCKER_COMPOSE logs -f frontend
        ;;

    logs-db)
        $DOCKER_COMPOSE logs -f db
        ;;

    ps)
        echo ""
        $DOCKER_COMPOSE ps
        echo ""
        ;;

    stats)
        print_section "Uso de recursos"
        docker stats --no-stream
        ;;

    shell-backend)
        print_section "Abriendo shell en backend..."
        $DOCKER_COMPOSE exec backend bash
        ;;

    shell-frontend)
        print_section "Abriendo shell en frontend..."
        $DOCKER_COMPOSE exec frontend bash
        ;;

    shell-db)
        print_section "Abriendo PostgreSQL..."
        $DOCKER_COMPOSE exec db psql -U sellbuy_user -d sellbuy
        ;;

    bash-db)
        print_section "Abriendo bash en BD..."
        $DOCKER_COMPOSE exec db bash
        ;;

    db-backup)
        print_section "Creando backup de base de datos..."
        mkdir -p backups
        BACKUP_FILE="backups/sellbuy_$(date +%Y%m%d_%H%M%S).sql"
        $DOCKER_COMPOSE exec -T db pg_dump -U sellbuy_user sellbuy > "$BACKUP_FILE"
        print_success "Backup creado: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
        ;;

    db-restore)
        if [ -z "$2" ]; then
            print_error "Uso: $0 db-restore FILE"
            echo "Ejemplo: $0 db-restore backups/sellbuy_20240101_120000.sql"
            exit 1
        fi
        if [ ! -f "$2" ]; then
            print_error "Archivo no encontrado: $2"
            exit 1
        fi
        print_warning "Restaurando desde: $2"
        read -p "¿Confirmas? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            print_section "Restaurando base de datos..."
            $DOCKER_COMPOSE exec -T db psql -U sellbuy_user sellbuy < "$2"
            print_success "Backup restaurado"
        else
            echo "Operación cancelada"
        fi
        ;;

    db-reset)
        print_warning "ESTO ELIMINARÁ TODOS LOS DATOS DE LA BASE DE DATOS"
        read -p "¿Confirmas? Escribe 'si' para continuar: " -r
        if [ "$REPLY" = "si" ]; then
            print_section "Reiniciando base de datos..."
            $DOCKER_COMPOSE down -v
            $DOCKER_COMPOSE up -d db
            sleep 5
            print_success "Base de datos reiniciada"
        else
            echo "Operación cancelada"
        fi
        ;;

    clean)
        print_section "Limpiando contenedores e imágenes..."
        $DOCKER_COMPOSE down
        docker system prune -f
        print_success "Limpieza completada"
        ;;

    clean-volumes)
        print_warning "ESTO ELIMINARÁ LOS VOLÚMENES (datos persistentes)"
        read -p "¿Confirmas? Escribe 'si' para continuar: " -r
        if [ "$REPLY" = "si" ]; then
            print_section "Eliminando volúmenes..."
            $DOCKER_COMPOSE down -v
            print_success "Volúmenes eliminados"
        else
            echo "Operación cancelada"
        fi
        ;;

    version)
        print_section "Versiones instaladas"
        docker --version
        docker-compose --version
        echo ""
        echo "Imágenes disponibles:"
        docker images | grep sellbuy || echo "  (No hay imágenes locales)"
        ;;

    config)
        print_section "Configuración docker-compose"
        $DOCKER_COMPOSE config
        ;;

    help)
        print_help
        ;;

    *)
        print_error "Comando no reconocido: $1"
        echo "Usa: $0 help"
        exit 1
        ;;
esac

exit 0
