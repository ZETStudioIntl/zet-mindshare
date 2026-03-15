"""
Credit Packages Purchase Tests - Iteration 35
Tests for ZET Mindshare credit package purchase feature:
- GET /api/credits/packages - Returns 4 packages (100, 350, 700, 1300 credits)
- 15% discount for Plus/Pro/Ultra users (no discount for Free)
- POST /api/credits/buy - Adds bonus_credits to user
- GET /api/usage - Includes bonus_credits in response
- credits_remaining = daily_credits + bonus_credits - credits_used
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
FREE_USER = {"email": "freetest@test.com", "password": "password123"}
PLUS_USER = {"email": "test2@test.com", "password": "password123"}  # Plus plan
ULTRA_USER = {"email": "autotest@test.com", "password": "password123"}  # Ultra plan

# Expected credit packages
EXPECTED_PACKAGES = [
    {"id": "pack_100", "credits": 100, "price": 2.99},
    {"id": "pack_350", "credits": 350, "price": 8.99},
    {"id": "pack_700", "credits": 700, "price": 14.99},
    {"id": "pack_1300", "credits": 1300, "price": 24.99},
]

SUBSCRIBER_DISCOUNT = 0.15  # 15%


class TestCreditPackagesForFreeUser:
    """Test credit packages API for Free plan user (no discount)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as free user"""
        self.session = requests.Session()
        # First try to login, if fails, register the user
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=FREE_USER
        )
        if login_response.status_code != 200:
            # Try to register
            reg_response = self.session.post(
                f"{BASE_URL}/api/auth/register",
                json={**FREE_USER, "name": "Free Test User"}
            )
            if reg_response.status_code not in [200, 400]:  # 400 = already exists
                pytest.skip(f"Could not create free user: {reg_response.status_code}")
            # Try login again
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=FREE_USER
            )
            if login_response.status_code != 200:
                pytest.skip(f"Free user login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_packages_endpoint_returns_4_packages(self):
        """GET /api/credits/packages returns exactly 4 packages"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "packages" in data, "Response should contain 'packages' key"
        packages = data["packages"]
        
        assert len(packages) == 4, f"Expected 4 packages, got {len(packages)}"
        print(f"✓ GET /api/credits/packages returns 4 packages")
    
    def test_packages_have_correct_credits(self):
        """Packages have correct credit amounts: 100, 350, 700, 1300"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        expected_credits = [100, 350, 700, 1300]
        actual_credits = [p["credits"] for p in packages]
        
        assert sorted(actual_credits) == sorted(expected_credits), \
            f"Expected credits {expected_credits}, got {actual_credits}"
        print(f"✓ Packages have correct credit amounts: {actual_credits}")
    
    def test_packages_have_correct_ids(self):
        """Packages have correct IDs: pack_100, pack_350, pack_700, pack_1300"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        expected_ids = ["pack_100", "pack_350", "pack_700", "pack_1300"]
        actual_ids = [p["id"] for p in packages]
        
        assert sorted(actual_ids) == sorted(expected_ids), \
            f"Expected IDs {expected_ids}, got {actual_ids}"
        print(f"✓ Packages have correct IDs: {actual_ids}")
    
    def test_free_user_gets_no_discount(self):
        """Free plan user gets no discount (discounted_price === price)"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("has_discount") == False, "Free user should have has_discount=False"
        assert data.get("discount_percent") == 0, "Free user should have discount_percent=0"
        
        packages = data["packages"]
        for pkg in packages:
            assert pkg["discounted_price"] == pkg["price"], \
                f"For free user, discounted_price should equal price for {pkg['id']}"
        
        print(f"✓ Free user gets no discount - discounted_price equals original price")
    
    def test_packages_response_includes_bonus_credits(self):
        """Response includes bonus_credits field"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        data = response.json()
        assert "bonus_credits" in data, "Response should contain 'bonus_credits' field"
        assert isinstance(data["bonus_credits"], int), "bonus_credits should be an integer"
        print(f"✓ Response includes bonus_credits: {data['bonus_credits']}")


class TestCreditPackagesForSubscribedUser:
    """Test credit packages API for subscribed user (Plus/Pro/Ultra - 15% discount)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as Plus user"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=PLUS_USER
        )
        if login_response.status_code != 200:
            pytest.skip(f"Plus user login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_subscribed_user_gets_15_percent_discount(self):
        """Plus/Pro/Ultra user gets 15% discount"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check discount flag
        assert data.get("has_discount") == True, "Subscribed user should have has_discount=True"
        assert data.get("discount_percent") == 15, f"Discount should be 15%, got {data.get('discount_percent')}%"
        
        # Verify each package has correct discounted price
        packages = data["packages"]
        for pkg in packages:
            expected_discounted = round(pkg["price"] * (1 - SUBSCRIBER_DISCOUNT), 2)
            assert pkg["discounted_price"] == expected_discounted, \
                f"Package {pkg['id']}: expected discounted_price {expected_discounted}, got {pkg['discounted_price']}"
        
        print(f"✓ Subscribed user gets 15% discount - has_discount=True, discount_percent=15")
    
    def test_discounted_prices_are_correct(self):
        """Verify exact discounted prices for each package"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        
        # Expected discounted prices (15% off)
        expected_discounted = {
            "pack_100": round(2.99 * 0.85, 2),   # 2.54
            "pack_350": round(8.99 * 0.85, 2),   # 7.64
            "pack_700": round(14.99 * 0.85, 2),  # 12.74
            "pack_1300": round(24.99 * 0.85, 2), # 21.24
        }
        
        for pkg in packages:
            assert pkg["discounted_price"] == expected_discounted[pkg["id"]], \
                f"Package {pkg['id']}: expected ${expected_discounted[pkg['id']]}, got ${pkg['discounted_price']}"
            print(f"  ✓ {pkg['id']}: original ${pkg['price']} -> discounted ${pkg['discounted_price']}")
        
        print(f"✓ All discounted prices are correct (15% off)")


class TestBuyCredits:
    """Test POST /api/credits/buy endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as Plus user"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=PLUS_USER
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_buy_credits_adds_bonus_credits(self):
        """POST /api/credits/buy adds credits to user's bonus_credits"""
        # Get current bonus credits
        packages_response = self.session.get(f"{BASE_URL}/api/credits/packages")
        initial_bonus = packages_response.json().get("bonus_credits", 0)
        
        # Buy 100 credit package
        buy_response = self.session.post(
            f"{BASE_URL}/api/credits/buy",
            json={"package_id": "pack_100"}
        )
        assert buy_response.status_code == 200, f"Expected 200, got {buy_response.status_code}"
        
        data = buy_response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "credits_added" in data, "Response should contain 'credits_added'"
        assert "bonus_credits" in data, "Response should contain 'bonus_credits'"
        
        # Verify credits were added
        assert data["credits_added"] == 100, f"Expected 100 credits added, got {data['credits_added']}"
        assert data["bonus_credits"] == initial_bonus + 100, \
            f"Expected bonus_credits to be {initial_bonus + 100}, got {data['bonus_credits']}"
        
        print(f"✓ POST /api/credits/buy adds 100 bonus credits (now: {data['bonus_credits']})")
    
    def test_buy_credits_returns_correct_price_paid(self):
        """Buy response includes correct price_paid"""
        buy_response = self.session.post(
            f"{BASE_URL}/api/credits/buy",
            json={"package_id": "pack_350"}
        )
        assert buy_response.status_code == 200
        
        data = buy_response.json()
        assert "price_paid" in data, "Response should contain 'price_paid'"
        
        # For subscribed user, should be discounted price
        expected_price = round(8.99 * 0.85, 2)  # 7.64
        assert data["price_paid"] == expected_price, \
            f"Expected price_paid ${expected_price}, got ${data['price_paid']}"
        
        print(f"✓ Buy response shows correct price_paid: ${data['price_paid']}")
    
    def test_buy_invalid_package_returns_error(self):
        """POST /api/credits/buy with invalid package_id returns 400"""
        buy_response = self.session.post(
            f"{BASE_URL}/api/credits/buy",
            json={"package_id": "invalid_package"}
        )
        assert buy_response.status_code == 400, \
            f"Expected 400 for invalid package, got {buy_response.status_code}"
        print(f"✓ Invalid package_id returns 400 error")
    
    def test_buy_credits_requires_auth(self):
        """POST /api/credits/buy requires authentication"""
        # Create new session without login
        unauth_session = requests.Session()
        buy_response = unauth_session.post(
            f"{BASE_URL}/api/credits/buy",
            json={"package_id": "pack_100"}
        )
        assert buy_response.status_code == 401, \
            f"Expected 401 for unauthenticated request, got {buy_response.status_code}"
        unauth_session.close()
        print(f"✓ Buy credits requires authentication (401)")


class TestUsageIncludesBonusCredits:
    """Test GET /api/usage includes bonus_credits in response"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as Plus user"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=PLUS_USER
        )
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_usage_includes_bonus_credits_field(self):
        """GET /api/usage response includes bonus_credits"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        
        data = response.json()
        assert "bonus_credits" in data, "Usage response should contain 'bonus_credits'"
        assert isinstance(data["bonus_credits"], int), "bonus_credits should be an integer"
        print(f"✓ GET /api/usage includes bonus_credits: {data['bonus_credits']}")
    
    def test_credits_remaining_includes_bonus(self):
        """credits_remaining = daily_credits + bonus_credits - credits_used"""
        response = self.session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        
        data = response.json()
        daily = data["daily_credits"]
        bonus = data["bonus_credits"]
        used = data["credits_used"]
        remaining = data["credits_remaining"]
        
        expected_remaining = max(0, daily + bonus - used)
        assert remaining == expected_remaining, \
            f"credits_remaining should be {expected_remaining} (daily:{daily} + bonus:{bonus} - used:{used}), got {remaining}"
        
        print(f"✓ credits_remaining = daily({daily}) + bonus({bonus}) - used({used}) = {remaining}")


class TestUltraUserDiscount:
    """Test Ultra user also gets 15% discount"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as Ultra user"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=ULTRA_USER
        )
        if login_response.status_code != 200:
            pytest.skip(f"Ultra user login failed: {login_response.status_code}")
        yield
        self.session.close()
    
    def test_ultra_user_gets_discount(self):
        """Ultra plan user also gets 15% discount"""
        response = self.session.get(f"{BASE_URL}/api/credits/packages")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("has_discount") == True, "Ultra user should have has_discount=True"
        assert data.get("discount_percent") == 15, "Ultra user should get 15% discount"
        print(f"✓ Ultra user gets 15% discount")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
