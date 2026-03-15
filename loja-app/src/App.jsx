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
    return <div className="h-screen w-full flex items-center justify-center bg-neutral-50 text-neutral-500">A carregar...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <>
      {/* O botão só vai ser renderizado (desenhado na tela) se isAdmin for verdadeiro */}
      {isAdmin && (
        <button 
          onClick={() => setCurrentView("admin")} 
          className="fixed bottom-6 right-6 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-2xl font-medium hover:bg-neutral-800 transition z-50"
        >
          Painel Admin
        </button>
      )}

      {currentView === 'store' ? (
        <Store currentUseruser={currentUser} onLogout={handleLogout} />
      ) : (
        <AdminPanel onBack={() => setCurrentView('store')} />
      )}
    </>
  );
}

export default App;