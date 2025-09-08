// Configuración de variables de entorno para Jest
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_testing_only';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// API Keys de prueba
process.env.OPENAI_API_KEY = 'test_openai_key';
process.env.ANTHROPIC_API_KEY = 'test_anthropic_key';
process.env.GOOGLE_AI_API_KEY = 'test_google_ai_key';
