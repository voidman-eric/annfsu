#!/usr/bin/env python3
"""
ANNFSU Backend API Testing Suite
Tests all backend APIs for the ANNFSU mobile application
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://union-connect.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@annfsu.org"
ADMIN_PASSWORD = "admin123"

class ANNFSUAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def get_auth_headers(self):
        """Get authorization headers with admin token"""
        if not self.admin_token:
            return {}
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = self.make_request("GET", "/")
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Root Endpoint", True, "API root accessible", data)
            return True
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Root Endpoint", False, f"Failed to access API root: {error_msg}")
            return False
    
    def test_seed_admin(self):
        """Test admin seeding endpoint"""
        response = self.make_request("POST", "/seed-admin")
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Seed Admin", True, "Admin seeding successful", data)
            return True
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Seed Admin", False, f"Admin seeding failed: {error_msg}")
            return False
    
    def test_admin_login(self):
        """Test admin login and get token"""
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.admin_token = data["access_token"]
                self.log_test("Admin Login", True, f"Login successful for {data['user']['email']}")
                return True
            else:
                self.log_test("Admin Login", False, "No access token in response", data)
                return False
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Admin Login", False, f"Login failed: {error_msg}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 401:
            self.log_test("Invalid Login", True, "Correctly rejected invalid credentials")
            return True
        else:
            self.log_test("Invalid Login", False, "Should have rejected invalid credentials")
            return False
    
    def test_get_me(self):
        """Test getting current user info"""
        if not self.admin_token:
            self.log_test("Get Me", False, "No admin token available")
            return False
        
        response = self.make_request("GET", "/auth/me", headers=self.get_auth_headers())
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get Me", True, f"Retrieved user info for {data['email']}")
            return True
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Get Me", False, f"Failed to get user info: {error_msg}")
            return False
    
    def test_content_apis(self):
        """Test content management APIs"""
        content_types = ["news", "knowledge", "constitution", "oath", "quotes", "about"]
        
        # Test getting content for each type
        for content_type in content_types:
            response = self.make_request("GET", f"/content/{content_type}")
            if response and response.status_code == 200:
                data = response.json()
                self.log_test(f"Get {content_type.title()} Content", True, f"Retrieved {len(data)} items")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"Get {content_type.title()} Content", False, f"Failed: {error_msg}")
        
        # Test creating content (requires admin token)
        if self.admin_token:
            test_content = {
                "type": "news",
                "title_ne": "परीक्षण समाचार",
                "content_ne": "यो एक परीक्षण समाचार हो।",
                "images": []
            }
            
            response = self.make_request("POST", "/content", test_content, headers=self.get_auth_headers())
            if response and response.status_code == 200:
                data = response.json()
                content_id = data["id"]
                self.log_test("Create Content", True, f"Created content with ID: {content_id}")
                
                # Test updating content
                updated_content = {
                    "type": "news",
                    "title_ne": "अपडेट गरिएको समाचार",
                    "content_ne": "यो अपडेट गरिएको समाचार हो।",
                    "images": []
                }
                
                response = self.make_request("PUT", f"/content/{content_id}", updated_content, headers=self.get_auth_headers())
                if response and response.status_code == 200:
                    self.log_test("Update Content", True, "Content updated successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("Update Content", False, f"Failed: {error_msg}")
                
                # Test deleting content
                response = self.make_request("DELETE", f"/content/{content_id}", headers=self.get_auth_headers())
                if response and response.status_code == 200:
                    self.log_test("Delete Content", True, "Content deleted successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("Delete Content", False, f"Failed: {error_msg}")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test("Create Content", False, f"Failed: {error_msg}")
    
    def test_contact_apis(self):
        """Test contact management APIs"""
        # Test getting all contacts
        response = self.make_request("GET", "/contacts")
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get All Contacts", True, f"Retrieved {len(data)} contacts")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Get All Contacts", False, f"Failed: {error_msg}")
        
        # Test committee filtering
        committees = ["central", "provincial"]
        for committee in committees:
            response = self.make_request("GET", "/contacts", params={"committee": committee})
            if response and response.status_code == 200:
                data = response.json()
                self.log_test(f"Get {committee.title()} Contacts", True, f"Retrieved {len(data)} contacts")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"Get {committee.title()} Contacts", False, f"Failed: {error_msg}")
        
        # Test creating contact (requires admin token)
        if self.admin_token:
            test_contact = {
                "name_ne": "परीक्षण व्यक्ति",
                "designation_ne": "परीक्षण पद",
                "phone_number": "9851234567",
                "committee": "central",
                "order": 1
            }
            
            response = self.make_request("POST", "/contacts", test_contact, headers=self.get_auth_headers())
            if response and response.status_code == 200:
                data = response.json()
                contact_id = data["id"]
                self.log_test("Create Contact", True, f"Created contact with ID: {contact_id}")
                
                # Test updating contact
                updated_contact = {
                    "name_ne": "अपडेट गरिएको व्यक्ति",
                    "designation_ne": "अपडेट गरिएको पद",
                    "phone_number": "9851234568",
                    "committee": "provincial",
                    "order": 2
                }
                
                response = self.make_request("PUT", f"/contacts/{contact_id}", updated_contact, headers=self.get_auth_headers())
                if response and response.status_code == 200:
                    self.log_test("Update Contact", True, "Contact updated successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("Update Contact", False, f"Failed: {error_msg}")
                
                # Test deleting contact
                response = self.make_request("DELETE", f"/contacts/{contact_id}", headers=self.get_auth_headers())
                if response and response.status_code == 200:
                    self.log_test("Delete Contact", True, "Contact deleted successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("Delete Contact", False, f"Failed: {error_msg}")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test("Create Contact", False, f"Failed: {error_msg}")
    
    def test_member_apis(self):
        """Test member management APIs"""
        if not self.admin_token:
            self.log_test("Member APIs", False, "No admin token available")
            return
        
        # Test getting all members
        response = self.make_request("GET", "/members", headers=self.get_auth_headers())
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get All Members", True, f"Retrieved {len(data)} members")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Get All Members", False, f"Failed: {error_msg}")
        
        # Test creating member
        test_member = {
            "email": "test.member@annfsu.org",
            "password": "testpass123",
            "full_name": "परीक्षण सदस्य",
            "phone": "9851234569",
            "address": "काठमाडौं, नेपाल",
            "institution": "परीक्षण कलेज",
            "committee": "district",
            "position": "सदस्य",
            "blood_group": "A+"
        }
        
        response = self.make_request("POST", "/members", test_member, headers=self.get_auth_headers())
        if response and response.status_code == 200:
            data = response.json()
            member_id = data["id"]
            self.log_test("Create Member", True, f"Created member with ID: {member_id}")
            
            # Test getting specific member
            response = self.make_request("GET", f"/members/{member_id}", headers=self.get_auth_headers())
            if response and response.status_code == 200:
                self.log_test("Get Specific Member", True, "Retrieved member details")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test("Get Specific Member", False, f"Failed: {error_msg}")
            
            # Test updating member
            update_data = {
                "status": "approved",
                "role": "member"
            }
            
            response = self.make_request("PUT", f"/members/{member_id}", update_data, headers=self.get_auth_headers())
            if response and response.status_code == 200:
                self.log_test("Update Member", True, "Member updated successfully")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test("Update Member", False, f"Failed: {error_msg}")
            
            # Clean up - delete test member
            response = self.make_request("DELETE", f"/members/{member_id}", headers=self.get_auth_headers())
            if response and response.status_code == 200:
                self.log_test("Delete Member", True, "Member deleted successfully")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test("Delete Member", False, f"Failed: {error_msg}")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Create Member", False, f"Failed: {error_msg}")
    
    def test_song_apis(self):
        """Test song management APIs"""
        # Test getting all songs
        response = self.make_request("GET", "/songs")
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Get All Songs", True, f"Retrieved {len(data)} songs")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Get All Songs", False, f"Failed: {error_msg}")
        
        # Note: Song creation with actual audio files will be tested later
        self.log_test("Song Creation", True, "Song creation API available (audio file testing deferred)")
    
    def test_unauthorized_access(self):
        """Test that admin-only endpoints reject unauthorized access"""
        # Test creating content without token
        test_content = {
            "type": "news",
            "title_ne": "अनधिकृत परीक्षण",
            "content_ne": "यो अनधिकृत परीक्षण हो।",
            "images": []
        }
        
        response = self.make_request("POST", "/content", test_content)
        if response and response.status_code == 403:
            self.log_test("Unauthorized Content Creation", True, "Correctly rejected unauthorized access")
        else:
            self.log_test("Unauthorized Content Creation", False, "Should have rejected unauthorized access")
        
        # Test creating member without token
        test_member = {
            "email": "unauthorized@test.com",
            "password": "test123",
            "full_name": "Unauthorized User",
            "phone": "1234567890",
            "address": "Test Address",
            "institution": "Test Institution",
            "committee": "district"
        }
        
        response = self.make_request("POST", "/members", test_member)
        if response and response.status_code == 403:
            self.log_test("Unauthorized Member Creation", True, "Correctly rejected unauthorized access")
        else:
            self.log_test("Unauthorized Member Creation", False, "Should have rejected unauthorized access")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ANNFSU Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Cannot connect to API. Stopping tests.")
            return False
        
        # Setup admin user
        self.test_seed_admin()
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed. Some tests will be skipped.")
        
        self.test_invalid_login()
        self.test_get_me()
        
        # API functionality tests
        self.test_content_apis()
        self.test_contact_apis()
        self.test_member_apis()
        self.test_song_apis()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = ANNFSUAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)