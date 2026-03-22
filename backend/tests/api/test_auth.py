"""
test_auth.py - Tests para autenticación y seguridad

Cubre login, token generation, password hashing, y validación de permisos.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime

pytestmark = pytest.mark.auth


class TestUserRegistration:
    """Tests para registro de usuarios"""
    
    def test_register_user_success(self, client: TestClient, db_session):
        """
        Test: Registrar un nuevo usuario exitosamente
        """
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "secure_password_123"
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 201
        user = response.json()
        assert user["username"] == "newuser"
        assert user["email"] == "newuser@example.com"
        assert "password" not in user  # No debe retornar la contraseña
        assert "id" in user
    
    def test_register_user_duplicate_username(
        self,
        client: TestClient,
        test_user
    ):
        """
        Test: No se puede registrar con username duplicado
        """
        user_data = {
            "username": "testuser",  # Ya existe
            "email": "another@example.com",
            "password": "secure_password_123"
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_register_user_duplicate_email(
        self,
        client: TestClient,
        test_user
    ):
        """
        Test: No se puede registrar con email duplicado
        """
        user_data = {
            "username": "different",
            "email": "test@example.com",  # Ya existe
            "password": "secure_password_123"
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_register_user_invalid_email(self, client: TestClient):
        """
        Test: Email inválido retorna error
        """
        user_data = {
            "username": "newuser",
            "email": "invalid-email",  # Email inválido
            "password": "secure_password_123"
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 422
    
    def test_register_user_weak_password(self, client: TestClient):
        """
        Test: Contraseña débil retorna error
        """
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "123"  # Muy corta
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 422
    
    def test_register_user_missing_fields(self, client: TestClient):
        """
        Test: Campos requeridos faltantes retorna error
        """
        user_data = {
            "username": "newuser",
            # Faltan email y password
        }
        
        response = client.post("/api/users/register", json=user_data)
        
        assert response.status_code == 422


class TestUserLogin:
    """Tests para login de usuarios"""
    
    def test_login_success(self, client: TestClient, test_user):
        """
        Test: Login exitoso retorna token JWT
        """
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_username(self, client: TestClient):
        """
        Test: Username inexistente retorna error
        """
        login_data = {
            "username": "nonexistent",
            "password": "password123"
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_login_invalid_password(self, client: TestClient, test_user):
        """
        Test: Contraseña incorrecta retorna error
        """
        login_data = {
            "username": "testuser",
            "password": "wrong_password"
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_login_inactive_user(self, client: TestClient, db_session, test_user):
        """
        Test: Usuario inactivo no puede hacer login
        """
        # Desactivar usuario
        test_user.is_active = False
        db_session.commit()
        
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()
    
    def test_login_missing_credentials(self, client: TestClient):
        """
        Test: Credenciales incompletas retorna error
        """
        login_data = {
            "username": "testuser"
            # Falta password
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        assert response.status_code == 422


class TestTokenValidation:
    """Tests para validación de tokens JWT"""
    
    def test_valid_token(self, authenticated_client: TestClient):
        """
        Test: Token válido permite acceso a rutas protegidas
        """
        response = authenticated_client.get("/api/users/me")
        
        assert response.status_code == 200
    
    def test_invalid_token(self, client: TestClient):
        """
        Test: Token inválido retorna error
        """
        client.headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/users/me")
        
        assert response.status_code == 403
    
    def test_missing_token(self, client: TestClient):
        """
        Test: Solicitud sin token retorna error
        """
        response = client.get("/api/users/me")
        
        assert response.status_code == 403
    
    def test_expired_token(self, client: TestClient):
        """
        Test: Token expirado retorna error (si está implementado)
        """
        # Este test depende de la implementación de tokens expirados
        pass
    
    def test_token_wrong_signature(self, client: TestClient):
        """
        Test: Token con firma incorrecta retorna error
        """
        client.headers = {"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid.signature"}
        response = client.get("/api/users/me")
        
        assert response.status_code == 403


class TestPasswordManagement:
    """Tests para gestión de contraseñas"""
    
    def test_change_password_success(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Cambiar contraseña exitosamente
        """
        password_data = {
            "old_password": "testpass123",
            "new_password": "new_secure_password_123"
        }
        
        response = authenticated_client.post(
            "/api/users/change-password",
            json=password_data
        )
        
        assert response.status_code == 200
    
    def test_change_password_wrong_old(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Cambiar contraseña con contraseña actual incorrecta retorna error
        """
        password_data = {
            "old_password": "wrong_password",
            "new_password": "new_secure_password_123"
        }
        
        response = authenticated_client.post(
            "/api/users/change-password",
            json=password_data
        )
        
        assert response.status_code == 401
    
    def test_change_password_weak_new(
        self,
        authenticated_client: TestClient
    ):
        """
        Test: Nueva contraseña débil retorna error
        """
        password_data = {
            "old_password": "testpass123",
            "new_password": "123"  # Muy corta
        }
        
        response = authenticated_client.post(
            "/api/users/change-password",
            json=password_data
        )
        
        assert response.status_code == 422
    
    def test_password_hash_not_stored_plaintext(
        self,
        db_session,
        test_user
    ):
        """
        Test: Las contraseñas nunca se almacenan en plaintext
        """
        assert test_user.hashed_password != "testpass123"
        assert test_user.hashed_password.startswith("$2b$")  # bcrypt hash format


class TestPermissions:
    """Tests para validación de permisos"""
    
    def test_cannot_access_others_data(
        self,
        client: TestClient,
        test_user,
        test_user_2,
        token_test_user_2
    ):
        """
        Test: Usuario no puede acceder datos de otro usuario
        """
        client.headers = {"Authorization": f"Bearer {token_test_user_2}"}
        
        # test_user_2 intenta acceder datos de test_user
        response = client.get(f"/api/users/{test_user.id}")
        
        assert response.status_code == 403
    
    def test_can_access_own_data(
        self,
        authenticated_client: TestClient,
        test_user
    ):
        """
        Test: Usuario puede acceder sus propios datos
        """
        response = authenticated_client.get("/api/users/me")
        
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == test_user.username


class TestSecurityHeaders:
    """Tests para headers de seguridad"""
    
    def test_password_not_in_response(self, authenticated_client: TestClient):
        """
        Test: Las contraseñas nunca se incluyen en respuestas
        """
        response = authenticated_client.get("/api/users/me")
        
        assert response.status_code == 200
        user = response.json()
        assert "password" not in user
        assert "hashed_password" not in user
    
    def test_no_sensitive_data_in_errors(self, client: TestClient):
        """
        Test: Los errores no revelan información sensible
        """
        login_data = {
            "username": "nonexistent",
            "password": "password123"
        }
        
        response = client.post("/api/users/login", json=login_data)
        
        # No debe revelar si el usuario existe o no
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
