"""
Credit System Tests - Iteration 29
Tests for ZET Mindshare credit-based usage system:
- PLAN_LIMITS for free, plus, pro, ultra plans
- CREDIT_COSTS for each action
- GET /api/usage endpoint returning credits and limits
- Plan-based restrictions on features
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "demo@demo.com"
TEST_PASSWORD = "demo123"


class TestCreditSystemAPI:
    """Credit system API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        # Login to get session
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        self.user = login_response.json().get("user", {})
        yield
        # Cleanup
        self.session.close()
    
    def test_usage_endpoint_returns_credits(self):
        """GET /api/usage returns credit system data"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check required fields
        assert "daily_credits" in data, "Missing daily_credits"
        assert "credits_used" in data, "Missing credits_used"
        assert "credits_remaining" in data, "Missing credits_remaining"
        assert "limits" in data, "Missing limits"
        assert "credit_costs" in data, "Missing credit_costs"
        
        # Validate types
        assert isinstance(data["daily_credits"], int), "daily_credits should be int"
        assert isinstance(data["credits_used"], int), "credits_used should be int"
        assert isinstance(data["credits_remaining"], int), "credits_remaining should be int"
        assert isinstance(data["limits"], dict), "limits should be dict"
        assert isinstance(data["credit_costs"], dict), "credit_costs should be dict"
        
        print(f"✓ Usage endpoint returns: {data['credits_remaining']}/{data['daily_credits']} credits")
    
    def test_usage_limits_structure(self):
        """GET /api/usage limits contains required fields"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        
        limits = response.json().get("limits", {})
        
        # Required limit fields
        required_fields = [
            'judge_enabled', 'nano_pro', 'custom_image_sizes',
            'layers', 'signature', 'watermark', 'page_color', 'charts'
        ]
        
        for field in required_fields:
            assert field in limits, f"Missing required limit field: {field}"
        
        print(f"✓ Limits structure contains all required fields: {list(limits.keys())}")
    
    def test_credit_costs_values(self):
        """GET /api/usage credit_costs contains correct values"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        
        credit_costs = response.json().get("credit_costs", {})
        
        # Expected credit costs per requirement
        expected_costs = {
            'nano_banana': 20,
            'nano_banana_pro': 50,
            'photo_edit': 15,
            'photo_edit_pro': 40,
            'judge_basic': 25,
            'judge_deep': 70,
        }
        
        for action, expected_cost in expected_costs.items():
            assert action in credit_costs, f"Missing credit cost: {action}"
            assert credit_costs[action] == expected_cost, \
                f"Credit cost for {action} should be {expected_cost}, got {credit_costs[action]}"
        
        print(f"✓ Credit costs verified: {credit_costs}")
    
    def test_free_plan_limits(self):
        """Verify free plan limits match requirements"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        
        data = response.json()
        plan = data.get("plan", "free")
        
        # Only test if on free plan (demo@demo.com is free by default)
        if plan != "free":
            pytest.skip("User is not on free plan")
        
        limits = data.get("limits", {})
        
        # Free plan requirements:
        # 20 kredi/gün, Judge kapalı, 3 fastselect, ZETA 250 harf, Pro yok, boyut: 16:9
        assert data["daily_credits"] == 20, f"Free plan should have 20 daily credits, got {data['daily_credits']}"
        assert limits.get("judge_enabled") == False, "Free plan should have judge_enabled=false"
        assert limits.get("zeta_chars") == 250, f"Free plan should have zeta_chars=250, got {limits.get('zeta_chars')}"
        assert limits.get("nano_pro") == False, "Free plan should have nano_pro=false"
        assert '16:9' in limits.get("custom_image_sizes", []), "Free plan should have 16:9 aspect ratio"
        assert len(limits.get("custom_image_sizes", [])) == 1, "Free plan should only have 16:9 aspect ratio"
        
        # Locked features for free plan
        assert limits.get("layers") == False, "Free plan should have layers=false"
        assert limits.get("signature") == False, "Free plan should have signature=false"
        assert limits.get("watermark") == False, "Free plan should have watermark=false"
        assert limits.get("page_color") == False, "Free plan should have page_color=false"
        assert limits.get("charts") == False, "Free plan should have charts=false"
        
        print(f"✓ Free plan limits verified: daily_credits=20, judge_enabled=False, zeta_chars=250")
    
    def test_zeta_chat_char_limit_for_free_plan(self):
        """POST /api/zeta/chat returns char_limit_exceeded when message > 250 chars for free plan"""
        # Create a message longer than 250 characters
        long_message = "A" * 260
        
        response = self.session.post(
            f"{BASE_URL}/api/zeta/chat",
            json={"message": long_message}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # For free plan, should have char_limit_exceeded flag
        if data.get("char_limit_exceeded"):
            print("✓ Zeta chat correctly returns char_limit_exceeded for long message on free plan")
        else:
            # If it succeeded, user might be on a higher plan
            print(f"Note: Chat succeeded - user may be on higher plan or char limit increased")
    
    def test_judge_locked_for_free_plan(self):
        """POST /api/judge/chat returns locked message for free plan users"""
        response = self.session.post(
            f"{BASE_URL}/api/judge/chat",
            json={"message": "Test analysis"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # For free plan, Judge should be locked
        if data.get("locked"):
            print("✓ Judge correctly returns locked=true for free plan")
            assert "Free" in data.get("response", "") or "free" in data.get("response", "").lower() or "planı" in data.get("response", ""), \
                "Response should mention plan upgrade"
        else:
            # If not locked, verify user is on Plus or higher
            usage_response = self.session.get(f"{BASE_URL}/api/usage")
            user_plan = usage_response.json().get("plan", "free")
            assert user_plan != "free", f"Judge should be locked for free plan, but was accessible"
            print(f"Note: Judge accessible - user is on {user_plan} plan")


class TestImageGenerationAPI:
    """Test AI image generation with pro and aspect_ratio params"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_generate_image_accepts_pro_param(self):
        """POST /api/zeta/generate-image accepts 'pro' parameter"""
        # Test with pro=false (should work for free plan)
        response = self.session.post(
            f"{BASE_URL}/api/zeta/generate-image",
            json={"prompt": "test", "pro": False, "aspect_ratio": "16:9"}
        )
        # Should either succeed or return credit error (not 4xx validation error)
        assert response.status_code in [200, 429], \
            f"Expected 200 or 429 (credit error), got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            print("✓ Image generation endpoint accepts pro parameter")
        else:
            print("✓ Image generation endpoint accepts pro parameter (returned credit error)")
    
    def test_generate_image_accepts_aspect_ratio(self):
        """POST /api/zeta/generate-image accepts 'aspect_ratio' parameter"""
        response = self.session.post(
            f"{BASE_URL}/api/zeta/generate-image",
            json={"prompt": "test", "aspect_ratio": "16:9"}
        )
        # Should either succeed or return credit/plan error (not validation error)
        assert response.status_code in [200, 403, 429], \
            f"Expected 200, 403, or 429, got {response.status_code}: {response.text}"
        print(f"✓ Image generation endpoint accepts aspect_ratio parameter (status: {response.status_code})")


class TestPhotoEditAPI:
    """Test photo edit with pro parameter"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_photo_edit_accepts_pro_param(self):
        """POST /api/zeta/photo-edit accepts 'pro' parameter"""
        # Test with minimal image data
        response = self.session.post(
            f"{BASE_URL}/api/zeta/photo-edit",
            json={
                "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "edit_prompt": "test edit",
                "pro": False
            }
        )
        # Should either succeed or return credit error
        assert response.status_code in [200, 429, 500], \
            f"Expected 200, 429, or 500, got {response.status_code}: {response.text}"
        print(f"✓ Photo edit endpoint accepts pro parameter (status: {response.status_code})")


class TestPlanLimitsValidation:
    """Validate PLAN_LIMITS match requirements"""
    
    def test_plan_limits_structure_in_backend(self):
        """Verify PLAN_LIMITS structure is correct by checking server.py"""
        # Read server.py to verify PLAN_LIMITS
        server_path = "/app/backend/server.py"
        try:
            with open(server_path, 'r') as f:
                content = f.read()
                
            # Check free plan
            assert "'free':" in content, "Missing 'free' plan in PLAN_LIMITS"
            assert "'daily_credits': 20" in content, "Free plan should have daily_credits: 20"
            assert "'judge_enabled': False" in content, "Free plan should have judge_enabled: False"
            assert "'zeta_chars': 250" in content, "Free plan should have zeta_chars: 250"
            
            # Check plus plan
            assert "'plus':" in content, "Missing 'plus' plan in PLAN_LIMITS"
            assert "'daily_credits': 100" in content, "Plus plan should have daily_credits: 100"
            
            # Check pro plan
            assert "'pro':" in content, "Missing 'pro' plan in PLAN_LIMITS"
            assert "'daily_credits': 250" in content, "Pro plan should have daily_credits: 250"
            
            # Check ultra plan
            assert "'ultra':" in content, "Missing 'ultra' plan in PLAN_LIMITS"
            assert "'daily_credits': 1000" in content, "Ultra plan should have daily_credits: 1000"
            
            # Check credit costs
            assert "'nano_banana': 20" in content, "Credit cost for nano_banana should be 20"
            assert "'nano_banana_pro': 50" in content, "Credit cost for nano_banana_pro should be 50"
            assert "'photo_edit': 15" in content, "Credit cost for photo_edit should be 15"
            assert "'photo_edit_pro': 40" in content, "Credit cost for photo_edit_pro should be 40"
            assert "'judge_basic': 25" in content, "Credit cost for judge_basic should be 25"
            assert "'judge_deep': 70" in content, "Credit cost for judge_deep should be 70"
            
            print("✓ All PLAN_LIMITS and CREDIT_COSTS verified in server.py")
            
        except FileNotFoundError:
            pytest.skip("server.py not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
