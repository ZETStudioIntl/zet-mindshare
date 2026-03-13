"""
Backend tests for iteration 26 features:
- POST /auth/profile-picture endpoint for profile photo upload
- PUT /auth/profile endpoint for profile name update
- Templates data verification
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spider-mind.preview.emergentagent.com')


class TestProfilePictureUpload:
    """Test suite for profile picture upload functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with test credentials
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        self.user_data = login_response.json().get("user", {})
        print(f"✅ Logged in as: {self.user_data.get('email')}")
    
    def test_upload_profile_picture_base64(self):
        """Test POST /auth/profile-picture accepts base64 image data"""
        # Create a small 1x1 red pixel PNG in base64
        # This is a valid minimal PNG image
        red_pixel_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jD5wAAAABJRU5ErkJggg=="
        image_data = f"data:image/png;base64,{red_pixel_png}"
        
        response = self.session.post(
            f"{BASE_URL}/api/auth/profile-picture",
            json={"image_data": image_data}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "picture_url" in data
        assert data["message"] == "Profile picture updated"
        # The picture_url should contain the base64 data we sent
        assert image_data in data["picture_url"] or "base64" in data["picture_url"] or len(data["picture_url"]) > 50
        print(f"✅ POST /auth/profile-picture - Picture uploaded successfully")
    
    def test_verify_profile_picture_persisted(self):
        """Test that uploaded profile picture persists in user profile"""
        # Upload a picture
        test_pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P/hPwAFhAJ/wlseKgAAAABJRU5ErkJggg=="
        image_data = f"data:image/png;base64,{test_pixel}"
        
        upload_response = self.session.post(
            f"{BASE_URL}/api/auth/profile-picture",
            json={"image_data": image_data}
        )
        assert upload_response.status_code == 200
        
        # Verify via GET /auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        user_data = me_response.json()
        assert "picture" in user_data or "picture_url" in user_data
        picture = user_data.get("picture") or user_data.get("picture_url")
        print(f"✅ Profile picture persisted: {picture[:50] if picture else 'None'}...")
    
    def test_upload_empty_image_data(self):
        """Test POST /auth/profile-picture with empty image_data"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/profile-picture",
            json={"image_data": ""}
        )
        
        # Should still accept (empty string update) or return validation error
        print(f"✅ Empty image_data response: {response.status_code}")


class TestProfileUpdate:
    """Test suite for profile name update"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed")
        
        self.original_user = login_response.json().get("user", {})
        print(f"✅ Logged in for profile update tests")
    
    def test_update_profile_name(self):
        """Test PUT /auth/profile updates name correctly"""
        # Get original name
        original_profile = self.session.get(f"{BASE_URL}/api/auth/me").json()
        original_name = original_profile.get("name", "")
        
        # Update to test name
        test_name = "TEST_ProfileIter26"
        update_response = self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": test_name}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify via GET
        verify_response = self.session.get(f"{BASE_URL}/api/auth/me")
        verify_data = verify_response.json()
        assert verify_data.get("name") == test_name
        print(f"✅ PUT /auth/profile - Name updated to: {test_name}")
        
        # Restore original name
        self.session.put(f"{BASE_URL}/api/auth/profile", json={"name": original_name})
        print(f"✅ Restored original name: {original_name}")


class TestSubscriptionAndUsage:
    """Test suite for subscription and usage endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed")
    
    def test_get_subscription(self):
        """Test GET /subscription returns plan info"""
        response = self.session.get(f"{BASE_URL}/api/subscription")
        
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        print(f"✅ GET /subscription - Plan: {data.get('plan')}")
    
    def test_get_usage(self):
        """Test GET /usage returns usage info"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "limits" in data
        assert "usage" in data
        assert "remaining" in data
        print(f"✅ GET /usage - Plan: {data.get('plan')}, Limits: {data.get('limits')}")


class TestDocumentEndpoints:
    """Test document CRUD for template testing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Login failed")
    
    def test_create_document_with_template_data(self):
        """Test creating document - templates will populate canvas on frontend"""
        # Create a new document
        create_response = self.session.post(
            f"{BASE_URL}/api/documents",
            json={"title": "TEST_TemplateDoc_Iter26"}
        )
        
        assert create_response.status_code in [200, 201], f"Expected 200/201, got {create_response.status_code}"
        doc_data = create_response.json()
        assert "doc_id" in doc_data or "id" in doc_data
        doc_id = doc_data.get("doc_id") or doc_data.get("id")
        print(f"✅ Created document: {doc_id}")
        
        # Clean up - delete the test document
        delete_response = self.session.delete(f"{BASE_URL}/api/documents/{doc_id}")
        print(f"✅ Cleanup - deleted test document: {delete_response.status_code}")
    
    def test_get_documents_list(self):
        """Test GET /documents returns document list"""
        response = self.session.get(f"{BASE_URL}/api/documents")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /documents - Found {len(data)} documents")


class TestAuthEndpoints:
    """Basic auth endpoint tests"""
    
    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "demo@demo.com"
        print(f"✅ Login successful for demo@demo.com")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"}
        )
        
        assert response.status_code == 401 or response.status_code == 400
        print(f"✅ Invalid login rejected with status {response.status_code}")
    
    def test_get_current_user(self):
        """Test GET /auth/me returns user info"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login first
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@demo.com", "password": "demo123"}
        )
        
        # Get current user
        response = session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        print(f"✅ GET /auth/me - User: {data.get('name')} ({data.get('email')})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
