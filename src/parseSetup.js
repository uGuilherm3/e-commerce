// Pega o Parse do HTML, fugindo do Vite
const Parse = window.Parse;

// Aponta para o Parse Server local (`npm run dev:server`).
// Dá para sobrescrever via .env.local com VITE_PARSE_*.
const APP_ID = import.meta.env.VITE_PARSE_APP_ID || 'lojaLocal';
const JS_KEY = import.meta.env.VITE_PARSE_JS_KEY || 'lojaLocalJsKey';
const SERVER_URL = import.meta.env.VITE_PARSE_SERVER_URL || 'http://localhost:1337/parse';

Parse.initialize(APP_ID, JS_KEY);
Parse.serverURL = SERVER_URL;

export default Parse;
