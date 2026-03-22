"""
conftest.py - Configuración y fixtures globales para pytest

Define todos los fixtures necesarios para los tests de integración y unitarios
incluyendo: base de datos de prueba, cliente HTTP, autenticación, etc.
"""

import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from typing import Generator

# Importar la aplicación
from app.main import app
from app import models, schemas, security
from app.database import get_db, Base
from app.security import create_access_token


# ============================================================================
# BASE DE DATOS DE PRUEBA
# ============================================================================

# Usar BD en memoria SQLite para tests (muy rápido)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """
    Crea un engine SQLAlchemy para BD de prueba en memoria.
    scope="function": Nueva BD para cada test (aislamiento)
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    yield engine
    
    # Limpiar después del test
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """
    Crea una sesión de BD para cada test.
    Genera la sesión y la limpia después.
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """
    Cliente HTTP de prueba con dependencia inyectada de BD.
    Reemplaza la dependencia de get_db con nuestra sesión de test.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    yield TestClient(app)
    
    # Limpiar los overrides después del test
    app.dependency_overrides.clear()


# ============================================================================
# FIXTURES DE DATOS DE PRUEBA
# ============================================================================

@pytest.fixture(scope="function")
def test_user(db_session: Session) -> models.User:
    """
    Crea un usuario de prueba.
    """
    user = models.User(
        username="testuser",
        email="test@example.com",
        hashed_password=security.hash_password("testpass123"),
        is_active=True,
        created_at=datetime.now()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_user_2(db_session: Session) -> models.User:
    """
    Crea un segundo usuario de prueba (para tests de permisos).
    """
    user = models.User(
        username="testuser2",
        email="test2@example.com",
        hashed_password=security.hash_password("testpass123"),
        is_active=True,
        created_at=datetime.now()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_article(db_session: Session, test_user: models.User) -> models.Article:
    """
    Crea un artículo de prueba perteneciente a test_user.
    """
    article = models.Article(
        title="Test Article",
        description="This is a test article",
        price=99.99,
        user_id=test_user.id,
        status="available",
        created_at=datetime.now()
    )
    db_session.add(article)
    db_session.commit()
    db_session.refresh(article)
    return article


@pytest.fixture(scope="function")
def test_sale(db_session: Session, test_article: models.Article) -> models.Sale:
    """
    Crea una venta de prueba.
    """
    sale = models.Sale(
        article_id=test_article.id,
        buyer_id=2,  # Otro usuario
        price=99.99,
        status="completed",
        created_at=datetime.now()
    )
    db_session.add(sale)
    db_session.commit()
    db_session.refresh(sale)
    return sale


# ============================================================================
# FIXTURES DE AUTENTICACIÓN
# ============================================================================

@pytest.fixture(scope="function")
def token_test_user(test_user: models.User) -> str:
    """
    Genera un token JWT válido para el usuario de prueba.
    """
    access_token = create_access_token(
        data={"sub": test_user.username},
        expires_delta=timedelta(hours=24)
    )
    return access_token


@pytest.fixture(scope="function")
def authenticated_client(client: TestClient, token_test_user: str) -> TestClient:
    """
    Cliente HTTP con headers de autenticación.
    Incluye el token JWT en las solicitudes.
    """
    client.headers = {"Authorization": f"Bearer {token_test_user}"}
    return client


# ============================================================================
# FIXTURES AVANZADOS
# ============================================================================

@pytest.fixture(scope="function")
def multiple_articles(db_session: Session, test_user: models.User) -> list:
    """
    Crea varios artículos de prueba.
    """
    articles = []
    for i in range(5):
        article = models.Article(
            title=f"Article {i+1}",
            description=f"Description for article {i+1}",
            price=10.0 + (i * 5),
            user_id=test_user.id,
            status="available",
            created_at=datetime.now() - timedelta(days=i)
        )
        db_session.add(article)
        articles.append(article)
    
    db_session.commit()
    for article in articles:
        db_session.refresh(article)
    
    return articles


@pytest.fixture(scope="function")
def multiple_users(db_session: Session) -> list:
    """
    Crea varios usuarios de prueba.
    """
    users = []
    for i in range(3):
        user = models.User(
            username=f"user{i+1}",
            email=f"user{i+1}@example.com",
            hashed_password=security.hash_password("password123"),
            is_active=True,
            created_at=datetime.now()
        )
        db_session.add(user)
        users.append(user)
    
    db_session.commit()
    for user in users:
        db_session.refresh(user)
    
    return users


# ============================================================================
# CONFIGURACIÓN Y HOOKS
# ============================================================================

def pytest_configure(config):
    """
    Hook de configuración inicial de pytest.
    Aquí se registran markers personalizados.
    """
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "auth: mark test as authentication test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow"
    )
    config.addinivalue_line(
        "markers", "smoke: mark test as smoke test"
    )


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Setup inicial para toda la suite de tests.
    """
    os.environ["ENVIRONMENT"] = "testing"
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    
    yield
    
    # Cleanup después de todos los tests
    pass
