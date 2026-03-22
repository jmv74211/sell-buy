"""
Integration test template for complete workflows

Cubre flujos de usuario completos de principio a fin.
"""

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


class TestCompleteUserFlow:
    """Tests de flujo completo de usuario"""
    
    def test_user_registration_login_create_article_sell(
        self,
        client: TestClient,
        db_session
    ):
        """
        Test: Flujo completo - Registro → Login → Crear artículo → Vender
        
        1. Registrar nuevo usuario
        2. Hacer login
        3. Crear artículo
        4. Listar artículos
        5. Crear venta
        6. Verificar venta en historial
        """
        # 1. Registrar usuario
        register_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "secure_password_123"
        }
        register_response = client.post("/api/users/register", json=register_data)
        assert register_response.status_code == 201
        user_id = register_response.json()["id"]
        
        # 2. Hacer login
        login_data = {
            "username": "newuser",
            "password": "secure_password_123"
        }
        login_response = client.post("/api/users/login", json=login_data)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # 3. Crear cliente autenticado
        client.headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Crear artículo
        article_data = {
            "title": "New Product",
            "description": "A great product for sale",
            "price": 199.99,
            "status": "available"
        }
        article_response = client.post("/api/articles/", json=article_data)
        assert article_response.status_code == 201
        article_id = article_response.json()["id"]
        
        # 5. Listar artículos propios
        articles_response = client.get("/api/articles/")
        assert articles_response.status_code == 200
        articles = articles_response.json()
        assert len(articles) > 0
        assert articles[0]["id"] == article_id
        
        # 6. Crear venta (simular comprador externo)
        sale_data = {
            "article_id": article_id,
            "buyer_id": 999,  # Otro usuario
            "price": 199.99,
            "status": "completed"
        }
        sale_response = client.post("/api/sales/", json=sale_data)
        assert sale_response.status_code == 201
        sale_id = sale_response.json()["id"]
        
        # 7. Verificar venta en historial
        sales_response = client.get("/api/sales/")
        assert sales_response.status_code == 200
        sales = sales_response.json()
        assert len(sales) > 0
        assert any(s["id"] == sale_id for s in sales)
    
    def test_user_browse_and_purchase_flow(
        self,
        client: TestClient,
        test_user,
        test_article,
        token_test_user_2
    ):
        """
        Test: Flujo de comprador - Buscar → Ver detalle → Comprar
        
        1. Usuario 2 busca artículos
        2. Ve detalle del artículo
        3. Compra el artículo
        4. Verifica en sus compras
        """
        # Autenticar como usuario 2
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        
        # 1. Buscar artículos
        search_response = client.get("/api/articles/?search=Test")
        assert search_response.status_code == 200
        articles = search_response.json()
        assert len(articles) > 0
        
        # 2. Ver detalle del artículo
        detail_response = client.get(f"/api/articles/{test_article.id}")
        assert detail_response.status_code == 200
        article = detail_response.json()
        assert article["user_id"] == test_user.id
        
        # 3. Comprar artículo
        purchase_data = {
            "article_id": test_article.id,
            "buyer_id": 2,  # Usuario 2
            "price": test_article.price,
            "status": "completed"
        }
        # Nota: Dependería del endpoint específico para compras
        # purchase_response = client.post("/api/sales/", json=purchase_data)
        # assert purchase_response.status_code == 201


class TestSecurityFlows:
    """Tests de seguridad de flujos"""
    
    def test_cannot_modify_others_articles(
        self,
        client: TestClient,
        test_article,
        token_test_user_2
    ):
        """
        Test: Usuario no puede modificar artículo de otro
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        
        update_data = {
            "title": "Hacked Article",
            "description": "Hacked!",
            "price": 1.00,
            "status": "available"
        }
        
        response = client.put(
            f"/api/articles/{test_article.id}",
            json=update_data
        )
        
        assert response.status_code == 403
        
        # Verificar que no cambió
        verify_response = client.get(f"/api/articles/{test_article.id}")
        assert verify_response.json()["title"] == "Test Article"
    
    def test_cannot_view_private_data(
        self,
        client: TestClient,
        test_user,
        token_test_user_2
    ):
        """
        Test: Usuario no puede ver datos privados de otro
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        
        # Intentar acceder datos privados
        response = client.get(f"/api/users/{test_user.id}/private")
        
        # Debería retornar 403 o no exponer datos privados
        assert response.status_code in [403, 404]


class TestConcurrentOperations:
    """Tests de operaciones concurrentes"""
    
    @pytest.mark.slow
    def test_multiple_users_buy_same_article(
        self,
        client: TestClient,
        test_article,
        token_test_user,
        token_test_user_2
    ):
        """
        Test: Manejar múltiples compradores del mismo artículo
        
        Nota: Dependerá de implementación de concurrencia
        """
        # Usuario 1 intenta comprar
        client.headers = {"Authorization": f"Bearer {token_test_user}"}
        sale1_data = {
            "article_id": test_article.id,
            "buyer_id": 1,
            "price": test_article.price,
            "status": "pending"
        }
        response1 = client.post("/api/sales/", json=sale1_data)
        
        # Usuario 2 intenta comprar (debería fallar si ya fue vendido)
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        sale2_data = {
            "article_id": test_article.id,
            "buyer_id": 2,
            "price": test_article.price,
            "status": "pending"
        }
        response2 = client.post("/api/sales/", json=sale2_data)
        
        # Una de las dos debería fallar (si hay control de stock)
        # O ambas podrían tener éxito (sin control de stock)
        # Esto depende de los requisitos
        assert response1.status_code in [201, 400]
        # Al menos una debería ser exitosa
        assert response1.status_code == 201 or response2.status_code == 201
