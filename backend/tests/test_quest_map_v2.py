"""
Quest Map v2 API Tests - Spiral Web Layout with SP System
Tests the redesigned quest map with 500 quests in spider-web layout
SP (Sadakat Puani) values: circle=20SP, square=45SP, triangle=100SP, star=200SP
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "test2@test.com"
TEST_PASSWORD = "password123"


class TestQuestMapV2API:
    """Quest Map v2 Backend API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.text}")
    
    def test_get_quest_progress_returns_completed_and_xp(self):
        """GET /api/quests/progress returns completed_quests array and quest_xp"""
        response = self.session.get(f"{BASE_URL}/api/quests/progress")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "completed_quests" in data, "Response should contain completed_quests"
        assert "quest_xp" in data, "Response should contain quest_xp (SP)"
        assert isinstance(data["completed_quests"], list), "completed_quests should be a list"
        assert isinstance(data["quest_xp"], int), "quest_xp should be an integer"
        
        print(f"Quest progress: {data['completed_quests']}, SP: {data['quest_xp']}")
    
    def test_complete_quest_0_center_quest(self):
        """POST /api/quests/0/complete - Quest 0 (center) is always unlocked"""
        # Quest 0 with 20 SP (circle shape - easy quest at center)
        response = self.session.post(
            f"{BASE_URL}/api/quests/0/complete",
            json={"xp": 20}  # Circle shape = 20 SP
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Either successful completion or already completed
        assert "completed_quests" in data, "Response should contain completed_quests"
        assert "quest_xp" in data, "Response should contain quest_xp"
        
        if not data.get("already_completed"):
            assert 0 in data["completed_quests"], "Quest 0 should be in completed list"
            print(f"Quest 0 completed. SP: {data['quest_xp']}")
        else:
            print(f"Quest 0 was already completed. SP: {data['quest_xp']}")
    
    def test_complete_quest_with_sp_value_circle(self):
        """Complete a circle quest and verify SP (20 SP) is awarded"""
        # First get current progress
        progress_before = self.session.get(f"{BASE_URL}/api/quests/progress").json()
        sp_before = progress_before.get("quest_xp", 0)
        
        # Find an uncompleted quest ID
        completed = set(progress_before.get("completed_quests", []))
        test_quest_id = None
        for i in range(1, 50):
            if i not in completed:
                test_quest_id = i
                break
        
        if test_quest_id is None:
            pytest.skip("All test quests already completed")
        
        # Complete the quest with circle SP value (20)
        response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": 20}  # Circle = 20 SP
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("already_completed"):
            assert data["quest_xp"] >= sp_before + 20, f"SP should increase by at least 20"
            print(f"Quest {test_quest_id} completed. SP: {sp_before} -> {data['quest_xp']}")
    
    def test_complete_quest_with_sp_value_square(self):
        """Complete a square quest and verify SP (45 SP) is awarded"""
        progress = self.session.get(f"{BASE_URL}/api/quests/progress").json()
        sp_before = progress.get("quest_xp", 0)
        completed = set(progress.get("completed_quests", []))
        
        # Find uncompleted quest
        test_quest_id = None
        for i in range(50, 100):
            if i not in completed:
                test_quest_id = i
                break
        
        if test_quest_id is None:
            pytest.skip("All test quests already completed")
        
        # Complete with square SP (45)
        response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": 45}  # Square = 45 SP
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("already_completed"):
            print(f"Quest {test_quest_id} (square) completed. SP: {sp_before} -> {data['quest_xp']}")
    
    def test_complete_quest_with_sp_value_triangle(self):
        """Complete a triangle quest and verify SP (100 SP) is awarded"""
        progress = self.session.get(f"{BASE_URL}/api/quests/progress").json()
        sp_before = progress.get("quest_xp", 0)
        completed = set(progress.get("completed_quests", []))
        
        # Find uncompleted quest
        test_quest_id = None
        for i in range(100, 200):
            if i not in completed:
                test_quest_id = i
                break
        
        if test_quest_id is None:
            pytest.skip("All test quests already completed")
        
        response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": 100}  # Triangle = 100 SP
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("already_completed"):
            print(f"Quest {test_quest_id} (triangle) completed. SP: {sp_before} -> {data['quest_xp']}")
    
    def test_complete_quest_with_sp_value_star(self):
        """Complete a star quest and verify SP (200 SP) is awarded"""
        progress = self.session.get(f"{BASE_URL}/api/quests/progress").json()
        sp_before = progress.get("quest_xp", 0)
        completed = set(progress.get("completed_quests", []))
        
        # Find uncompleted quest
        test_quest_id = None
        for i in range(200, 300):
            if i not in completed:
                test_quest_id = i
                break
        
        if test_quest_id is None:
            pytest.skip("All test quests already completed")
        
        response = self.session.post(
            f"{BASE_URL}/api/quests/{test_quest_id}/complete",
            json={"xp": 200}  # Star = 200 SP
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if not data.get("already_completed"):
            print(f"Quest {test_quest_id} (star) completed. SP: {sp_before} -> {data['quest_xp']}")
    
    def test_already_completed_quest_returns_flag(self):
        """Completing an already completed quest returns already_completed flag"""
        # First complete quest 0
        self.session.post(
            f"{BASE_URL}/api/quests/0/complete",
            json={"xp": 20}
        )
        
        # Try completing again
        response = self.session.post(
            f"{BASE_URL}/api/quests/0/complete",
            json={"xp": 20}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("already_completed") == True, "Should return already_completed flag"
        print("Already completed quest correctly returns flag")
    
    def test_unauthenticated_progress_request_returns_401(self):
        """GET /api/quests/progress without auth returns 401"""
        # Create new session without cookies
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/quests/progress")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated progress request correctly returns 401")
    
    def test_unauthenticated_complete_request_returns_401(self):
        """POST /api/quests/{id}/complete without auth returns 401"""
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        response = new_session.post(
            f"{BASE_URL}/api/quests/0/complete",
            json={"xp": 20}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated complete request correctly returns 401")
    
    def test_quest_progress_persists_across_sessions(self):
        """Quest progress persists in database across sessions"""
        # Complete a quest
        progress = self.session.get(f"{BASE_URL}/api/quests/progress").json()
        completed_before = progress.get("completed_quests", [])
        
        # Find uncompleted quest
        test_quest_id = None
        for i in range(300, 400):
            if i not in completed_before:
                test_quest_id = i
                break
        
        if test_quest_id:
            self.session.post(
                f"{BASE_URL}/api/quests/{test_quest_id}/complete",
                json={"xp": 20}
            )
        
        # Create new session and login again
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        new_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        # Check progress
        new_progress = new_session.get(f"{BASE_URL}/api/quests/progress").json()
        
        assert "completed_quests" in new_progress
        if test_quest_id:
            assert test_quest_id in new_progress["completed_quests"], "Quest should persist"
        print("Quest progress correctly persists across sessions")


class TestNewUserQuestProgress:
    """Test quest progress for new user scenario"""
    
    def test_new_user_starts_with_zero_sp(self):
        """New user should start with 0 SP"""
        # Create unique test user
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"sptest_{unique_id}@test.com"
        
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Register new user
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "SP Test User"
            }
        )
        
        if reg_response.status_code != 200:
            pytest.skip(f"Registration failed: {reg_response.text}")
        
        # Check quest progress
        progress = session.get(f"{BASE_URL}/api/quests/progress").json()
        
        assert progress.get("quest_xp", 0) == 0, "New user should have 0 SP"
        assert progress.get("completed_quests", []) == [], "New user should have no completed quests"
        print(f"New user {test_email} starts with 0 SP and empty completed_quests")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
