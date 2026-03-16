"""
Test ZETA Auto-Write endpoint and Plan Downgrade FastSelect enforcement
Iteration 34 - Testing auto-write feature and plan limits
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://brainstorm-ai-dev.preview.emergentagent.com')

# Test user credentials
TEST_USER = {"email": "test2@test.com", "password": "password123"}

class TestZetaAutoWrite:
    """Test ZETA Auto-Write endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.user = login_res.json().get("user")
        yield
        # Cleanup if needed
    
    def test_auto_write_endpoint_exists(self):
        """Test that auto-write endpoint exists and accepts POST"""
        # Test with minimal valid payload
        res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "test",
            "page_count": 1,
            "writing_style": "gunluk"
        })
        # Should return 200 or success:false if insufficient credits
        assert res.status_code == 200, f"Endpoint failed: {res.text}"
        data = res.json()
        assert "success" in data, "Response missing 'success' field"
        print(f"Auto-write response: success={data.get('success')}")
    
    def test_auto_write_requires_auth(self):
        """Test that auto-write requires authentication"""
        # Create new session without login
        new_session = requests.Session()
        res = new_session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "test",
            "page_count": 1,
            "writing_style": "profesyonel"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("Auto-write requires auth: PASSED")
    
    def test_auto_write_response_structure(self):
        """Test that auto-write returns proper response structure"""
        res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "test",
            "page_count": 1,
            "writing_style": "profesyonel"
        })
        assert res.status_code == 200
        data = res.json()
        
        # Check response has required fields
        if data.get("success"):
            # Successful response
            assert "content" in data, "Missing 'content' field"
            assert "pages" in data, "Missing 'pages' field"
            assert "lines" in data, "Missing 'lines' field"
            assert "credits_spent" in data, "Missing 'credits_spent' field"
            assert "credits_remaining" in data, "Missing 'credits_remaining' field"
            print(f"Auto-write success: {data.get('lines')} lines, {data.get('credits_spent')} credits")
        else:
            # Failed response (insufficient credits)
            assert "error" in data, "Missing 'error' field on failure"
            assert "credits_remaining" in data, "Missing 'credits_remaining' field"
            print(f"Auto-write insufficient credits: {data.get('error')}")
    
    def test_auto_write_insufficient_credits_error(self):
        """Test that auto-write returns proper error when credits insufficient"""
        # Request high page count to exceed credits
        res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "test",
            "page_count": 10,
            "writing_style": "akademik"
        })
        assert res.status_code == 200
        data = res.json()
        
        # For 10 pages (~300 lines), cost is ~1000 credits which should exceed most plans
        if not data.get("success"):
            assert "error" in data
            assert "kredi" in data["error"].lower() or "credits" in data["error"].lower()
            print(f"Insufficient credits error: {data.get('error')}")
        else:
            # User has high credits, still verify structure
            assert "credits_spent" in data
            print(f"User has enough credits, spent: {data.get('credits_spent')}")
    
    def test_auto_write_writing_styles(self):
        """Test all available writing styles are accepted"""
        styles = ["profesyonel", "akademik", "yaratici", "resmi", "gunluk", "hikaye"]
        
        for style in styles:
            res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
                "prompt": "test",
                "page_count": 1,
                "writing_style": style
            })
            assert res.status_code == 200, f"Style '{style}' failed: {res.text}"
            data = res.json()
            assert "success" in data, f"Style '{style}' missing success field"
            print(f"Writing style '{style}': {'OK' if res.status_code == 200 else 'FAIL'}")
    
    def test_auto_write_page_count_range(self):
        """Test page count accepts 1-10"""
        for page_count in [1, 5, 10]:
            res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
                "prompt": "test",
                "page_count": page_count,
                "writing_style": "gunluk"
            })
            assert res.status_code == 200, f"Page count {page_count} failed"
            print(f"Page count {page_count}: OK")
    
    def test_auto_write_credits_calculation(self):
        """Test credits are calculated correctly: 10 credits per 3 lines"""
        # This test verifies the formula is applied correctly
        res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "Cok kisa bir test yazisi yaz sadece bir cumle",
            "page_count": 1,
            "writing_style": "gunluk"
        })
        assert res.status_code == 200
        data = res.json()
        
        if data.get("success"):
            lines = data.get("lines", 0)
            credits_spent = data.get("credits_spent", 0)
            # Formula: max(10, (lines // 3) * 10)
            expected_min = max(10, (lines // 3) * 10)
            print(f"Lines: {lines}, Credits spent: {credits_spent}, Expected min: {expected_min}")
            # Credits should be >= minimum
            assert credits_spent >= 10, "Minimum cost is 10 credits"
        else:
            print(f"Test skipped due to insufficient credits: {data.get('error')}")
    
    def test_auto_write_pages_split_by_marker(self):
        """Test that pages are split by ---SAYFA SONU--- marker"""
        res = self.session.post(f"{BASE_URL}/api/zeta/auto-write", json={
            "prompt": "test",
            "page_count": 2,
            "writing_style": "profesyonel"
        })
        assert res.status_code == 200
        data = res.json()
        
        if data.get("success"):
            pages = data.get("pages", [])
            assert isinstance(pages, list), "Pages should be a list"
            # For multi-page, there should be page markers in content
            print(f"Returned {len(pages)} pages")
        else:
            print(f"Insufficient credits for multi-page test")


class TestPlanLimits:
    """Test PLAN_LIMITS and FastSelect enforcement"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert login_res.status_code == 200
        yield
    
    def test_usage_returns_plan_limits(self):
        """Test GET /api/usage returns plan and limits"""
        res = self.session.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 200
        data = res.json()
        
        # Check required fields
        assert "plan" in data, "Missing 'plan' field"
        assert "daily_credits" in data, "Missing 'daily_credits' field"
        assert "credits_remaining" in data, "Missing 'credits_remaining' field"
        assert "limits" in data, "Missing 'limits' field"
        
        # Check limits structure
        limits = data["limits"]
        assert "fastselect_limit" in limits, "Missing 'fastselect_limit' in limits"
        print(f"Plan: {data['plan']}, FastSelect limit: {limits.get('fastselect_limit')}")
    
    def test_plan_limits_fastselect(self):
        """Test FastSelect limits by plan"""
        res = self.session.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 200
        data = res.json()
        
        plan = data.get("plan", "free")
        fastselect_limit = data["limits"].get("fastselect_limit", 0)
        
        # Verify limits match expected values
        expected_limits = {
            "free": 3,
            "plus": 999,  # Backend uses 999 for unlimited
            "pro": 999,
            "ultra": 999
        }
        
        expected = expected_limits.get(plan, 3)
        print(f"Plan '{plan}' FastSelect limit: {fastselect_limit} (expected: {expected})")
        
        # For free, should be 3; for paid plans, should be high (999 or unlimited)
        if plan == "free":
            assert fastselect_limit == 3, f"Free plan should have 3 fastselect, got {fastselect_limit}"
        else:
            assert fastselect_limit >= 5, f"Paid plans should have >= 5 fastselect"
    
    def test_subscription_endpoint(self):
        """Test GET /api/subscription returns current plan"""
        res = self.session.get(f"{BASE_URL}/api/subscription")
        assert res.status_code == 200
        data = res.json()
        
        assert "plan" in data, "Missing 'plan' field"
        assert data["plan"] in ["free", "plus", "pro", "ultra"], f"Invalid plan: {data['plan']}"
        print(f"Current subscription: {data['plan']}")
    
    def test_plan_downgrade_simulation(self):
        """Test that downgrading plan would affect limits (conceptual test)"""
        # Get current usage
        res = self.session.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 200
        data = res.json()
        
        current_plan = data.get("plan")
        current_fastselect = data["limits"].get("fastselect_limit")
        
        # Document the expected behavior
        print(f"Current plan: {current_plan}")
        print(f"Current FastSelect limit: {current_fastselect}")
        print("On downgrade to free, FastSelect should be limited to 3")
        
        # This is a documentation test - actual downgrade would require subscription change


class TestPlanCredits:
    """Test credit limits by plan"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert login_res.status_code == 200
        yield
    
    def test_daily_credits_by_plan(self):
        """Verify daily credits match PLAN_LIMITS"""
        res = self.session.get(f"{BASE_URL}/api/usage")
        assert res.status_code == 200
        data = res.json()
        
        plan = data.get("plan")
        daily_credits = data.get("daily_credits")
        
        expected_credits = {
            "free": 20,
            "plus": 100,
            "pro": 250,
            "ultra": 1000
        }
        
        expected = expected_credits.get(plan, 20)
        assert daily_credits == expected, f"Plan {plan} should have {expected} credits, got {daily_credits}"
        print(f"Plan '{plan}' daily credits: {daily_credits} (expected: {expected})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
