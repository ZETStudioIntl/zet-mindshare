"""
Test suite for new features in iteration 36:
- Credit limit of 1000 with overflow warning
- Deep Analysis feature for Pro/Ultra users (100 credits)
- Credit package updated from pack_1300 to pack_1000
- Credit overflow confirmation dialog when buying credits that exceed 1000 limit
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PRO_USER = {"email": "testcredit@test.com", "password": "test1234"}
FREE_USER = {"email": "freetest_iter36@test.com", "password": "test1234"}


class TestCreditPackages:
    """Test credit packages API - should return pack_1000 instead of pack_1300"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth cookie"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as Pro user
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        if resp.status_code != 200:
            pytest.skip("Could not login as Pro user")
        self.session.cookies = resp.cookies
    
    def test_get_credit_packages_returns_pack_1000(self):
        """GET /api/credits/packages should return pack_1000 instead of pack_1300"""
        resp = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should have packages list
        assert "packages" in data
        packages = data["packages"]
        
        # Should have 4 packages
        assert len(packages) == 4
        
        # Check package IDs - pack_1000 should exist, pack_1300 should NOT
        package_ids = [p["id"] for p in packages]
        assert "pack_1000" in package_ids, "pack_1000 should be present"
        assert "pack_1300" not in package_ids, "pack_1300 should NOT be present"
        
        # Verify pack_1000 details
        pack_1000 = next((p for p in packages if p["id"] == "pack_1000"), None)
        assert pack_1000 is not None
        assert pack_1000["credits"] == 1000
        assert pack_1000["price"] == 24.99
        print(f"✓ pack_1000 found with credits={pack_1000['credits']}, price=${pack_1000['price']}")
    
    def test_packages_include_100_350_700_1000(self):
        """Verify all 4 packages: pack_100, pack_350, pack_700, pack_1000"""
        resp = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert resp.status_code == 200
        packages = resp.json()["packages"]
        
        expected = {
            "pack_100": {"credits": 100, "price": 2.99},
            "pack_350": {"credits": 350, "price": 8.99},
            "pack_700": {"credits": 700, "price": 14.99},
            "pack_1000": {"credits": 1000, "price": 24.99},
        }
        
        for pkg in packages:
            if pkg["id"] in expected:
                assert pkg["credits"] == expected[pkg["id"]]["credits"]
                assert pkg["price"] == expected[pkg["id"]]["price"]
                print(f"✓ {pkg['id']}: {pkg['credits']} credits, ${pkg['price']}")


class TestCreditOverflowConfirmation:
    """Test credit overflow confirmation dialog when buying credits that exceed 1000 limit"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth cookie"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as Pro user
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        if resp.status_code != 200:
            pytest.skip("Could not login as Pro user")
        self.session.cookies = resp.cookies
    
    def test_buy_credits_returns_needs_confirmation_when_exceeds_1000(self):
        """POST /api/credits/buy with pack_1000 should return needs_confirmation when total exceeds 1000"""
        # First get current credits
        usage_resp = self.session.get(f"{BASE_URL}/api/usage")
        current_credits = usage_resp.json().get("credits_remaining", 0)
        
        # Try to buy pack_1000 - if current > 0, it will exceed 1000
        if current_credits > 0:
            resp = self.session.post(f"{BASE_URL}/api/credits/buy", json={
                "package_id": "pack_1000",
                "confirm_overflow": False
            })
            assert resp.status_code == 200
            data = resp.json()
            
            # Should return needs_confirmation if total > 1000
            if current_credits + 1000 > 1000:
                assert data.get("needs_confirmation") == True
                assert "overflow" in data
                assert data["overflow"] == (current_credits + 1000 - 1000)
                print(f"✓ needs_confirmation returned with overflow={data['overflow']}")
            else:
                # If total <= 1000, purchase should succeed
                assert "credits_added" in data or data.get("needs_confirmation") is None
        else:
            # If no current credits, purchase pack_100 first to have some credits
            resp = self.session.post(f"{BASE_URL}/api/credits/buy", json={
                "package_id": "pack_100",
                "confirm_overflow": False
            })
            print("Purchased pack_100 first, then will test overflow")
            
            # Now buy pack_1000 which should exceed 1000
            resp2 = self.session.post(f"{BASE_URL}/api/credits/buy", json={
                "package_id": "pack_1000",
                "confirm_overflow": False
            })
            assert resp2.status_code == 200
            data = resp2.json()
            # May or may not need confirmation depending on daily credits
            print(f"✓ Response: {data}")
    
    def test_buy_credits_with_confirm_overflow_caps_at_1000(self):
        """POST /api/credits/buy with confirm_overflow=true should cap credits at 1000"""
        # Get current state
        usage_resp = self.session.get(f"{BASE_URL}/api/usage")
        before_credits = usage_resp.json().get("bonus_credits", 0)
        
        # Buy with confirm_overflow=True
        resp = self.session.post(f"{BASE_URL}/api/credits/buy", json={
            "package_id": "pack_700",
            "confirm_overflow": True
        })
        assert resp.status_code == 200
        data = resp.json()
        
        # If it was a direct success (no overflow needed) or confirmed overflow
        if "credits_added" in data:
            # Check the new bonus_credits is <= 1000
            assert data.get("bonus_credits", 0) <= 1000
            print(f"✓ Purchase successful, bonus_credits={data.get('bonus_credits')}")
        elif data.get("needs_confirmation"):
            print("✓ Still needs confirmation (another package already pushed over limit)")
        else:
            print(f"✓ Response: {data}")


class TestDeepAnalysisFeature:
    """Test Deep Analysis endpoint - only for Pro/Ultra users, costs 100 credits"""
    
    def test_deep_analysis_returns_403_for_free_user(self):
        """POST /api/zeta/deep-analysis should return 403 for Free plan users"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # First register a new free user
        import uuid
        free_email = f"freetest_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": free_email,
            "password": "test1234",
            "name": "Free User Test"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip("Could not register free user")
        
        session.cookies = reg_resp.cookies
        
        # Try deep analysis - should get 403
        resp = session.post(f"{BASE_URL}/api/zeta/deep-analysis", json={
            "topic": "Artificial Intelligence trends in 2025",
            "document_content": ""
        })
        
        assert resp.status_code == 403
        assert "Pro" in resp.json().get("detail", "") or "Ultra" in resp.json().get("detail", "")
        print(f"✓ Free user correctly blocked from Deep Analysis (403)")
    
    def test_deep_analysis_works_for_pro_user(self):
        """POST /api/zeta/deep-analysis should work for Pro users with sufficient credits"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as Pro user
        resp = session.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        if resp.status_code != 200:
            pytest.skip("Could not login as Pro user")
        session.cookies = resp.cookies
        
        # Check user plan first
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        user_plan = me_resp.json().get("subscription", "free")
        print(f"User plan: {user_plan}")
        
        if user_plan not in ("pro", "ultra"):
            pytest.skip(f"Test user is on {user_plan} plan, not Pro/Ultra")
        
        # Check credits
        usage_resp = session.get(f"{BASE_URL}/api/usage")
        credits = usage_resp.json().get("credits_remaining", 0)
        print(f"Credits remaining: {credits}")
        
        if credits < 100:
            pytest.skip(f"Not enough credits for deep analysis (need 100, have {credits})")
        
        # Try deep analysis - should work
        resp = session.post(f"{BASE_URL}/api/zeta/deep-analysis", json={
            "topic": "Test topic for deep analysis",
            "document_content": ""
        }, timeout=60)  # May take a while due to LLM processing
        
        # Should be 200 or 402 (insufficient credits)
        assert resp.status_code in (200, 402)
        
        if resp.status_code == 200:
            data = resp.json()
            assert data.get("success") == True
            assert "analysis" in data
            assert data.get("credits_spent") == 100
            print(f"✓ Deep Analysis successful, credits_spent=100")
        else:
            print(f"✓ Got 402 - insufficient credits (expected if user used credits)")


class TestDeepAnalysisEndpointExists:
    """Test that deep analysis endpoint exists and validates plan"""
    
    def test_deep_analysis_endpoint_exists(self):
        """Verify /api/zeta/deep-analysis endpoint exists"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as Pro user
        resp = session.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        if resp.status_code != 200:
            pytest.skip("Could not login")
        session.cookies = resp.cookies
        
        # Just check endpoint exists (not 404)
        resp = session.post(f"{BASE_URL}/api/zeta/deep-analysis", json={
            "topic": "test"
        }, timeout=10)
        
        # Should not be 404 or 405
        assert resp.status_code not in (404, 405), "Endpoint should exist"
        print(f"✓ Endpoint exists, got status {resp.status_code}")


class TestMaxCreditBalance:
    """Test MAX_CREDIT_BALANCE constant is 1000"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=PRO_USER)
        if resp.status_code != 200:
            pytest.skip("Could not login")
        self.session.cookies = resp.cookies
    
    def test_overflow_message_mentions_1000_limit(self):
        """Verify overflow message mentions 1000 as the limit"""
        # Buy a small package first to ensure some credits
        self.session.post(f"{BASE_URL}/api/credits/buy", json={
            "package_id": "pack_100",
            "confirm_overflow": True
        })
        
        # Now buy pack_1000 without confirm
        resp = self.session.post(f"{BASE_URL}/api/credits/buy", json={
            "package_id": "pack_1000",
            "confirm_overflow": False
        })
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get("needs_confirmation"):
                assert "1000" in data.get("message", "")
                print(f"✓ Overflow message mentions 1000 limit: {data['message'][:100]}...")
            else:
                print(f"✓ Purchase succeeded without overflow (total <= 1000)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
