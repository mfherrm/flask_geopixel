"""
RunPod API integration module for GeoPixel Flask application.

This module handles all RunPod-related functionality including:
- API key management
- Pod discovery and status checking
- Health checks and proxy operations
- Template-based pod management
"""

import os
import json
import requests
from flask import Blueprint, request, jsonify, current_app

# Create RunPod Blueprint
runpod_bp = Blueprint('runpod', __name__)

# Global variable to store the RunPod API key temporarily
_runpod_api_key = None

def set_runpod_api_key(api_key):
    """Set the RunPod API key for dynamic URL detection"""
    global _runpod_api_key
    _runpod_api_key = api_key

def get_runpod_api_key():
    """Get the RunPod API key from global storage (set by frontend), config, or environment"""
    global _runpod_api_key
    # Priority: 1. Global variable (set by frontend), 2. Config, 3. Environment
    return _runpod_api_key or current_app.config.get('RUNPOD_API_KEY') or os.environ.get('RUNPOD_API_KEY')

def get_active_runpod_url():
    """
    Get the URL of the currently running RunPod instance by querying the RunPod API.
    This function specifically looks for pods with port 5000 (GeoPixel API service).
    
    Returns:
        str: The RunPod API URL if found, None otherwise
    """
    try:
        # Get API key from global storage or environment
        api_key = get_runpod_api_key()
        if not api_key:
            print("No RunPod API key found")
            return None
        
        print(f"Using API key (length: {len(api_key)})")
        
        # Query RunPod API for running pods
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key.strip()}'
        }
        
        query = """
        query {
            myself {
                pods {
                    id
                    name
                    desiredStatus
                    runtime {
                        ports {
                            ip
                            isIpPublic
                            privatePort
                            publicPort
                            type
                        }
                    }
                }
            }
        }
        """
        
        payload = {'query': query}
        
        # Try RunPod endpoints
        endpoints = ['https://api.runpod.io/graphql', 'https://api.runpod.ai/graphql']
        
        for endpoint in endpoints:
            try:
                print(f"Querying {endpoint}...")
                response = requests.post(endpoint, json=payload, headers=headers, timeout=15)
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'data' in data and 'myself' in data['data'] and 'pods' in data['data']['myself']:
                        pods = data['data']['myself']['pods']
                        print(f"Found {len(pods)} pods")
                        
                        # Look for running pods with port 5000 specifically
                        for i, pod in enumerate(pods):
                            pod_id = pod.get('id', 'unknown')
                            pod_name = pod.get('name', 'unknown')
                            pod_status = pod.get('desiredStatus', 'unknown')
                            
                            print(f"Pod {i+1}: {pod_name} ({pod_id}) - Status: {pod_status}")
                            
                            if pod_status == 'RUNNING' and pod.get('runtime'):
                                runtime = pod['runtime']
                                
                                if 'ports' in runtime and runtime['ports']:
                                    ports = runtime['ports']
                                    print(f"  Found {len(ports)} ports")
                                    
                                    # Check if any port is 5000 (GeoPixel API)
                                    has_port_5000 = False
                                    for j, port in enumerate(ports):
                                        private_port = port.get('privatePort')
                                        public_port = port.get('publicPort')
                                        ip = port.get('ip')
                                        is_public = port.get('isIpPublic')
                                        port_type = port.get('type')
                                        
                                        print(f"    Port {j+1}: private={private_port}, public={public_port}, ip={ip}, public={is_public}, type={port_type}")
                                        
                                        # Look specifically for port 5000 (GeoPixel API)
                                        if private_port == 5000 or public_port == 5000:
                                            print(f"    🎯 Found port 5000!")
                                            has_port_5000 = True
                                            break
                                    
                                    # If this pod has port 5000, construct URL using pod ID
                                    if has_port_5000 and pod_id != 'unknown':
                                        # Construct the standard RunPod proxy URL format
                                        endpoint_url = f"https://{pod_id}-5000.proxy.runpod.net/"
                                        print(f"    ✅ Constructed RunPod endpoint using pod ID: {endpoint_url}")
                                        return endpoint_url
                                    elif has_port_5000:
                                        print(f"    ⚠️  Port 5000 found but pod ID is unknown")
                                else:
                                    print("  No ports found in runtime")
                            else:
                                print(f"  Pod not running or no runtime")
                        
                        print("No running pods with port 5000 found")
                        return None
                    else:
                        print(f"Unexpected API response structure")
                        return None
                    
            except Exception as e:
                print(f"Error querying RunPod endpoint {endpoint}: {e}")
                continue
        
        print("Failed to query RunPod API from all endpoints")
        return None
        
    except Exception as e:
        print(f"Error getting active RunPod URL: {e}")
        return None

def check_pod_running_with_template(template_id):
    """
    Check if there's already a pod running with the specified template.
    
    Args:
        template_id (str): The template ID to check for
        
    Returns:
        dict: Dictionary containing pod status information
    """
    try:
        # Get API key from global storage or environment
        api_key = get_runpod_api_key()
        if not api_key:
            print("No RunPod API key found for template check")
            return {
                'running': False,
                'pod_id': None,
                'endpoint_url': None,
                'error': 'No API key available'
            }
        
        print(f"Checking for running pods with template: {template_id}")
        
        # Query RunPod API for running pods
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key.strip()}'
        }
        
        query = """
        query {
            myself {
                pods {
                    id
                    name
                    desiredStatus
                    templateId
                    runtime {
                        ports {
                            ip
                            isIpPublic
                            privatePort
                            publicPort
                            type
                        }
                    }
                }
            }
        }
        """
        
        payload = {'query': query}
        
        # Try RunPod endpoints
        endpoints = ['https://api.runpod.io/graphql', 'https://api.runpod.ai/graphql']
        
        for endpoint in endpoints:
            try:
                print(f"Querying {endpoint} for template check...")
                response = requests.post(endpoint, json=payload, headers=headers, timeout=15)
                print(f"Template check response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'data' in data and 'myself' in data['data'] and 'pods' in data['data']['myself']:
                        pods = data['data']['myself']['pods']
                        print(f"Found {len(pods)} total pods")
                        
                        # Look for running pods with the specified template
                        running_pods_with_port_5000 = []  # Fallback list
                        
                        for pod in pods:
                            pod_id = pod.get('id', 'unknown')
                            pod_name = pod.get('name', 'unknown')
                            pod_status = pod.get('desiredStatus', 'unknown')
                            pod_template_id = pod.get('templateId', '')
                            
                            print(f"Pod: {pod_name} ({pod_id}) - Status: {pod_status}, Template: '{pod_template_id}' (looking for: '{template_id}')")
                            
                            # Enhanced template matching with fallback logic
                            template_match = False
                            
                            # Primary check: exact match (case-insensitive and trimmed)
                            if pod_template_id and template_id:
                                template_match = pod_template_id.strip().lower() == template_id.strip().lower()
                                if template_match:
                                    print(f"✅ Template match found (case-insensitive): {pod_id}")
                            
                            # If running, check for port 5000 regardless of template (fallback)
                            if pod_status == 'RUNNING':
                                has_port_5000 = False
                                if pod.get('runtime') and 'ports' in pod['runtime'] and pod['runtime']['ports']:
                                    for port in pod['runtime']['ports']:
                                        if port.get('privatePort') == 5000 or port.get('publicPort') == 5000:
                                            has_port_5000 = True
                                            break
                                
                                if has_port_5000:
                                    running_pods_with_port_5000.append({
                                        'pod': pod,
                                        'template_match': template_match
                                    })
                                    print(f"Found running pod with port 5000: {pod_id} (template_match: {template_match})")
                            
                            # Check if this pod matches our template and is running
                            if pod_status == 'RUNNING' and template_match:
                                print(f"Found running pod with exact template match: {pod_id}")
                                
                                # Get endpoint URL if available
                                endpoint_url = None
                                if pod.get('runtime') and 'ports' in pod['runtime'] and pod['runtime']['ports']:
                                    ports = pod['runtime']['ports']
                                    
                                    # Look for port 5000 (GeoPixel API)
                                    for port in ports:
                                        private_port = port.get('privatePort')
                                        public_port = port.get('publicPort')
                                        
                                        if private_port == 5000 or public_port == 5000:
                                            # Construct the standard RunPod proxy URL format
                                            endpoint_url = f"https://{pod_id}-5000.proxy.runpod.net/"
                                            print(f"Found endpoint URL: {endpoint_url}")
                                            break
                                
                                return {
                                    'running': True,
                                    'pod_id': pod_id,
                                    'pod_name': pod_name,
                                    'endpoint_url': endpoint_url,
                                    'error': None
                                }
                        
                        # FALLBACK: If no exact template match, but we have running pods with port 5000
                        if running_pods_with_port_5000:
                            print(f"No exact template match, but found {len(running_pods_with_port_5000)} running pods with port 5000")
                            
                            # Prefer any pod that partially matches template (even if not exact)
                            for pod_info in running_pods_with_port_5000:
                                pod = pod_info['pod']
                                pod_id = pod.get('id')
                                pod_name = pod.get('name', 'unknown')
                                pod_template_id = pod.get('templateId', '')
                                
                                # Check for partial template match or use the first available
                                is_likely_match = (
                                    not pod_template_id or  # No template ID stored
                                    template_id in pod_template_id or  # Partial match
                                    pod_template_id in template_id or  # Reverse partial match
                                    len(running_pods_with_port_5000) == 1  # Only one option
                                )
                                
                                if is_likely_match:
                                    # Get endpoint URL
                                    endpoint_url = f"https://{pod_id}-5000.proxy.runpod.net/"
                                    
                                    print(f"🎯 FALLBACK SUCCESS: Using running pod {pod_id} (template: '{pod_template_id}')")
                                    return {
                                        'running': True,
                                        'pod_id': pod_id,
                                        'pod_name': pod_name,
                                        'endpoint_url': endpoint_url,
                                        'error': None
                                    }
                        
                        print(f"No running pods found with template: {template_id}")
                        return {
                            'running': False,
                            'pod_id': None,
                            'endpoint_url': None,
                            'error': None
                        }
                    else:
                        print(f"Unexpected API response structure for template check")
                        return {
                            'running': False,
                            'pod_id': None,
                            'endpoint_url': None,
                            'error': 'Unexpected API response'
                        }
                    
            except Exception as e:
                print(f"Error querying RunPod endpoint {endpoint} for template check: {e}")
                continue
        
        print("Failed to query RunPod API from all endpoints for template check")
        return {
            'running': False,
            'pod_id': None,
            'endpoint_url': None,
            'error': 'Failed to query RunPod API'
        }
        
    except Exception as e:
        print(f"Error checking pod status with template: {e}")
        return {
            'running': False,
            'pod_id': None,
            'endpoint_url': None,
            'error': str(e)
        }

# RunPod Blueprint Routes

@runpod_bp.route('/check-health', methods=['POST'])
def check_health():
    """Enhanced health check that verifies service is fully ready, not just started"""
    import requests
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided', 'available': False}), 400
            
        pod_id = data.get('pod_id')
        
        if not pod_id:
            return jsonify({'error': 'Pod ID is required', 'available': False}), 400
        
        # Construct base URL for the service
        base_url = f'https://{pod_id}-5000.proxy.runpod.net'
        
        # First, check basic health endpoint
        health_url = f'{base_url}/health'
        print(f"Health Check Proxy: Checking {health_url}")
        
        try:
            # Make request to health endpoint with short timeout
            response = requests.get(health_url, timeout=5)
            print(f"Health Check Proxy: Response status {response.status_code}")
            
            if response.status_code == 200:
                try:
                    health_data = response.json()
                    print(f"Health Check Proxy: Response data: {health_data}")
                    
                    # Check if status is "ok"
                    if health_data.get('status') == 'ok':
                        print("Health Check Proxy: ✅ Basic health check passed")
                        
                        # Enhanced readiness check - verify service can handle actual requests
                        print("Health Check Proxy: 🔍 Performing enhanced readiness check...")
                        
                        # Check if service has additional readiness indicators
                        service_ready = True
                        
                        # Check for model loading status if available
                        if 'model_loaded' in health_data:
                            model_loaded = health_data.get('model_loaded')
                            print(f"Health Check Proxy: Model loaded status: {model_loaded}")
                            if not model_loaded:
                                service_ready = False
                                print("Health Check Proxy: ❌ Model not loaded yet")
                        
                        # Check for ready flag if available
                        if 'ready' in health_data:
                            ready_flag = health_data.get('ready')
                            print(f"Health Check Proxy: Ready flag: {ready_flag}")
                            if not ready_flag:
                                service_ready = False
                                print("Health Check Proxy: ❌ Service not ready yet")
                        
                        # If health endpoint doesn't provide readiness info, try a test request
                        if service_ready and 'model_loaded' not in health_data and 'ready' not in health_data:
                            print("Health Check Proxy: 🧪 Testing service with lightweight request...")
                            
                            # Try to make a simple test request to verify service is actually ready
                            try:
                                # Try a lightweight endpoint if available, otherwise skip this test
                                test_endpoints = [
                                    f'{base_url}/api/status',
                                    f'{base_url}/status',
                                    f'{base_url}/ready'
                                ]
                                
                                test_passed = False
                                for test_url in test_endpoints:
                                    try:
                                        test_response = requests.get(test_url, timeout=3)
                                        if test_response.status_code == 200:
                                            print(f"Health Check Proxy: ✅ Test endpoint {test_url} responded")
                                            test_passed = True
                                            break
                                    except:
                                        continue
                                
                                # If no test endpoints work, assume service is ready if basic health passes
                                if not test_passed:
                                    print("Health Check Proxy: ⚠️ No test endpoints available, assuming ready based on health check")
                                    
                            except Exception as e:
                                print(f"Health Check Proxy: ⚠️ Test request failed: {e}")
                                # Don't fail the health check for test request failures
                        
                        if service_ready:
                            print("Health Check Proxy: ✅ Service is fully ready")
                            return jsonify({
                                'available': True,
                                'status': 'ok',
                                'ready': True,
                                'health_data': health_data
                            })
                        else:
                            print("Health Check Proxy: ❌ Service not fully ready yet")
                            return jsonify({
                                'available': False,
                                'status': 'loading',
                                'ready': False,
                                'health_data': health_data
                            })
                        
                    else:
                        print(f"Health Check Proxy: ❌ Status is '{health_data.get('status')}' - not ready")
                        return jsonify({
                            'available': False,
                            'status': health_data.get('status', 'unknown'),
                            'ready': False,
                            'health_data': health_data
                        })
                        
                except json.JSONDecodeError:
                    print("Health Check Proxy: ❌ Invalid JSON response")
                    return jsonify({
                        'available': False,
                        'error': 'Invalid JSON response from health endpoint'
                    })
            else:
                print(f"Health Check Proxy: ❌ HTTP {response.status_code} - endpoint not ready")
                return jsonify({
                    'available': False,
                    'error': f'HTTP {response.status_code}: {response.reason}'
                })
                
        except requests.exceptions.Timeout:
            print("Health Check Proxy: ❌ Request timeout")
            return jsonify({
                'available': False,
                'error': 'Health check timeout'
            })
        except requests.exceptions.RequestException as e:
            print(f"Health Check Proxy: ❌ Request exception: {str(e)}")
            return jsonify({
                'available': False,
                'error': f'Network error: {str(e)}'
            })
            
    except Exception as e:
        print(f"Health Check Proxy: ❌ Unexpected error: {str(e)}")
        return jsonify({
            'available': False,
            'error': f'Server error: {str(e)}'
        }), 500

@runpod_bp.route('/runpod-proxy', methods=['POST'])
def runpod_proxy():
    """Proxy endpoint for RunPod API calls to avoid CORS issues"""
    import requests
    
    try:
        # Get the request data from the frontend
        data = request.get_json()
        api_key = data.get('api_key')
        query = data.get('query')
        variables = data.get('variables', {})
        
        if not api_key or not query:
            return jsonify({'error': 'API key and query are required'}), 400
        
        # Validate and clean the API key
        api_key_cleaned = api_key.strip()
        
        # RunPod API keys should be around 50-60 characters and alphanumeric with some special chars
        if len(api_key_cleaned) > 100:
            print(f"RunPod Proxy: WARNING - API key is unusually long ({len(api_key_cleaned)} chars)")
            print(f"RunPod Proxy: First 50 chars: {api_key_cleaned[:50]}")
            print(f"RunPod Proxy: Last 50 chars: {api_key_cleaned[-50:]}")
            # Try to extract just the API key part if it's concatenated
            # RunPod keys typically start with specific patterns
            import re
            # Look for patterns that might be RunPod API keys
            potential_keys = re.findall(r'[A-Za-z0-9]{40,80}', api_key_cleaned)
            if potential_keys:
                api_key_cleaned = potential_keys[0]
                print(f"RunPod Proxy: Extracted potential API key: {api_key_cleaned[:20]}...")
        
        # Store the cleaned API key for dynamic URL detection
        set_runpod_api_key(api_key_cleaned)
        
        print(f"RunPod Proxy: Using API key length: {len(api_key_cleaned)}")
        print(f"RunPod Proxy: Query: {query[:100]}...")
        
        # Make the request to RunPod API server-side
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key_cleaned}'
        }
        
        payload = {
            'query': query,
            'variables': variables
        }
        
        # Try both endpoints
        endpoints = [
            'https://api.runpod.io/graphql',
            'https://api.runpod.ai/graphql'
        ]
        
        last_error = None
        for endpoint in endpoints:
            try:
                print(f"RunPod Proxy: Trying endpoint {endpoint}")
                response = requests.post(endpoint, json=payload, headers=headers, timeout=30)
                print(f"RunPod Proxy: Response status {response.status_code} from {endpoint}")
                
                if response.status_code == 200:
                    return jsonify(response.json()), 200
                elif response.status_code == 401:
                    print(f"RunPod Proxy: 401 Unauthorized from {endpoint}")
                    print(f"RunPod Proxy: Response text: {response.text}")
                    return jsonify({
                        'error': f'Authentication failed: Invalid API key',
                        'details': f'401 Unauthorized from {endpoint}',
                        'response': response.text
                    }), 401
                elif response.status_code == 404:
                    last_error = f"404 Not Found at {endpoint}"
                    continue
                else:
                    print(f"RunPod Proxy: Error {response.status_code} from {endpoint}: {response.text}")
                    return jsonify({
                        'error': f'RunPod API error: {response.status_code}',
                        'details': response.text,
                        'endpoint': endpoint
                    }), response.status_code
                    
            except requests.exceptions.RequestException as e:
                last_error = f"Request failed for {endpoint}: {str(e)}"
                print(f"RunPod Proxy: Request exception: {last_error}")
                continue
        
        # If we get here, all endpoints failed
        return jsonify({
            'error': 'All RunPod API endpoints failed',
            'details': last_error
        }), 500
        
    except Exception as e:
        return jsonify({'error': f'Proxy error: {str(e)}'}), 500

@runpod_bp.route('/check-pod-status', methods=['POST'])
def check_pod_status_endpoint():
    """Endpoint to check if a pod is running with a specific template"""
    try:
        # Get the request data from the frontend
        data = request.get_json()
        api_key = data.get('api_key')
        template_id = data.get('template_id')
        
        if not api_key or not template_id:
            return jsonify({'error': 'API key and template ID are required'}), 400
        
        # Store the API key for the check
        set_runpod_api_key(api_key.strip())
        
        # Check pod status with template
        pod_status = check_pod_running_with_template(template_id.strip())
        
        return jsonify({
            'success': True,
            'pod_running': pod_status['running'],
            'pod_id': pod_status['pod_id'],
            'pod_name': pod_status.get('pod_name'),
            'endpoint_url': pod_status['endpoint_url'],
            'error': pod_status['error']
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Pod status check error: {str(e)}'}), 500