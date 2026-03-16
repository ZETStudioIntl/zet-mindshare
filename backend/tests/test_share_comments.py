"""
Test Share and Comment API endpoints for ZET Mindshare Editor
Testing: Share link creation/revocation, Comments CRUD, Shared document access
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test2@test.com"
TEST_PASSWORD = "password123"
TEST_DOC_ID = "doc_83a776d30cd3"
EXISTING_SHARE_ID = "share_aa7ddfa2c22b"


class TestShareCommentAPIs:
    """Test Share and Comment endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get cookie auth
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip(f"Authentication failed: {login_res.status_code}")
    
    # ============ SHARE LINK TESTS ============
    
    def test_create_share_link_view(self):
        """POST /api/documents/{doc_id}/share - Create view-only share link"""
        response = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/share", json={
            "permission": "view"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "share_id" in data, "Response should contain share_id"
        assert data["permission"] == "view", "Permission should be 'view'"
        assert data["share_id"].startswith("share_"), "Share ID should start with 'share_'"
        
        # Store for later tests
        self.created_share_id_view = data["share_id"]
        print(f"Created view share link: {data['share_id']}")
    
    def test_create_share_link_edit(self):
        """POST /api/documents/{doc_id}/share - Create editable share link"""
        response = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/share", json={
            "permission": "edit"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "share_id" in data
        assert data["permission"] == "edit", "Permission should be 'edit'"
        print(f"Created edit share link: {data['share_id']}")
    
    def test_get_share_links(self):
        """GET /api/documents/{doc_id}/shares - Get all share links for document"""
        response = self.session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/shares")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} share links for document")
        
        if len(data) > 0:
            # Validate structure of share link
            share = data[0]
            assert "share_id" in share, "Share should have share_id"
            assert "permission" in share, "Share should have permission"
            assert "doc_id" in share, "Share should have doc_id"
    
    def test_get_shared_document_public(self):
        """GET /api/shared/{share_id} - Access shared document without auth"""
        # Use a fresh session without auth
        public_session = requests.Session()
        response = public_session.get(f"{BASE_URL}/api/shared/{EXISTING_SHARE_ID}")
        
        # Could be 200 if exists, 404 if not found
        if response.status_code == 200:
            data = response.json()
            assert "document" in data, "Response should contain document"
            assert "permission" in data, "Response should contain permission"
            assert "viewer" in data, "Response should contain viewer info"
            print(f"Shared document accessible with permission: {data['permission']}")
        elif response.status_code == 404:
            print(f"Share link {EXISTING_SHARE_ID} not found or inactive")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_revoke_share_link(self):
        """DELETE /api/share/{share_id} - Revoke a share link"""
        # First create a share to revoke
        create_res = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/share", json={
            "permission": "view"
        })
        assert create_res.status_code == 200
        share_id = create_res.json()["share_id"]
        
        # Now revoke it
        response = self.session.delete(f"{BASE_URL}/api/share/{share_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "revoked", "Status should be 'revoked'"
        print(f"Revoked share link: {share_id}")
        
        # Verify it's no longer accessible
        public_session = requests.Session()
        verify_res = public_session.get(f"{BASE_URL}/api/shared/{share_id}")
        assert verify_res.status_code == 404, "Revoked share should return 404"
    
    # ============ COMMENT TESTS ============
    
    def test_create_comment(self):
        """POST /api/documents/{doc_id}/comments - Add a comment"""
        response = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/comments", json={
            "content": "TEST_comment_from_pytest",
            "element_id": None,
            "page_index": 0
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "comment_id" in data, "Response should contain comment_id"
        assert data["content"] == "TEST_comment_from_pytest"
        assert data["comment_id"].startswith("cmt_")
        assert data["resolved"] == False
        
        self.test_comment_id = data["comment_id"]
        print(f"Created comment: {data['comment_id']}")
        return data["comment_id"]
    
    def test_get_comments(self):
        """GET /api/documents/{doc_id}/comments - Get all comments"""
        response = self.session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/comments")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} comments for document")
        
        if len(data) > 0:
            comment = data[0]
            assert "comment_id" in comment
            assert "content" in comment
            assert "user_name" in comment
    
    def test_reply_to_comment(self):
        """POST /api/comments/{comment_id}/reply - Reply to a comment"""
        # First create a comment
        create_res = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/comments", json={
            "content": "TEST_parent_comment_for_reply",
            "element_id": None,
            "page_index": 0
        })
        assert create_res.status_code == 200
        comment_id = create_res.json()["comment_id"]
        
        # Now reply to it
        response = self.session.post(f"{BASE_URL}/api/comments/{comment_id}/reply", json={
            "content": "TEST_reply_to_comment"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "reply_id" in data, "Response should contain reply_id"
        assert data["content"] == "TEST_reply_to_comment"
        print(f"Created reply: {data['reply_id']} to comment: {comment_id}")
    
    def test_resolve_comment(self):
        """PUT /api/comments/{comment_id}/resolve - Mark comment as resolved"""
        # First create a comment
        create_res = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/comments", json={
            "content": "TEST_comment_to_resolve",
            "element_id": None,
            "page_index": 0
        })
        assert create_res.status_code == 200
        comment_id = create_res.json()["comment_id"]
        
        # Resolve it
        response = self.session.put(f"{BASE_URL}/api/comments/{comment_id}/resolve")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "resolved"
        print(f"Resolved comment: {comment_id}")
    
    def test_delete_comment(self):
        """DELETE /api/comments/{comment_id} - Delete a comment"""
        # First create a comment
        create_res = self.session.post(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/comments", json={
            "content": "TEST_comment_to_delete",
            "element_id": None,
            "page_index": 0
        })
        assert create_res.status_code == 200
        comment_id = create_res.json()["comment_id"]
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/comments/{comment_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"Deleted comment: {comment_id}")
    
    # ============ ONLINE USERS TEST ============
    
    def test_get_online_users(self):
        """GET /api/documents/{doc_id}/online - Get online users count"""
        response = self.session.get(f"{BASE_URL}/api/documents/{TEST_DOC_ID}/online")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "users" in data
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"Online users: {data['count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
