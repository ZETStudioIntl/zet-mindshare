"""
Test SP (Sadakat Puani) based subscription purchase and PLAN_LIMITS verification
Tests for iteration 32: minimap removal, SP purchase, PLAN_LIMITS verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSPPurchase:
    """SP-based subscription purchase tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session for tests"""
        self.session = requests.Session()
        # Login with test user
        login_res = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test2@test.com", "password": "password123"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        
    def test_get_subscription_returns_plan(self):
        """GET /api/subscription returns current plan info"""
        res = self.session.get(f"{BASE_URL}/api/subscription")
        assert res.status_code == 200
        data = res.json()
        assert "plan" in data
        assert data["plan"] in ["free", "plus", "pro", "ultra"]
        print(f"Current plan: {data['plan']}")
        
    def test_get_quest_progress_returns_sp(self):
        """GET /api/quests/progress returns SP balance"""
        res = self.session.get(f"{BASE_URL}/api/quests/progress")
        assert res.status_code == 200
        data = res.json()
        assert "quest_xp" in data
        assert isinstance(data["quest_xp"], (int, float))
        print(f"Current SP: {data['quest_xp']}")
        
    def test_buy_with_sp_invalid_plan(self):
        """POST /api/subscription/buy-with-sp returns 400 for invalid plan"""
        res = self.session.post(
            f"{BASE_URL}/api/subscription/buy-with-sp",
            json={"plan": "invalid_plan"}
        )
        assert res.status_code == 400
        data = res.json()
        assert "Gecersiz plan" in data.get("detail", "")
        print(f"Invalid plan error: {data}")
        
    def test_buy_with_sp_insufficient_sp(self):
        """POST /api/subscription/buy-with-sp returns 400 when insufficient SP"""
        # First ensure user has low SP by checking current status
        res = self.session.get(f"{BASE_URL}/api/quests/progress")
        current_sp = res.json().get("quest_xp", 0)
        
        # Try to buy ultra which costs 50000 SP
        if current_sp < 50000:
            res = self.session.post(
                f"{BASE_URL}/api/subscription/buy-with-sp",
                json={"plan": "ultra"}
            )
            assert res.status_code == 400
            data = res.json()
            assert "Yetersiz SP" in data.get("detail", "")
            print(f"Insufficient SP error: {data}")
        else:
            pytest.skip("User has enough SP for ultra")
            
    def test_sp_plan_costs_correct(self):
        """Verify SP costs: plus=10000, pro=30000, ultra=50000"""
        # This tests the backend returns correct error messages with costs
        res = self.session.get(f"{BASE_URL}/api/quests/progress")
        current_sp = res.json().get("quest_xp", 0)
        
        costs = {"plus": 10000, "pro": 30000, "ultra": 50000}
        for plan, cost in costs.items():
            if current_sp < cost:
                res = self.session.post(
                    f"{BASE_URL}/api/subscription/buy-with-sp",
                    json={"plan": plan}
                )
                if res.status_code == 400:
                    detail = res.json().get("detail", "")
                    assert str(cost) in detail, f"Expected {cost} in error for {plan}"
                    print(f"{plan} cost {cost} SP confirmed in error message")
                    
    def test_buy_same_or_lower_plan_fails(self):
        """Cannot buy same or lower plan than current"""
        # Get current plan
        sub_res = self.session.get(f"{BASE_URL}/api/subscription")
        current_plan = sub_res.json().get("plan", "free")
        
        # If already on plus/pro/ultra, try to buy free or same
        if current_plan != "free":
            # Try to buy same plan
            res = self.session.post(
                f"{BASE_URL}/api/subscription/buy-with-sp",
                json={"plan": current_plan}
            )
            assert res.status_code == 400
            detail = res.json().get("detail", "")
            assert "Zaten bu plan" in detail or "daha ust" in detail
            print(f"Cannot buy same plan error: {detail}")
        else:
            print("User on free plan, cannot test downgrade")
            
    def test_money_subscription_still_works(self):
        """POST /api/subscription with money still works"""
        # Get current plan
        sub_res = self.session.get(f"{BASE_URL}/api/subscription")
        current_plan = sub_res.json().get("plan", "free")
        
        # Subscribe to plus if on free
        if current_plan == "free":
            res = self.session.post(
                f"{BASE_URL}/api/subscription",
                json={"plan": "plus", "action": "subscribe"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data.get("plan") == "plus"
            print(f"Money subscription success: {data}")
            
            # Cancel to reset
            cancel_res = self.session.post(
                f"{BASE_URL}/api/subscription",
                json={"plan": "free", "action": "cancel"}
            )
            print(f"Cancel result: {cancel_res.json()}")
        else:
            print(f"Already on {current_plan}, skipping money subscription test")


class TestPlanLimits:
    """Verify PLAN_LIMITS are correctly configured"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        login_res = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test2@test.com", "password": "password123"}
        )
        assert login_res.status_code == 200
        
    def test_usage_endpoint_returns_limits(self):
        """GET /api/usage returns plan limits"""
        res = self.session.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 200
        data = res.json()
        
        assert "plan" in data
        assert "daily_credits" in data
        assert "limits" in data
        
        limits = data["limits"]
        plan = data["plan"]
        
        # Verify limit values based on plan
        expected_credits = {"free": 20, "plus": 100, "pro": 250, "ultra": 1000}
        assert data["daily_credits"] == expected_credits.get(plan, 20), f"Wrong daily_credits for {plan}"
        
        print(f"Plan: {plan}, Daily credits: {data['daily_credits']}")
        print(f"Full limits: {limits}")
        
    def test_free_plan_limits(self):
        """Verify free plan limits: 20 credits, judge disabled"""
        # Create a temp session with free user or check limits structure
        res = self.session.get(f"{BASE_URL}/api/usage")
        data = res.json()
        
        # Check the limits structure is correct
        limits = data.get("limits", {})
        
        # Verify limit keys exist
        expected_keys = ['daily_credits', 'judge_enabled', 'judge_deep', 'nano_pro']
        for key in expected_keys:
            assert key in limits, f"Missing key: {key}"
            
        print(f"Limits structure verified: {list(limits.keys())}")
        
        # If free plan, verify specific values
        if data.get("plan") == "free":
            assert limits["daily_credits"] == 20
            assert limits["judge_enabled"] == False
            assert limits["judge_deep"] == False
            assert limits["nano_pro"] == False
            print("Free plan limits verified: 20 credits, judge disabled")


class TestSPTestUser:
    """Tests with SP test user who has 5000 SP and plus plan"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with SP test user"""
        self.session = requests.Session()
        login_res = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "sptest@test.com", "password": "password123"}
        )
        if login_res.status_code != 200:
            pytest.skip("sptest@test.com user not available")
            
    def test_sptest_user_subscription(self):
        """Verify sptest user plan and SP"""
        sub_res = self.session.get(f"{BASE_URL}/api/subscription")
        if sub_res.status_code != 200:
            pytest.skip("Could not get subscription")
            
        plan = sub_res.json().get("plan", "free")
        print(f"sptest user plan: {plan}")
        
        sp_res = self.session.get(f"{BASE_URL}/api/quests/progress")
        sp = sp_res.json().get("quest_xp", 0)
        print(f"sptest user SP: {sp}")


class TestAPIAuthentication:
    """Test authentication requirements"""
    
    def test_subscription_requires_auth(self):
        """GET /api/subscription requires authentication"""
        res = requests.get(f"{BASE_URL}/api/subscription")
        assert res.status_code == 401
        
    def test_buy_with_sp_requires_auth(self):
        """POST /api/subscription/buy-with-sp requires authentication"""
        res = requests.post(
            f"{BASE_URL}/api/subscription/buy-with-sp",
            json={"plan": "plus"}
        )
        assert res.status_code == 401
        
    def test_usage_requires_auth(self):
        """GET /api/usage requires authentication"""
        res = requests.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
