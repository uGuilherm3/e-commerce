// Configuração compartilhada entre o servidor local e o seed.
export const APP_ID = 'lojaLocal';
export const JAVASCRIPT_KEY = 'lojaLocalJsKey';
export const MASTER_KEY = 'lojaLocalMasterKey';
export const PORT = Number(process.env.PARSE_PORT || 1337);
export const MOUNT = '/parse';
export const SERVER_URL = `http://localhost:${PORT}${MOUNT}`;

// E-mail que o App.jsx trata como admin.
export const ADMIN_EMAIL = 'umadruginha@gmail.com';
export const ADMIN_PASSWORD = 'admin123';
