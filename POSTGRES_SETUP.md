# Guía de Instalación PostgreSQL

## Windows

### Opción 1: Instalador Oficial

1. Descargar desde https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Seguir el wizard (recordar contraseña de postgres)
4. Durante la instalación, marcar pgAdmin y Stack Builder
5. Elegir puerto 5432

### Opción 2: Usando Chocolatey

```bash
choco install postgresql
```

### Crear Base de Datos

Usando pgAdmin (interfaz gráfica):
1. Abrir pgAdmin (está en el menú de inicio)
2. Conectarse con usuario `postgres`
3. Click derecho en "Databases" > Create > Database
4. Nombre: `sellbuy`

O usando cmd:
```bash
psql -U postgres -c "CREATE DATABASE sellbuy;"
```

## macOS

### Usando Homebrew

```bash
brew install postgresql@15
brew services start postgresql@15
createdb sellbuy
```

## Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Crear base de datos
sudo -u postgres createdb sellbuy
```

## Verificar Instalación

```bash
psql --version
psql -U postgres -d sellbuy -c "SELECT 1;"
```

## Notas

- Usuario por defecto: `postgres`
- Puerto por defecto: `5432`
- La contraseña se configura durante la instalación (Windows/macOS) o en `/etc/postgresql/` (Linux)
