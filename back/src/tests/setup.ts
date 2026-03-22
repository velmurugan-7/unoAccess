// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/unoaccess-test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters!';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!!';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.EMAIL_USER = '';
process.env.EMAIL_PASS = '';
