// Centralized API mode flag
// Set to false when backend is ready, or use environment variable
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
