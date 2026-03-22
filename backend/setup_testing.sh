#!/bin/bash
# Instalador de dependencias de testing para el backend

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PYTEST SETUP - Installation Script                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Detectar OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    PIP="python -m pip"
else
    PIP="pip"
fi

echo "📦 Instalando dependencias de testing..."
echo ""

$PIP install pytest==7.4.3 \
    pytest-asyncio==0.21.1 \
    pytest-cov==4.1.0 \
    pytest-xdist==3.5.0 \
    httpx==0.25.2 \
    faker==20.1.0

echo ""
echo "✓ Dependencias instaladas correctamente"
echo ""

echo "📋 Verificando instalación..."
pytest --version
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   ✅ SETUP COMPLETADO                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo ""
echo "  1. Ver estructura de tests:"
echo "     find tests -type f -name '*.py'"
echo ""
echo "  2. Ejecutar todos los tests:"
echo "     pytest"
echo ""
echo "  3. Ejecutar con cobertura:"
echo "     pytest --cov=app --cov-report=html"
echo ""
echo "  4. Ver documentación:"
echo "     cat TESTING.md"
echo ""
echo "  5. Ver comandos make:"
echo "     make -f Makefile.test help"
echo ""
