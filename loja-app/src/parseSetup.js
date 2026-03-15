// Pega o Parse do HTML, fugindo do Vite
const Parse = window.Parse;

Parse.initialize(
  "RKWLzoCM7uqVIFVRKeZG9VesjnGwieHPzvu2r92W", // Chave 100% certa!
  "ZbLan5WmNyaXwhYXQtOGHFbq30c8q4k9SyRQNiPF"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

export default Parse;