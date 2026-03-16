"""
Test Deep Analysis API endpoint
- Tests the /api/zeta/deep-analysis endpoint
- Verifies it returns sources array with title/url fields
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDeepAnalysis:
    """Deep Analysis API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testcredit@test.com", "password": "test1234"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"Logged in successfully")
        
    def test_deep_analysis_endpoint_returns_expected_fields(self):
        """Test that deep-analysis endpoint returns expected structure"""
        response = self.session.post(
            f"{BASE_URL}/api/zeta/deep-analysis",
            json={"topic": "Machine Learning"}
        )
        
        # Due to credit constraints, might get 402 or 200
        if response.status_code == 402:
            pytest.skip("Insufficient credits for deep analysis test")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields exist
        assert "success" in data, "Response should have 'success' field"
        assert "analysis" in data, "Response should have 'analysis' field"
        assert "sources_found" in data, "Response should have 'sources_found' field"
        assert "sources" in data, "Response should have 'sources' field"
        assert "search_queries" in data, "Response should have 'search_queries' field"
        
        # Sources should be a list
        assert isinstance(data["sources"], list), "Sources should be a list"
        
        # If sources exist, verify structure
        if len(data["sources"]) > 0:
            source = data["sources"][0]
            assert "title" in source, "Source should have 'title' field"
            assert "url" in source, "Source should have 'url' field"
            assert "snippet" in source, "Source should have 'snippet' field"
            print(f"Source structure verified: {source}")
        else:
            print("Note: DuckDuckGo API returned 0 sources (API limitation for complex queries)")
        
        print(f"Deep analysis completed. Sources found: {data['sources_found']}")
        
    def test_deep_analysis_requires_topic(self):
        """Test that deep-analysis requires a topic"""
        response = self.session.post(
            f"{BASE_URL}/api/zeta/deep-analysis",
            json={}
        )
        
        # Should fail validation
        assert response.status_code in [400, 422], f"Expected 400/422 for missing topic, got {response.status_code}"
        
    def test_deep_analysis_requires_auth(self):
        """Test that deep-analysis requires authentication"""
        # New session without login
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        response = new_session.post(
            f"{BASE_URL}/api/zeta/deep-analysis",
            json={"topic": "Test"}
        )
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"


class TestTurkishCharacters:
    """Test Turkish character support in API responses"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testcredit@test.com", "password": "test1234"}
        )
        assert login_response.status_code == 200
        
    def test_subscription_api_returns_correctly(self):
        """Test subscription API works correctly"""
        response = self.session.get(f"{BASE_URL}/api/subscription")
        assert response.status_code == 200
        
        data = response.json()
        assert "plan" in data
        print(f"User plan: {data['plan']}")
        
    def test_documents_api(self):
        """Test documents API works correctly"""
        response = self.session.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Documents count: {len(data)}")
        
    def test_zeta_chat_with_turkish_topic(self):
        """Test ZETA chat can handle Turkish characters in topic"""
        response = self.session.post(
            f"{BASE_URL}/api/zeta/chat",
            json={
                "message": "Türkiye'de yapay zeka sektörü hakkında bilgi ver",
                "document_id": None
            }
        )
        
        # May fail due to credits but check for Turkish char handling
        if response.status_code == 402:
            pytest.skip("Insufficient credits")
            
        assert response.status_code == 200, f"Chat failed: {response.status_code}"
        
        data = response.json()
        assert "response" in data or "message" in data
        print("Turkish characters handled in chat request")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
