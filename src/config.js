// Centralized configuration
// In production (Render), we use relative paths ("") to hit the same origin.
// In development, we hit the local backend port 5000.

export const API_BASE = import.meta.env.PROD ? "" : "http://localhost:5000";
