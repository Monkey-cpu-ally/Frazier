import requests
import sys
import json
from datetime import datetime

class HyperAxelAPITester:
    def __init__(self, base_url="https://agent-platform-73.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": None,
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                    print(f"   Response: {json.dumps(result['response_data'], indent=2)}")
                except:
                    result["response_data"] = response.text
                    print(f"   Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error"] = error_data
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    result["error"] = response.text
                    print(f"   Error: {response.text}")

            self.test_results.append(result)
            return success, result.get("response_data", {})

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": None,
                "success": False,
                "response_data": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_save_score(self):
        """Test saving a score"""
        test_score_data = {
            "score": 1500,
            "coins": 25,
            "level": 2
        }
        
        success, response = self.run_test(
            "Save Score",
            "POST",
            "api/scores",
            200,
            data=test_score_data
        )
        
        if success and response:
            # Verify response contains expected fields
            required_fields = ["id", "score", "coins", "level", "timestamp"]
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in response")
                    return False
            
            # Verify data matches
            if (response.get("score") != test_score_data["score"] or
                response.get("coins") != test_score_data["coins"] or
                response.get("level") != test_score_data["level"]):
                print("⚠️  Warning: Response data doesn't match input data")
                return False
                
        return success

    def test_get_top_scores(self):
        """Test getting top scores"""
        success, response = self.run_test(
            "Get Top Scores",
            "GET",
            "api/scores/top",
            200
        )
        
        if success and response:
            # Verify response is a list
            if not isinstance(response, list):
                print("⚠️  Warning: Response should be a list")
                return False
            
            # If there are scores, verify structure
            if len(response) > 0:
                score_entry = response[0]
                required_fields = ["score", "coins", "level", "timestamp"]
                for field in required_fields:
                    if field not in score_entry:
                        print(f"⚠️  Warning: Missing field '{field}' in score entry")
                        return False
        
        return success

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "api/",
            200
        )
        return success

def main():
    print("🎮 Starting Hyper Axel Backend API Tests")
    print("=" * 50)
    
    tester = HyperAxelAPITester()
    
    # Run all tests
    tests = [
        ("Health Check", tester.test_health_endpoint),
        ("API Root", tester.test_api_root),
        ("Save Score", tester.test_save_score),
        ("Get Top Scores", tester.test_get_top_scores),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())