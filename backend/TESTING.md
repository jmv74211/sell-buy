# 🧪 Testing Guide - Backend API (Sell & Buy)

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación](#instalación)
3. [Estructura de Tests](#estructura-de-tests)
4. [Ejecutar Tests](#ejecutar-tests)
5. [Escribir Tests](#escribir-tests)
6. [Fixtures Disponibles](#fixtures-disponibles)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Este proyecto utiliza **pytest** para testing automático del backend.

**Características:**
- ✅ Tests unitarios e integración
- ✅ BD en memoria para tests (sin dependencias externas)
- ✅ Cobertura de código automática
- ✅ Fixtures reutilizables
- ✅ Fixtures parametrizados
- ✅ Integración continua lista

---

## 📦 Instalación

### 1. Instalar dependencias de testing

```bash
# Linux/Mac
pip install -r requirements.txt

# Windows
python -m pip install -r requirements.txt
```

**Packages instalados:**
- `pytest` - Framework de testing
- `pytest-cov` - Cobertura de código
- `pytest-asyncio` - Soporte para async
- `httpx` - Cliente HTTP
- `faker` - Generación de datos de prueba

### 2. Verificar instalación

```bash
pytest --version
# pytest 7.4.3
```

---

## 📁 Estructura de Tests

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures globales
│   ├── api/
│   │   ├── __init__.py
│   │   ├── test_auth.py         # Tests de autenticación
│   │   ├── test_sales.py        # Tests de ventas
│   │   ├── test_articles.py     # Tests de artículos
│   │   └── test_users.py        # Tests de usuarios (futuro)
│   ├── models/
│   │   ├── __init__.py
│   │   └── test_models.py       # Tests de modelos (futuro)
│   └── integration/
│       └── test_workflows.py    # Tests de flujos completos (futuro)
├── pytest.ini                    # Configuración de pytest
└── requirements.txt              # Dependencias
```

**Convenciones:**
- Archivos: `test_*.py` o `*_test.py`
- Funciones: `test_*`
- Clases: `Test*`

---

## 🚀 Ejecutar Tests

### Todos los tests

```bash
pytest
```

**Salida esperada:**
```
tests/api/test_sales.py::TestSalesGet::test_get_sales_empty PASSED
tests/api/test_sales.py::TestSalesGet::test_get_sales_success PASSED
tests/api/test_auth.py::TestUserRegistration::test_register_user_success PASSED
...
========================== 45 passed in 2.34s ==========================
```

### Tests específicos

```bash
# Un archivo completo
pytest tests/api/test_sales.py

# Una clase
pytest tests/api/test_sales.py::TestSalesGet

# Una función específica
pytest tests/api/test_sales.py::TestSalesGet::test_get_sales_empty
```

### Con verbosidad

```bash
# Muy detallado
pytest -vv

# Con prints (útil para debugging)
pytest -s

# Con prints Y detallado
pytest -vv -s
```

### Con cobertura

```bash
# Ejecutar con cobertura
pytest --cov=app

# HTML report (abre htmlcov/index.html)
pytest --cov=app --cov-report=html

# Mostrar líneas no cubiertas
pytest --cov=app --cov-report=term-missing
```

### Filtrar tests

```bash
# Solo tests de integración
pytest -m integration

# Solo tests de autenticación
pytest -m auth

# Excluir tests lentos
pytest -m "not slow"

# Tests que contengan "sales"
pytest -k sales
```

### Ejecución paralela (más rápido)

```bash
# Instalar primero
pip install pytest-xdist

# Ejecutar con 4 workers
pytest -n 4
```

### Watch mode (re-ejecuta al cambiar archivos)

```bash
# Instalar primero
pip install pytest-watch

# Ejecutar en watch
ptw
```

---

## ✍️ Escribir Tests

### Estructura básica

```python
import pytest
from fastapi.testclient import TestClient

class TestSomething:
    """Tests para algo específico"""
    
    def test_happy_path(self, client: TestClient):
        """
        Test: Descripción clara de qué se prueba
        """
        # Arrange (preparar datos)
        data = {"name": "test"}
        
        # Act (ejecutar)
        response = client.post("/api/endpoint", json=data)
        
        # Assert (verificar)
        assert response.status_code == 201
        assert response.json()["name"] == "test"
```

### Con fixtures

```python
def test_with_user(self, authenticated_client: TestClient, test_user):
    """
    Test: Usar usuario de prueba autenticado
    
    Fixtures disponibles:
    - client: Cliente HTTP sin autenticación
    - authenticated_client: Cliente HTTP con token JWT
    - test_user: Usuario de prueba
    - test_article: Artículo de prueba
    - test_sale: Venta de prueba
    """
    response = authenticated_client.get(f"/api/users/{test_user.id}")
    
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
```

### Parametrizado

```python
@pytest.mark.parametrize("status,code", [
    ("available", 200),
    ("sold", 200),
    ("invalid", 422),
])
def test_article_status(self, authenticated_client, status, code):
    """Test múltiples valores de estado"""
    response = authenticated_client.get(f"/api/articles?status={status}")
    assert response.status_code == code
```

### Con markers

```python
@pytest.mark.slow
def test_bulk_operations(self, authenticated_client):
    """Este test es lento"""
    pass

@pytest.mark.integration
def test_with_database(self, db_session):
    """Este es un test de integración"""
    pass
```

### Mocking/Patching

```python
from unittest.mock import patch

def test_with_mock(self):
    """Test usando mocks"""
    with patch('app.external_api.get_data') as mock_get:
        mock_get.return_value = {"data": "mocked"}
        
        # Tu código que usa external_api.get_data
        result = my_function()
        
        assert result == expected
        mock_get.assert_called_once()
```

---

## 🔧 Fixtures Disponibles

### Autenticación

```python
def test_example(authenticated_client: TestClient):
    """Cliente HTTP con token JWT"""
    pass

def test_example(client: TestClient, token_test_user: str):
    """Token JWT del usuario de prueba"""
    client.headers = {"Authorization": f"Bearer {token_test_user}"}
```

### Datos de prueba

```python
def test_example(test_user, test_article, test_sale):
    """Usuarios, artículos y ventas de prueba"""
    pass

def test_example(multiple_articles, multiple_users):
    """Múltiples items para probar listas"""
    pass
```

### Base de datos

```python
def test_example(db_session):
    """Sesión de BD para queries directas"""
    users = db_session.query(User).all()
```

### Crear fixtures personalizados

En `tests/conftest.py`:

```python
@pytest.fixture(scope="function")
def my_data(db_session):
    """Mi fixture personalizado"""
    item = MyModel(name="test")
    db_session.add(item)
    db_session.commit()
    return item
```

Luego usar:

```python
def test_with_my_fixture(my_data):
    assert my_data.name == "test"
```

---

## 📊 Cobertura de Código

### Ver reporte

```bash
# Terminal
pytest --cov=app --cov-report=term-missing

# HTML
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

**Interpretación:**
```
app/api/routes/sales.py    45    5    89%    15-17, 45
```
- Líneas ejecutables: 45
- Líneas no cubiertas: 5
- Cobertura: 89%
- Líneas no cubiertas: 15-17, 45

### Requisito mínimo de cobertura

En `pytest.ini`:
```ini
--cov-fail-under=70
```

Si la cobertura baja del 70%, los tests fallan.

---

## 🏆 Mejores Prácticas

### ✅ DO

```python
# ✅ Nombres descriptivos
def test_user_cannot_buy_own_article(self, authenticated_client):
    pass

# ✅ Una cosa por test
def test_login_with_correct_password(self):
    # Solo verifica que el login funciona
    pass

# ✅ Usar fixtures
def test_something(self, test_user, authenticated_client):
    # Aprovecha los datos precreados
    pass

# ✅ Assertions claros
assert response.status_code == 200
assert "error" not in response.json()

# ✅ Documentación
def test_complex_logic(self):
    """
    Test: Verifica que el usuario puede comprar artículos
    pero no puede comprar su propio artículo
    """
    pass
```

### ❌ DON'T

```python
# ❌ Nombres genéricos
def test_1(self):
    pass

# ❌ Múltiples cosas
def test_auth_and_articles_and_sales(self):
    # Prueba 3 cosas diferentes
    pass

# ❌ Crear datos manualmente cada vez
def test_something(self, client):
    # Mejor: usar fixtures
    user = models.User(...)
    db.add(user)
    pass

# ❌ Assertions débiles
assert response is not None
assert response.json()

# ❌ Sin documentación
def test_xyz(self):
    pass
```

### Testing de errores

```python
def test_error_handling(self, authenticated_client):
    """Verifica que los errores se manejan correctamente"""
    response = authenticated_client.get("/api/nonexistent")
    
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"].lower()
```

### Testing de seguridad

```python
def test_password_not_exposed(self, authenticated_client, test_user):
    """Verifica que las contraseñas nunca se exponen"""
    response = authenticated_client.get(f"/api/users/{test_user.id}")
    user = response.json()
    
    assert "password" not in user
    assert "hashed_password" not in user
```

---

## 🐛 Troubleshooting

### "No module named 'app'"

**Problema:** Los imports de `app` fallan

**Solución:**
```bash
# Asegúrate de ejecutar desde backend/
cd backend
pytest

# O configura PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)
pytest
```

### "Fixture 'test_user' not found"

**Problema:** El fixture no está definido

**Solución:**
- Verifica que conftest.py esté en `tests/`
- Verifica que no hay errores en conftest.py
- Recarga VSCode si está abierto

### "Database is locked"

**Problema:** Conflicto de BD

**Solución:**
```bash
# Limpia la BD de prueba
pytest --cache-clear

# O ejecuta un test a la vez
pytest tests/api/test_sales.py::TestSalesGet::test_get_sales_empty
```

### Tests fallan en CI pero pasan localmente

**Problema:** Diferencias entre ambientes

**Soluciones:**
- Verifica versiones de Python
- Verifica PYTHONPATH
- Verifica variables de entorno
- Ejecuta exactamente como CI: `pytest --cov=app`

### Debugging

```python
def test_something(self, authenticated_client):
    """Debugging de un test"""
    response = authenticated_client.get("/api/endpoint")
    
    # Ver la respuesta completa
    print(response.json())
    
    # Ver headers
    print(response.headers)
    
    # Ver status code
    print(response.status_code)
```

Luego ejecuta con:
```bash
pytest tests/api/test_sales.py::TestSalesGet -s
```

---

## 📈 Próximos Pasos

### Tests adicionales sugeridos

- [ ] `tests/api/test_users.py` - CRUD de usuarios
- [ ] `tests/models/test_models.py` - Validaciones de modelos
- [ ] `tests/integration/test_workflows.py` - Flujos completos
- [ ] `tests/test_performance.py` - Tests de rendimiento

### Mejoras

```bash
# Generar HTML de cobertura
pytest --cov=app --cov-report=html

# Ver qué tests fallan primero
pytest --failed-first

# Repetir tests aleatorios
pytest --random-order

# Ejecutar en paralelo
pytest -n auto
```

---

## 🚀 Integración Continua

### GitHub Actions (ejemplo)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: pytest --cov=app
```

### GitLab CI (ejemplo)

```yaml
test:
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest --cov=app
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

---

## 📚 Recursos

- [Documentación de pytest](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/faq/testing.html)
- [pytest fixtures](https://docs.pytest.org/en/stable/fixture.html)

---

## 📞 Comandos Rápidos

```bash
# Todos los tests
pytest

# Con cobertura
pytest --cov=app --cov-report=html

# Específico
pytest tests/api/test_sales.py::TestSalesGet::test_get_sales_empty

# Con prints
pytest -s

# Paralelo (rápido)
pytest -n auto

# Watch mode
ptw

# Mostrar qué tests existen
pytest --collect-only
```

---

**¡Happy Testing!** 🎉
