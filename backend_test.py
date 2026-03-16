#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ZETBackendTester:
    def __init__(self, base_url="https://brainstorm-ai-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = "test_session_1772804464509"
        self.test_user_id = "test-user-1772804464509"
        self.test_email = "test@zetmindshare.com"
        self.tests_run = 0
        self.tests_passed = 0
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        self.cookies = {'session_token': self.session_token}

    def log_test(self, name, status, details=""):
        self.tests_run += 1
        if status == "PASS":
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/")
            if response.status_code == 200:
                data = response.json()
                if "ZET Mindshare API" in data.get("message", ""):
                    self.log_test("Root Endpoint", "PASS", f"- Status: {response.status_code}")
                    return True
            self.log_test("Root Endpoint", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("Root Endpoint", "FAIL", f"- Error: {str(e)}")
            return False

    def test_auth_me(self):
        """Test authentication with test session token"""
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=self.headers)
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get("user_id") == self.test_user_id:
                    self.log_test("Auth /me", "PASS", f"- User: {user_data.get('name', 'N/A')}")
                    return True
            self.log_test("Auth /me", "FAIL", f"- Status: {response.status_code}, Response: {response.text}")
            return False
        except Exception as e:
            self.log_test("Auth /me", "FAIL", f"- Error: {str(e)}")
            return False

    def test_documents_list(self):
        """Test getting user documents"""
        try:
            response = requests.get(f"{self.api_url}/documents", headers=self.headers)
            if response.status_code == 200:
                docs = response.json()
                self.log_test("Documents List", "PASS", f"- Found {len(docs)} documents")
                return True, docs
            self.log_test("Documents List", "FAIL", f"- Status: {response.status_code}")
            return False, []
        except Exception as e:
            self.log_test("Documents List", "FAIL", f"- Error: {str(e)}")
            return False, []

    def test_create_document(self):
        """Test creating a new document"""
        try:
            doc_data = {
                "title": f"Test Document {datetime.now().strftime('%H:%M:%S')}",
                "doc_type": "document"
            }
            response = requests.post(f"{self.api_url}/documents", 
                                   headers=self.headers, json=doc_data)
            if response.status_code == 200:
                doc = response.json()
                doc_id = doc.get("doc_id")
                if doc_id:
                    self.log_test("Create Document", "PASS", f"- Created doc_id: {doc_id}")
                    return True, doc_id
            self.log_test("Create Document", "FAIL", f"- Status: {response.status_code}")
            return False, None
        except Exception as e:
            self.log_test("Create Document", "FAIL", f"- Error: {str(e)}")
            return False, None

    def test_get_document(self, doc_id):
        """Test retrieving a specific document"""
        try:
            response = requests.get(f"{self.api_url}/documents/{doc_id}", headers=self.headers)
            if response.status_code == 200:
                doc = response.json()
                self.log_test("Get Document", "PASS", f"- Title: {doc.get('title', 'N/A')}")
                return True
            self.log_test("Get Document", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("Get Document", "FAIL", f"- Error: {str(e)}")
            return False

    def test_update_document(self, doc_id):
        """Test updating a document"""
        try:
            update_data = {
                "title": f"Updated Test Document {datetime.now().strftime('%H:%M:%S')}",
                "content": {"test": "content"}
            }
            response = requests.put(f"{self.api_url}/documents/{doc_id}",
                                  headers=self.headers, json=update_data)
            if response.status_code == 200:
                self.log_test("Update Document", "PASS")
                return True
            self.log_test("Update Document", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("Update Document", "FAIL", f"- Error: {str(e)}")
            return False

    def test_notes_list(self):
        """Test getting user notes"""
        try:
            response = requests.get(f"{self.api_url}/notes", headers=self.headers)
            if response.status_code == 200:
                notes = response.json()
                self.log_test("Notes List", "PASS", f"- Found {len(notes)} notes")
                return True, notes
            self.log_test("Notes List", "FAIL", f"- Status: {response.status_code}")
            return False, []
        except Exception as e:
            self.log_test("Notes List", "FAIL", f"- Error: {str(e)}")
            return False, []

    def test_create_note(self):
        """Test creating a quick note"""
        try:
            note_data = {
                "content": f"Test note created at {datetime.now().strftime('%H:%M:%S')}"
            }
            response = requests.post(f"{self.api_url}/notes",
                                   headers=self.headers, json=note_data)
            if response.status_code == 200:
                note = response.json()
                note_id = note.get("note_id")
                if note_id:
                    self.log_test("Create Note", "PASS", f"- Created note_id: {note_id}")
                    return True, note_id
            self.log_test("Create Note", "FAIL", f"- Status: {response.status_code}")
            return False, None
        except Exception as e:
            self.log_test("Create Note", "FAIL", f"- Error: {str(e)}")
            return False, None

    def test_zeta_chat(self):
        """Test ZETA AI chat functionality"""
        try:
            chat_data = {
                "message": "Hello ZETA, this is a test message. Please respond briefly.",
                "session_id": f"test_session_{datetime.now().strftime('%H%M%S')}"
            }
            response = requests.post(f"{self.api_url}/zeta/chat",
                                   headers=self.headers, json=chat_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("response") and result.get("session_id"):
                    self.log_test("ZETA Chat", "PASS", f"- Response length: {len(result['response'])}")
                    return True
            self.log_test("ZETA Chat", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("ZETA Chat", "FAIL", f"- Error: {str(e)}")
            return False

    def test_cloud_endpoints(self):
        """Test mocked cloud storage endpoints"""
        endpoints = [
            "/cloud/google-drive/files",
            "/cloud/icloud/files"
        ]
        
        all_passed = True
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.api_url}{endpoint}", headers=self.headers)
                if response.status_code == 200:
                    data = response.json()
                    if "files" in data:
                        self.log_test(f"Cloud {endpoint}", "PASS", "- Mocked endpoint working")
                    else:
                        self.log_test(f"Cloud {endpoint}", "FAIL", "- Invalid response format")
                        all_passed = False
                else:
                    self.log_test(f"Cloud {endpoint}", "FAIL", f"- Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Cloud {endpoint}", "FAIL", f"- Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_delete_document(self, doc_id):
        """Test deleting a document"""
        try:
            response = requests.delete(f"{self.api_url}/documents/{doc_id}", headers=self.headers)
            if response.status_code == 200:
                self.log_test("Delete Document", "PASS")
                return True
            self.log_test("Delete Document", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("Delete Document", "FAIL", f"- Error: {str(e)}")
            return False

    def test_delete_note(self, note_id):
        """Test deleting a note"""
        try:
            response = requests.delete(f"{self.api_url}/notes/{note_id}", headers=self.headers)
            if response.status_code == 200:
                self.log_test("Delete Note", "PASS")
                return True
            self.log_test("Delete Note", "FAIL", f"- Status: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("Delete Note", "FAIL", f"- Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print("🚀 Starting ZET Mindshare Backend API Tests")
        print(f"📍 Testing against: {self.api_url}")
        print(f"🔑 Using session token: {self.session_token}")
        print("-" * 60)

        # Core API Tests
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed - stopping tests")
            return False

        if not self.test_auth_me():
            print("❌ Authentication failed - stopping tests")
            return False

        # Document CRUD Tests
        success, existing_docs = self.test_documents_list()
        
        # Create a new document for testing
        success, test_doc_id = self.test_create_document()
        if success and test_doc_id:
            self.test_get_document(test_doc_id)
            self.test_update_document(test_doc_id)
            self.test_delete_document(test_doc_id)

        # Notes CRUD Tests
        success, existing_notes = self.test_notes_list()
        
        # Create a new note for testing
        success, test_note_id = self.test_create_note()
        if success and test_note_id:
            self.test_delete_note(test_note_id)

        # AI and Cloud Tests
        self.test_zeta_chat()
        self.test_cloud_endpoints()

        # Summary
        print("-" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API testing successful!")
            return True
        else:
            print("⚠️  Some backend issues detected")
            return False

def main():
    tester = ZETBackendTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())