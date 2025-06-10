#!/usr/bin/env python3
"""
Test script to verify dynamic endpoint URL detection works correctly.
This test simulates RunPod API responses and validates the detection logic.
"""

import os
import sys
import json
from unittest.mock import patch, MagicMock

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app
from app.static.views import get_active_runpod_url, set_runpod_api_key

def create_mock_runpod_response(pods_data):
    """Create a mock RunPod API response"""
    return {
        "data": {
            "myself": {
                "pods": pods_data
            }
        }
    }

def test_scenario_1_proxy_url():
    """Test detection with proxy URL format (most common)"""
    print("🧪 Test 1: Proxy URL Detection")
    print("-" * 40)
    
    # Mock pod with proxy URL
    mock_pods = [{
        "id": "test-pod-1",
        "name": "geopixel-pod",
        "desiredStatus": "RUNNING",
        "runtime": {
            "ports": [{
                "ip": "abc123xyz-5000.proxy.runpod.net",
                "isIpPublic": True,
                "privatePort": 5000,
                "publicPort": 5000,
                "type": "http"
            }]
        }
    }]
    
    mock_response = create_mock_runpod_response(mock_pods)
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        # Set a test API key
        set_runpod_api_key("test-api-key-12345")
        
        app = create_app()
        with app.app_context():
            detected_url = get_active_runpod_url()
            
            expected_url = "https://abc123xyz-5000.proxy.runpod.net/"
            
            if detected_url == expected_url:
                print(f"✅ SUCCESS: Detected {detected_url}")
                return True
            else:
                print(f"❌ FAILED: Expected {expected_url}, got {detected_url}")
                return False

def test_scenario_2_direct_ip():
    """Test detection with direct IP and port"""
    print("\n🧪 Test 2: Direct IP Detection")
    print("-" * 40)
    
    # Mock pod with direct IP
    mock_pods = [{
        "id": "test-pod-2",
        "name": "geopixel-pod",
        "desiredStatus": "RUNNING",
        "runtime": {
            "ports": [{
                "ip": "203.0.113.42",
                "isIpPublic": True,
                "privatePort": 5000,
                "publicPort": 8080,
                "type": "http"
            }]
        }
    }]
    
    mock_response = create_mock_runpod_response(mock_pods)
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        set_runpod_api_key("test-api-key-12345")
        
        app = create_app()
        with app.app_context():
            detected_url = get_active_runpod_url()
            
            expected_url = "https://203.0.113.42:8080/"
            
            if detected_url == expected_url:
                print(f"✅ SUCCESS: Detected {detected_url}")
                return True
            else:
                print(f"❌ FAILED: Expected {expected_url}, got {detected_url}")
                return False

def test_scenario_3_no_running_pods():
    """Test when no running pods are found"""
    print("\n🧪 Test 3: No Running Pods")
    print("-" * 40)
    
    # Mock response with stopped pods
    mock_pods = [{
        "id": "test-pod-3",
        "name": "geopixel-pod",
        "desiredStatus": "STOPPED",
        "runtime": None
    }]
    
    mock_response = create_mock_runpod_response(mock_pods)
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        set_runpod_api_key("test-api-key-12345")
        
        app = create_app()
        with app.app_context():
            detected_url = get_active_runpod_url()
            
            if detected_url is None:
                print("✅ SUCCESS: Correctly returned None for no running pods")
                return True
            else:
                print(f"❌ FAILED: Expected None, got {detected_url}")
                return False

def test_scenario_4_multiple_pods():
    """Test with multiple pods - should pick the one with port 5000"""
    print("\n🧪 Test 4: Multiple Pods Priority")
    print("-" * 40)
    
    # Mock multiple pods - should prioritize port 5000
    mock_pods = [
        {
            "id": "test-pod-4a",
            "name": "jupyter-pod",
            "desiredStatus": "RUNNING",
            "runtime": {
                "ports": [{
                    "ip": "jupyter123-8888.proxy.runpod.net",
                    "isIpPublic": True,
                    "privatePort": 8888,
                    "publicPort": 8888,
                    "type": "http"
                }]
            }
        },
        {
            "id": "test-pod-4b",
            "name": "geopixel-pod",
            "desiredStatus": "RUNNING",
            "runtime": {
                "ports": [{
                    "ip": "geopixel456-5000.proxy.runpod.net",
                    "isIpPublic": True,
                    "privatePort": 5000,
                    "publicPort": 5000,
                    "type": "http"
                }]
            }
        }
    ]
    
    mock_response = create_mock_runpod_response(mock_pods)
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        set_runpod_api_key("test-api-key-12345")
        
        app = create_app()
        with app.app_context():
            detected_url = get_active_runpod_url()
            
            expected_url = "https://geopixel456-5000.proxy.runpod.net/"
            
            if detected_url == expected_url:
                print(f"✅ SUCCESS: Correctly prioritized port 5000: {detected_url}")
                return True
            else:
                print(f"❌ FAILED: Expected {expected_url}, got {detected_url}")
                return False

def test_scenario_5_api_error():
    """Test API error handling"""
    print("\n🧪 Test 5: API Error Handling")
    print("-" * 40)
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 401
        mock_post.return_value.text = "Unauthorized"
        
        set_runpod_api_key("invalid-api-key")
        
        app = create_app()
        with app.app_context():
            detected_url = get_active_runpod_url()
            
            if detected_url is None:
                print("✅ SUCCESS: Correctly handled API error")
                return True
            else:
                print(f"❌ FAILED: Expected None for API error, got {detected_url}")
                return False

def test_scenario_6_no_api_key():
    """Test behavior when no API key is available"""
    print("\n🧪 Test 6: No API Key")
    print("-" * 40)
    
    # Clear any existing API key
    set_runpod_api_key(None)
    
    app = create_app()
    with app.app_context():
        detected_url = get_active_runpod_url()
        
        if detected_url is None:
            print("✅ SUCCESS: Correctly returned None when no API key")
            return True
        else:
            print(f"❌ FAILED: Expected None for no API key, got {detected_url}")
            return False

def test_real_api_call():
    """Test with real API call if API key is available"""
    print("\n🧪 Test 7: Real API Call (if API key available)")
    print("-" * 40)
    
    app = create_app()
    with app.app_context():
        # Check if real API key is available
        from app.static.views import get_runpod_api_key
        real_api_key = get_runpod_api_key()
        
        if real_api_key:
            print(f"Real API key found (length: {len(real_api_key)})")
            print("Making real API call...")
            
            detected_url = get_active_runpod_url()
            
            if detected_url:
                print(f"✅ SUCCESS: Real detection worked: {detected_url}")
                return True
            else:
                print("❌ Real detection failed (but this might be expected if no pods are running)")
                return False
        else:
            print("⚠️  No real API key available - skipping real API test")
            print("   To test with real API: add RUNPOD_API_KEY to .env file")
            return True

def main():
    """Run all endpoint detection tests"""
    print("🧪 Dynamic Endpoint URL Detection Test Suite")
    print("=" * 50)
    
    tests = [
        ("Proxy URL Detection", test_scenario_1_proxy_url),
        ("Direct IP Detection", test_scenario_2_direct_ip),
        ("No Running Pods", test_scenario_3_no_running_pods),
        ("Multiple Pods Priority", test_scenario_4_multiple_pods),
        ("API Error Handling", test_scenario_5_api_error),
        ("No API Key", test_scenario_6_no_api_key),
        ("Real API Call", test_real_api_call),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status}: {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Dynamic detection logic is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the logic in get_active_runpod_url()")

if __name__ == '__main__':
    main()