#!/bin/sh

# Reemplazar variables de entorno en index.html y en los bundles
# Esto permite pasar la URL de la API en tiempo de ejecución

VITE_API_URL=${VITE_API_URL:-http://localhost:8000}

# Si estamos en desarrollo con Vite
if [ "$NODE_ENV" != "production" ]; then
    exec "$@"
fi

# Para producción, simplemente iniciar Nginx
exec "$@"
