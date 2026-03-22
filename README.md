# SellBuy - Plataforma de Gestión de Compras y Ventas

Una plataforma web moderna para registrar y gestionar compras y ventas de artículos, con análisis de márgenes de beneficio y gráficos interactivos.

## 🚀 Características

- **Autenticación segura** con JWT
- **Gestión de artículos** con detalles y condiciones
- **Registro de compras y ventas** con análisis automático
- **Dashboard analytics** con gráficos en tiempo real
- **Cálculo de márgenes** de beneficio por artículo
- **UI moderna y responsiva** con Tailwind CSS
- **Validación de datos** con Pydantic
- **🐳 Completamente dockerizada** con docker-compose

## ⚡ Inicio Rápido con Docker (Recomendado)

```bash
# 1. Clonar/abrir el proyecto
cd sell_buy

# 2. Iniciar en desarrollo (con hot reload)
make dev
# O en Windows: docker.bat dev

# 3. Acceder a la aplicación
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Eso es todo.** Docker se encarga de PostgreSQL, backend y frontend.

Más detalles en [DOCKER.md](./DOCKER.md)

## 📋 Requisitos Previos

### Backend
- Python 3.9+
- PostgreSQL 12+
- pip

### Frontend
- Node.js 16+
- npm o yarn

## 🛠 Instalación

### Backend

1. **Crear archivo de variables de entorno**
```bash
cd backend
cp .env.example .env
```

2. **Editar `.env` con tus configuraciones**
```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sellbuy
SECRET_KEY=tu-clave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

3. **Crear entorno virtual e instalar dependencias**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Crear base de datos PostgreSQL**
```bash
createdb sellbuy
```

### Frontend

1. **Instalar dependencias**
```bash
cd frontend
npm install
```

## 🚀 Ejecución

### Backend

```bash
cd backend
source venv/bin/activate  # En Windows: venv\Scripts\activate
python main.py
```

El API estará disponible en `http://localhost:8000`
Documentación Swagger: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
sell_buy/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py          # Autenticación
│   │   │       ├── articles.py      # Artículos
│   │   │       ├── purchases.py     # Compras
│   │   │       ├── sales.py         # Ventas
│   │   │       ├── estimations.py   # Estimaciones
│   │   │       └── analytics.py     # Análisis
│   │   ├── models.py                # Modelos SQLAlchemy
│   │   ├── schemas.py               # Schemas Pydantic
│   │   ├── security.py              # JWT y autenticación
│   │   └── database.py              # Conexión BD
│   ├── main.py                      # Aplicación FastAPI
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/              # Componentes React
    │   │   ├── Sidebar.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── Modal.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── pages/                   # Páginas
    │   │   ├── LoginPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   └── ArticlesPage.tsx
    │   ├── services/                # Servicios API
    │   ├── store/                   # Estado global (Zustand)
    │   ├── types/                   # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 🔐 Autenticación

La aplicación usa JWT para autenticación. Los tokens se guardan en localStorage y se envían en el header `Authorization: Bearer <token>`.

### Endpoints de Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

## 📊 API Endpoints

### Artículos
- `GET /api/articles/` - Listar artículos
- `POST /api/articles/` - Crear artículo
- `GET /api/articles/{id}` - Obtener artículo
- `PUT /api/articles/{id}` - Actualizar artículo
- `DELETE /api/articles/{id}` - Eliminar artículo

### Compras
- `GET /api/purchases/` - Listar compras
- `POST /api/purchases/` - Crear compra
- `GET /api/purchases/{id}` - Obtener compra
- `PUT /api/purchases/{id}` - Actualizar compra
- `DELETE /api/purchases/{id}` - Eliminar compra

### Ventas
- `GET /api/sales/` - Listar ventas
- `POST /api/sales/` - Crear venta
- `GET /api/sales/{id}` - Obtener venta
- `PUT /api/sales/{id}` - Actualizar venta
- `DELETE /api/sales/{id}` - Eliminar venta

### Análisis
- `GET /api/analytics/summary` - Resumen estadístico
- `GET /api/analytics/monthly` - Datos mensuales
- `GET /api/analytics/profit-by-article` - Ganancia por artículo

## 🎨 Stack Tecnológico

### Backend
- **FastAPI** - Framework web rápido y moderno
- **SQLAlchemy** - ORM para Python
- **PostgreSQL** - Base de datos relacional
- **Pydantic** - Validación de datos
- **Python-jose** - JWT para autenticación

### Frontend
- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido
- **Tailwind CSS** - Utilidades de CSS
- **Zustand** - Gestión de estado
- **Recharts** - Gráficos interactivos
- **Axios** - Cliente HTTP
- **React Router** - Navegación

## 📝 Notas Importantes

1. **Base de Datos**: Asegúrate de tener PostgreSQL instalado y en ejecución
2. **Variables de Entorno**: Cambiar `SECRET_KEY` en producción
3. **CORS**: El backend está configurado para permitir localhost
4. **Validaciones**: Los datos se validan tanto en frontend como en backend

## 🤝 Mejoras Futuras

- [ ] Soporte para múltiples monedas
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Notificaciones en tiempo real
- [ ] Integración con plataformas de venta
- [ ] Análisis predictivos
- [ ] Móvil app (React Native)

## 📄 Licencia

MIT License

## 👨‍💻 Soporte

Para reportar bugs o sugerir mejoras, crear un issue en el repositorio.
