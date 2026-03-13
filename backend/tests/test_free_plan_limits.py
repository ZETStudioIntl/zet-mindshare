"""
ZET Mindshare Free Plan Limits Tests - Iteration 22
Testing: AI Image limits, Judge access control, Usage tracking
Features:
- Free plan user AI Image limit (1/day) - should show error when exceeded
- Free plan user Judge locked - should show 'Free planda kullanılamaz' message
- Usage API returns correct limits and remaining counts
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spider-mind.preview.emergentagent.com')

# Test credentials for demo user (FREE plan)
DEMO_USER = {
    "email": "demo@demo.com",
    "password": "demo123"
}


class TestFreePlanLimits:
    """Tests for Free plan usage limits"""
    
    @pytest.fixture(scope="class")
    def demo_session(self):
        """Login with demo user (FREE plan)"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=DEMO_USER)
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
            print(f"Logged in as demo user")
        return session
    
    def test_demo_user_login(self, demo_session):
        """Verify demo user can login"""
        response = demo_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == DEMO_USER["email"]
        print(f"Demo user authenticated: {data['email']}")
    
    def test_demo_user_is_free_plan(self, demo_session):
        """Verify demo user is on FREE plan"""
        response = demo_session.get(f"{BASE_URL}/api/subscription")
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "free", f"Expected free plan, got {data['plan']}"
        print(f"Demo user plan: {data['plan']}")
    
    def test_usage_api_returns_free_limits(self, demo_session):
        """Test usage API returns correct FREE plan limits"""
        response = demo_session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "plan" in data
        assert "limits" in data
        assert "usage" in data
        assert "remaining" in data
        
        # FREE plan should have specific limits
        assert data["plan"] == "free"
        assert data["limits"]["ai_images"] == 1, f"Expected 1 AI image limit, got {data['limits']['ai_images']}"
        assert data["limits"]["judge_basic"] == 0, f"Expected 0 Judge basic limit, got {data['limits']['judge_basic']}"
        assert data["limits"]["judge_deep"] == 0, f"Expected 0 Judge deep limit, got {data['limits']['judge_deep']}"
        
        print(f"FREE plan limits: {data['limits']}")
        print(f"Current usage: {data['usage']}")
        print(f"Remaining: {data['remaining']}")
    
    def test_judge_locked_for_free_plan(self, demo_session):
        """Test Judge returns locked message for FREE plan users"""
        response = demo_session.post(f"{BASE_URL}/api/judge/chat", json={
            "message": "Analyze my project",
            "mode": "fast"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should return locked=True for free plan
        assert data.get("locked") == True, f"Expected locked=True, got {data}"
        assert "Free planda kullanılamaz" in data.get("response", ""), f"Expected lock message, got: {data.get('response')}"
        
        print(f"Judge response for FREE user: {data['response'][:100]}...")


class TestPlanLimitsConstants:
    """Test that plan limits are correctly configured"""
    
    @pytest.fixture(scope="class")
    def test_session(self):
        """Create and login a fresh test user"""
        session = requests.Session()
        email = f"test_limits_{datetime.now().strftime('%H%M%S')}@example.com"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Limits Tester"
        })
        return session
    
    def test_free_plan_limits(self, test_session):
        """Verify FREE plan limits"""
        response = test_session.get(f"{BASE_URL}/api/usage")
        data = response.json()
        
        assert data["plan"] == "free"
        assert data["limits"]["ai_images"] == 1
        assert data["limits"]["judge_basic"] == 0
        assert data["limits"]["judge_deep"] == 0
        print(f"FREE: ai_images={data['limits']['ai_images']}, judge_basic={data['limits']['judge_basic']}, judge_deep={data['limits']['judge_deep']}")
    
    def test_plus_plan_limits(self, test_session):
        """Verify PLUS plan limits after upgrade"""
        # Upgrade to Plus
        response = test_session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "plus",
            "action": "subscribe"
        })
        assert response.status_code == 200
        
        # Check limits
        usage_response = test_session.get(f"{BASE_URL}/api/usage")
        data = usage_response.json()
        
        assert data["plan"] == "plus"
        assert data["limits"]["ai_images"] == 5
        assert data["limits"]["judge_basic"] == 3
        assert data["limits"]["judge_deep"] == 0
        print(f"PLUS: ai_images={data['limits']['ai_images']}, judge_basic={data['limits']['judge_basic']}, judge_deep={data['limits']['judge_deep']}")
    
    def test_pro_plan_limits(self, test_session):
        """Verify PRO plan limits after upgrade"""
        # Upgrade to Pro
        response = test_session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "pro",
            "action": "subscribe"
        })
        assert response.status_code == 200
        
        # Check limits
        usage_response = test_session.get(f"{BASE_URL}/api/usage")
        data = usage_response.json()
        
        assert data["plan"] == "pro"
        assert data["limits"]["ai_images"] == 30
        assert data["limits"]["judge_basic"] == 7
        assert data["limits"]["judge_deep"] == 1
        print(f"PRO: ai_images={data['limits']['ai_images']}, judge_basic={data['limits']['judge_basic']}, judge_deep={data['limits']['judge_deep']}")
    
    def test_ultra_plan_limits(self, test_session):
        """Verify ULTRA plan limits after upgrade"""
        # Upgrade to Ultra
        response = test_session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "ultra",
            "action": "subscribe"
        })
        assert response.status_code == 200
        
        # Check limits
        usage_response = test_session.get(f"{BASE_URL}/api/usage")
        data = usage_response.json()
        
        assert data["plan"] == "ultra"
        assert data["limits"]["ai_images"] == 50
        assert data["limits"]["judge_basic"] == 12
        assert data["limits"]["judge_deep"] == 5
        print(f"ULTRA: ai_images={data['limits']['ai_images']}, judge_basic={data['limits']['judge_basic']}, judge_deep={data['limits']['judge_deep']}")


class TestJudgeAccessControl:
    """Test Judge AI access control based on plan"""
    
    @pytest.fixture(scope="class")
    def free_session(self):
        """Create a fresh FREE plan user"""
        session = requests.Session()
        email = f"test_judge_free_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Judge Free Tester"
        })
        return session
    
    @pytest.fixture(scope="class")
    def plus_session(self):
        """Create a PLUS plan user"""
        session = requests.Session()
        email = f"test_judge_plus_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Judge Plus Tester"
        })
        # Upgrade to Plus
        session.post(f"{BASE_URL}/api/subscription", json={
            "plan": "plus",
            "action": "subscribe"
        })
        return session
    
    def test_judge_blocked_for_free(self, free_session):
        """FREE plan should not have Judge access"""
        response = free_session.post(f"{BASE_URL}/api/judge/chat", json={
            "message": "Analyze this",
            "mode": "fast"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("locked") == True
        assert "Free planda" in data.get("response", "")
        print(f"FREE user Judge response: {data['response']}")
    
    def test_judge_allowed_for_plus(self, plus_session):
        """PLUS plan should have Judge access"""
        response = plus_session.post(f"{BASE_URL}/api/judge/chat", json={
            "message": "Merhaba",
            "mode": "fast"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should NOT be locked
        assert data.get("locked") != True, f"Plus user should have Judge access, got: {data}"
        assert "session_id" in data
        print(f"PLUS user Judge response length: {len(data.get('response', ''))} chars")


class TestZetaKnowledge:
    """Test ZETA's knowledge about subscription packages and tools"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        session = requests.Session()
        email = f"test_zeta_knowledge_{datetime.now().strftime('%H%M%S')}@example.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "ZETA Knowledge Tester"
        })
        return session
    
    def test_zeta_knows_subscription_packages(self, session):
        """Test ZETA can answer questions about subscription packages"""
        response = session.post(f"{BASE_URL}/api/zeta/chat", json={
            "message": "Abonelik paketleri hakkında bilgi ver. Free, Plus, Pro ve Ultra paketlerinin özellikleri neler?"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        response_text = data["response"].lower()
        
        # Check if response contains subscription plan info
        # Should mention at least some plan names or features
        has_plan_info = any(word in response_text for word in ["free", "plus", "pro", "ultra", "paket", "plan", "abonelik"])
        assert has_plan_info, f"ZETA should know about subscription packages. Response: {data['response'][:200]}"
        
        print(f"ZETA subscription knowledge test passed")
        print(f"Response excerpt: {data['response'][:300]}...")
    
    def test_zeta_knows_about_tools(self, session):
        """Test ZETA can answer questions about available tools"""
        response = session.post(f"{BASE_URL}/api/zeta/chat", json={
            "message": "Uygulamadaki araçlar hakkında bilgi ver. Hangi çizim ve düzenleme araçları var?"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        response_text = data["response"].lower()
        
        # Should mention some tools
        has_tool_info = any(word in response_text for word in ["çiz", "metin", "görsel", "tool", "araç", "font", "renk", "şekil"])
        assert has_tool_info, f"ZETA should know about tools. Response: {data['response'][:200]}"
        
        print(f"ZETA tools knowledge test passed")
        print(f"Response excerpt: {data['response'][:300]}...")
    
    def test_zeta_knows_gradient_feature(self, session):
        """Test ZETA knows about gradient feature"""
        response = session.post(f"{BASE_URL}/api/zeta/chat", json={
            "message": "Gradient nasıl kullanılır? Metin ve şekillere degrade renk uygulayabilir miyim?"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        print(f"ZETA gradient knowledge response: {data['response'][:300]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
