"""
Backend API Tests for ZET Mindshare
Tests: Auth, Documents CRUD, Notes CRUD, ZETA AI, Cloud Storage
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = "test_session_d260da24d7e1"
TEST_DOC_ID = "doc_test_001"


class TestRootAndHealth:
    """Root endpoint and health checks"""
    
    def test_root_endpoint(self):
        """Test API root returns proper response"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "ZET Mindshare API"
        assert "version" in data


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_auth_me_valid_session(self):
        """Test /auth/me returns user with valid session"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert data["user_id"] == "user_test_001"
        
    def test_auth_me_invalid_session(self):
        """Test /auth/me returns 401 with invalid session"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": "invalid_token_xyz"}
        )
        assert response.status_code == 401
        
    def test_auth_me_no_session(self):
        """Test /auth/me returns 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        
    def test_auth_bearer_token(self):
        """Test auth with Bearer token header"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "user_test_001"


class TestDocumentsCRUD:
    """Documents CRUD operations"""
    
    @pytest.fixture
    def session(self):
        s = requests.Session()
        s.cookies.set("session_token", TEST_SESSION_TOKEN)
        return s
    
    def test_get_documents_list(self, session):
        """Test listing all documents"""
        response = session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_single_document(self, session):
        """Test getting the test document"""
        response = session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["doc_id"] == TEST_DOC_ID
        assert "title" in data
        assert "pages" in data
        assert "content" in data
        
    def test_get_nonexistent_document(self, session):
        """Test getting a non-existent document returns 404"""
        response = session.get(f"{BASE_URL}/api/documents/doc_nonexistent_xyz")
        assert response.status_code == 404
        
    def test_create_and_delete_document(self, session):
        """Test creating a document and then deleting it"""
        # Create
        create_payload = {"title": "TEST_Pytest Doc", "doc_type": "document"}
        create_resp = session.post(f"{BASE_URL}/api/documents", json=create_payload)
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["title"] == "TEST_Pytest Doc"
        assert "doc_id" in created
        doc_id = created["doc_id"]
        
        # Verify GET works
        get_resp = session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "TEST_Pytest Doc"
        
        # Delete
        del_resp = session.delete(f"{BASE_URL}/api/documents/{doc_id}")
        assert del_resp.status_code == 200
        
        # Verify deleted
        verify_resp = session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert verify_resp.status_code == 404
        
    def test_update_document(self, session):
        """Test updating the test document"""
        update_payload = {"title": "Updated Test Document"}
        response = session.put(f"{BASE_URL}/api/documents/{TEST_DOC_ID}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Test Document"
        
        # Reset title for other tests
        session.put(f"{BASE_URL}/api/documents/{TEST_DOC_ID}", json={"title": "Test Document"})
        
    def test_update_document_pages(self, session):
        """Test updating document pages (for auto-save)"""
        # Get current state
        get_resp = session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}")
        doc = get_resp.json()
        
        # Update with new element in pages
        new_pages = doc.get("pages", [])
        if new_pages:
            new_pages[0]["elements"] = new_pages[0].get("elements", []) 
            new_pages[0]["elements"].append({
                "id": "el_test_123",
                "type": "text",
                "x": 100,
                "y": 100,
                "content": "Test text",
                "fontSize": 16
            })
        
        update_resp = session.put(
            f"{BASE_URL}/api/documents/{TEST_DOC_ID}",
            json={"pages": new_pages}
        )
        assert update_resp.status_code == 200
        
        # Verify persistence
        verify_resp = session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}")
        saved_pages = verify_resp.json().get("pages", [])
        found_test_el = any(
            el.get("id") == "el_test_123"
            for page in saved_pages
            for el in page.get("elements", [])
        )
        assert found_test_el, "Test element should be persisted"


class TestNotesCRUD:
    """Quick Notes CRUD operations"""
    
    @pytest.fixture
    def session(self):
        s = requests.Session()
        s.cookies.set("session_token", TEST_SESSION_TOKEN)
        return s
    
    def test_get_notes_list(self, session):
        """Test listing all notes"""
        response = session.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_create_and_delete_note(self, session):
        """Test creating and deleting a note"""
        # Create
        create_resp = session.post(f"{BASE_URL}/api/notes", json={"content": "TEST_Note content"})
        assert create_resp.status_code == 200
        created = create_resp.json()
        assert created["content"] == "TEST_Note content"
        note_id = created["note_id"]
        
        # Verify in list
        list_resp = session.get(f"{BASE_URL}/api/notes")
        notes = list_resp.json()
        assert any(n["note_id"] == note_id for n in notes)
        
        # Delete
        del_resp = session.delete(f"{BASE_URL}/api/notes/{note_id}")
        assert del_resp.status_code == 200


class TestZETAAI:
    """ZETA AI endpoints tests"""
    
    @pytest.fixture
    def session(self):
        s = requests.Session()
        s.cookies.set("session_token", TEST_SESSION_TOKEN)
        return s
    
    def test_zeta_chat(self, session):
        """Test ZETA chat endpoint"""
        payload = {
            "message": "Hello ZETA, what can you help me with?",
            "doc_id": TEST_DOC_ID
        }
        response = session.post(f"{BASE_URL}/api/zeta/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        
    def test_zeta_chat_with_session_id(self, session):
        """Test ZETA chat maintains session"""
        # First message
        resp1 = session.post(
            f"{BASE_URL}/api/zeta/chat",
            json={"message": "What tools are available?"}
        )
        session_id = resp1.json().get("session_id")
        
        # Second message with same session
        resp2 = session.post(
            f"{BASE_URL}/api/zeta/chat",
            json={"message": "Tell me more", "session_id": session_id}
        )
        assert resp2.status_code == 200


class TestCloudStorage:
    """Cloud storage mock endpoints"""
    
    @pytest.fixture
    def session(self):
        s = requests.Session()
        s.cookies.set("session_token", TEST_SESSION_TOKEN)
        return s
    
    def test_google_drive_list(self, session):
        """Test Google Drive list endpoint (mocked)"""
        response = session.get(f"{BASE_URL}/api/cloud/google-drive/files")
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "message" in data
        
    def test_google_drive_upload(self, session):
        """Test Google Drive upload endpoint (mocked)"""
        response = session.post(f"{BASE_URL}/api/cloud/google-drive/upload")
        assert response.status_code == 200
        
    def test_icloud_list(self, session):
        """Test iCloud list endpoint (mocked)"""
        response = session.get(f"{BASE_URL}/api/cloud/icloud/files")
        assert response.status_code == 200
        
    def test_icloud_upload(self, session):
        """Test iCloud upload endpoint (mocked)"""
        response = session.post(f"{BASE_URL}/api/cloud/icloud/upload")
        assert response.status_code == 200


class TestUnauthenticatedAccess:
    """Test endpoints reject unauthenticated requests"""
    
    def test_documents_requires_auth(self):
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 401
        
    def test_notes_requires_auth(self):
        response = requests.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 401
        
    def test_zeta_chat_requires_auth(self):
        response = requests.post(f"{BASE_URL}/api/zeta/chat", json={"message": "test"})
        assert response.status_code == 401
