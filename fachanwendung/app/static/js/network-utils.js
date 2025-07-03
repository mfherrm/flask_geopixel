/**
 * Network Utilities for Cadenza Integration
 * 
 * This module provides utilities for handling network connectivity issues
 * and server availability checks for the Cadenza WMS integration.
 */

/**
 * Check if the Cadenza server is reachable
 * @param {string} baseUrl - The base URL of the Cadenza server
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} - True if server is reachable, false otherwise
 */
export async function checkCadenzaServerConnectivity(baseUrl = 'http://localhost:8080/cadenza/', timeout = 5000) {
    try {
        console.log('Checking Cadenza server connectivity...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(baseUrl, {
            method: 'HEAD', // Use HEAD to minimize data transfer
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        const isReachable = response.ok || response.status < 500; // Accept redirects and client errors, but not server errors
        console.log(`Cadenza server connectivity check: ${isReachable ? 'SUCCESS' : 'FAILED'} (status: ${response.status})`);
        
        return isReachable;
    } catch (error) {
        console.warn('Cadenza server connectivity check failed:', error.message);
        return false;
    }
}

/**
 * Wait for Cadenza server to become available
 * @param {string} baseUrl - The base URL of the Cadenza server
 * @param {number} maxAttempts - Maximum number of attempts (default: 10)
 * @param {number} interval - Interval between attempts in milliseconds (default: 2000)
 * @returns {Promise<boolean>} - True if server becomes available, false if max attempts reached
 */
export async function waitForCadenzaServer(baseUrl = 'http://localhost:8080/cadenza/', maxAttempts = 10, interval = 2000) {
    console.log(`Waiting for Cadenza server to become available (max ${maxAttempts} attempts)...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Connectivity check attempt ${attempt}/${maxAttempts}...`);
        
        const isAvailable = await checkCadenzaServerConnectivity(baseUrl);
        if (isAvailable) {
            console.log(`Cadenza server is available after ${attempt} attempts`);
            return true;
        }
        
        if (attempt < maxAttempts) {
            console.log(`Server not available, waiting ${interval}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    console.error(`Cadenza server did not become available after ${maxAttempts} attempts`);
    return false;
}

/**
 * Check if a network error is recoverable (temporary)
 * @param {Error} error - The error to check
 * @returns {boolean} - True if the error appears to be temporary/recoverable
 */
export function isRecoverableNetworkError(error) {
    if (!error || !error.message) return false;
    
    const recoverablePatterns = [
        'NetworkError',
        'Failed to fetch',
        'load map image',
        'loading-error',
        'timeout',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'fetch resource'
    ];
    
    return recoverablePatterns.some(pattern => 
        error.message.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns {Promise<any>} - The result of the function or throws the last error
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                console.error(`Function failed after ${maxRetries + 1} attempts:`, error);
                throw error;
            }
            
            if (!isRecoverableNetworkError(error)) {
                console.error('Non-recoverable error, not retrying:', error);
                throw error;
            }
            
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Monitor network connectivity and provide status updates
 */
export class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = [];
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            this.isOnline = true;
            this.notifyListeners('online');
        });
        
        window.addEventListener('offline', () => {
            console.warn('Network connection lost');
            this.isOnline = false;
            this.notifyListeners('offline');
        });
    }
    
    /**
     * Add a listener for network status changes
     * @param {Function} callback - Callback function (receives 'online' or 'offline')
     */
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Remove a listener
     * @param {Function} callback - The callback to remove
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    /**
     * Notify all listeners of status change
     * @param {string} status - 'online' or 'offline'
     */
    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in network status listener:', error);
            }
        });
    }
    
    /**
     * Get current network status
     * @returns {boolean} - True if online, false if offline
     */
    getStatus() {
        return this.isOnline;
    }
}

// Create a global network monitor instance
export const networkMonitor = new NetworkMonitor();

/**
 * Show user-friendly error messages for network issues
 * @param {Error} error - The error to display
 * @param {string} context - Context where the error occurred
 */
export function showNetworkErrorMessage(error, context = 'operation') {
    let message = `Network error during ${context}. `;
    
    if (!navigator.onLine) {
        message += 'Please check your internet connection and try again.';
    } else if (isRecoverableNetworkError(error)) {
        message += 'The server may be temporarily unavailable. Please wait a moment and try again.';
    } else {
        message += 'Please check your connection and server status.';
    }
    
    console.error(`Network Error [${context}]:`, error);
    alert(message);
}