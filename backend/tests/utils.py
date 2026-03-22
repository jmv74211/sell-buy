"""
utils.py - Utilidades para tests

Funciones helper, factories, y utilidades comunes para tests.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import random
import string
from faker import Faker

fake = Faker()


class UserFactory:
    """Factory para crear usuarios de prueba"""
    
    @staticmethod
    def create_data(
        username: Optional[str] = None,
        email: Optional[str] = None,
        password: str = "testpass123"
    ) -> Dict[str, str]:
        """Crear datos de usuario"""
        return {
            "username": username or fake.user_name(),
            "email": email or fake.email(),
            "password": password
        }


class ArticleFactory:
    """Factory para crear artículos de prueba"""
    
    @staticmethod
    def create_data(
        title: Optional[str] = None,
        description: Optional[str] = None,
        price: Optional[float] = None,
        status: str = "available"
    ) -> Dict[str, Any]:
        """Crear datos de artículo"""
        return {
            "title": title or fake.sentence(nb_words=3),
            "description": description or fake.paragraph(),
            "price": price or round(random.uniform(10, 1000), 2),
            "status": status
        }


class SaleFactory:
    """Factory para crear ventas de prueba"""
    
    @staticmethod
    def create_data(
        article_id: int = 1,
        buyer_id: int = 2,
        price: Optional[float] = None,
        status: str = "completed"
    ) -> Dict[str, Any]:
        """Crear datos de venta"""
        return {
            "article_id": article_id,
            "buyer_id": buyer_id,
            "price": price or 99.99,
            "status": status
        }


def create_test_data_batch(count: int = 5):
    """Crear batch de datos de prueba"""
    return {
        "users": [UserFactory.create_data() for _ in range(count)],
        "articles": [ArticleFactory.create_data() for _ in range(count)],
        "sales": [SaleFactory.create_data(article_id=i) for i in range(1, count + 1)]
    }


def assert_datetime_recent(dt: datetime, seconds: int = 5):
    """
    Verificar que un datetime es reciente (último N segundos)
    
    Útil para verificar created_at, updated_at, etc.
    """
    now = datetime.now()
    delta = now - dt
    assert delta.total_seconds() <= seconds, \
        f"DateTime {dt} no es reciente (hace {delta.total_seconds()}s)"


def assert_paginated_response(response_json: Dict, items_key: str = "items"):
    """
    Verificar que una respuesta paginada tiene la estructura correcta
    """
    assert items_key in response_json
    assert "total" in response_json
    assert "skip" in response_json
    assert "limit" in response_json
    assert isinstance(response_json[items_key], list)


def assert_error_response(response_json: Dict, expected_detail: Optional[str] = None):
    """
    Verificar que una respuesta de error tiene la estructura correcta
    """
    assert "detail" in response_json
    
    if expected_detail:
        assert expected_detail.lower() in response_json["detail"].lower()


def generate_random_string(length: int = 10) -> str:
    """Generar string aleatorio para tests"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def generate_random_email() -> str:
    """Generar email aleatorio para tests"""
    return f"{generate_random_string()}@test.example.com"


def generate_random_password(length: int = 12) -> str:
    """Generar contraseña segura para tests"""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choices(chars, k=length))


class APIResponseValidator:
    """Validador para respuestas API"""
    
    @staticmethod
    def is_success(status_code: int) -> bool:
        """¿Es una respuesta exitosa?"""
        return 200 <= status_code < 300
    
    @staticmethod
    def is_client_error(status_code: int) -> bool:
        """¿Es un error del cliente?"""
        return 400 <= status_code < 500
    
    @staticmethod
    def is_server_error(status_code: int) -> bool:
        """¿Es un error del servidor?"""
        return 500 <= status_code < 600
    
    @staticmethod
    def validate_json(response_json: Any):
        """Verificar que el JSON es válido"""
        assert response_json is not None
        assert isinstance(response_json, (dict, list))


class MockData:
    """Datos mock para tests"""
    
    VALID_CREDENTIALS = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    VALID_USER = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    VALID_ARTICLE = {
        "title": "Test Article",
        "description": "A test article for sale",
        "price": 99.99,
        "status": "available"
    }
    
    VALID_SALE = {
        "article_id": 1,
        "buyer_id": 2,
        "price": 99.99,
        "status": "completed"
    }
    
    INVALID_CREDENTIALS = {
        "username": "nonexistent",
        "password": "wrongpassword"
    }
    
    INVALID_USER = {
        "username": "",
        "email": "invalid",
        "password": "123"
    }
    
    INVALID_ARTICLE = {
        "title": "",
        "description": "",
        "price": -50,
        "status": "invalid"
    }
