// Environment configuration with fallbacks
export const config = {
  // API Configuration
  API_BASE_URL: (() => {
    // Try different ways to get the API URL based on environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_URL || 'http://localhost:8000';
    }
    
    // Fallback for different environments
    if (typeof window !== 'undefined' && (window as any).__API_URL__) {
      return (window as any).__API_URL__;
    }
    
    // Default fallback
    return 'http://localhost:8000';
  })(),

  // Other configuration
  ENV: (() => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_ENV || 'development';
    }
    return 'development';
  })(),

  // Check if we're in development
  isDevelopment: (() => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV;
    }
    return false;
  })(),

  // Check if we're in production
  isProduction: (() => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.PROD;
    }
    return true; // Default to production for safety
  })()
};
