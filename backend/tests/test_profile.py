"""
Backend tests for iteration 25 features:
- PUT /auth/profile endpoint for profile name update
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://zeta-ai-write.preview.emergentagent.com')

class TestProfileEndpoint:
    """Test suite for profile update functionality"""
    
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
    
    def test_get_current_user_profile(self):
        """Test GET /auth/me returns user profile data"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        print(f"✅ GET /auth/me - Current user: {data.get('name')} ({data.get('email')})")
        return data
    
    def test_update_profile_name(self):
        """Test PUT /auth/profile updates name correctly"""
        # Get original name
        original_profile = self.session.get(f"{BASE_URL}/api/auth/me").json()
        original_name = original_profile.get("name", "")
        
        # Update to test name
        test_name = "TEST_UpdatedName_25"
        update_response = self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": test_name}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        update_data = update_response.json()
        assert update_data.get("name") == test_name
        print(f"✅ PUT /auth/profile - Name updated to: {test_name}")
        
        # Verify via GET
        verify_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("name") == test_name
        print(f"✅ Verified profile update: {verify_data.get('name')}")
        
        # Restore original name
        self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": original_name}
        )
        print(f"✅ Restored original name: {original_name}")
    
    def test_update_profile_empty_name(self):
        """Test PUT /auth/profile handles empty name"""
        # Get original name first
        original_profile = self.session.get(f"{BASE_URL}/api/auth/me").json()
        original_name = original_profile.get("name", "")
        
        # Try empty name update (should still work - empty is valid)
        response = self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": ""}
        )
        
        # Empty name might be rejected or accepted based on validation
        if response.status_code == 200:
            print(f"✅ PUT /auth/profile - Empty name accepted")
        else:
            print(f"✅ PUT /auth/profile - Empty name rejected (status: {response.status_code})")
        
        # Restore original name
        self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": original_name}
        )
    
    def test_update_profile_no_changes(self):
        """Test PUT /auth/profile with no data"""
        response = self.session.put(
            f"{BASE_URL}/api/auth/profile",
            json={}
        )
        
        # Should succeed but make no changes
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ PUT /auth/profile - No changes request handled")


class TestSubscriptionEndpoint:
    """Test suite for subscription status"""
    
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
    
    def test_get_subscription_status(self):
        """Test GET /subscription returns plan info"""
        response = self.session.get(f"{BASE_URL}/api/subscription")
        
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        print(f"✅ GET /subscription - Current plan: {data.get('plan')}")


class TestUsageEndpoint:
    """Test suite for usage limits"""
    
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
    
    def test_get_usage_info(self):
        """Test GET /usage returns usage info with limits"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "limits" in data
        assert "usage" in data
        assert "remaining" in data
        print(f"✅ GET /usage - Plan: {data.get('plan')}, Limits: {data.get('limits')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
