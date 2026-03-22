"""
test_sales.py - Tests para el endpoint de sales (ventas)

Cubre todos los CRUD operations y validaciones de la API de ventas.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

pytestmark = [pytest.mark.integration, pytest.mark.smoke]


class TestSalesGet:
    """Tests para GET /api/sales"""
    
    def test_get_sales_empty(self, authenticated_client: TestClient):
        """
        Test: Usuario sin ventas obtiene lista vacía
        """
        response = authenticated_client.get("/api/sales/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_sales_success(
        self, 
        authenticated_client: TestClient, 
        test_sale,
        test_article
    ):
        """
        Test: Usuario con ventas obtiene la lista completa
        """
        response = authenticated_client.get("/api/sales/")
        
        assert response.status_code == 200
        sales = response.json()
        assert len(sales) > 0
        assert sales[0]["price"] == 99.99
    
    def test_get_sales_without_auth(self, client: TestClient):
        """
        Test: Solicitud sin autenticación retorna 401
        """
        response = client.get("/api/sales/")
        
        assert response.status_code == 403
    
    def test_get_sales_invalid_token(self, client: TestClient):
        """
        Test: Token inválido retorna 401
        """
        client.headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/sales/")
        
        assert response.status_code == 403


class TestSalesGetById:
    """Tests para GET /api/sales/{sale_id}"""
    
    def test_get_sale_by_id_success(
        self,
        authenticated_client: TestClient,
        test_sale
    ):
        """
        Test: Obtener una venta específica por ID
        """
        response = authenticated_client.get(f"/api/sales/{test_sale.id}")
        
        assert response.status_code == 200
        sale = response.json()
        assert sale["id"] == test_sale.id
        assert sale["price"] == 99.99
    
    def test_get_sale_not_found(self, authenticated_client: TestClient):
        """
        Test: Obtener una venta inexistente retorna 404
        """
        response = authenticated_client.get("/api/sales/999")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Sale not found"
    
    def test_get_sale_not_owned(
        self,
        client: TestClient,
        test_sale,
        token_test_user_2
    ):
        """
        Test: Usuario no puede ver venta de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        response = client.get(f"/api/sales/{test_sale.id}")
        
        assert response.status_code == 404


class TestSalesCreate:
    """Tests para POST /api/sales"""
    
    def test_create_sale_success(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Crear una venta con datos válidos
        """
        sale_data = {
            "article_id": test_article.id,
            "buyer_id": 2,
            "price": 99.99,
            "status": "completed"
        }
        
        response = authenticated_client.post("/api/sales/", json=sale_data)
        
        assert response.status_code == 201
        sale = response.json()
        assert sale["article_id"] == test_article.id
        assert sale["price"] == 99.99
        assert "id" in sale
    
    def test_create_sale_article_not_found(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Crear venta con artículo inexistente retorna 404
        """
        sale_data = {
            "article_id": 999,
            "buyer_id": 2,
            "price": 99.99,
            "status": "completed"
        }
        
        response = authenticated_client.post("/api/sales/", json=sale_data)
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Article not found"
    
    def test_create_sale_missing_fields(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Crear venta sin campos requeridos retorna 422
        """
        sale_data = {
            "buyer_id": 2,
            "price": 99.99
        }
        
        response = authenticated_client.post("/api/sales/", json=sale_data)
        
        assert response.status_code == 422
    
    def test_create_sale_without_auth(
        self,
        client: TestClient,
        test_article
    ):
        """
        Test: Crear venta sin autenticación retorna 403
        """
        sale_data = {
            "article_id": test_article.id,
            "buyer_id": 2,
            "price": 99.99,
            "status": "completed"
        }
        
        response = client.post("/api/sales/", json=sale_data)
        
        assert response.status_code == 403


class TestSalesUpdate:
    """Tests para PUT /api/sales/{sale_id}"""
    
    def test_update_sale_success(
        self,
        authenticated_client: TestClient,
        test_sale
    ):
        """
        Test: Actualizar una venta exitosamente
        """
        update_data = {
            "article_id": test_sale.article_id,
            "buyer_id": 3,
            "price": 120.00,
            "status": "pending"
        }
        
        response = authenticated_client.put(
            f"/api/sales/{test_sale.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        sale = response.json()
        assert sale["price"] == 120.00
        assert sale["status"] == "pending"
    
    def test_update_sale_not_found(self, authenticated_client: TestClient):
        """
        Test: Actualizar venta inexistente retorna 404
        """
        update_data = {
            "article_id": 1,
            "buyer_id": 2,
            "price": 100.00,
            "status": "completed"
        }
        
        response = authenticated_client.put(
            "/api/sales/999",
            json=update_data
        )
        
        assert response.status_code == 404
    
    def test_update_sale_not_owned(
        self,
        client: TestClient,
        test_sale,
        token_test_user_2
    ):
        """
        Test: No se puede actualizar venta de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        update_data = {
            "article_id": test_sale.article_id,
            "buyer_id": 3,
            "price": 150.00,
            "status": "pending"
        }
        
        response = client.put(
            f"/api/sales/{test_sale.id}",
            json=update_data
        )
        
        assert response.status_code == 404


class TestSalesDelete:
    """Tests para DELETE /api/sales/{sale_id}"""
    
    def test_delete_sale_success(
        self,
        authenticated_client: TestClient,
        test_sale
    ):
        """
        Test: Eliminar una venta exitosamente
        """
        response = authenticated_client.delete(f"/api/sales/{test_sale.id}")
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Sale deleted"
        
        # Verificar que se eliminó
        get_response = authenticated_client.get(f"/api/sales/{test_sale.id}")
        assert get_response.status_code == 404
    
    def test_delete_sale_not_found(self, authenticated_client: TestClient):
        """
        Test: Eliminar venta inexistente retorna 404
        """
        response = authenticated_client.delete("/api/sales/999")
        
        assert response.status_code == 404
    
    def test_delete_sale_not_owned(
        self,
        client: TestClient,
        test_sale,
        token_test_user_2
    ):
        """
        Test: No se puede eliminar venta de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        response = client.delete(f"/api/sales/{test_sale.id}")
        
        assert response.status_code == 404


class TestSalesEdgeCases:
    """Tests de casos especiales y límites"""
    
    @pytest.mark.slow
    def test_create_multiple_sales(
        self,
        authenticated_client: TestClient,
        multiple_articles
    ):
        """
        Test: Crear múltiples ventas y verificar listado
        """
        for article in multiple_articles[:3]:
            sale_data = {
                "article_id": article.id,
                "buyer_id": 2,
                "price": article.price,
                "status": "completed"
            }
            response = authenticated_client.post("/api/sales/", json=sale_data)
            assert response.status_code == 201
        
        # Verificar que se crearon todas
        response = authenticated_client.get("/api/sales/")
        assert response.status_code == 200
        assert len(response.json()) >= 3
    
    def test_sale_price_decimal_precision(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Precios con precisión decimal se manejan correctamente
        """
        sale_data = {
            "article_id": test_article.id,
            "buyer_id": 2,
            "price": 99.99,
            "status": "completed"
        }
        
        response = authenticated_client.post("/api/sales/", json=sale_data)
        
        assert response.status_code == 201
        sale = response.json()
        assert sale["price"] == 99.99
    
    def test_sale_status_values(
        self,
        authenticated_client: TestClient,
        test_article
    ):
        """
        Test: Verificar diferentes estados válidos de venta
        """
        statuses = ["pending", "completed", "cancelled"]
        
        for i, status in enumerate(statuses):
            article = test_article
            if i > 0:
                # Para múltiples, crearemos articles adicionales si es necesario
                pass
            
            sale_data = {
                "article_id": article.id,
                "buyer_id": 2 + i,
                "price": 50.00 + i,
                "status": status
            }
            
            response = authenticated_client.post("/api/sales/", json=sale_data)
            assert response.status_code == 201
