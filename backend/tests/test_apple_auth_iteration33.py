"""
Test cases for iteration 33:
1. Apple Sign-In init endpoint (returns null when not configured)
2. Apple Sign-In callback endpoint (creates user with apple_id)
3. Email login and register functionality
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAppleAuthInit:
    """Test GET /api/auth/apple/init endpoint"""
    
    def test_apple_init_returns_null_when_not_configured(self):
        """Apple init should return auth_url=null when APPLE_CLIENT_ID is not set"""
        response = requests.get(f"{BASE_URL}/api/auth/apple/init")
        assert response.status_code == 200
        data = response.json()
        assert data.get("auth_url") is None
        assert "henuz yapilandirilmadi" in data.get("message", "").lower() or "message" in data
        print("PASSED: Apple init returns auth_url=null when not configured")


class TestAppleAuthCallback:
    """Test POST /api/auth/apple/callback endpoint"""
    
    def test_apple_callback_requires_id_token(self):
        """Callback should fail without id_token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/apple/callback",
            json={}
        )
        assert response.status_code == 400
        data = response.json()
        assert "id_token" in str(data).lower() or "eksik" in str(data).lower()
        print("PASSED: Apple callback requires id_token")
    
    def test_apple_callback_creates_user_with_test_jwt(self):
        """Callback should create user from valid JWT token"""
        import jwt
        
        # Create a test JWT token (unverified - Apple callback doesn't verify signature)
        test_apple_id = f"test_apple_{uuid.uuid4().hex[:12]}"
        test_email = f"test_apple_{uuid.uuid4().hex[:8]}@privaterelay.appleid.com"
        
        test_token = jwt.encode({
            "sub": test_apple_id,
            "email": test_email,
            "aud": "test_client_id",
            "iss": "https://appleid.apple.com",
            "exp": 9999999999  # Far future
        }, "test_secret", algorithm="HS256")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/apple/callback",
            json={
                "id_token": test_token,
                "user": {"name": {"firstName": "Test", "lastName": "User"}}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        user = data["user"]
        assert "user_id" in user
        assert user.get("email") == test_email
        print(f"PASSED: Apple callback created user with user_id={user['user_id']}, email={user['email']}")
    
    def test_apple_callback_handles_existing_user(self):
        """Callback should handle existing user login"""
        import jwt
        
        # First create a new user
        test_apple_id = f"existing_apple_{uuid.uuid4().hex[:12]}"
        test_email = f"existing_{uuid.uuid4().hex[:8]}@privaterelay.appleid.com"
        
        test_token = jwt.encode({
            "sub": test_apple_id,
            "email": test_email,
            "aud": "test_client_id",
            "iss": "https://appleid.apple.com",
            "exp": 9999999999
        }, "test_secret", algorithm="HS256")
        
        # First call - create user
        response1 = requests.post(
            f"{BASE_URL}/api/auth/apple/callback",
            json={"id_token": test_token}
        )
        assert response1.status_code == 200
        user1 = response1.json()["user"]
        
        # Second call - login existing user
        response2 = requests.post(
            f"{BASE_URL}/api/auth/apple/callback",
            json={"id_token": test_token}
        )
        assert response2.status_code == 200
        user2 = response2.json()["user"]
        
        # Should be same user
        assert user1["user_id"] == user2["user_id"]
        print(f"PASSED: Apple callback handles existing user login correctly (same user_id)")


class TestEmailAuth:
    """Test email login and register endpoints"""
    
    def test_email_login_existing_user(self):
        """Login with existing test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test2@test.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "test2@test.com"
        print("PASSED: Email login works for existing user test2@test.com")
    
    def test_email_login_wrong_password(self):
        """Login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test2@test.com",
                "password": "wrongpassword123"
            }
        )
        assert response.status_code == 401
        print("PASSED: Email login rejects wrong password with 401")
    
    def test_email_register_new_user(self):
        """Register a new user"""
        unique_email = f"TEST_newuser_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "newpassword123",
                "name": "Test New User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test New User"
        print(f"PASSED: Email register creates new user with email={unique_email}")
    
    def test_email_register_duplicate_rejected(self):
        """Registering with existing email should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test2@test.com",
                "password": "somepassword123",
                "name": "Duplicate User"
            }
        )
        assert response.status_code == 400
        print("PASSED: Email register rejects duplicate email with 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
