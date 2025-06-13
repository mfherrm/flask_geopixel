/**
 * RunPod Manager Class
 * Handles all RunPod API interactions, pod management, and status monitoring
 * Updated 2025-06-10-11:44
 */

class RunPodManager {
    constructor() {
        this.currentPodId = null;
        this.statusCheckInterval = null;
        this.healthCheckInterval = null; // New: dedicated health check interval
        this.apiBaseUrl = '/runpod-proxy';
        this.shouldCheckEndpointHealth = false; // Only check endpoint health when needed
        this.endpointAvailable = false; // Track if endpoint is confirmed available
        this.initializeEventListeners();
        this.clearStaleData();
        this.loadSavedCredentials();
        this.setInitialButtonStates();
        this.checkInitialPodStatus();
    }

    initializeEventListeners() {
        document.getElementById('runpod-test').addEventListener('click', () => this.testConnection());
        document.getElementById('runpod-start').addEventListener('click', () => this.startPod());
        document.getElementById('runpod-stop').addEventListener('click', () => this.stopPod());
        
        // Save credentials when they change and check pod status
        document.getElementById('runpod-api-key').addEventListener('change', () => {
            this.saveCredentials();
            this.checkPodStatusOnChange();
        });
        document.getElementById('runpod-template-id').addEventListener('change', () => {
            this.saveCredentials();
            this.checkPodStatusOnChange();
        });
    }

    clearStaleData() {
        console.log('Clearing any stale pod state data...');
        
        // Clear any stale pod ID that might be cached
        this.currentPodId = null;
        
        // Clear any running intervals
        this.stopStatusChecking();
        this.stopHealthCheckPolling();
        
        // Clear any stale pod state from localStorage (but keep credentials)
        // Note: We keep the API key and template ID as those are user preferences
        const stalePodKeys = [
            'runpod-current-pod-id',
            'runpod-pod-status',
            'runpod-last-status-check'
        ];
        
        stalePodKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`Cleared stale data: ${key}`);
            }
        });
        
        console.log('Stale data cleanup complete');
    }

    loadSavedCredentials() {
        const apiKey = localStorage.getItem('runpod-api-key');
        const templateId = localStorage.getItem('runpod-template-id');
        
        console.log('Loading saved credentials:', {
            hasApiKey: !!apiKey,
            hasTemplateId: !!templateId
        });
        
        if (apiKey) document.getElementById('runpod-api-key').value = apiKey;
        if (templateId) document.getElementById('runpod-template-id').value = templateId;
    }

    saveCredentials() {
        const apiKey = document.getElementById('runpod-api-key').value;
        const templateId = document.getElementById('runpod-template-id').value;
        
        if (apiKey) localStorage.setItem('runpod-api-key', apiKey);
        if (templateId) localStorage.setItem('runpod-template-id', templateId);
    }

    setInitialButtonStates() {
        console.log('Setting initial button states...');
        
        // ALWAYS set buttons to correct initial state regardless of any cached data
        const startBtn = document.getElementById('runpod-start');
        const stopBtn = document.getElementById('runpod-stop');
        const callGeoPixelBtn = document.getElementById('screenMap');
        
        console.log('Button elements found:', {
            startBtn: !!startBtn,
            stopBtn: !!stopBtn,
            callGeoPixelBtn: !!callGeoPixelBtn
        });
        
        if (startBtn && stopBtn && callGeoPixelBtn) {
            // FORCE correct initial state: Start enabled, Stop disabled, Call GeoPixel disabled
            console.log('Forcing correct initial button states (ignoring any cached data)...');
            
            // Start button should be ENABLED initially (assume no pod running until verified)
            startBtn.disabled = false;
            startBtn.classList.remove('enabled');
            startBtn.style.background = '#28a745';
            startBtn.style.color = 'white';
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
            console.log('Initial state - START button: ENABLED (green)');
            
            // Stop button should be DISABLED initially (assume no pod running until verified)
            stopBtn.disabled = true;
            stopBtn.classList.remove('enabled');
            stopBtn.style.background = '#6c757d';
            stopBtn.style.color = '#ffffff';
            stopBtn.style.opacity = '0.7';
            stopBtn.style.cursor = 'not-allowed';
            console.log('Initial state - STOP button: DISABLED (grey)');
            
            // Call GeoPixel button MUST be disabled initially until pod status is verified
            callGeoPixelBtn.disabled = true;
            callGeoPixelBtn.classList.remove('enabled');
            callGeoPixelBtn.classList.remove('cadenza-disabled');
            callGeoPixelBtn.classList.add('disabled-button');
            callGeoPixelBtn.setAttribute('data-initialization-complete', 'false');
            
            console.log('CORRECTED initial button states set (cache-independent):', {
                startBtn_disabled: startBtn.disabled,
                stopBtn_disabled: stopBtn.disabled,
                callGeoPixelBtn_disabled: callGeoPixelBtn.disabled
            });
        } else {
            console.error('Some button elements not found during initialization');
        }
        
        // Set initial status
        this.updateStatus('Not Connected', 'Checking for saved credentials...');
    }

    updateStatus(status, details = '', error = '') {
        document.getElementById('runpod-status-text').textContent = status;
        document.getElementById('runpod-details').textContent = details;
        document.getElementById('runpod-error').textContent = error;
        
        // Update status styling
        const statusDiv = document.getElementById('runpod-status');
        statusDiv.className = ''; // Clear existing classes
        
        if (status.toLowerCase().includes('running') || status === 'RUNNING') {
            statusDiv.classList.add('status-running');
        } else if (status.toLowerCase().includes('error') || error) {
            statusDiv.classList.add('status-error');
        } else if (status.toLowerCase().includes('starting') || status === 'STARTING') {
            statusDiv.classList.add('status-starting');
        }
        
        // Update button states
        const startBtn = document.getElementById('runpod-start');
        const stopBtn = document.getElementById('runpod-stop');
        
        // CORRECT LOGIC: Start enabled when no pod, Stop enabled when pod running
        if (status === 'RUNNING' || status.toLowerCase().includes('running')) {
            // Pod is running: DISABLE start, ENABLE stop
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.style.background = '#6c757d';
                startBtn.style.color = '#ffffff';
                startBtn.style.opacity = '0.7';
                startBtn.style.cursor = 'not-allowed';
                console.log('Pod running - START button DISABLED');
            }
            if (stopBtn) {
                // ENABLE Stop button: remove disabled attribute AND add enabled class
                stopBtn.disabled = false;
                stopBtn.classList.add('enabled');
                stopBtn.style.opacity = '';
                stopBtn.style.cursor = '';
                // Force override any CSS that might be interfering
                stopBtn.style.background = '#dc3545';
                stopBtn.style.color = 'white';
                console.log('Pod running - STOP button ENABLED (red)');
            }
        } else if (status === 'Starting' || status === 'Starting...' || status === 'STARTING' ||
                  status === 'Checking...' || status === 'Already Running') {
            // During pod creation process: disable both buttons
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.style.background = '#6c757d';
                startBtn.style.color = '#ffffff';
                startBtn.style.opacity = '0.7';
                startBtn.style.cursor = 'not-allowed';
                console.log('Pod starting - START button DISABLED');
            }
            if (stopBtn) {
                // DISABLE Stop button: add disabled attribute AND remove enabled class
                stopBtn.disabled = true;
                stopBtn.classList.remove('enabled');
                // Force CSS override to ensure grey appearance
                stopBtn.style.background = '#6c757d';
                stopBtn.style.color = '#ffffff';
                stopBtn.style.opacity = '0.7';
                stopBtn.style.cursor = 'not-allowed';
                console.log('Pod starting - STOP button DISABLED (grey)');
            }
        } else {
            // For other states (Error, Stopped, Not Connected, Not Running, etc.): ENABLE start, DISABLE stop
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('enabled'); // Remove any conflicting classes
                startBtn.style.background = '#28a745';
                startBtn.style.color = 'white';
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
                console.log(`Status "${status}" - START button ENABLED`);
            }
            if (stopBtn) {
                // DISABLE Stop button: add disabled attribute AND remove enabled class
                stopBtn.disabled = true;
                stopBtn.classList.remove('enabled');
                // Force CSS override to ensure grey appearance
                stopBtn.style.background = '#6c757d';
                stopBtn.style.color = '#ffffff';
                stopBtn.style.opacity = '0.7';
                stopBtn.style.cursor = 'not-allowed';
                console.log(`Status "${status}" - STOP button DISABLED (grey)`);
            }
        }
        
        // Always update Call GeoPixel button state, but respect initialization flag
        console.log('Updating Call GeoPixel button state after status update...');
        this.updateCallGeoPixelButtonState();
    }

    async checkInitialPodStatus() {
        // Check if there's already a pod running with the current template on page load
        const templateId = document.getElementById('runpod-template-id').value.trim();
        const apiKey = document.getElementById('runpod-api-key').value.trim();
        
        console.log('checkInitialPodStatus: Starting with fresh verification...');
        
        // CRITICAL: Always start with correct initial button states
        this.forceCorrectInitialButtonStates();
        
        if (templateId && apiKey) {
            console.log('Credentials found, performing FRESH pod status verification...');
            this.updateStatus('Verifying...', 'Checking actual pod status (ignoring cache)');
            
            // Perform a fresh, real-time check - don't trust any cached data
            await this.checkPodStatusWithTemplate(templateId, apiKey);
        } else {
            console.log('No credentials found, maintaining initial button states');
            this.updateStatus('Not Connected', 'Enter API key and template ID to check pod status');
            
            // Mark initialization as complete when no credentials are provided
            const callGeoPixelBtn = document.getElementById('screenMap');
            if (callGeoPixelBtn) {
                callGeoPixelBtn.setAttribute('data-initialization-complete', 'true');
                console.log('No credentials - initialization marked complete');
            }
        }
    }

    forceCorrectInitialButtonStates() {
        console.log('FORCING correct initial button states (cache-independent)...');
        
        const callGeoPixelBtn = document.getElementById('screenMap');
        const startBtn = document.getElementById('runpod-start');
        const stopBtn = document.getElementById('runpod-stop');
        
        // ALWAYS start with these states regardless of any cached data
        if (callGeoPixelBtn) {
            callGeoPixelBtn.disabled = true;
            callGeoPixelBtn.classList.remove('enabled');
            callGeoPixelBtn.classList.remove('cadenza-disabled');
            callGeoPixelBtn.classList.add('disabled-button');
            callGeoPixelBtn.setAttribute('data-initialization-complete', 'false');
        }
        
        if (startBtn) {
            startBtn.disabled = false; // Start enabled (assume no pod until verified)
            startBtn.classList.remove('enabled');
            startBtn.style.background = '#28a745';
            startBtn.style.color = 'white';
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
            console.log('FORCED - START button: ENABLED (green)');
        }
        
        if (stopBtn) {
            stopBtn.disabled = true; // Stop disabled (assume no pod until verified)
            stopBtn.classList.remove('enabled');
            stopBtn.style.background = '#6c757d';
            stopBtn.style.color = '#ffffff';
            stopBtn.style.opacity = '0.7';
            stopBtn.style.cursor = 'not-allowed';
            console.log('FORCED - STOP button: DISABLED (grey)');
        }
        
        console.log('Initial button states FORCED to correct values');
    }

    async checkPodStatusWithTemplate(templateId, apiKey) {
        try {
            console.log(`Performing FRESH pod status check for template: ${templateId}`);
            
            const response = await fetch('/check-pod-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    template_id: templateId
                })
            });

            const data = await response.json();
            console.log('Fresh pod status response:', data);
            
            // Mark initialization as complete after first status check
            const callGeoPixelBtn = document.getElementById('screenMap');
            if (callGeoPixelBtn) {
                callGeoPixelBtn.setAttribute('data-initialization-complete', 'true');
                console.log('RunPod status check complete - initialization flag set to true');
            }
            
            if (data.success && data.pod_running) {
                // Pod is running - but don't check endpoint health on page load to reduce traffic
                console.log(`Found running pod: ${data.pod_id} - assuming available since it's running`);
                this.currentPodId = data.pod_id;
                this.endpointAvailable = true; // Optimistically assume available if pod is running
                
                // Update status to running and assume endpoint is available
                this.updateStatus('RUNNING', `Pod: ${data.pod_name || data.pod_id}\nEndpoint: Available (cached)`);
                this.startStatusChecking();
                
                // Don't check endpoint health on page load - assume it's available if pod is running
                console.log('Page load: Assuming endpoint is available for running pod (no health check)');
                this.updateCallGeoPixelButtonState();
                
                console.log(`Found running pod with template ${templateId}: ${data.pod_id}`);
            } else if (data.success && !data.pod_running) {
                // No pod running with this template - this is the expected state for fresh loads
                console.log(`No running pod found with template ${templateId} - this is correct for fresh loads`);
                this.updateStatus('Not Running', 'No pod found with this template');
                
                // Ensure buttons are in correct state for no running pod
                this.forceCorrectInitialButtonStates();
            } else {
                console.error('Error checking pod status:', data.error);
                this.updateStatus('Error', 'Failed to check pod status');
                
                // On error, maintain safe initial state
                this.forceCorrectInitialButtonStates();
            }
        } catch (error) {
            console.error('Failed to check pod status:', error);
            
            // Mark initialization as complete even on error
            const callGeoPixelBtn = document.getElementById('screenMap');
            if (callGeoPixelBtn) {
                callGeoPixelBtn.setAttribute('data-initialization-complete', 'true');
                console.log('RunPod status check failed but initialization flag set to true');
            }
            
            this.updateStatus('Error', 'Failed to check pod status');
            
            // On network error, maintain safe initial state
            this.forceCorrectInitialButtonStates();
        }
    }

    updateCallGeoPixelButtonState() {
        console.log('Updating Call GeoPixel button state...');
        
        const callGeoPixelButton = document.getElementById('screenMap');
        const statusText = document.getElementById('runpod-status-text').textContent;
        
        // Check if initialization is complete
        const initializationComplete = callGeoPixelButton?.getAttribute('data-initialization-complete') === 'true';
        
        // Check if OpenLayers is currently visible (not Cadenza)
        const openLayersRadio = document.getElementById('olbtn');
        const isOpenLayersMode = openLayersRadio && openLayersRadio.checked;
        
        console.log('Button state check:', {
            statusText: statusText,
            isOpenLayersMode: isOpenLayersMode,
            callGeoPixelButton: !!callGeoPixelButton,
            initializationComplete: initializationComplete
        });
        
        if (!callGeoPixelButton) {
            console.error('Call GeoPixel button not found!');
            return;
        }
        
        // If initialization is not complete, keep button disabled regardless of other conditions
        if (!initializationComplete) {
            console.log('Initialization not complete - keeping Call GeoPixel button disabled');
            callGeoPixelButton.disabled = true;
            callGeoPixelButton.classList.remove('enabled');
            callGeoPixelButton.classList.remove('cadenza-disabled');
            callGeoPixelButton.classList.add('disabled-button');
            return;
        }
        
        console.log('Before update:', {
            disabled: callGeoPixelButton.disabled,
            className: callGeoPixelButton.className,
            style: callGeoPixelButton.style.cssText
        });
        
        if (!isOpenLayersMode) {
            // Cadenza is visible - disable button with RunPod-style appearance
            console.log('Cadenza mode - disabling Call GeoPixel button with RunPod styling');
            callGeoPixelButton.disabled = true;
            callGeoPixelButton.classList.remove('enabled');
            callGeoPixelButton.classList.remove('disabled-button');
            callGeoPixelButton.classList.add('cadenza-disabled');
            return;
        }
        
        // OpenLayers is visible - check pod status AND endpoint availability
        if (statusText === 'RUNNING' || statusText.toLowerCase().includes('running')) {
            // Pod is running - check if we should verify endpoint availability
            if (this.endpointAvailable) {
                // Endpoint is confirmed available - enable button immediately
                console.log('Pod running and endpoint confirmed available - enabling Call GeoPixel button');
                callGeoPixelButton.disabled = false;
                callGeoPixelButton.classList.add('enabled');
                callGeoPixelButton.classList.remove('disabled-button');
                callGeoPixelButton.classList.remove('cadenza-disabled');
                console.log('Call GeoPixel button ENABLED (cached):', {
                    disabled: callGeoPixelButton.disabled,
                    className: callGeoPixelButton.className
                });
            } else if (this.shouldCheckEndpointHealth) {
                // Need to check endpoint availability
                console.log('Pod running - checking endpoint availability...');
                this.checkEndpointAvailabilityWithFallback().then(isAvailable => {
                    console.log(`updateCallGeoPixelButtonState: Endpoint availability result: ${isAvailable}`);
                    if (isAvailable) {
                        this.endpointAvailable = true;
                        this.shouldCheckEndpointHealth = false; // Stop checking once available
                        console.log('Endpoint available - enabling Call GeoPixel button and stopping health checks');
                        callGeoPixelButton.disabled = false;
                        callGeoPixelButton.classList.add('enabled');
                        callGeoPixelButton.classList.remove('disabled-button');
                        callGeoPixelButton.classList.remove('cadenza-disabled');
                        console.log('Call GeoPixel button ENABLED:', {
                            disabled: callGeoPixelButton.disabled,
                            className: callGeoPixelButton.className
                        });
                    } else {
                        console.log('Endpoint not yet available - keeping Call GeoPixel button disabled');
                        callGeoPixelButton.disabled = true;
                        callGeoPixelButton.classList.remove('enabled');
                        callGeoPixelButton.classList.remove('cadenza-disabled');
                        callGeoPixelButton.classList.add('disabled-button');
                        console.log('Call GeoPixel button DISABLED:', {
                            disabled: callGeoPixelButton.disabled,
                            className: callGeoPixelButton.className
                        });
                    }
                }).catch(error => {
                    console.error('Error in updateCallGeoPixelButtonState endpoint check:', error);
                    callGeoPixelButton.disabled = true;
                    callGeoPixelButton.classList.remove('enabled');
                    callGeoPixelButton.classList.remove('cadenza-disabled');
                    callGeoPixelButton.classList.add('disabled-button');
                });
            } else {
                // Pod is running but we haven't checked endpoint yet - assume available for existing pods
                console.log('Pod running (existing pod assumed available) - enabling Call GeoPixel button');
                this.endpointAvailable = true; // Assume existing running pods are available
                callGeoPixelButton.disabled = false;
                callGeoPixelButton.classList.add('enabled');
                callGeoPixelButton.classList.remove('disabled-button');
                callGeoPixelButton.classList.remove('cadenza-disabled');
                console.log('Call GeoPixel button ENABLED (assumed available):', {
                    disabled: callGeoPixelButton.disabled,
                    className: callGeoPixelButton.className
                });
            }
        } else {
            // No pod running - disable Call GeoPixel button
            console.log(`No pod running (status: "${statusText}") - disabling Call GeoPixel button`);
            callGeoPixelButton.disabled = true;
            callGeoPixelButton.classList.remove('enabled');
            callGeoPixelButton.classList.remove('cadenza-disabled');
            callGeoPixelButton.classList.add('disabled-button');
            
            // Extra logging for debugging
            console.log('Call GeoPixel button FORCED to disabled state:', {
                disabled: callGeoPixelButton.disabled,
                className: callGeoPixelButton.className,
                statusText: statusText
            });
        }
        
        console.log('After update:', {
            disabled: callGeoPixelButton.disabled,
            className: callGeoPixelButton.className,
            style: callGeoPixelButton.style.cssText
        });
    }

    async checkEndpointAvailability() {
        // Check if the RunPod endpoint is actually available and responding with status "ok"
        try {
            // Get the current pod ID
            if (!this.currentPodId) {
                console.log('No current pod ID - endpoint not available');
                return false;
            }

            console.log(`Checking endpoint health for pod: ${this.currentPodId}`);
            
            try {
                // Use the backend proxy to check health (avoids CORS)
                const healthResponse = await fetch('/check-health', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pod_id: this.currentPodId
                    })
                });
                
                if (healthResponse.ok) {
                    const healthData = await healthResponse.json();
                    console.log('Health proxy response:', healthData);
                    
                    // Check if the backend confirmed the endpoint is available with status "ok"
                    if (healthData.available && healthData.status === 'ok') {
                        console.log('✅ HEALTH CHECK PASSED: Backend confirmed status = "ok"');
                        
                        // Set endpoint as available and stop health checks
                        this.endpointAvailable = true;
                        this.shouldCheckEndpointHealth = false;
                        console.log('ENDPOINT HEALTHY: Flags set - endpointAvailable=true, shouldCheckEndpointHealth=false');
                        
                        // Update status to show endpoint is available
                        this.updateStatus('RUNNING', `Pod: ${this.currentPodId}\nEndpoint: Available (status: ok)`);
                        
                        // CRITICAL: Set initialization complete flag when health check passes
                        const callGeoPixelBtn = document.getElementById('screenMap');
                        if (callGeoPixelBtn) {
                            callGeoPixelBtn.setAttribute('data-initialization-complete', 'true');
                            console.log('✅ INITIALIZATION COMPLETE: Set to true after successful health check');
                        }
                        
                        // IMMEDIATE button state update
                        console.log('IMMEDIATE BUTTON UPDATE: Health check passed with status "ok"');
                        if (callGeoPixelBtn) {
                            const openLayersRadio = document.getElementById('olbtn');
                            const isOpenLayersMode = openLayersRadio && openLayersRadio.checked;
                            const initializationComplete = callGeoPixelBtn.getAttribute('data-initialization-complete') === 'true';
                            
                            console.log('IMMEDIATE UPDATE - Button conditions:', {
                                initializationComplete,
                                isOpenLayersMode,
                                currentDisabled: callGeoPixelBtn.disabled,
                                healthStatus: healthData.status,
                                available: healthData.available
                            });
                            
                            if (initializationComplete && isOpenLayersMode) {
                                console.log('IMMEDIATE BUTTON UPDATE: Enabling Call GeoPixel button - health check OK');
                                callGeoPixelBtn.disabled = false;
                                callGeoPixelBtn.classList.add('enabled');
                                callGeoPixelBtn.classList.remove('disabled-button');
                                console.log('✅ CALL GEOPIXEL BUTTON ENABLED - Health check successful!');
                                console.log('Button state after health check passed:', {
                                    disabled: callGeoPixelBtn.disabled,
                                    className: callGeoPixelBtn.className
                                });
                            } else {
                                console.log('IMMEDIATE BUTTON UPDATE: Conditions not met for enabling button');
                            }
                        }
                        
                        return true;
                    } else {
                        console.log(`❌ HEALTH CHECK FAILED: Backend reported available=${healthData.available}, status="${healthData.status}"`);
                        return false;
                    }
                } else {
                    console.log(`❌ HEALTH CHECK FAILED: Backend proxy error ${healthResponse.status}`);
                    return false;
                }
                
            } catch (fetchError) {
                console.log('❌ HEALTH CHECK FAILED: Backend proxy error:', fetchError.message);
                return false;
            }
            
        } catch (error) {
            console.log('❌ HEALTH CHECK FAILED: Unexpected error:', error.message);
            return false;
        }
    }

    async checkEndpointAvailabilityWithFallback() {
        // Enhanced endpoint availability check with time-based fallback
        console.log('Checking endpoint availability with fallback logic...');
        
        // First, try the standard endpoint check
        const isAvailable = await this.checkEndpointAvailability();
        
        if (isAvailable) {
            console.log('Endpoint check passed immediately');
            return true;
        }
        
        // If not available, check how long the pod has been running
        if (!this.currentPodId) {
            console.log('No pod ID available for fallback check');
            return false;
        }
        
        try {
            // Get pod runtime information to determine startup time
            const query = `
                query {
                    myself {
                        pods {
                            id
                            desiredStatus
                            runtime {
                                uptimeInSeconds
                            }
                        }
                    }
                }
            `;
            
            const result = await this.makeGraphQLRequest(query);
            
            if (result.myself && result.myself.pods) {
                const pod = result.myself.pods.find(p => p.id === this.currentPodId);
                
                if (pod && pod.desiredStatus === 'RUNNING' && pod.runtime) {
                    const uptimeSeconds = pod.runtime.uptimeInSeconds;
                    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
                    
                    console.log(`Pod uptime: ${uptimeMinutes} minutes (${uptimeSeconds} seconds)`);
                    
                    // More aggressive fallback logic since CSP is now fixed
                    // If pod has been running for more than 2 minutes, assume endpoint is available
                    if (uptimeSeconds > 120) { // 2 minutes
                        console.log('Pod has been running for >2 minutes - assuming endpoint is available (fallback)');
                        return true;
                    }
                    
                    // If pod has been running for more than 30 seconds, be optimistic
                    if (uptimeSeconds > 30) { // 30 seconds
                        console.log('Pod has been running for >30 seconds - being optimistic about endpoint availability');
                        return true;
                    }
                    
                    console.log('Pod is still starting up - endpoint not yet available');
                    return false;
                }
            }
            
            console.log('Could not determine pod uptime - using conservative approach');
            return false;
            
        } catch (error) {
            console.log('Error in fallback check:', error.message);
            // If we can't check uptime, be optimistic since the pod is marked as running
            console.log('Fallback: assuming endpoint is available since pod status is RUNNING');
            return true;
        }
    }

    async checkEndpointAvailabilityQuick() {
        // Quick endpoint check with shorter timeout for fallback scenarios
        if (!this.currentPodId) {
            return false;
        }

        const endpointUrl = `https://${this.currentPodId}-5000.proxy.runpod.net`;
        console.log(`Quick endpoint check: ${endpointUrl}`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const healthResponse = await fetch(`${endpointUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
                mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            console.log('Quick endpoint check succeeded');
            return true;
            
        } catch (error) {
            console.log('Quick endpoint check failed:', error.message);
            // For quick check, be more permissive with errors
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('cors') ||
                errorMessage.includes('network') ||
                errorMessage.includes('fetch')) {
                console.log('Quick check: Network/CORS error - assuming available');
                return true;
            }
            return false;
        }
    }

    startHealthCheckPolling() {
        // Start continuous health check polling every 5 seconds
        console.log('🔄 Starting health check polling every 5 seconds...');
        this.stopHealthCheckPolling(); // Clear any existing interval
        
        this.healthCheckInterval = setInterval(async () => {
            // Check if we should stop polling
            const callGeoPixelBtn = document.getElementById('screenMap');
            const isButtonEnabled = callGeoPixelBtn && !callGeoPixelBtn.disabled;
            
            // Stop if: no pod ID (terminated) OR Call GeoPixel button is enabled
            if (!this.currentPodId) {
                console.log('🛑 Stopping health check polling - no pod ID (pod terminated)');
                this.stopHealthCheckPolling();
                return;
            }
            
            if (isButtonEnabled) {
                console.log('🛑 Stopping health check polling - Call GeoPixel button is enabled');
                this.stopHealthCheckPolling();
                return;
            }
            
            console.log('🩺 Running scheduled health check...');
            const isHealthy = await this.checkEndpointAvailability();
            
            if (isHealthy) {
                console.log('✅ Health check passed - stopping polling and updating button');
                this.stopHealthCheckPolling();
                // Force immediate button state update
                this.updateCallGeoPixelButtonState();
            } else {
                console.log('❌ Health check failed - continuing polling in 5 seconds');
                // Show current status in the UI
                const statusText = document.getElementById('runpod-status-text').textContent;
                if (statusText === 'RUNNING') {
                    this.updateStatus('RUNNING', `Pod: ${this.currentPodId}\nEndpoint: Starting... (checking every 5s)`);
                }
            }
        }, 5000); // 5 second interval
    }

    stopHealthCheckPolling() {
        // Stop the health check polling interval
        if (this.healthCheckInterval) {
            console.log('🛑 Stopping health check polling interval');
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    async checkPodStatusOnChange() {
        // Check pod status when template ID or API key changes
        const templateId = document.getElementById('runpod-template-id').value.trim();
        const apiKey = document.getElementById('runpod-api-key').value.trim();
        
        if (templateId && apiKey) {
            console.log('Template or API key changed, checking pod status...');
            await this.checkPodStatusWithTemplate(templateId, apiKey);
        } else {
            // Reset status if either field is empty and ensure buttons are disabled
            this.updateStatus('Not Connected', 'Enter API key and template ID');
            this.currentPodId = null;
            this.stopStatusChecking();
            
            // Mark initialization as complete even when credentials are missing
            const callGeoPixelBtn = document.getElementById('screenMap');
            if (callGeoPixelBtn) {
                callGeoPixelBtn.setAttribute('data-initialization-complete', 'true');
                console.log('Credentials missing but initialization flag set to true');
                
                // Explicitly disable Call GeoPixel button when credentials are missing
                callGeoPixelBtn.disabled = true;
                callGeoPixelBtn.classList.remove('enabled');
                callGeoPixelBtn.classList.remove('cadenza-disabled');
                callGeoPixelBtn.classList.add('disabled-button');
                
                // Also ensure Stop Pod button is disabled when no credentials
                const stopBtn = document.getElementById('runpod-stop');
                if (stopBtn) {
                    stopBtn.disabled = true;
                    stopBtn.classList.remove('enabled');
                    // Force CSS override to ensure grey appearance
                    stopBtn.style.background = '#6c757d';
                    stopBtn.style.color = '#ffffff';
                    stopBtn.style.opacity = '0.7';
                    stopBtn.style.cursor = 'not-allowed';
                    console.log('Credentials missing - STOP button DISABLED (grey)');
                }
            }
        }
    }

    async makeGraphQLRequest(query, variables = {}) {
        const apiKey = document.getElementById('runpod-api-key').value;
        
        if (!apiKey) {
            throw new Error('API Key is required');
        }

        try {
            console.log('Making request to RunPod Proxy:', this.apiBaseUrl);
            
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query,
                    variables: variables
                })
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }
            
            return data.data;
        } catch (error) {
            console.error('GraphQL request failed:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to RunPod API. Check your internet connection and API endpoint.');
            }
            throw error;
        }
    }

    async testConnection() {
        try {
            const apiKey = document.getElementById('runpod-api-key').value.trim();
            
            // Validate API key before testing
            if (!apiKey) {
                throw new Error('API Key is required for testing');
            }
            
            this.updateStatus('Testing...', 'Checking API connection');
            
            // Simple query to test the connection - use RunPod's actual schema
            const query = `
                query {
                    myself {
                        id
                        email
                    }
                }
            `;
            
            const result = await this.makeGraphQLRequest(query);
            
            if (result && result.myself) {
                this.updateStatus('Connected', `API working! User: ${result.myself.email || result.myself.id}`);
            } else if (result) {
                this.updateStatus('Connected', 'API connection successful');
            } else {
                throw new Error('No valid response from API');
            }
            
        } catch (error) {
            this.updateStatus('Connection Failed', '', `Error: ${error.message}`);
            console.error('Connection test failed:', error);
        }
    }

    async startPod() {
        try {
            const apiKey = document.getElementById('runpod-api-key').value.trim();
            const templateId = document.getElementById('runpod-template-id').value.trim();
            const podName = document.getElementById('runpod-name').value.trim() || 'GeoPixel-Pod';
            
            // Immediately disable the start button when clicked
            const startBtn = document.getElementById('runpod-start');
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.style.opacity = '0.6';
                startBtn.style.cursor = 'not-allowed';
            }
            
            // Validate required fields
            if (!apiKey) {
                throw new Error('API Key is required');
            }
            if (!templateId) {
                throw new Error('Template ID is required');
            }
            if (podName.length === 0) {
                throw new Error('Pod Name cannot be empty');
            }

            // First check if there's already a pod running with this template
            this.updateStatus('Checking...', 'Checking for existing pods with this template');
            
            const existingPodStatus = await this.checkPodStatusWithTemplate(templateId, apiKey);
            
            // If a pod is already running, don't start a new one
            if (this.currentPodId) {
                this.updateStatus('Already Running', 'Pod with this template is already running');
                return;
            }

            this.updateStatus('Starting...', 'Creating new pod instance');

            const mutation = `
                mutation podFindAndDeployOnDemand($input: PodFindAndDeployOnDemandInput) {
                    podFindAndDeployOnDemand(input: $input) {
                        id
                        imageName
                        env
                        machineId
                        machine {
                            podHostId
                        }
                    }
                }
            `;

            // Ensure all variables are properly formatted and not empty
            const variables = {
                input: {
                    cloudType: "ALL",
                    gpuCount: 1,
                    volumeInGb: 0,
                    containerDiskInGb: 60,
                    minVcpuCount: 1,
                    minMemoryInGb: 30,
                    gpuTypeId: "NVIDIA RTX 6000 Ada Generation",
                    name: podName.trim(),
                    templateId: templateId.trim(),
                    dockerArgs: "",
                    ports: "8888/http,5000/http",
                    volumeMountPath: "/workspace",
                    env: [
                        {
                            key: "JUPYTER_PASSWORD",
                            value: "geopixel123"
                        }
                    ]
                }
            };
            
            // Validate that critical fields are not empty after trimming
            if (!variables.input.name || !variables.input.templateId) {
                throw new Error('Pod name and template ID cannot be empty');
            }

            const result = await this.makeGraphQLRequest(mutation, variables);
            
            if (result.podFindAndDeployOnDemand) {
                this.currentPodId = result.podFindAndDeployOnDemand.id;
                this.endpointAvailable = false; // Reset endpoint availability
                this.shouldCheckEndpointHealth = true; // Enable health checks for new pod
                console.log('Pod started - starting continuous health checks every 5 seconds');
                this.updateStatus('Starting', `Pod ID: ${this.currentPodId}`);
                this.startStatusChecking();
                this.startHealthCheckPolling(); // Start 5-second health check loop
            } else {
                throw new Error('Failed to create pod');
            }

        } catch (error) {
            this.updateStatus('Error', '', error.message);
            console.error('RunPod start error:', error);
            
            // Re-enable the start button if there was an error
            const startBtn = document.getElementById('runpod-start');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
            }
        }
    }

    async stopPod() {
        // Get button references once at the start
        const startBtn = document.getElementById('runpod-start');
        const stopBtn = document.getElementById('runpod-stop');
        
        try {
            if (!this.currentPodId) {
                throw new Error('No active pod to stop');
            }

            // Immediately disable the stop button when clicked
            if (stopBtn) {
                stopBtn.disabled = true;
                stopBtn.style.opacity = '0.6';
                stopBtn.style.cursor = 'not-allowed';
            }

            this.updateStatus('Stopping...', 'Terminating pod instance');

            const mutation = `
                mutation podTerminate($input: PodTerminateInput!) {
                    podTerminate(input: $input)
                }
            `;

            const variables = {
                input: {
                    podId: this.currentPodId
                }
            };

            await this.makeGraphQLRequest(mutation, variables);
            
            this.currentPodId = null;
            this.endpointAvailable = false; // Reset endpoint availability
            this.shouldCheckEndpointHealth = false; // Disable health checks until next pod start
            console.log('Pod stopped - resetting health check flags. Health checks will resume only when starting a new pod.');
            this.stopStatusChecking();
            this.stopHealthCheckPolling(); // Stop health check polling
            this.updateStatus('Stopped', 'Pod terminated successfully');
            
            // Clear any manual styling from both buttons after stopping
            if (startBtn) {
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
            }
            if (stopBtn) {
                stopBtn.style.opacity = '';
                stopBtn.style.cursor = '';
            }

        } catch (error) {
            this.updateStatus('Error', '', error.message);
            console.error('RunPod stop error:', error);
            
            // Clear any manual styling from both buttons on error too
            if (startBtn) {
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
            }
            if (stopBtn) {
                stopBtn.style.opacity = '';
                stopBtn.style.cursor = '';
            }
        }
    }

    async checkPodStatus() {
        try {
            if (!this.currentPodId) return;

            const query = `
                query {
                    myself {
                        pods {
                            id
                            name
                            runtime {
                                uptimeInSeconds
                                ports {
                                    ip
                                    isIpPublic
                                    privatePort
                                    publicPort
                                    type
                                }
                                gpus {
                                    id
                                    gpuUtilPercent
                                    memoryUtilPercent
                                }
                            }
                            machine {
                                podHostId
                            }
                            desiredStatus
                            lastStatusChange
                        }
                    }
                }
            `;

            const variables = {};

            const result = await this.makeGraphQLRequest(query, variables);
            
            if (result.myself && result.myself.pods) {
                // Find our specific pod by ID
                const pod = result.myself.pods.find(p => p.id === this.currentPodId);
                
                if (pod) {
                    const status = pod.desiredStatus;
                    
                    let details = `Pod: ${pod.name || this.currentPodId}`;
                    
                    if (pod.runtime) {
                        const uptime = Math.floor(pod.runtime.uptimeInSeconds / 60);
                        details += `\nUptime: ${uptime} minutes`;
                        
                        if (pod.runtime.ports && pod.runtime.ports.length > 0) {
                            const port = pod.runtime.ports[0];
                            if (port.publicPort) {
                                details += `\nAccess: ${port.ip}:${port.publicPort}`;
                            }
                        }
                        
                        if (pod.runtime.gpus && pod.runtime.gpus.length > 0) {
                            const gpu = pod.runtime.gpus[0];
                            details += `\nGPU: ${gpu.gpuUtilPercent}% util, ${gpu.memoryUtilPercent}% mem`;
                        }
                    }
                    
                    // Update status and only check endpoint availability when needed
                    if (status === 'RUNNING') {
                        if (this.shouldCheckEndpointHealth && !this.endpointAvailable) {
                            // Only check endpoint health if we should and it's not already confirmed available
                            console.log('Periodic check: Checking endpoint availability...');
                            this.checkEndpointAvailabilityWithFallback().then(isAvailable => {
                                console.log(`Periodic status check: Endpoint availability: ${isAvailable}`);
                                if (isAvailable) {
                                    this.endpointAvailable = true;
                                    this.shouldCheckEndpointHealth = false; // Stop checking once available
                                    console.log('Periodic check: Endpoint available - stopping health checks and updating button');
                                    this.updateStatus(status, details + '\nEndpoint: Available');
                                    this.updateCallGeoPixelButtonState();
                                } else {
                                    this.updateStatus(status, details + '\nEndpoint: Starting...');
                                }
                            }).catch(error => {
                                console.error('Error in periodic endpoint check:', error);
                                this.updateStatus(status, details + '\nEndpoint: Check failed');
                            });
                        } else if (this.endpointAvailable) {
                            // Endpoint already confirmed available
                            this.updateStatus(status, details + '\nEndpoint: Available (cached)');
                        } else {
                            // Not checking endpoint health
                            this.updateStatus(status, details + '\nEndpoint: Assumed available');
                        }
                    } else {
                        this.updateStatus(status, details);
                    }
                    
                    if (status === 'EXITED' || status === 'FAILED') {
                        this.currentPodId = null;
                        this.stopStatusChecking();
                    }
                } else {
                    // Pod not found, might have been terminated
                    this.updateStatus('Not Found', 'Pod may have been terminated');
                    this.currentPodId = null;
                    this.stopStatusChecking();
                }
            }

        } catch (error) {
            console.error('Status check error:', error);
            // Don't update status on check errors to avoid spam
        }
    }

    startStatusChecking() {
        this.stopStatusChecking(); // Clear any existing interval
        this.statusCheckInterval = setInterval(() => {
            this.checkPodStatus();
        }, 10000); // Check every 10 seconds
    }

    stopStatusChecking() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }
}

// Initialize RunPod manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are properly rendered
    setTimeout(() => {
        window.runPodManager = new RunPodManager();
        
        // Set up radio button change listeners to update Call GeoPixel button state
        const radioButtons = document.querySelectorAll('input[name="vis"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                // Small delay to ensure the view has switched before updating button state
                setTimeout(() => {
                    if (window.runPodManager) {
                        console.log('Radio button changed, updating Call GeoPixel button state...');
                        
                        // Check if initialization is complete
                        const callGeoPixelBtn = document.getElementById('screenMap');
                        const initializationComplete = callGeoPixelBtn?.getAttribute('data-initialization-complete') === 'true';
                        
                        if (initializationComplete) {
                            console.log('Initialization complete, updating button state based on radio selection');
                            window.runPodManager.updateCallGeoPixelButtonState();
                        } else {
                            console.log('Initialization not complete, keeping button disabled');
                            // Ensure button stays disabled
                            if (callGeoPixelBtn) {
                                callGeoPixelBtn.disabled = true;
                                callGeoPixelBtn.classList.remove('enabled');
                                callGeoPixelBtn.classList.remove('cadenza-disabled');
                                callGeoPixelBtn.classList.add('disabled-button');
                            }
                        }
                    }
                }, 50);
            });
        });
    }, 100);
});