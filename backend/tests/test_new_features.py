"""
Backend API Tests for ZET Mindshare New Features
Tests: Email Auth, Copy/Mirror/VoiceInput tools (frontend only), ZETA full doc content
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmailAuthentication:
    """Email authentication tests - /auth/register and /auth/login"""
    
    def test_register_with_email(self):
        """Test registering a new user with email"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        # Should create user successfully
        assert response.status_code == 200, f"Register failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain 'user' field"
        user = data["user"]
        assert "user_id" in user, "User should have user_id"
        assert user["email"] == unique_email, "Email should match"
        assert user["name"] == "Test User", "Name should match"
        
        # Verify session cookie is set
        assert "session_token" in response.cookies, "Session cookie should be set after registration"
        print(f"✓ Email registration successful for {unique_email}")
        
        # Clean up - delete user (optional, test accounts accumulate)
        return user["user_id"], response.cookies.get("session_token")
    
    def test_register_duplicate_email(self):
        """Test that duplicate email registration is rejected"""
        unique_email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "testpassword123",
            "name": "First User"
        }
        
        # First registration should succeed
        resp1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert resp1.status_code == 200, f"First registration failed: {resp1.text}"
        
        # Second registration with same email should fail
        payload["name"] = "Second User"
        resp2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert resp2.status_code == 400, "Duplicate email should return 400"
        assert "already registered" in resp2.json().get("detail", "").lower()
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_with_email(self):
        """Test logging in with email credentials"""
        # First register a user
        unique_email = f"login_{uuid.uuid4().hex[:8]}@example.com"
        register_payload = {
            "email": unique_email,
            "password": "securepassword456",
            "name": "Login Test User"
        }
        
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert register_resp.status_code == 200, f"Setup register failed: {register_resp.text}"
        
        # Now login with same credentials
        login_payload = {
            "email": unique_email,
            "password": "securepassword456"
        }
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        data = login_resp.json()
        
        # Verify response
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert "session_token" in login_resp.cookies
        print(f"✓ Email login successful for {unique_email}")
    
    def test_login_invalid_password(self):
        """Test login with wrong password is rejected"""
        # First register
        unique_email = f"wrongpw_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "correctpassword",
            "name": "Wrong PW Test"
        })
        
        # Try login with wrong password
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "wrongpassword"
        })
        
        assert resp.status_code == 401, "Wrong password should return 401"
        print("✓ Invalid password correctly rejected")
    
    def test_login_nonexistent_email(self):
        """Test login with non-existent email is rejected"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        
        assert resp.status_code == 401, "Non-existent email should return 401"
        print("✓ Non-existent email correctly rejected")
    
    def test_session_works_after_email_login(self):
        """Test that session token from email login works for protected routes"""
        # Register and login
        unique_email = f"session_{uuid.uuid4().hex[:8]}@example.com"
        
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "sessiontest123",
            "name": "Session Test"
        })
        
        session_token = register_resp.cookies.get("session_token")
        
        # Use session to access protected endpoint
        me_resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": session_token}
        )
        
        assert me_resp.status_code == 200, f"Protected route failed: {me_resp.text}"
        user_data = me_resp.json()
        assert user_data["email"] == unique_email
        print("✓ Session token from email auth works for protected routes")


class TestZETAFullDocumentContent:
    """Test ZETA receiving full document content (shape, image, text, etc)"""
    
    @pytest.fixture
    def session(self):
        """Create a test user and return session"""
        unique_email = f"zeta_{uuid.uuid4().hex[:8]}@example.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "zetatest123",
            "name": "ZETA Test User"
        })
        s = requests.Session()
        s.cookies.update(resp.cookies)
        return s
    
    def test_zeta_chat_with_document_content(self, session):
        """Test ZETA can receive and understand full document content"""
        # Simulate full document content from frontend's getFullDocContent()
        document_content = """[TEXT]: Project Title - Q4 Report
[TEXT]: This is the quarterly financial report for 2025.
[SHAPE]: square at (100, 200)
[IMAGE]: at (150, 300), size: 200x150
[CHART]: bar at (50, 450)
[TEXT]: Key findings show 15% growth in revenue.
[VECTOR 1]: 12 points, color: #000000"""
        
        payload = {
            "message": "What shapes and images are in my document?",
            "document_content": document_content
        }
        
        resp = session.post(f"{BASE_URL}/api/zeta/chat", json=payload)
        assert resp.status_code == 200, f"ZETA chat failed: {resp.text}"
        
        data = resp.json()
        assert "response" in data
        
        # ZETA should acknowledge the document content
        response_text = data["response"].lower()
        # The AI should recognize there are shapes/images in the document
        print(f"✓ ZETA responded to document content query")
        print(f"  Response snippet: {data['response'][:200]}...")
    
    def test_zeta_chat_document_summary(self, session):
        """Test ZETA can summarize document elements"""
        document_content = """[TEXT]: Meeting Notes - January 2026
[TEXT]: Attendees: John, Sarah, Mike
[TEXT]: Action items discussed below
[TABLE]: 3x4 at (50, 200)
[SHAPE]: circle at (400, 100)
[IMAGE]: at (20, 350), size: 300x200"""
        
        payload = {
            "message": "Can you summarize what's in my document?",
            "document_content": document_content
        }
        
        resp = session.post(f"{BASE_URL}/api/zeta/chat", json=payload)
        assert resp.status_code == 200, f"ZETA summary failed: {resp.text}"
        
        data = resp.json()
        assert len(data["response"]) > 10, "ZETA should provide a meaningful response"
        print("✓ ZETA can summarize document with various element types")


class TestToolEndpoints:
    """Test that tools endpoints are accessible (frontend tools are UI-only)"""
    
    def test_api_root(self):
        """Verify API is running"""
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        assert resp.json()["message"] == "ZET Mindshare API"
        print("✓ API root endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
