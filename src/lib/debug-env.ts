// Debug script to verify environment variables in production
export function debugEnvironment() {
  console.group('🔍 Environment Variables Debug');
  
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('VITE_API_KEY:', import.meta.env.VITE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing');
  
  console.log('\nMode:', import.meta.env.MODE);
  console.log('Dev:', import.meta.env.DEV);
  console.log('Prod:', import.meta.env.PROD);
  
  console.groupEnd();
}

// Call this on page load in development
if (import.meta.env.DEV) {
  debugEnvironment();
}

