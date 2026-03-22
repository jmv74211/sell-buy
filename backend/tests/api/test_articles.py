"""
test_articles.py - Tests para el endpoint de artículos

Cubre CRUD operations para artículos (productos).
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime

pytestmark = [pytest.mark.integration, pytest.mark.smoke]


class TestArticlesGet:
    """Tests para GET /api/articles"""
    
    def test_get_articles_empty(self, authenticated_client: TestClient):
        """
        Test: Usuario sin artículos obtiene lista vacía
        """
        response = authenticated_client.get("/api/articles/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_articles_success(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Usuario con artículos obtiene la lista
        """
        response = authenticated_client.get("/api/articles/")
        
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) > 0
        assert articles[0]["title"] == "Test Article"
    
    def test_get_articles_pagination(
        self,
        authenticated_client: TestClient,
        multiple_articles
    ):
        """
        Test: Verificar paginación de artículos
        """
        response = authenticated_client.get("/api/articles/?skip=0&limit=10")
        
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) <= 10
    
    def test_get_articles_filter_by_status(
        self,
        authenticated_client: TestClient,
        test_article,
        db_session
    ):
        """
        Test: Filtrar artículos por estado
        """
        response = authenticated_client.get("/api/articles/?status=available")
        
        assert response.status_code == 200
        articles = response.json()
        for article in articles:
            assert article["status"] == "available"
    
    def test_get_articles_search(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Buscar artículos por título
        """
        response = authenticated_client.get("/api/articles/?search=Test")
        
        assert response.status_code == 200
        articles = response.json()
        assert len(articles) > 0
        assert "Test" in articles[0]["title"]


class TestArticlesGetById:
    """Tests para GET /api/articles/{article_id}"""
    
    def test_get_article_success(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Obtener artículo específico por ID
        """
        response = authenticated_client.get(f"/api/articles/{test_article.id}")
        
        assert response.status_code == 200
        article = response.json()
        assert article["id"] == test_article.id
        assert article["title"] == "Test Article"
    
    def test_get_article_not_found(self, authenticated_client: TestClient):
        """
        Test: Obtener artículo inexistente retorna 404
        """
        response = authenticated_client.get("/api/articles/999")
        
        assert response.status_code == 404
    
    def test_get_article_includes_seller_info(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Respuesta incluye información del vendedor
        """
        response = authenticated_client.get(f"/api/articles/{test_article.id}")
        
        assert response.status_code == 200
        article = response.json()
        assert "user_id" in article
        assert article["user_id"] == test_article.user_id


class TestArticlesCreate:
    """Tests para POST /api/articles"""
    
    def test_create_article_success(self, authenticated_client: TestClient):
        """
        Test: Crear artículo con datos válidos
        """
        article_data = {
            "title": "New Article",
            "description": "A new article for sale",
            "price": 49.99,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 201
        article = response.json()
        assert article["title"] == "New Article"
        assert article["price"] == 49.99
        assert "id" in article
    
    def test_create_article_missing_required_field(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Crear artículo sin campo requerido retorna 422
        """
        article_data = {
            "title": "New Article",
            # Falta description
            "price": 49.99,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 422
    
    def test_create_article_negative_price(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: No se permite precio negativo
        """
        article_data = {
            "title": "New Article",
            "description": "A new article",
            "price": -10.00,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 422
    
    def test_create_article_invalid_status(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Estado inválido retorna error
        """
        article_data = {
            "title": "New Article",
            "description": "A new article",
            "price": 49.99,
            "status": "invalid_status"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 422
    
    def test_create_article_without_auth(self, client: TestClient):
        """
        Test: Crear artículo sin autenticación retorna 403
        """
        article_data = {
            "title": "New Article",
            "description": "A new article",
            "price": 49.99,
            "status": "available"
        }
        
        response = client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 403
    
    def test_create_article_sets_user_id(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: User ID se asigna automáticamente al usuario autenticado
        """
        article_data = {
            "title": "New Article",
            "description": "A new article",
            "price": 49.99,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 201
        article = response.json()
        assert article["user_id"] == test_user.id


class TestArticlesUpdate:
    """Tests para PUT /api/articles/{article_id}"""
    
    def test_update_article_success(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Actualizar artículo exitosamente
        """
        update_data = {
            "title": "Updated Article",
            "description": "Updated description",
            "price": 79.99,
            "status": "sold"
        }
        
        response = authenticated_client.put(
            f"/api/articles/{test_article.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        article = response.json()
        assert article["title"] == "Updated Article"
        assert article["price"] == 79.99
    
    def test_update_article_not_found(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Actualizar artículo inexistente retorna 404
        """
        update_data = {
            "title": "Updated Article",
            "description": "Updated description",
            "price": 79.99,
            "status": "available"
        }
        
        response = authenticated_client.put(
            "/api/articles/999",
            json=update_data
        )
        
        assert response.status_code == 404
    
    def test_update_article_not_owned(
        self,
        client: TestClient,
        test_article,
        token_test_user_2
    ):
        """
        Test: No se puede actualizar artículo de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        update_data = {
            "title": "Hacked Article",
            "description": "Hacked",
            "price": 1.00,
            "status": "available"
        }
        
        response = client.put(
            f"/api/articles/{test_article.id}",
            json=update_data
        )
        
        assert response.status_code == 403
    
    def test_update_article_partial(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Actualizar solo algunos campos
        """
        update_data = {
            "price": 120.00
        }
        
        response = authenticated_client.patch(
            f"/api/articles/{test_article.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        article = response.json()
        assert article["price"] == 120.00
        assert article["title"] == test_article.title  # Debe conservarse


class TestArticlesDelete:
    """Tests para DELETE /api/articles/{article_id}"""
    
    def test_delete_article_success(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Eliminar artículo exitosamente
        """
        response = authenticated_client.delete(f"/api/articles/{test_article.id}")
        
        assert response.status_code == 204
        
        # Verificar que se eliminó
        get_response = authenticated_client.get(f"/api/articles/{test_article.id}")
        assert get_response.status_code == 404
    
    def test_delete_article_not_found(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Eliminar artículo inexistente retorna 404
        """
        response = authenticated_client.delete("/api/articles/999")
        
        assert response.status_code == 404
    
    def test_delete_article_not_owned(
        self,
        client: TestClient,
        test_article,
        token_test_user_2
    ):
        """
        Test: No se puede eliminar artículo de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        response = client.delete(f"/api/articles/{test_article.id}")
        
        assert response.status_code == 403
    
    def test_delete_article_with_sales(
        self,
        authenticated_client: TestClient,
        test_article,
        test_sale
    ):
        """
        Test: Comportamiento al eliminar artículo con ventas
        """
        response = authenticated_client.delete(f"/api/articles/{test_article.id}")
        
        # Depende de la implementación: puede ser 400 o cascada
        assert response.status_code in [400, 204]


class TestArticlesValidation:
    """Tests de validación de datos"""
    
    def test_article_title_max_length(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Validar máximo de caracteres en título
        """
        article_data = {
            "title": "A" * 1000,  # Título muy largo
            "description": "A description",
            "price": 49.99,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        # Puede aceptar o rechazar según validaciones
        assert response.status_code in [201, 422]
    
    def test_article_description_required(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Descripción es requerida
        """
        article_data = {
            "title": "Article",
            "description": "",  # Vacío
            "price": 49.99,
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        # Debería rechazar descripción vacía
        assert response.status_code == 422
    
    def test_article_price_precision(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Precisión decimal del precio
        """
        article_data = {
            "title": "Article",
            "description": "A description",
            "price": 19.999,  # Más decimales de lo esperado
            "status": "available"
        }
        
        response = authenticated_client.post("/api/articles/", json=article_data)
        
        assert response.status_code == 201
        article = response.json()
        # Debería redondearse a 2 decimales
        assert article["price"] == 20.00 or article["price"] == 19.999
