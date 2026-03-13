"""
ZET Mindshare API Tests - Iteration 21
Testing: Auth, Documents, Notes, Subscription endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://brainstorm-hub-386.preview.emergentagent.com')

class TestHealthAndRoot:
    """API root endpoint tests"""
    
    def test_api_root(self):
        """Test API root returns valid response"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "ZET Mindshare API"
        print(f"API Root: {data}")


class TestEmailAuth:
    """Email authentication tests"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create test user credentials"""
        return {
            "email": f"test_iter21_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "testpass123",
            "name": "Test User 21"
        }
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session"""
        return requests.Session()
    
    def test_register_new_user(self, session, test_user):
        """Test user registration"""
        response = session.post(f"{BASE_URL}/api/auth/register", json=test_user)
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        print(f"Registered user: {data['user']['email']}")
        # Store user_id for later tests
        test_user["user_id"] = data["user"]["user_id"]
    
    def test_login_existing_user(self, session, test_user):
        """Test user login with registered email"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user["email"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]
        print(f"Logged in user: {data['user']['email']}")
    
    def test_login_wrong_password(self, session, test_user):
        """Test login with wrong password"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user["email"],
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Wrong password correctly rejected")
    
    def test_get_me_authenticated(self, session, test_user):
        """Test get current user when authenticated"""
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user["email"]
        print(f"Current user: {data}")


class TestDocuments:
    """Document CRUD tests"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_docs_{datetime.now().strftime('%H%M%S')}@example.com"
        # Register
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Docs Tester"
        })
        return session
    
    @pytest.fixture(scope="class")
    def created_doc(self, authenticated_session):
        """Create a test document"""
        response = authenticated_session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_Document_Iter21",
            "doc_type": "document"
        })
        assert response.status_code == 200
        return response.json()
    
    def test_create_document(self, authenticated_session):
        """Test document creation"""
        response = authenticated_session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_New_Document",
            "doc_type": "document"
        })
        assert response.status_code == 200
        data = response.json()
        assert "doc_id" in data
        assert data["title"] == "TEST_New_Document"
        print(f"Created document: {data['doc_id']}")
    
    def test_get_documents_list(self, authenticated_session, created_doc):
        """Test getting documents list"""
        response = authenticated_session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} documents")
    
    def test_get_single_document(self, authenticated_session, created_doc):
        """Test getting single document"""
        doc_id = created_doc["doc_id"]
        response = authenticated_session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["doc_id"] == doc_id
        print(f"Retrieved document: {data['title']}")
    
    def test_update_document(self, authenticated_session, created_doc):
        """Test updating document"""
        doc_id = created_doc["doc_id"]
        response = authenticated_session.put(f"{BASE_URL}/api/documents/{doc_id}", json={
            "title": "TEST_Updated_Document"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Updated_Document"
        print(f"Updated document title: {data['title']}")
    
    def test_update_document_pages(self, authenticated_session, created_doc):
        """Test updating document with pages"""
        doc_id = created_doc["doc_id"]
        pages_data = [
            {"page_id": "page_1", "elements": [{"type": "text", "content": "Test"}], "drawPaths": []},
            {"page_id": "page_2", "elements": [], "drawPaths": []}
        ]
        response = authenticated_session.put(f"{BASE_URL}/api/documents/{doc_id}", json={
            "pages": pages_data
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["pages"]) == 2
        print(f"Updated document with {len(data['pages'])} pages")
    
    def test_delete_document(self, authenticated_session):
        """Test deleting document"""
        # Create a document to delete
        create_response = authenticated_session.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_To_Delete"
        })
        doc_id = create_response.json()["doc_id"]
        
        # Delete it
        response = authenticated_session.delete(f"{BASE_URL}/api/documents/{doc_id}")
        assert response.status_code == 200
        
        # Verify it's gone
        get_response = authenticated_session.get(f"{BASE_URL}/api/documents/{doc_id}")
        assert get_response.status_code == 404
        print(f"Deleted document: {doc_id}")


class TestNotes:
    """Quick notes with reminders tests"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_notes_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Notes Tester"
        })
        return session
    
    def test_create_note_without_reminder(self, authenticated_session):
        """Test creating note without reminder"""
        response = authenticated_session.post(f"{BASE_URL}/api/notes", json={
            "content": "TEST_Note without reminder"
        })
        assert response.status_code == 200
        data = response.json()
        assert "note_id" in data
        assert data["content"] == "TEST_Note without reminder"
        print(f"Created note: {data['note_id']}")
    
    def test_create_note_with_reminder(self, authenticated_session):
        """Test creating note with reminder"""
        reminder_time = (datetime.now() + timedelta(hours=1)).isoformat()
        response = authenticated_session.post(f"{BASE_URL}/api/notes", json={
            "content": "TEST_Note with reminder",
            "reminder_time": reminder_time
        })
        assert response.status_code == 200
        data = response.json()
        assert data["reminder_time"] == reminder_time
        assert data["reminder_sent"] == False
        print(f"Created note with reminder: {data['reminder_time']}")
    
    def test_get_notes_list(self, authenticated_session):
        """Test getting notes list"""
        response = authenticated_session.get(f"{BASE_URL}/api/notes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} notes")
    
    def test_get_due_reminders(self, authenticated_session):
        """Test getting due reminders"""
        response = authenticated_session.get(f"{BASE_URL}/api/notes/reminders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} due reminders")
    
    def test_delete_note(self, authenticated_session):
        """Test deleting note"""
        # Create a note to delete
        create_response = authenticated_session.post(f"{BASE_URL}/api/notes", json={
            "content": "TEST_To_Delete"
        })
        note_id = create_response.json()["note_id"]
        
        # Delete it
        response = authenticated_session.delete(f"{BASE_URL}/api/notes/{note_id}")
        assert response.status_code == 200
        print(f"Deleted note: {note_id}")


class TestSubscription:
    """Subscription management tests"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_sub_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Sub Tester"
        })
        return session
    
    def test_get_subscription_free_default(self, authenticated_session):
        """Test that new users have free plan"""
        response = authenticated_session.get(f"{BASE_URL}/api/subscription")
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "free"
        print(f"Default subscription: {data['plan']}")
    
    def test_subscribe_to_plus(self, authenticated_session):
        """Test subscribing to plus plan"""
        response = authenticated_session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "plus",
            "action": "subscribe"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "plus"
        print(f"Subscribed to: {data['plan']}")
    
    def test_verify_subscription_updated(self, authenticated_session):
        """Test that subscription was updated"""
        response = authenticated_session.get(f"{BASE_URL}/api/subscription")
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "plus"
        print(f"Verified subscription: {data['plan']}")
    
    def test_request_cancel_subscription(self, authenticated_session):
        """Test requesting subscription cancellation (sends email)"""
        response = authenticated_session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "free",
            "action": "cancel"
        })
        assert response.status_code == 200
        data = response.json()
        # Should have cancel_pending flag
        assert "cancel_pending" in data
        print(f"Cancellation requested, pending: {data.get('cancel_pending')}")


class TestUsageLimits:
    """Usage limits and tracking tests"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_usage_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Usage Tester"
        })
        return session
    
    def test_get_usage_stats(self, authenticated_session):
        """Test getting usage statistics"""
        response = authenticated_session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "limits" in data
        assert "usage" in data
        assert "remaining" in data
        print(f"Usage stats: plan={data['plan']}, limits={data['limits']}")


class TestDriveIntegration:
    """Google Drive integration tests (MOCKED)"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_drive_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Drive Tester"
        })
        return session
    
    def test_drive_status_not_connected(self, authenticated_session):
        """Test Drive status when not connected"""
        response = authenticated_session.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        # New user should not be connected
        print(f"Drive connected: {data['connected']}")


class TestZetaAI:
    """ZETA AI assistant tests"""
    
    @pytest.fixture(scope="class")
    def authenticated_session(self):
        """Create and login a test user"""
        session = requests.Session()
        email = f"test_zeta_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "ZETA Tester"
        })
        return session
    
    def test_zeta_chat_simple(self, authenticated_session):
        """Test ZETA chat with simple message"""
        response = authenticated_session.post(f"{BASE_URL}/api/zeta/chat", json={
            "message": "Hello, what can you do?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"ZETA response length: {len(data['response'])} chars")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
