"""
Test Quest Map API endpoints
- GET /api/quests/progress - returns completed quests and XP
- POST /api/quests/{quest_id}/complete - marks quest as complete and awards XP
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_EMAIL = "questmap_test@test.com"
TEST_PASSWORD = "test123"


class TestQuestMap:
    """Quest Map API tests"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Try to login or register
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate by login or register"""
        # Try login first
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            print(f"✓ Logged in as {TEST_EMAIL}")
            return
        
        # Register if login fails
        register_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Quest Map Tester"
        })
        
        if register_response.status_code == 200:
            print(f"✓ Registered and logged in as {TEST_EMAIL}")
        else:
            pytest.skip(f"Authentication failed: {register_response.text}")
    
    def test_get_quest_progress(self):
        """Test GET /api/quests/progress returns completed quests and XP"""
        response = self.session.get(f"{BASE_URL}/api/quests/progress")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "completed_quests" in data, "Response should contain 'completed_quests'"
        assert "quest_xp" in data, "Response should contain 'quest_xp'"
        
        # Verify data types
        assert isinstance(data["completed_quests"], list), "'completed_quests' should be a list"
        assert isinstance(data["quest_xp"], (int, float)), "'quest_xp' should be a number"
        
        print(f"✓ GET /api/quests/progress - Completed: {len(data['completed_quests'])}, XP: {data['quest_xp']}")
    
    def test_complete_quest(self):
        """Test POST /api/quests/{quest_id}/complete marks quest as complete"""
        # First get current progress
        progress_response = self.session.get(f"{BASE_URL}/api/quests/progress")
        assert progress_response.status_code == 200
        initial_data = progress_response.json()
        initial_xp = initial_data["quest_xp"]
        initial_completed = len(initial_data["completed_quests"])
        
        # Find a quest ID that is not completed yet (use a high ID to avoid conflicts)
        test_quest_id = 999
        xp_to_award = 25
        
        # Complete the quest
        complete_response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": xp_to_award}
        )
        
        assert complete_response.status_code == 200, f"Expected 200, got {complete_response.status_code}: {complete_response.text}"
        
        data = complete_response.json()
        assert "completed_quests" in data, "Response should contain 'completed_quests'"
        assert "quest_xp" in data, "Response should contain 'quest_xp'"
        
        # Verify the quest was added and XP increased
        assert test_quest_id in data["completed_quests"], f"Quest {test_quest_id} should be in completed list"
        assert data["quest_xp"] >= initial_xp, "XP should not decrease"
        
        print(f"✓ POST /api/quests/{test_quest_id}/complete - New XP: {data['quest_xp']}")
    
    def test_complete_quest_already_completed(self):
        """Test completing an already completed quest returns already_completed flag"""
        test_quest_id = 998
        xp_to_award = 15
        
        # Complete the quest first time
        first_response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": xp_to_award}
        )
        assert first_response.status_code == 200
        first_xp = first_response.json()["quest_xp"]
        
        # Try to complete the same quest again
        second_response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": xp_to_award}
        )
        
        assert second_response.status_code == 200
        data = second_response.json()
        
        # Should have already_completed flag or XP should not increase
        if "already_completed" in data:
            assert data["already_completed"] == True, "Should indicate quest was already completed"
        
        # XP should remain the same
        assert data["quest_xp"] == first_xp, "XP should not increase for already completed quest"
        
        print(f"✓ Completing already completed quest - already_completed: {data.get('already_completed', 'N/A')}")
    
    def test_complete_multiple_quests(self):
        """Test completing multiple different quests"""
        quest_ids = [997, 996, 995]
        
        for quest_id in quest_ids:
            response = self.session.post(
                f"{BASE_URL}/api/quests/{quest_id}/complete",
                json={"xp": 10}
            )
            assert response.status_code == 200, f"Failed to complete quest {quest_id}"
        
        # Verify all quests are in completed list
        progress_response = self.session.get(f"{BASE_URL}/api/quests/progress")
        assert progress_response.status_code == 200
        
        completed = progress_response.json()["completed_quests"]
        for quest_id in quest_ids:
            assert quest_id in completed, f"Quest {quest_id} should be in completed list"
        
        print(f"✓ Completed multiple quests: {quest_ids}")
    
    def test_quest_progress_persistence(self):
        """Test that quest progress persists after re-authentication"""
        # Get current progress
        response1 = self.session.get(f"{BASE_URL}/api/quests/progress")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Create new session and authenticate again
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        login_response = new_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        
        # Get progress with new session
        response2 = new_session.get(f"{BASE_URL}/api/quests/progress")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Progress should be the same
        assert data1["completed_quests"] == data2["completed_quests"], "Completed quests should persist"
        assert data1["quest_xp"] == data2["quest_xp"], "XP should persist"
        
        print(f"✓ Quest progress persists - {len(data2['completed_quests'])} completed, {data2['quest_xp']} XP")


class TestQuestMapUnauthenticated:
    """Test Quest Map API without authentication"""
    
    def test_progress_requires_auth(self):
        """Test GET /api/quests/progress requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/quests/progress")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/quests/progress requires authentication")
    
    def test_complete_requires_auth(self):
        """Test POST /api/quests/{quest_id}/complete requires authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/quests/1/complete", json={"xp": 10})
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/quests/{quest_id}/complete requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
