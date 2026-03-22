@echo off
REM Docker Management Script for Windows
REM Sell & Buy Platform

setlocal enabledelayedexpansion

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="ps" goto ps
if "%1"=="build" goto build
if "%1"=="shell-backend" goto shell_backend
if "%1"=="shell-db" goto shell_db
if "%1"=="db-backup" goto db_backup
if "%1"=="db-reset" goto db_reset
if "%1"=="clean" goto clean

echo Comando no reconocido: %1
goto help

:help
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║    Sell ^& Buy Platform - Docker Management (Windows)         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Uso: docker.bat COMANDO
echo.
echo COMANDO:
echo   dev              Iniciar en modo desarrollo con hot reload
echo   prod             Iniciar en modo producción
echo   up               Levantar todos los servicios
echo   down             Detener todos los servicios
echo   restart          Reiniciar todos los servicios
echo   logs             Ver logs de todos los servicios
echo   ps               Ver estado de contenedores
echo   build            Construir imágenes Docker
echo   shell-backend    Terminal interactiva en backend
echo   shell-db         Terminal PostgreSQL
echo   db-backup        Crear backup de base de datos
echo   db-reset         Reiniciar base de datos (PELIGROSO)
echo   clean            Limpiar contenedores e imágenes
echo   help             Mostrar esta ayuda
echo.
echo Ejemplos:
echo   docker.bat dev
echo   docker.bat logs
echo   docker.bat shell-backend
echo.
goto end

:dev
echo.
echo 🚀 Iniciando en modo DESARROLLO con hot reload...
echo.
if not exist .env (
    echo ⚠️  Archivo .env no encontrado
    echo Creando desde .env.docker...
    copy .env.docker .env
)
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ Servicios iniciados:
    echo    Frontend: http://localhost:5173
    echo    Backend:  http://localhost:8000
    echo    API Docs: http://localhost:8000/docs
    echo    Database: localhost:5432
    echo.
) else (
    echo ❌ Error al iniciar servicios
)
goto end

:prod
echo.
echo 🚀 Iniciando en modo PRODUCCIÓN...
echo.
if not exist .env (
    echo ⚠️  Archivo .env no encontrado
    echo Creando desde .env.docker...
    copy .env.docker .env
)
docker-compose -f docker-compose.yml up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ Servicios en producción:
    echo    Frontend: http://localhost:80 o http://localhost:5173
    echo    Backend:  http://localhost:8000
    echo.
) else (
    echo ❌ Error al iniciar servicios
)
goto end

:up
echo 🟢 Levantando servicios...
if not exist .env (
    copy .env.docker .env
)
docker-compose up -d
echo ✅ Servicios activos
goto end

:down
echo 🔴 Deteniendo servicios...
docker-compose down
echo ✅ Servicios detenidos
goto end

:restart
echo 🔄 Reiniciando servicios...
docker-compose restart
echo ✅ Servicios reiniciados
goto end

:logs
docker-compose logs -f
goto end

:ps
echo.
echo Estado de contenedores:
echo.
docker-compose ps
echo.
goto end

:build
echo 🔨 Construyendo imágenes...
docker-compose build --no-cache
echo ✅ Imágenes construidas
goto end

:shell_backend
echo Abriendo terminal en backend...
docker-compose exec backend bash
goto end

:shell_db
echo Abriendo terminal PostgreSQL...
docker-compose exec db psql -U sellbuy_user -d sellbuy
goto end

:db_backup
echo 💾 Creando backup...
if not exist backups mkdir backups
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
docker-compose exec -T db pg_dump -U sellbuy_user sellbuy > backups\sellbuy_%mydate%_%mytime%.sql
echo ✅ Backup creado en backups\
goto end

:db_reset
echo.
echo ⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos
echo.
set /p confirm="Escribe 'si' para confirmar: "
if /i "%confirm%"=="si" (
    echo Reiniciando base de datos...
    docker-compose down -v
    docker-compose up -d db
    timeout /t 5 /nobreak
    echo ✅ Base de datos reiniciada
) else (
    echo Operación cancelada
)
goto end

:clean
echo 🧹 Limpiando contenedores e imágenes...
docker-compose down
docker system prune -f
echo ✅ Limpieza completada
goto end

:end
echo.
exit /b 0
