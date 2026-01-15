// Centralized API mode flag
// Backend is now enabled - defaults to real API
// Set VITE_USE_MOCK_API=true only for local development without backend
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
