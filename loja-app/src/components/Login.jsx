import React, { useState, useEffect } from "react";
import Parse from "../parseSetup";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

// DADOS DO CARROSSEL
const slides = [
  {
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop",
    tag: "Acesso Exclusivo",
    title: "Seja o primeiro.",
    desc: "Membros cadastrados têm acesso antecipado a todos os nossos lançamentos e ofertas limitadas."
  },
  {
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    tag: "Coleção Essência",
    title: "Descubra o novo.",
    desc: "Peças pensadas para iluminar o seu dia a dia com conforto e muita elegância em cada detalhe."
  },
  {
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
    tag: "Estilo Único",
    title: "Expresse quem você é.",
    desc: "A moda é a sua melhor forma de comunicação com o mundo sem precisar dizer uma única palavra."
  }
];

export default function Auth({ onLogin }) {
  const [view, setView] = useState("login"); // "login", "register", "forgot"
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  // ESTADO DO CARROSSEL
  const [currentSlide, setCurrentSlide] = useState(0);

  // EFEITO PARA GIRAR O CARROSSEL AUTOMATICAMENTE
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Troca a cada 5 segundos
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // LÓGICAS DE AUTENTICAÇÃO (PARSE)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await Parse.User.logIn(email, password);
      onLogin(user); 
    } catch (err) {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = new Parse.User();
      user.set("username", email); 
      user.set("email", email);
      user.set("password", password);
      user.set("name", name); 

      await user.signUp();
      onLogin(user); 
    } catch (err) {
      setError("Erro ao criar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await Parse.User.requestPasswordReset(email);
      setToast({ show: true, message: "E-mail de recuperação enviado com sucesso!" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
        setView("login");
      }, 3000);
    } catch (err) {
      setError("Erro ao enviar e-mail: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ANIMAÇÕES DO FRAMER MOTION
  // ==========================================
  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen flex bg-fundo transition-colors duration-500 font-sans relative overflow-hidden text-texto">
      
      {/* ===================================================================== */}
      {/* LADO ESQUERDO: CARROSSEL ANIMADO (Esconde no celular) */}
      {/* ===================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.img 
            key={`img-${currentSlide}`}
            src={slides[currentSlide].image} 
            alt="Fundo" 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-16 left-16 right-16 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.3em] mb-4">{slides[currentSlide].tag}</p>
              <h2 className="text-5xl font-serif italic text-white mb-6 leading-tight">{slides[currentSlide].title}</h2>
              <p className="text-white/80 text-lg font-light max-w-md leading-relaxed">
                {slides[currentSlide].desc}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* INDICADORES DO CARROSSEL (Agora são botões clicáveis!) */}
          <div className="flex gap-2 mt-10">
            {slides.map((_, index) => (
              <button 
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                aria-label={`Ir para o slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LADO DIREITO: FORMULÁRIOS COM ANIMAÇÃO */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-fundo">
        <div className="w-full max-w-md">
          
          <AnimatePresence mode="wait">
            
            {/* ---- TELA DE LOGIN ---- */}
            {view === "login" && (
              <motion.div key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                <div className="mb-10 text-center lg:text-left">
                  <h1 className="text-4xl font-serif italic text-texto mb-3">Flor e Sol</h1>
                  <p className="text-texto-sec">Bem-vindo(a) de volta.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
                  
                  <div>
                    <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider mb-2">E-mail</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="seu@email.com" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider">Senha</label>
                      <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-[10px] font-bold text-texto hover:underline">Esqueceu a senha?</button>
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-btn text-btn-texto font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar na Conta <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>

                <div className="mt-10 text-center">
                  <p className="text-sm text-texto-sec mb-2">Ainda não tem uma conta?</p>
                  <button onClick={() => { setView("register"); setError(""); }} className="text-sm font-bold text-texto hover:underline transition-all">
                    Criar minha conta agora
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- TELA DE CADASTRO ---- */}
            {view === "register" && (
              <motion.div key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                <button type="button" onClick={() => { setView("login"); setError(""); }} className="mb-8 p-2 bg-card rounded-full text-texto-sec hover:text-texto transition-colors w-fit">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="mb-8 text-center lg:text-left">
                  <h1 className="text-3xl font-serif italic text-texto mb-2">Nova Conta</h1>
                  <p className="text-texto-sec text-sm">Preencha seus dados para acessar ofertas exclusivas.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
                  
                  <div>
                    <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider mb-2">Como você quer ser chamado?</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Seu nome ou apelido" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider mb-2">E-mail</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="seu@email.com" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider mb-2">Crie uma Senha</label>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Mínimo 6 caracteres" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-btn text-btn-texto font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Conta <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ---- TELA DE RECUPERAR SENHA ---- */}
            {view === "forgot" && (
              <motion.div key="forgot" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                <button type="button" onClick={() => { setView("login"); setError(""); }} className="mb-8 p-2 bg-card rounded-full text-texto-sec hover:text-texto transition-colors w-fit">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="mb-8 text-center lg:text-left">
                  <h1 className="text-3xl font-serif italic text-texto mb-2">Recuperar Senha</h1>
                  <p className="text-texto-sec text-sm">Digite seu e-mail para receber um link de redefinição.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
                  
                  <div>
                    <label className="block text-[10px] font-bold text-texto-sec uppercase tracking-wider mb-2">Seu E-mail</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="seu@email.com" 
                      className="w-full px-4 py-3.5 bg-card border border-borda text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none transition-all" 
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-btn text-btn-texto font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar link de recuperação"}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>

      {/* PÍLULA DE NOTIFICAÇÃO */}
      <div className={`fixed top-8 right-8 bg-btn text-btn-texto px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transform transition-all duration-300 z-50 ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"}`}>
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="font-bold text-sm">{toast.message}</span>
      </div>

    </div>
  );
}