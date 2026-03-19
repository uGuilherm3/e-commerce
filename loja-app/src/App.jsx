import React, { useState, useEffect } from 'react';
import Parse from './parseSetup';
import Login from './components/Login';
import Store from './components/Store';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  // Verifica se o usuário logado é o dono da loja
  const isAdmin = currentUser && currentUser.get("email") === "umadruginha@gmail.com";
  const [isLoading, setIsLoading] = useState(true);
  
  // Agora a tela padrão ('store') abre para todo mundo logo de cara
  const [currentView, setCurrentView] = useState('store'); 

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await Parse.User.currentAsync();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Erro ao verificar utilizador logado:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await Parse.User.logOut();
    setCurrentUser(null);
    setCurrentView('store');
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-neutral-50 text-neutral-500 font-medium">Carregando a loja...</div>;
  }

  return (
    <>
      {/* BOTÃO DO PAINEL DE ADM */}
      {isAdmin && currentView !== "admin" && (
        <button
          onClick={() => setCurrentView("admin")}
          className="fixed bottom-6 right-6 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 font-medium hover:scale-105 transition-transform"
        >
          Painel Admin
        </button>
      )}

      {/* ROTEAMENTO DAS TELAS */}
      {currentView === 'login' ? (
        <div className="relative min-h-screen bg-neutral-50">
          {/* Botão de segurança para o cliente voltar para a vitrine se desistir de logar */}
          <button 
            onClick={() => setCurrentView('store')}
            className="absolute top-6 left-6 z-50 bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg shadow-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            ← Voltar para a Loja
          </button>
          
          <Login onLogin={(user) => { 
            setCurrentUser(user); 
            setCurrentView('store'); // Devolve o cliente pra loja assim que logar
          }} />
        </div>
      ) : currentView === 'admin' ? (
        <AdminPanel onBack={() => setCurrentView('store')} />
      ) : (
        /* A TELA DA LOJA AGORA RECEBE UM COMANDO NOVO: onRequireLogin */
        <Store 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onRequireLogin={() => setCurrentView('login')} 
        />
      )}
    </>
  );
}

export default App;