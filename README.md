[README.txt](https://github.com/user-attachments/files/33611211/README.txt)[UploEnviroLink login + world map update

This package replaces public/index.html and the existing api/boxes.js and api/ingest.js, and adds api/login.js, api/logout.js, api/me.js, and lib/auth.js.

Vercel environment variables required:
UPSTASH_REDIS_REST_URL = existing Upstash REST URL
UPSTASH_REDIS_REST_TOKEN = existing Upstash REST token
DEVICE_API_KEY = existing ESP8266 device key
SESSION_SECRET = a new random secret of at least 32 characters
ADMIN_USERNAME = master admin username
ADMIN_PASSWORD = strong master admin password
SUNSHINE_USERNAME = Sunshine Coast council username
SUNSHINE_PASSWORD = strong Sunshine Coast council password
NOOSA_USERNAME = Noosa council username
NOOSA_PASSWORD = strong Noosa council password
BOX_COUNCIL_MAP = JSON mapping box IDs to council slugs, e.g. {"ENV-001":"sunshine"}

The Sunshine Coast account is assigned council slug "sunshine" and Noosa is assigned "noosa". Admin sees all boxes. Council filtering is done server-side.

After adding or changing environment variables, redeploy the Vercel project. Never put passwords, REST tokens, SESSION_SECRET or DEVICE_API_KEY in public source files.

IMPORTANT: The world map uses Leaflet and OpenStreetMap tiles via public CDNs, so the browser needs internet access. The map can only place boxes that have valid lat/lon values. Canopy values marked simulated remain estimates until the camera is connected.

This is a prototype authentication setup using environment-variable passwords. For production deployment, use password hashing/rate limiting and a managed identity provider, and add account-management workflows.
ading README.txt…]()
