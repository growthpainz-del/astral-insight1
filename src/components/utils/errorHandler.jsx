/**
 * Safely extract error message from various error types
 */
export function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  
  // If it's already a string
  if (typeof error === 'string') return error;
  
  // If it has a message property
  if (error.message) return error.message;
  
  // If it's a Response object
  if (error.status && error.statusText) {
    return `${error.status} ${error.statusText}`;
  }
  
  // Try to stringify it properly
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Log error with proper formatting
 */
export function logError(context, error, ...additionalInfo) {
  const message = getErrorMessage(error);
  console.error(`${context}:`, message, ...additionalInfo);
  return message;
}

/**
 * Format error for user display
 */
export function formatUserError(error) {
  const message = getErrorMessage(error);
  
  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network connection error. Please check your internet and try again.';
  }
  
  // 404 errors
  if (message.includes('404')) {
    return 'Resource not found. The image may have been moved or deleted.';
  }
  
  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // CORS errors
  if (message.includes('CORS')) {
    return 'Unable to load image due to security restrictions.';
  }
  
  return message;
}

export default {
  getErrorMessage,
  logError,
  formatUserError
};