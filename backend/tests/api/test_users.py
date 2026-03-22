"""
test_users.py - Tests para el endpoint de usuarios

Cubre perfil, actualización de información, y gestión de cuenta.
"""

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration


class TestGetCurrentUser:
    """Tests para GET /api/users/me"""
    
    def test_get_current_user_success(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Obtener datos del usuario autenticado
        """
        response = authenticated_client.get("/api/users/me")
        
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == test_user.username
        assert user["email"] == test_user.email
        assert "password" not in user
    
    def test_get_current_user_without_auth(self, client: TestClient):
        """
        Test: Sin autenticación retorna error
        """
        response = client.get("/api/users/me")
        
        assert response.status_code == 403


class TestUserProfile:
    """Tests para perfil de usuario"""
    
    def test_get_user_profile(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Obtener perfil público de usuario
        """
        response = authenticated_client.get(f"/api/users/{test_user.id}")
        
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == test_user.username
    
    def test_user_profile_includes_article_count(
        self,
        authenticated_client: TestClient,
        test_user,
        test_article
    ):
        """
        Test: Perfil incluye contador de artículos
        """
        response = authenticated_client.get(f"/api/users/{test_user.id}")
        
        assert response.status_code == 200
        user = response.json()
        assert "articles_count" in user or "article_count" in user
    
    def test_user_not_found(self, authenticated_client: TestClient):
        """
        Test: Usuario inexistente retorna 404
        """
        response = authenticated_client.get("/api/users/999")
        
        assert response.status_code == 404


class TestUpdateProfile:
    """Tests para actualizar perfil de usuario"""
    
    def test_update_profile_success(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Actualizar información de perfil
        """
        update_data = {
            "email": "newemail@example.com"
        }
        
        response = authenticated_client.put(
            "/api/users/me",
            json=update_data
        )
        
        assert response.status_code == 200
        user = response.json()
        assert user["email"] == "newemail@example.com"
    
    def test_update_profile_duplicate_email(
        self,
        authenticated_client: TestClient,
        test_user_2
    ):
        """
        Test: No se puede cambiar a email que otro usuario ya usa
        """
        update_data = {
            "email": test_user_2.email  # Email de otro usuario
        }
        
        response = authenticated_client.put(
            "/api/users/me",
            json=update_data
        )
        
        assert response.status_code == 400
    
    def test_update_profile_invalid_email(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Email inválido retorna error
        """
        update_data = {
            "email": "invalid-email"
        }
        
        response = authenticated_client.put(
            "/api/users/me",
            json=update_data
        )
        
        assert response.status_code == 422
    
    def test_cannot_update_other_user_profile(
        self,
        client: TestClient,
        test_user,
        token_test_user_2
    ):
        """
        Test: No se puede actualizar perfil de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        update_data = {
            "email": "hacked@example.com"
        }
        
        response = client.put(
            f"/api/users/{test_user.id}",
            json=update_data
        )
        
        assert response.status_code == 403


class TestUserDeletion:
    """Tests para eliminación de cuenta"""
    
    def test_delete_account_success(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Eliminar la propia cuenta
        """
        response = authenticated_client.delete("/api/users/me")
        
        assert response.status_code == 200
        
        # Verificar que se eliminó
        verify_response = authenticated_client.get("/api/users/me")
        assert verify_response.status_code == 403
    
    def test_delete_account_requires_password(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Eliminación requiere contraseña de confirmación
        """
        delete_data = {
            "password": "testpass123"
        }
        
        response = authenticated_client.delete(
            "/api/users/me",
            json=delete_data
        )
        
        assert response.status_code == 200
    
    def test_delete_account_wrong_password(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Contraseña incorrecta impide eliminación
        """
        delete_data = {
            "password": "wrong_password"
        }
        
        response = authenticated_client.delete(
            "/api/users/me",
            json=delete_data
        )
        
        assert response.status_code == 401
    
    def test_cannot_delete_other_user(
        self,
        client: TestClient,
        test_user,
        token_test_user_2
    ):
        """
        Test: No se puede eliminar cuenta de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        response = client.delete(f"/api/users/{test_user.id}")
        
        assert response.status_code == 403


class TestUserStats:
    """Tests para estadísticas de usuario"""
    
    def test_user_articles_count(
        self,
        authenticated_client: TestClient,
        test_user,
        multiple_articles
    ):
        """
        Test: Contar artículos del usuario
        """
        response = authenticated_client.get(f"/api/users/{test_user.id}/stats")
        
        assert response.status_code == 200
        stats = response.json()
        assert stats["articles_count"] == len(multiple_articles)
    
    def test_user_sales_count(
        self,
        authenticated_client: TestClient,
        test_user,
        test_sale
    ):
        """
        Test: Contar ventas del usuario
        """
        response = authenticated_client.get(f"/api/users/{test_user.id}/stats")
        
        assert response.status_code == 200
        stats = response.json()
        assert "sales_count" in stats
    
    def test_user_rating(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Obtener calificación del usuario (si existe)
        """
        response = authenticated_client.get(f"/api/users/{test_user.id}")
        
        assert response.status_code == 200
        user = response.json()
        if "rating" in user:
            assert 0 <= user["rating"] <= 5


class TestUserActivation:
    """Tests para activación de cuenta"""
    
    def test_user_is_active_by_default(
        self,
        client: TestClient
    ):
        """
        Test: Nuevo usuario es activo por defecto
        """
        user_data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/users/register", json=user_data)
        assert response.status_code == 201
        
        # Debe poder hacer login
        login_response = client.post(
            "/api/users/login",
            json={"username": "newuser", "password": "password123"}
        )
        assert login_response.status_code == 200
    
    def test_deactivate_account(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Deactivar propia cuenta
        """
        response = authenticated_client.post("/api/users/me/deactivate")
        
        assert response.status_code == 200
        
        # No debe poder hacer login
        login_response = authenticated_client.post(
            "/api/users/login",
            json={"username": "testuser", "password": "testpass123"}
        )
        assert login_response.status_code == 401
