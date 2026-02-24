import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({
    path: '/etc/smartserv/config/zt-url-shortener.env'
});

// Fallback to local .env if needed
// override: true ensures local values take precedence over global ones (useful for local development tweaking)
dotenv.config({ override: true }); 
