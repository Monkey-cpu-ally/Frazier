#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HyperAxelAPITester:
    def __init__(self, base_url="https://agent-platform-73.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            result = {
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_size": len(response.text) if response.text else 0
            }

            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    result["response_data"] = response_data
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    result["response_text"] = response.text[:100]
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                result["error_response"] = response.text[:200]

            self.results.append(result)
            return success, response.json() if success and response.text else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            result = {
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.results.append(result)
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Unexpected Error: {str(e)}")
            result = {
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e)
            }
            self.results.append(result)
            return False, {}

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success:
            expected_fields = ["status", "game"]
            for field in expected_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in health response")
                    return False
            if response.get("status") != "ok":
                print(f"⚠️  Warning: Health status is not 'ok': {response.get('status')}")
                return False
            if response.get("game") != "Hyper Axel":
                print(f"⚠️  Warning: Game name mismatch: {response.get('game')}")
                return False
        return success

    def test_api_root(self):
        """Test the API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET", 
            "api/",
            200
        )
        if success and "message" not in response:
            print("⚠️  Warning: Missing 'message' field in API root response")
            return False
        return success

    def test_score_submission(self):
        """Test score submission endpoint"""
        test_score_data = {
            "score": 1500,
            "coins": 25,
            "level": 3
        }
        
        success, response = self.run_test(
            "Score Submission",
            "POST",
            "api/scores",
            200,
            data=test_score_data
        )
        
        if success:
            # Verify response structure
            expected_fields = ["id", "score", "coins", "level", "timestamp"]
            for field in expected_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in score response")
                    return False
            
            # Verify data integrity
            if response.get("score") != test_score_data["score"]:
                print(f"⚠️  Warning: Score mismatch - sent {test_score_data['score']}, got {response.get('score')}")
                return False
            if response.get("coins") != test_score_data["coins"]:
                print(f"⚠️  Warning: Coins mismatch - sent {test_score_data['coins']}, got {response.get('coins')}")
                return False
            if response.get("level") != test_score_data["level"]:
                print(f"⚠️  Warning: Level mismatch - sent {test_score_data['level']}, got {response.get('level')}")
                return False
                
            # Store the ID for potential cleanup
            self.last_score_id = response.get("id")
            
        return success

    def test_top_scores_retrieval(self):
        """Test top scores retrieval endpoint"""
        success, response = self.run_test(
            "Top Scores Retrieval",
            "GET",
            "api/scores/top",
            200
        )
        
        if success:
            # Verify response is a list
            if not isinstance(response, list):
                print(f"⚠️  Warning: Expected list, got {type(response)}")
                return False
            
            # If there are scores, verify structure
            if len(response) > 0:
                score_entry = response[0]
                expected_fields = ["score", "coins", "level", "timestamp"]
                for field in expected_fields:
                    if field not in score_entry:
                        print(f"⚠️  Warning: Missing field '{field}' in score entry")
                        return False
                        
                # Verify scores are sorted (highest first)
                if len(response) > 1:
                    for i in range(len(response) - 1):
                        if response[i]["score"] < response[i + 1]["score"]:
                            print("⚠️  Warning: Scores are not sorted in descending order")
                            return False
            
            print(f"   Found {len(response)} score entries")
            
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return appropriate errors"""
        success, _ = self.run_test(
            "Invalid Endpoint",
            "GET",
            "api/nonexistent",
            404
        )
        return success

    def test_invalid_score_data(self):
        """Test score submission with invalid data"""
        invalid_data = {
            "score": "invalid",  # Should be int
            "coins": -5,         # Negative value
            "level": "abc"       # Should be int
        }
        
        # This might return 422 (validation error) or 400 (bad request)
        # We'll accept either as valid error handling
        success, _ = self.run_test(
            "Invalid Score Data",
            "POST",
            "api/scores",
            422,  # FastAPI validation error
            data=invalid_data
        )
        
        if not success:
            # Try with 400 status code
            success, _ = self.run_test(
                "Invalid Score Data (400)",
                "POST", 
                "api/scores",
                400,
                data=invalid_data
            )
        
        return success

def main():
    print("🎮 Starting Hyper Axel Backend API Tests")
    print("=" * 50)
    
    tester = HyperAxelAPITester()
    
    # Run all tests
    test_results = []
    
    print("\n📡 Testing Core Endpoints...")
    test_results.append(("Health Check", tester.test_health_endpoint()))
    test_results.append(("API Root", tester.test_api_root()))
    
    print("\n🏆 Testing Score System...")
    test_results.append(("Score Submission", tester.test_score_submission()))
    test_results.append(("Top Scores Retrieval", tester.test_top_scores_retrieval()))
    
    print("\n🚫 Testing Error Handling...")
    test_results.append(("Invalid Endpoint", tester.test_invalid_endpoints()))
    test_results.append(("Invalid Score Data", tester.test_invalid_score_data()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed_tests = []
    failed_tests = []
    
    for test_name, result in test_results:
        if result:
            passed_tests.append(test_name)
            print(f"✅ {test_name}")
        else:
            failed_tests.append(test_name)
            print(f"❌ {test_name}")
    
    print(f"\n🎯 Overall Results: {len(passed_tests)}/{len(test_results)} tests passed")
    print(f"📈 Success Rate: {(len(passed_tests)/len(test_results)*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(test_results),
            "passed_tests": len(passed_tests),
            "failed_tests": len(failed_tests),
            "success_rate": len(passed_tests)/len(test_results)*100,
            "test_details": tester.results,
            "passed_test_names": passed_tests,
            "failed_test_names": failed_tests
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    # Return appropriate exit code
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())