-- Inicialización de la base de datos para SellBuy
-- Este script se ejecuta automáticamente al iniciar el contenedor PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Las tablas se crearán automáticamente por SQLAlchemy
-- cuando la aplicación se inicie por primera vez

-- Nota: Los índices se crearán desde la aplicación o manualmente después
-- de que las tablas sean creadas por SQLAlchemy

-- Mostrar resultado de inicialización
SELECT 'Database initialized successfully' as message;
