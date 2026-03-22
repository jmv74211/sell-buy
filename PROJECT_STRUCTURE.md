## 📊 Estructura Completa del Proyecto SellBuy

```
sell_buy/
├── 📄 README.md                          # Documentación principal
├── 📄 QUICKSTART.md                      # Guía de inicio rápido
├── 📄 DEVELOPMENT.md                     # Pautas de desarrollo
├── 📄 POSTGRES_SETUP.md                  # Instalación de PostgreSQL
├── 📄 .gitignore                         # Archivos a ignorar en git
├── 📄 .python-version                    # Versión de Python
│
├── 📁 backend/                           # API FastAPI
│   ├── 📄 main.py                        # Aplicación principal
│   ├── 📄 requirements.txt                # Dependencias Python
│   ├── 📄 .env.example                   # Variables de entorno
│   │
│   └── 📁 app/
│       ├── 📄 __init__.py
│       ├── 📄 database.py                # Configuración BD
│       ├── 📄 models.py                  # Modelos SQLAlchemy
│       ├── 📄 schemas.py                 # Schemas Pydantic
│       ├── 📄 security.py                # JWT y autenticación
│       │
│       └── 📁 api/
│           ├── 📄 __init__.py
│           └── 📁 routes/
│               ├── 📄 __init__.py
│               ├── 📄 auth.py            # Registro y login
│               ├── 📄 users.py           # Perfil de usuario
│               ├── 📄 articles.py        # CRUD artículos
│               ├── 📄 platforms.py       # CRUD plataformas
│               ├── 📄 purchases.py       # CRUD compras
│               ├── 📄 sales.py           # CRUD ventas
│               ├── 📄 estimations.py     # CRUD estimaciones
│               └── 📄 analytics.py       # Análisis y estadísticas
│
└── 📁 frontend/                          # Aplicación React + TypeScript
    ├── 📄 package.json                   # Dependencias NPM
    ├── 📄 tsconfig.json                  # Configuración TypeScript
    ├── 📄 vite.config.ts                 # Configuración Vite
    ├── 📄 tailwind.config.js             # Configuración Tailwind
    ├── 📄 postcss.config.js              # Configuración PostCSS
    ├── 📄 eslint.config.js               # Configuración ESLint
    ├── 📄 index.html                     # HTML principal
    │
    └── 📁 src/
        ├── 📄 main.tsx                   # Punto de entrada
        ├── 📄 App.tsx                    # Componente raíz
        ├── 📄 index.css                  # Estilos globales
        ├── 📄 env.d.ts                   # Tipos de variables de entorno
        │
        ├── 📁 components/                # Componentes reutilizables
        │   ├── 📄 Sidebar.tsx            # Navegación principal
        │   ├── 📄 StatCard.tsx           # Tarjeta de estadísticas
        │   ├── 📄 Modal.tsx              # Modal genérico
        │   └── 📄 ProtectedRoute.tsx     # Protección de rutas
        │
        ├── 📁 pages/                     # Páginas principales
        │   ├── 📄 LoginPage.tsx          # Autenticación
        │   ├── 📄 DashboardPage.tsx      # Panel principal
        │   ├── 📄 ArticlesPage.tsx       # Gestión artículos
        │   ├── 📄 PurchasesPage.tsx      # Gestión compras
        │   └── 📄 SalesPage.tsx          # Gestión ventas
        │
        ├── 📁 services/                  # Servicios API
        │   ├── 📄 api.ts                 # Cliente HTTP base
        │   ├── 📄 auth.ts                # Servicio autenticación
        │   ├── 📄 articles.ts            # Servicio artículos
        │   ├── 📄 purchases.ts           # Servicio compras
        │   ├── 📄 sales.ts               # Servicio ventas
        │   └── 📄 analytics.ts           # Servicio análisis
        │
        ├── 📁 store/                     # Estado global (Zustand)
        │   ├── 📄 auth.ts                # Estado de autenticación
        │   └── 📄 data.ts                # Estado de datos
        │
        ├── 📁 types/                     # Tipos TypeScript
        │   └── 📄 api.ts                 # Interfaces de API
        │
        └── 📁 utils/                     # Funciones auxiliares
            └── 📄 date.ts                # Utilidades de fechas
```

## 🗄️ Estructura de Base de Datos

```sql
-- Usuarios
users (id, user_name, password_hash, name, email, active, first_login_date, last_login_date, created_at)

-- Plataformas de venta
platforms (id, name, url)

-- Artículos
articles (id, user_id→, name, description, precio, item_condition, platform_id→, created_at)

-- Compras
purchases (id, article_id→, purchase_date, amount, created_at)

-- Ventas
sales (id, article_id→, sale_date, amount, created_at)

-- Estimaciones de ganancia
estimations (id, purchase_id→*, sale_id→*, estimated_profit, actual_profit, created_at)
```

## 🔗 Endpoints API

### Autenticación (`/api/auth`)
```
POST   /register        Registrar usuario
POST   /login          Iniciar sesión
GET    /me             Obtener usuario actual
```

### Usuarios (`/api/users`)
```
GET    /profile        Obtener perfil
PUT    /profile        Actualizar perfil
DELETE /account        Desactivar cuenta
```

### Artículos (`/api/articles`)
```
GET    /               Listar artículos
POST   /               Crear artículo
GET    /{id}           Obtener artículo
PUT    /{id}           Actualizar artículo
DELETE /{id}           Eliminar artículo
```

### Plataformas (`/api/platforms`)
```
GET    /               Listar plataformas
POST   /               Crear plataforma
GET    /{id}           Obtener plataforma
PUT    /{id}           Actualizar plataforma
DELETE /{id}           Eliminar plataforma
```

### Compras (`/api/purchases`)
```
GET    /               Listar compras
POST   /               Crear compra
GET    /{id}           Obtener compra
PUT    /{id}           Actualizar compra
DELETE /{id}           Eliminar compra
```

### Ventas (`/api/sales`)
```
GET    /               Listar ventas
POST   /               Crear venta
GET    /{id}           Obtener venta
PUT    /{id}           Actualizar venta
DELETE /{id}           Eliminar venta
```

### Estimaciones (`/api/estimations`)
```
GET    /               Listar estimaciones
POST   /               Crear estimación
GET    /{id}           Obtener estimación
PUT    /{id}           Actualizar estimación
DELETE /{id}           Eliminar estimación
```

### Análisis (`/api/analytics`)
```
GET    /summary                   Resumen estadístico
GET    /monthly                   Datos mensuales
GET    /profit-by-article         Ganancia por artículo
```

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno
- **SQLAlchemy** - ORM para Python
- **PostgreSQL** - Base de datos relacional
- **Pydantic** - Validación de datos
- **Python-Jose** - JWT tokens
- **Passlib** - Hash de contraseñas

### Frontend
- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido
- **Tailwind CSS** - Utilidades CSS
- **Zustand** - Gestión de estado
- **Recharts** - Gráficos interactivos
- **Axios** - Cliente HTTP
- **React Router** - Navegación SPA
- **Lucide React** - Iconos

## 🚀 Características Implementadas

✅ Autenticación con JWT y sesiones
✅ Validación de datos con Pydantic
✅ Gestión CRUD completa de artículos
✅ Registro de compras y ventas
✅ Cálculo automático de márgenes de ganancia
✅ Dashboard con estadísticas en tiempo real
✅ Gráficos interactivos (Recharts)
✅ UI moderna y responsiva (Tailwind CSS)
✅ Sidebar de navegación
✅ Protección de rutas con autenticación
✅ Manejo de errores y validaciones
✅ Interceptores HTTP automáticos

## 📦 Instalación de Dependencias

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## ▶️ Ejecución

### Backend
```bash
cd backend
python main.py
# http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm run dev
# http://localhost:5173
```

## 📝 Próximas Mejoras

- [ ] Tests automatizados (pytest, jest)
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Sistema de notificaciones
- [ ] Búsqueda y filtros avanzados
- [ ] Paginación de listados
- [ ] Sistema de categorías
- [ ] Historial de cambios
- [ ] Dashboard más detallado
- [ ] App móvil (React Native)
- [ ] Deploy automatizado
- [ ] Integración con APIs externas

## 📄 Archivos de Documentación

- **README.md** - Documentación principal y setup
- **QUICKSTART.md** - Guía rápida para empezar
- **DEVELOPMENT.md** - Pautas de desarrollo
- **POSTGRES_SETUP.md** - Instalación de PostgreSQL
- **.python-version** - Versión de Python recomendada

## ✅ Estado del Proyecto

El proyecto está completamente estructurado y listo para:
- Desarrollo local
- Agregar nuevas características
- Deploy a producción
- Escalamiento futuro

¡Listo para empezar! 🚀
