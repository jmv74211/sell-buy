#!/bin/bash

# SellBuy - Script de Instalación Rápida
# Este script configura automáticamente todo el proyecto

set -e

echo "🚀 SellBuy - Instalación Completa"
echo "=================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

# Verificar Python
print_step "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 no encontrado. Instalalo desde python.org"
    exit 1
fi
python_version=$(python3 --version | cut -d' ' -f2)
print_success "Python $python_version encontrado"

# Verificar PostgreSQL
print_step "Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL no encontrado."
    echo "         Instálalo desde https://www.postgresql.org/download/"
    echo "         Luego ejecuta este script nuevamente."
    exit 1
fi
print_success "PostgreSQL encontrado"

# Verificar Node.js
print_step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js no encontrado. Instalalo desde nodejs.org"
    exit 1
fi
node_version=$(node --version)
print_success "Node $node_version encontrado"

echo ""
echo "=================================="
echo "Instalando Backend"
echo "=================================="
echo ""

# Backend setup
cd backend

# Crear .env
if [ ! -f .env ]; then
    print_step "Creando archivo .env..."
    cp .env.example .env
    print_success ".env creado (edítalo con tus credenciales de BD)"
fi

# Crear venv
if [ ! -d venv ]; then
    print_step "Creando entorno virtual Python..."
    python3 -m venv venv
    print_success "Entorno virtual creado"
fi

# Activar venv
print_step "Activando entorno virtual..."
source venv/bin/activate
print_success "Entorno virtual activado"

# Instalar dependencias
print_step "Instalando dependencias Python..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1
print_success "Dependencias Python instaladas"

cd ..

echo ""
echo "=================================="
echo "Instalando Frontend"
echo "=================================="
echo ""

# Frontend setup
cd frontend

print_step "Instalando dependencias Node..."
npm install > /dev/null 2>&1
print_success "Dependencias Node instaladas"

cd ..

echo ""
echo "=================================="
echo "✅ Instalación Completada"
echo "=================================="
echo ""

echo "Próximos pasos:"
echo ""
print_step "1. Configura la base de datos:"
echo "   createdb sellbuy"
echo ""
print_step "2. Edita backend/.env con tus credenciales de BD:"
echo "   DATABASE_URL=postgresql://usuario:password@localhost:5432/sellbuy"
echo ""
print_step "3. Inicia el backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
print_step "4. En otra terminal, inicia el frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
print_step "5. Abre tu navegador:"
echo "   http://localhost:5173"
echo ""

print_success "¡Todo listo para empezar! 🚀"
