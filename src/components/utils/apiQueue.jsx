// Global API call queue to prevent rate limits across the entire app
class ApiQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastCallTime = 0;
    this.minDelayBetweenCalls = 1500; // INCREASED: 1.5s between calls (was 1s)
    this.consecutiveErrors = 0;
    this.backoffMultiplier = 1;
  }

  async add(apiCall, retries = 5, baseDelay = 2000, timeout = 15000) { // Added timeout parameter
    return new Promise((resolve, reject) => {
      this.queue.push({ apiCall, retries, baseDelay, timeout, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      
      const effectiveDelay = this.minDelayBetweenCalls * this.backoffMultiplier;
      
      if (timeSinceLastCall < effectiveDelay) {
        const waitTime = effectiveDelay - timeSinceLastCall;
        console.log(`⏳ API Queue: Waiting ${waitTime}ms (${this.queue.length} queued, backoff: ${this.backoffMultiplier}x)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      const { apiCall, retries, baseDelay, timeout, resolve, reject } = this.queue.shift();
      
      try {
        const result = await this.retryApiCall(apiCall, retries, baseDelay, timeout);
        this.lastCallTime = Date.now();
        this.consecutiveErrors = 0;
        this.backoffMultiplier = Math.max(1, this.backoffMultiplier * 0.8);
        resolve(result);
      } catch (error) {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= 3) {
          this.backoffMultiplier = Math.min(8, this.backoffMultiplier * 2); // INCREASED: Max 8x backoff (was 5x)
          console.warn(`⚠️ ${this.consecutiveErrors} consecutive errors, backoff: ${this.backoffMultiplier}x`);
        }
        reject(error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.processing = false;
  }

  async retryApiCall(apiCall, maxRetries, baseDelay, timeout = 15000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use custom timeout per call
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API call timeout - server is very slow or down')), timeout)
        );
        
        const result = await Promise.race([
          apiCall(),
          timeoutPromise
        ]);
        
        return result;
      } catch (error) {
        lastError = error;

        // If it's a 404 on delete, treat as success
        if (error.response?.status === 404 && apiCall.toString().includes('.delete')) {
          return null;
        }

        const isRateLimitError = 
          error.response?.status === 429 || 
          error.message?.includes('Rate limit') || 
          error.message?.includes('API_RATE_LIMIT_EXCEEDED') ||
          error.response?.data?.error?.includes('Rate limit');
          
        const isNetworkError = 
          error.message?.includes('Network Error') || 
          error.message?.includes('NETWORK_ERROR_DETECTED') ||
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNABORTED' || // NEW: Connection aborted
          error.code === 'ETIMEDOUT' || // NEW: Timeout
          !error.response;

        const status = error.response?.status;
        const isServerError = status >= 500;
        const isLoop508 = status === 508;

        if ((isRateLimitError || isNetworkError || isServerError) && attempt < maxRetries) {
          let delay;
          
          if (isRateLimitError) {
            delay = baseDelay * Math.pow(5, attempt - 1) + Math.random() * 3000;
          } else if (isLoop508) {
            // Extra-aggressive backoff for 508 Loop Detected
            delay = baseDelay * Math.pow(6, attempt - 1) + Math.random() * 2500;
          } else if (isServerError) {
            delay = baseDelay * Math.pow(4, attempt - 1) + Math.random() * 2000; // INCREASED: 4x multiplier (was 3x)
          } else {
            delay = baseDelay * Math.pow(3, attempt - 1) + Math.random() * 1000; // INCREASED: 3x multiplier (was 2x)
          }
          
          const url = error.config?.url;
          const errorType = isRateLimitError
            ? 'RATE LIMIT'
            : isLoop508
            ? 'SERVER 508'
            : isServerError
            ? `SERVER ${status || ''}`
            : 'NETWORK';
          console.warn(`⏳ Retry ${attempt}/${maxRetries}: ${errorType} at ${url || 'unknown'}. Wait ${(delay / 1000).toFixed(1)}s`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          // Log final error details
          console.error(`❌ API call failed after ${attempt} attempts:`, {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            code: error.code,
            details: error.response?.data || null
          });
          throw error;
        }
      }
    }

    throw lastError;
  }
}

const globalApiQueue = new ApiQueue();

export function queueApiCall(apiCall, retries = 5, baseDelay = 2000, timeout = 15000) {
  return globalApiQueue.add(apiCall, retries, baseDelay, timeout);
}

// Special version for LLM calls with extended timeout
export function queueLLMCall(apiCall, retries = 3, baseDelay = 3000) {
  return globalApiQueue.add(apiCall, retries, baseDelay, 60000); // INCREASED: 60 second timeout for LLM (was 45s)
}