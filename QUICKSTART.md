# Quick Start Guide - SellBuy

## 🚀 Inicio Rápido

### Paso 1: Configurar PostgreSQL

Si no tienes PostgreSQL instalado:
- **Windows**: Descargar desde https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql@15 && brew services start postgresql@15`
- **Linux**: `sudo apt install postgresql`

Crear la base de datos:
```bash
createdb sellbuy
```

### Paso 2: Configurar Backend

```bash
cd backend

# Crear archivo .env (copiar de .env.example)
cp .env.example .env

# Editar .env con tus valores de BD
# DATABASE_URL=postgresql://usuario:password@localhost:5432/sellbuy

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python main.py
```

El API estará en: http://localhost:8000
Swagger Docs: http://localhost:8000/docs

### Paso 3: Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La app estará en: http://localhost:5173

### Paso 4: Login

1. Ir a http://localhost:5173/login
2. Hacer clic en "Crea una aquí" para registrarse
3. Completar el formulario
4. ¡Listo! Puedes empezar a usar la plataforma

## 📚 Características Implementadas

✅ Autenticación con JWT
✅ Gestión de artículos
✅ Registro de compras y ventas
✅ Dashboard con estadísticas
✅ Gráficos interactivos
✅ Cálculo automático de márgenes
✅ UI moderna con Tailwind CSS
✅ Validación de datos

## 🔗 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil actual

### Datos
- `GET/POST /api/articles` - Artículos
- `GET/POST /api/purchases` - Compras
- `GET/POST /api/sales` - Ventas

### Análisis
- `GET /api/analytics/summary` - Resumen
- `GET /api/analytics/monthly` - Datos mensuales
- `GET /api/analytics/profit-by-article` - Ganancias

## 🛠 Próximas Mejoras

Para desarrollo futuro:
1. Agregar más páginas de análisis
2. Exportar reportes (PDF/Excel)
3. Sistema de notificaciones
4. Tests automatizados
5. Deploy a producción
6. App móvil

## ❓ Troubleshooting

**Error: "Connection refused"**
- Verificar que PostgreSQL está corriendo
- Revisar DATABASE_URL en .env

**Error: "Module not found"**
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

**CORS errors**
- El backend está configurado para localhost
- En producción, actualizar CORS en main.py

¡Listo para empezar! 🚀
