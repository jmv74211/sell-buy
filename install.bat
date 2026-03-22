@echo off
REM SellBuy - Script de Instalación Rápida (Windows)
REM Este script configura automáticamente todo el proyecto

echo.
echo ================================
echo   SellBuy - Instalacion Completa
echo ================================
echo.

REM Verificar Python
echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python no encontrado. Instalalo desde python.org
    pause
    exit /b 1
)
python --version
echo.

REM Verificar Node
echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js no encontrado. Instalalo desde nodejs.org
    pause
    exit /b 1
)
node --version
echo.

REM Backend
echo.
echo ================================
echo   Instalando Backend
echo ================================
echo.

cd backend

REM Crear .env
if not exist .env (
    echo Creando archivo .env...
    copy .env.example .env
    echo Archivo .env creado - editalo con tus credenciales
)

REM Crear venv
if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
    echo Entorno virtual creado
)

REM Activar venv
echo Activando entorno virtual...
call venv\Scripts\activate.bat

REM Instalar dependencias
echo Instalando dependencias Python...
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
echo Dependencias instaladas

cd ..

REM Frontend
echo.
echo ================================
echo   Instalando Frontend
echo ================================
echo.

cd frontend

echo Instalando dependencias Node...
npm install >nul 2>&1
echo Dependencias instaladas

cd ..

REM Finalizar
echo.
echo ================================
echo   ✓ Instalacion Completada
echo ================================
echo.

echo Proximos pasos:
echo.
echo 1. Configura la base de datos:
echo    createdb sellbuy
echo.
echo 2. Edita backend\.env con tus credenciales:
echo    DATABASE_URL=postgresql://user:password@localhost:5432/sellbuy
echo.
echo 3. Inicia el backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python main.py
echo.
echo 4. En otra terminal, inicia el frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 5. Abre tu navegador:
echo    http://localhost:5173
echo.

echo ¡Todo listo para empezar!
pause
