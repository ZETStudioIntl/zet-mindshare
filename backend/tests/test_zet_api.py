"""
ZET Mindshare API Tests
Tests for: Auth, Documents, Notes, ZETA AI, Google Drive connect flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://brainstorm-canvas-1.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "ZET Mindshare API"
        print("✓ API health check passed")


class TestEmailAuth:
    """Email/Password authentication tests"""
    
    def test_register_new_user(self):
        """Register a new user via email"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"test_{unique_id}@example.com"
        password = "testpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": f"Test User {unique_id}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == email
        assert "session_token" in response.cookies or response.headers.get("set-cookie")
        print(f"✓ User registration passed: {email}")
        return email, password, response.cookies
    
    def test_register_duplicate_email_rejected(self):
        """Duplicate email registration should fail"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"dup_{unique_id}@example.com"
        password = "testpass123"
        
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Test User"
        })
        assert response1.status_code == 200
        
        # Duplicate registration should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Test User 2"
        })
        assert response2.status_code == 400
        print("✓ Duplicate email rejection passed")
    
    def test_login_success(self):
        """Login with valid credentials"""
        # First register
        unique_id = uuid.uuid4().hex[:8]
        email = f"login_{unique_id}@example.com"
        password = "testpass123"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Test Login User"
        })
        
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == email
        print("✓ Login success passed")
        return response.cookies
    
    def test_login_invalid_password(self):
        """Login with wrong password should fail"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"wrongpw_{unique_id}@example.com"
        password = "correctpass"
        
        # Register user
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Wrong PW User"
        })
        
        # Login with wrong password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print("✓ Invalid password rejection passed")
    
    def test_login_nonexistent_email(self):
        """Login with non-existent email should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"nonexistent_{uuid.uuid4().hex}@example.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401
        print("✓ Non-existent email rejection passed")


class TestDocuments:
    """Document CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authenticated session"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"doctest_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Doc Test User"
        })
        
        self.cookies = reg_response.cookies
        self.session = requests.Session()
        self.session.cookies.update(self.cookies)
    
    def test_get_documents_empty(self):
        """Get documents for new user should be empty"""
        response = self.session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Get documents passed")
    
    def test_create_document(self):
        """Create a new document"""
        response = self.session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_Document",
            "doc_type": "document"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "doc_id" in data
        assert data["title"] == "TEST_Document"
        assert "pages" in data
        print(f"✓ Create document passed: {data['doc_id']}")
        return data["doc_id"]
    
    def test_create_and_get_document(self):
        """Create document and verify it can be retrieved"""
        # Create
        create_response = self.session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_GetDoc",
            "doc_type": "document"
        })
        assert create_response.status_code == 200
        doc_id = create_response.json()["doc_id"]
        
        # Get
        get_response = self.session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["doc_id"] == doc_id
        assert data["title"] == "TEST_GetDoc"
        print("✓ Create and get document passed")
    
    def test_update_document(self):
        """Update document title"""
        # Create
        create_response = self.session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_Original",
            "doc_type": "document"
        })
        doc_id = create_response.json()["doc_id"]
        
        # Update
        update_response = self.session.put(f"{BASE_URL}/api/documents/{doc_id}", json={
            "title": "TEST_Updated"
        })
        assert update_response.status_code == 200
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert get_response.json()["title"] == "TEST_Updated"
        print("✓ Update document passed")
    
    def test_delete_document(self):
        """Delete a document"""
        # Create
        create_response = self.session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_ToDelete",
            "doc_type": "document"
        })
        doc_id = create_response.json()["doc_id"]
        
        # Delete
        delete_response = self.session.delete(f"{BASE_URL}/api/documents/{doc_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = self.session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert get_response.status_code == 404
        print("✓ Delete document passed")


class TestNotes:
    """Quick notes tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authenticated session"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"notetest_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Note Test User"
        })
        
        self.session = requests.Session()
        self.session.cookies.update(reg_response.cookies)
    
    def test_get_notes_empty(self):
        """Get notes for new user should be empty"""
        response = self.session.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print("✓ Get notes passed")
    
    def test_create_note(self):
        """Create a quick note"""
        response = self.session.post(f"{BASE_URL}/api/notes", json={
            "content": "TEST_This is a test note"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "note_id" in data
        assert data["content"] == "TEST_This is a test note"
        print("✓ Create note passed")
    
    def test_delete_note(self):
        """Delete a note"""
        # Create
        create_response = self.session.post(f"{BASE_URL}/api/notes", json={
            "content": "TEST_Note to delete"
        })
        note_id = create_response.json()["note_id"]
        
        # Delete
        delete_response = self.session.delete(f"{BASE_URL}/api/notes/{note_id}")
        assert delete_response.status_code == 200
        print("✓ Delete note passed")


class TestZetaAI:
    """ZETA AI chat endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authenticated session"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"zetaai_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "ZETA AI Test User"
        })
        
        self.session = requests.Session()
        self.session.cookies.update(reg_response.cookies)
    
    def test_zeta_chat_basic(self):
        """Test ZETA AI chat endpoint"""
        response = self.session.post(f"{BASE_URL}/api/zeta/chat", json={
            "message": "Hello, what tools are available?"
        }, timeout=30)
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"✓ ZETA chat passed: {data['response'][:100]}...")


class TestGoogleDrive:
    """Google Drive integration tests (mock mode)"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authenticated session"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"drivetest_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Drive Test User"
        })
        
        self.session = requests.Session()
        self.session.cookies.update(reg_response.cookies)
    
    def test_drive_status(self):
        """Check drive connection status"""
        response = self.session.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        print(f"✓ Drive status passed: connected={data['connected']}")
    
    def test_drive_connect_flow(self):
        """Test Google Drive OAuth connect initiation"""
        response = self.session.get(f"{BASE_URL}/api/drive/connect")
        
        # Should return authorization URL (mock or real OAuth)
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        print(f"✓ Drive connect flow passed: {data['authorization_url'][:50]}...")


class TestChartCreation:
    """Test chart creation data validation (chart endpoint is client-side)"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authenticated session"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"charttest_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Chart Test User"
        })
        
        self.session = requests.Session()
        self.session.cookies.update(reg_response.cookies)
    
    def test_document_with_chart_content(self):
        """Create document and update with chart content"""
        # Create document
        create_response = self.session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_Chart Document",
            "doc_type": "document"
        })
        assert create_response.status_code == 200
        doc_id = create_response.json()["doc_id"]
        
        # Update with chart element in pages
        chart_content = {
            "pages": [{
                "page_id": "page_1",
                "elements": [{
                    "id": "chart_1",
                    "type": "chart",
                    "chartType": "bar",
                    "x": 50,
                    "y": 50,
                    "width": 400,
                    "height": 300
                }]
            }]
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/documents/{doc_id}", json=chart_content)
        assert update_response.status_code == 200
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/documents/{doc_id}")
        data = get_response.json()
        assert len(data["pages"]) > 0
        print("✓ Document with chart content passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
