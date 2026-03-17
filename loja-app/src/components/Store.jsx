import React, { useState, useEffect } from "react";
import Parse from "../parseSetup";
import { Search, LogOut, ShoppingBag, X, Plus, Minus, Trash2, CheckCircle, Loader2, User, Package, Settings, Instagram, Facebook, Twitter, Timer, Menu, CreditCard, QrCode, Truck, MessageCircle, Heart, TrendingUp, Sun, Moon, ArrowLeft, Star, Sparkles, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Store({ currentUser, onLogout }) {
  
  const activeUser = Parse.User.current();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tudo");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState("cart"); 
  const [paymentMethod, setPaymentMethod] = useState("pix"); 
  const [lastOrderId, setLastOrderId] = useState(null); 
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" }); 
  const [pixData, setPixData] = useState(null); 

  const [currentView, setCurrentView] = useState("store"); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("data"); 
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState(activeUser?.get("favorites") || []);
  
  const [userName, setUserName] = useState(activeUser?.get("name") || "");
  const [userPhone, setUserPhone] = useState(activeUser?.get("phone") || "");
  const [userAvatar, setUserAvatar] = useState(activeUser?.get("avatar")?.url() || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [quickAdd, setQuickAdd] = useState({ isOpen: false, product: null, selectedVariant: "" });
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [detailedVariant, setDetailedVariant] = useState("");
  const [productReviews, setProductReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // CARROSSEL E ROLAGEM SUAVE
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => {
    fetchProducts();
    fetchStoreSettings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isCartLoaded && checkoutStep !== "success") {
      const cartToSave = cart.map(item => ({ id: item.product.id, variant: item.variant, quantity: item.quantity }));
      localStorage.setItem("florESol_cart", JSON.stringify(cartToSave));
    }
  }, [cart, isCartLoaded, checkoutStep]);

  useEffect(() => {
    if (currentView === "profile" && profileTab === "orders") fetchOrders();
  }, [currentView, profileTab]);

  const fetchProducts = async () => {
    const query = new Parse.Query("Product");
    try {
      const results = await query.find();
      setProducts(results);
      const savedCart = localStorage.getItem("florESol_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          const restoredCart = parsed.map(item => {
            const p = results.find(prod => prod.id === item.id);
            if (p) return { product: p, variant: item.variant, quantity: item.quantity };
            return null;
          }).filter(Boolean); 
          setCart(restoredCart);
        } catch (e) {}
      }
      setIsCartLoaded(true); 
    } catch (error) {}
  };

  const fetchStoreSettings = async () => {
    try {
      const results = await new Parse.Query("StoreSettings").find();
      if (results.length > 0) setStoreSettings(results[0]);
    } catch (error) {}
  };

  const fetchOrders = async () => {
    const safeUser = Parse.User.current();
    if (!safeUser) return;
    const query = new Parse.Query("Order");
    query.equalTo("user", safeUser);
    query.descending("createdAt");
    try { setOrders(await query.find()); } catch (error) {}
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const userToUpdate = Parse.User.current();
      if (!userToUpdate) throw new Error("Sessão expirada.");
      userToUpdate.set("name", userName);
      userToUpdate.set("phone", userPhone);
      
      if (avatarFile) {
        const parseFile = new Parse.File("avatar.jpg", avatarFile);
        await parseFile.save();
        userToUpdate.set("avatar", parseFile);
      }

      await userToUpdate.save();
      if (userToUpdate.get("avatar")) { setUserAvatar(userToUpdate.get("avatar").url()); }
      showToast("Dados atualizados com sucesso!");
    } catch (error) { alert("Erro ao salvar: " + error.message); } 
    finally { setIsSavingProfile(false); setAvatarFile(null); }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const toggleFavorite = async (productId, e) => {
    e.stopPropagation(); 
    const safeUser = Parse.User.current();
    if (!safeUser) { showToast("Faça login para salvar!"); return; }
    let newFavorites = [...favorites];
    if (newFavorites.includes(productId)) {
      newFavorites = newFavorites.filter(id => id !== productId);
      safeUser.remove("favorites", productId);
    } else {
      newFavorites.push(productId);
      safeUser.addUnique("favorites", productId);
    }
    setFavorites(newFavorites);
    try { await safeUser.save(); } catch (error) {}
  };

  const getActivePromo = (product) => {
    const discountPrice = product.get("discountPrice");
    const discountEndsAt = product.get("discountEndsAt");
    if (discountPrice && discountEndsAt && discountEndsAt > currentTime) {
      return { isActive: true, price: discountPrice, endsAt: discountEndsAt };
    }
    return { isActive: false, price: product.get("price") };
  };

  const formatTimeLeft = (endTime) => {
    const total = Date.parse(endTime) - Date.parse(currentTime);
    if (total <= 0) return null;
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSubscribeNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribing(true);
    try {
      const Newsletter = Parse.Object.extend("Newsletter");
      const query = new Parse.Query(Newsletter);
      query.equalTo("email", newsletterEmail);
      if (await query.first()) { showToast("Este e-mail já está inscrito!"); } 
      else {
        const sub = new Newsletter();
        sub.set("email", newsletterEmail);
        if (Parse.User.current()) { sub.set("user", Parse.User.current()); }
        await sub.save();
        showToast("Inscrição realizada com sucesso! 🎉");
        setNewsletterEmail("");
      }
    } catch (error) { showToast("Erro ao assinar: " + error.message); } 
    finally { setIsSubscribing(false); }
  };

  const fetchReviews = async (product) => {
    try {
      const query = new Parse.Query("Review");
      query.equalTo("product", product);
      query.descending("createdAt");
      query.limit(10); 
      setProductReviews(await query.find());
    } catch (error) { console.error("Erro avaliações", error); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const currentUser = Parse.User.current();
    if (!currentUser) { showToast("Faça login para avaliar!"); return; }
    if (!newReviewComment.trim()) { showToast("Escreva um comentário."); return; }

    setIsSubmittingReview(true);
    try {
      const review = new Parse.Object("Review");
      review.set("product", detailedProduct);
      review.set("user", currentUser);
      review.set("userName", currentUser.get("name") || "Cliente");
      review.set("rating", newReviewRating);
      review.set("comment", newReviewComment);
      await review.save();
      setProductReviews([review, ...productReviews]);
      setNewReviewComment(""); 
      showToast("Avaliação enviada!");
    } catch (error) { alert("Erro: " + error.message); } 
    finally { setIsSubmittingReview(false); }
  };

  const handleAddToCartClick = (product, e = null) => {
    if (e) e.stopPropagation(); 
    const variants = product.get("variants") || [];
    if (variants.length > 0) { setQuickAdd({ isOpen: true, product, selectedVariant: variants[0] }); } 
    else { processAddToCart(product, null); }
  };

  const openProductDetails = (product) => {
    if (!product) return;
    const variants = product.get("variants") || [];
    setDetailedVariant(variants.length > 0 ? variants[0] : "");
    setDetailedProduct(product);
    setNewReviewRating(5); setNewReviewComment(""); setProductReviews([]);
    fetchReviews(product);
  };

  const processAddToCart = (product, variant) => {
    const stock = product.get("stock") || 0;
    if (stock <= 0) { showToast("Produto esgotado!"); return; }
    const totalOfThisProductInCart = cart.filter(item => item.product.id === product.id).reduce((sum, item) => sum + item.quantity, 0);
    if (totalOfThisProductInCart >= stock) {
      showToast(`Temos apenas ${stock} unidades!`);
      setQuickAdd({ isOpen: false, product: null, selectedVariant: "" });
      setDetailedProduct(null);
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id && item.variant === variant);
      if (existingItem) { return prevCart.map(item => (item.product.id === product.id && item.variant === variant) ? { ...item, quantity: item.quantity + 1 } : item); }
      return [...prevCart, { product, quantity: 1, variant }];
    });
    setQuickAdd({ isOpen: false, product: null, selectedVariant: "" });
    setDetailedProduct(null); 
    showToast(`${product.get("name")} adicionado!`);
  };

  const updateQuantity = (productId, variant, delta) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item.product.id === productId && item.variant === variant) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0 && newQuantity <= item.product.get("stock")) { return { ...item, quantity: newQuantity }; }
      }
      return item;
    }));
  };

  const removeFromCart = (productId, variant) => setCart((prevCart) => prevCart.filter(item => !(item.product.id === productId && item.variant === variant)));

  const cartTotal = cart.reduce((total, item) => total + (getActivePromo(item.product).price * item.quantity), 0);
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  const submitFinalCheckout = async () => {
    setCheckoutStep("processing");
    try {
      const productsToUpdate = []; const orderItems = []; const quantityMap = {};
      cart.forEach(item => { quantityMap[item.product.id] = (quantityMap[item.product.id] || 0) + item.quantity; });

      for (const [productId, qtyToDeduct] of Object.entries(quantityMap)) {
        const parseProduct = await new Parse.Query("Product").get(productId);
        if ((parseProduct.get("stock") || 0) < qtyToDeduct) { throw new Error(`Estoque insuficiente.`); }
        parseProduct.increment("stock", -qtyToDeduct);
        parseProduct.increment("salesCount", qtyToDeduct); 
        productsToUpdate.push(parseProduct);
      }

      for (const item of cart) {
        orderItems.push({ productId: item.product.id, name: `${item.product.get("name")} ${item.variant ? `(${item.variant})` : ''}`, price: getActivePromo(item.product).price, quantity: item.quantity, imageUrl: item.product.get("imageUrl") });
      }

      const order = new Parse.Object("Order");
      order.set("user", Parse.User.current()); 
      order.set("total", cartTotal); order.set("items", orderItems); order.set("shippingAddress", "A Combinar via WhatsApp");
      order.set("paymentMethod", paymentMethod === "pix" ? "PIX" : "Pagamento na Entrega");
      order.set("status", paymentMethod === "pix" ? "Aguardando PIX" : "Aguardando Entrega");
      await order.save();
      setLastOrderId(order.id); 

      if (paymentMethod === "pix") {
        try {
          const pixResponse = await Parse.Cloud.run("createPixPayment", { total: cartTotal, description: `Pedido #${order.id.slice(-6).toUpperCase()}`, email: activeUser?.get("email") || "cliente@loja.com" });
          setPixData({ qrCode: pixResponse.qr_code, qrCodeBase64: pixResponse.qr_code_base64 });
          order.set("paymentId", String(pixResponse.payment_id));
          await order.save();
        } catch (error) { await order.destroy(); setCheckoutStep("payment"); return; }
      }

      await Parse.Object.saveAll(productsToUpdate);
      setCart([]); localStorage.removeItem("florESol_cart"); setCheckoutStep("success"); 
      fetchProducts(); if (profileTab === "orders") fetchOrders();
    } catch (error) { alert("Erro: " + error.message); setCheckoutStep("payment"); }
  };

  const closeCart = () => { setCurrentView("store"); setTimeout(() => { setCheckoutStep("cart"); setLastOrderId(null); setPixData(null); }, 400); };

  const handleWhatsAppRedirect = () => {
    const texto = `${activeUser?.get("name") ? `Olá, me chamo ${activeUser.get("name")}!` : "Olá!"} Acabei de fazer um pedido (ID: ${lastOrderId}).\n\nMétodo: *${paymentMethod === "pix" ? "PIX" : "Pagamento na Entrega"}*.`;
    window.open(`https://wa.me/5585999999999?text=${encodeURIComponent(texto)}`, '_blank');
    closeCart();
  };

  const handleCopyPix = () => { if (pixData?.qrCode) { navigator.clipboard.writeText(pixData.qrCode); showToast("Código copiado!"); } };

  // =========================================
  // LISTAS E VARIÁVEIS
  // =========================================
  const normalizeText = (text) => (text || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const searchResults = products.filter((p) => {
    if (!searchQuery.trim()) return false;
    const queryRaw = normalizeText(searchQuery);
    const searchTerms = queryRaw.split(" ").filter(term => term.length > 0);
    const searchableText = `${normalizeText(p.get("name"))} ${normalizeText(p.get("category"))} ${normalizeText(p.get("description"))} ${(p.get("variants") || []).map(normalizeText).join(" ")}`;
    return searchTerms.every(term => searchableText.includes(term) || searchableText.includes(term.endsWith('s') ? term.slice(0, -1) : term));
  });

  const promoProducts = products.filter(p => getActivePromo(p).isActive);
  const bestSellers = [...products].sort((a, b) => (b.get("salesCount") || 0) - (a.get("salesCount") || 0)).slice(0, 5);
  const newArrivals = [...products].sort((a, b) => b.createdAt > a.createdAt ? 1 : -1).slice(0, 4);
  const categoriesList = ["Tudo", ...new Set(products.map(p => p.get("category")).filter(Boolean))];
  const catalogProducts = products.filter((p) => selectedCategory === "Tudo" || p.get("category") === selectedCategory);
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const tabVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }, exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } } };

  const bannersArray = storeSettings?.get("banners") || [{ imageUrl: storeSettings?.get("bannerImageUrl") || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", tag: storeSettings?.get("bannerTag") || "Novidades", title: storeSettings?.get("bannerTitle") || "Coleção Essência", desc: storeSettings?.get("bannerDesc") || "Descubra o frescor.", btn: storeSettings?.get("bannerBtn") || "Descobrir Agora", target: storeSettings?.get("bannerTarget") || "lancamentos" }];
  const infoBannerActive = storeSettings ? storeSettings.get("infoBannerActive") !== false : true;
  const infoBannerTitle = storeSettings?.get("infoBannerTitle") !== undefined ? storeSettings.get("infoBannerTitle") : "Coleção de Outono";
  const infoBannerDesc = storeSettings?.get("infoBannerDesc") !== undefined ? storeSettings.get("infoBannerDesc") : "Não perca nossa coleção exclusiva por tempo limitado.";
  const infoBannerBtn = storeSettings?.get("infoBannerBtn") !== undefined ? storeSettings.get("infoBannerBtn") : "Explorar";
  const infoBannerImageUrl = storeSettings?.get("infoBannerImageUrl") || "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop";

  // Sincroniza a barra de progresso dourada com os slides
  useEffect(() => {
    if (bannersArray.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannersArray.length);
    }, 5000);
    // Agora o timer reinicia se o usuário clicar na barra manualmente
    return () => clearInterval(interval);
  }, [bannersArray.length, currentBannerIndex]);

  // =========================================
  // CARDS DE PRODUTO (SEM ZOOM / FLAT DESIGN)
  // =========================================
  
  const renderMosaicPromoCard = (p, index) => {
    const isOutOfStock = p.get("stock") <= 0;
    const promo = getActivePromo(p);
    const isFav = favorites.includes(p.id);
    const isFullWidth = index % 3 === 0;
    const hasDetails = p.get("hasDetails"); // <--- AQUI ESTÁ A CORREÇÃO! Faltava essa linha.

    return (
      <div key={p.id} className={`group relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-card shadow-sm ${!isOutOfStock ? 'cursor-pointer' : ''} ${isFullWidth ? 'col-span-1 md:col-span-2 aspect-[4/3] md:aspect-[7/2]' : 'col-span-1 aspect-square md:aspect-[7/5]'}`}>
        {!isOutOfStock && (<div className="absolute inset-0 z-10" onClick={(e) => { e.stopPropagation(); openProductDetails(p); }} />)}
        
        <img src={p.get("imageUrl")} alt={p.get("name")} loading="lazy" className={`absolute inset-0 w-full h-full object-cover object-top ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
        
        <button onClick={(e) => toggleFavorite(p.id, e)} className="absolute top-4 right-4 md:top-5 md:right-5 p-2.5 md:p-3 bg/30 backdrop-blur-md rounded-full text-texto hover:bg-white/30 transition-colors duration-300 z-20 shadow-sm">
          <Heart className="w-4 h-4 md:w-5 md:h-5 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>

        {isOutOfStock && <div className="absolute top-4 left-4 md:top-5 md:left-5 bg-black/60 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider z-20 shadow-lg">Esgotado</div>}
        
        {/* SELO PREMIUM NO LUGAR DO DETALHES */}
        {hasDetails && !isOutOfStock && (
          <div className="absolute top-4 left-4 md:top-5 md:left-5 bg-white/30 backdrop-blur-md text-neutral-900 text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" /> Premium
          </div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
        
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-8 group-hover:translate-y-0 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
            <Timer className="w-4 h-4 md:w-5 md:h-5 text-white/90" />
            <span className="text-white/90 font-bold text-[10px] md:text-xs tracking-widest uppercase">Termina em {formatTimeLeft(promo.endsAt)}</span>
          </div>
          <h3 className="font-serif italic text-3xl sm:text-4xl md:text-5xl text-white mb-2 leading-tight drop-shadow-lg line-clamp-2 break-words">{p.get("name")}</h3>
          
          <div className="flex items-end justify-between mt-2 md:mt-4 pointer-events-auto">
            <div className="flex flex-col drop-shadow-md min-w-0 pr-2">
              <span className="text-xs md:text-sm line-through text-white/60 font-normal mb-0.5 truncate">De R$ {p.get("price").toFixed(2)}</span>
              <span className="font-bold text-white text-2xl md:text-3xl truncate">R$ {promo.price.toFixed(2)}</span>
            </div>
            
            <button onClick={(e) => handleAddToCartClick(p, e)} disabled={isOutOfStock} className="shrink-0 h-10 md:h-14 px-5 md:px-8 text-sm md:text-base bg-white text-neutral-900 font-bold rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-200 transition-colors duration-300 disabled:opacity-50">
              {isOutOfStock ? "Esgotado" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNewArrivalCard = (p) => {
    const isOutOfStock = p.get("stock") <= 0;
    const promo = getActivePromo(p);
    const isFav = favorites.includes(p.id);
    const hasDetails = p.get("hasDetails");

    return (
      <div key={p.id} className="relative shrink-0 w-[80vw] max-w-[280px] sm:max-w-[340px] md:w-full md:max-w-none snap-center pb-6 md:pb-8 pt-2">
        <div onClick={() => hasDetails && !isOutOfStock && openProductDetails(p)} className={`group relative aspect-[3/4] w-full overflow-hidden rounded-[24px] md:rounded-[32px] shadow-sm transition-shadow duration-300 ${hasDetails && !isOutOfStock ? 'cursor-pointer' : ''}`}>
          
          <img src={p.get("imageUrl")} alt={p.get("name")} loading="lazy" className={`absolute inset-0 w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
          
          <div className="absolute top-4 left-4 md:top-5 md:left-5 flex items-center gap-2 z-30 pointer-events-none">
            <div className="bg-texto text-card text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest shadow-md">Novo</div>
            
            {/* SELO PREMIUM NO LUGAR DO DETALHES */}
            {hasDetails && !isOutOfStock && (
              <div className="bg/30 backdrop-blur-md text-neutral-900 text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" /> Premium
              </div>
            )}
          </div>

          <button onClick={(e) => toggleFavorite(p.id, e)} className="absolute top-4 right-4 md:top-5 md:right-5 p-2.5 md:p-3 bg/30 backdrop-blur-lg rounded-full text-texto hover:bg-card/30 transition-colors duration-300 z-30 shadow-sm">
            <Heart className="w-4 h-4 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
          </button>

          {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30"><span className="bg-card text-texto text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">Esgotado</span></div>}

          <div className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-[35%] pointer-events-none z-10 bg-gradient-to-t from-texto/30 via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col gap-2 z-20 opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
            <span className="text-[10px] md:text-[10px] font-bold uppercase tracking-widest text-texto-sec drop-shadow-sm">{p.get("category")}</span>
            <h3 className="font-serif italic text-2xl sm:text-3xl text-texto line-clamp-1 drop-shadow-sm">{p.get("name")}</h3>
            <div className="flex items-center gap-2 mt-1 pointer-events-auto drop-shadow-sm">
              {promo.isActive ? (<><span className="text-xs md:text-sm line-through text-texto-sec pr-1">R$ {p.get("price").toFixed(2)}</span><span className="font-bold text-texto text-xl sm:text-2xl">R$ {promo.price.toFixed(2)}</span></>) : (<span className="font-bold text-texto text-xl sm:text-2xl">R$ {p.get("price").toFixed(2)}</span>)}
            </div>
            <button onClick={(e) => handleAddToCartClick(p, e)} disabled={isOutOfStock} className="pointer-events-auto mt-4 w-full h-12 md:h-14 text-sm md:text-base bg-texto text-card font-bold rounded-xl md:rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 gap-2 shadow-lg">
              {isOutOfStock ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}
              {isOutOfStock ? "Esgotado" : "Adicionar à sacola"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBestSellerCard = (p) => {
    const isOutOfStock = p.get("stock") <= 0;
    const promo = getActivePromo(p);
    const isFav = favorites.includes(p.id);
    const hasDetails = p.get("hasDetails");

    return (
      <div key={p.id} className="relative shrink-0 w-[80vw] max-w-[280px] sm:max-w-[320px] md:w-full md:max-w-none snap-center pb-6 md:pb-8 pt-2">
        <div onClick={() => hasDetails && !isOutOfStock && openProductDetails(p)} className={`group w-full aspect-[3/4] relative rounded-[24px] md:rounded-[32px] overflow-hidden border border-borda bg-card shadow-sm ${hasDetails && !isOutOfStock ? 'cursor-pointer' : ''}`}>
          
          <img src={p.get("imageUrl")} alt={p.get("name")} loading="lazy" className={`absolute inset-0 w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
          
          <button onClick={(e) => toggleFavorite(p.id, e)} className="absolute top-4 right-4 md:top-5 md:right-5 p-2.5 md:p-3 bg/30 backdrop-blur-md rounded-full text-texto hover:bg-white/30 transition-colors duration-300 z-20 shadow-sm">
            <Heart className="w-4 h-4 md:w-5 md:h-5 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
          </button>

          {isOutOfStock && <div className="absolute top-4 left-4 md:top-5 md:left-5 bg-black/60 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider z-20 shadow-lg">Esgotado</div>}
          
          {/* SELO PREMIUM NO LUGAR DO DETALHES */}
          {hasDetails && !isOutOfStock && (
            <div className="absolute top-4 left-4 md:top-5 md:left-5 bg-white/30 backdrop-blur-md text-neutral-900 text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" /> Premium
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0 z-10 pointer-events-none">
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1 drop-shadow-md">{p.get("category")}</span>
            <h3 className="font-serif italic text-2xl sm:text-3xl text-white mb-2 md:mb-3 leading-tight line-clamp-2 drop-shadow-lg break-words">{p.get("name")}</h3>
            <div className="flex flex-col gap-3 mt-1 pointer-events-auto">
              <div className="flex items-center gap-2 drop-shadow-md flex-wrap">
                {promo.isActive ? (<><span className="text-xs md:text-sm line-through text-white/70 font-normal">R$ {p.get("price").toFixed(2)}</span><span className="font-bold text-white text-xl sm:text-2xl">R$ {promo.price.toFixed(2)}</span></>) : (<span className="font-bold text-white text-xl sm:text-2xl">R$ {p.get("price").toFixed(2)}</span>)}
              </div>
              <button onClick={(e) => handleAddToCartClick(p, e)} disabled={isOutOfStock} className="w-full h-10 md:h-12 text-sm md:text-base bg-white text-neutral-900 font-bold rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-200 transition-colors duration-300 disabled:opacity-50 gap-2">
                {isOutOfStock ? <X className="w-4 h-4 md:w-5 md:h-5" /> : <Plus className="w-4 h-4 md:w-5 md:h-5" />}
                {isOutOfStock ? "Esgotado" : "Adicionar à sacola"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductCard = (p) => {
    const isOutOfStock = p.get("stock") <= 0;
    const variants = p.get("variants") || [];
    const isFav = favorites.includes(p.id);
    const hasDetails = p.get("hasDetails");
    
    return (
      <div key={p.id} className="group relative flex flex-col">
        <div onClick={() => hasDetails && !isOutOfStock && openProductDetails(p)} className={`aspect-[4/5] overflow-hidden rounded-[20px] md:rounded-[24px] bg-card mb-3 md:mb-4 relative border border-transparent hover:border-borda transition-colors ${hasDetails && !isOutOfStock ? 'cursor-pointer' : ''}`}>
          
          <img src={p.get("imageUrl")} alt={p.get("name")} loading="lazy" className={`w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
          
          <button onClick={(e) => toggleFavorite(p.id, e)} className="absolute top-3 right-3 md:top-4 md:right-4 p-2.5 bg-card/30 backdrop-blur-md rounded-full text-texto shadow-sm hover:bg-card transition-colors duration-300 z-20">
            <Heart className="w-4 h-4 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
          </button>

          {isOutOfStock && <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-card/90 backdrop-blur-sm text-texto text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full uppercase tracking-wider shadow-sm z-20">Esgotado</div>}
          
          {/* SELO PREMIUM NO LUGAR DO DETALHES */}
          {hasDetails && !isOutOfStock && (
            <div className="absolute top-3 left-3 md:top-4 md:left-4 backdrop-blur-md text-neutral-900 text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-2.5 md:py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Premium
            </div>
          )}
          
          {!isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 translate-y-[120%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-auto">
              <button onClick={(e) => handleAddToCartClick(p, e)} className="w-full bg-btn text-btn-texto font-bold py-3 md:py-4 text-sm md:text-base rounded-xl shadow-lg hover:opacity-90 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> Adicionar à sacola
              </button>
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm md:text-base text-texto line-clamp-2">{p.get("name")}</h3>
        <div className="flex justify-between items-end mt-1">
          <p className="text-texto-sec text-sm md:text-base">R$ {p.get("price").toFixed(2)}</p>
          {variants.length > 0 && <span className="text-[9px] md:text-[10px] uppercase font-bold text-texto-sec bg-fundo border border-borda px-1.5 md:px-2 py-0.5 rounded-md">{variants.length} Cores</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-fundo transition-colors duration-500 font-sans relative flex flex-col text-texto">
      
      {/* ========================================================================= */}
      {/* CABEÇALHO (NAVBAR) */}
      {/* ========================================================================= */}
      <header className="bg-fundo backdrop-blur-md transition-colors duration-500 sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-4">
          
          <div className="flex-1 flex justify-start">
            <button onClick={() => setCurrentView("store")} className="text-2xl md:text-3xl font-serif italic tracking-wide text-texto hover:opacity-70 transition-opacity truncate">
              Flor e Sol
            </button>
          </div>
          
          {currentView === "store" && (
            <div className="flex-[2] flex justify-center items-center">
              <motion.div initial={false} animate={{ width: isSearchExpanded ? "100%" : "44px", maxWidth: isSearchExpanded ? "600px" : "44px" }} transition={{ type: "spring", bounce: 0, duration: 0.6 }} className={`relative flex items-center h-10 md:h-11 rounded-full overflow-hidden transition-colors duration-300 ${isSearchExpanded ? 'bg-texto text-card shadow-md' : 'bg-transparent hover:bg-texto/5'}`}>
                <button onClick={() => setIsSearchExpanded(true)} className={`absolute left-0 z-10 w-10 md:w-11 h-10 md:h-11 flex items-center justify-center transition-colors duration-300 ${isSearchExpanded ? 'text-card cursor-default pointer-events-none' : 'text-texto'}`}><Search className="w-4 h-4 md:w-5 md:h-5" /></button>
                <input type="text" placeholder="O que você está procurando?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full h-full bg-transparent border-none py-2 pl-10 md:pl-12 pr-10 md:pr-12 focus:outline-none text-sm md:text-base transition-opacity duration-300 ${isSearchExpanded ? 'opacity-100 text-card placeholder:text-card/70' : 'opacity-0 cursor-pointer'}`} style={{ pointerEvents: isSearchExpanded ? 'auto' : 'none' }} />
                <AnimatePresence>
                  {isSearchExpanded && (<motion.button initial={{ opacity: 0, scale: 0.5, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 45 }} transition={{ duration: 0.3 }} onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }} className="absolute right-0 z-10 w-10 md:w-11 h-10 md:h-11 flex items-center justify-center text-card/70 hover:text-card hover:bg-card/10 rounded-full transition-colors"><X className="w-4 h-4" /></motion.button>)}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          <div className="flex-1 flex justify-end items-center gap-1 md:gap-2 text-texto-sec">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full text-texto-sec hover:text-texto hover:bg-texto/5 transition-colors hidden sm:block">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={() => setCurrentView("cart")} className={`p-2.5 rounded-full transition-colors relative ${currentView === "cart" ? "bg-texto text-card" : "text-texto-sec hover:text-texto hover:bg-texto/5"}`}>
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (<span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 ${currentView === "cart" ? "bg-card border-texto" : "bg-texto border-fundo"}`} />)}
            </button>
            
            {/* BOTÃO DE PERFIL*/}
            <div 
              className="relative hidden md:block ml-1"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                className={`flex items-center gap-2 px-3 py-2.5 rounded-full transition-colors ${currentView === "profile" ? "bg-texto text-card shadow-sm" : "text-texto-sec hover:text-texto hover:bg-texto/5"}`}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Perfil" className={`w-7 h-7 rounded-full object-cover border ${currentView === "profile" ? "border-card/30" : "border-borda"}`} />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {activeUser?.get("name") ? `Olá, ${activeUser.get("name").split(" ")[0]}` : "Entrar"}
                </span>
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-card rounded-2xl shadow-xl border border-borda overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-borda mb-2 flex items-center gap-3">
                      {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-10 h-10 rounded-full object-cover border border-borda" /> : <div className="w-10 h-10 rounded-full bg-fundo flex items-center justify-center text-texto-sec"><User className="w-5 h-5" /></div>}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-texto truncate">{activeUser?.get("name") || "Bem-vindo!"}</p>
                        <p className="text-xs text-texto-sec truncate">{activeUser?.get("email")}</p>
                      </div>
                    </div>
                    <button onClick={() => { setCurrentView("profile"); setProfileTab("data"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Settings className="w-4 h-4" /> Meus Dados</button>
                    <button onClick={() => { setCurrentView("profile"); setProfileTab("orders"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Package className="w-4 h-4" /> Meus Pedidos</button>
                    <button onClick={() => { setCurrentView("profile"); setProfileTab("favorites"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Heart className="w-4 h-4" /> Meus Favoritos</button>
                    <div className="h-px bg-borda my-2"></div>
                    <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"><LogOut className="w-4 h-4" /> Sair da Conta</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-texto-sec hover:text-texto hover:bg-texto/5 rounded-full transition-colors"><Menu className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-card shadow-2xl z-50 flex flex-col md:hidden">
              <div className="flex items-center justify-between p-5 border-b border-borda">
                <h2 className="text-xl font-serif italic text-texto">Flor e Sol</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-fundo rounded-full transition text-texto-sec hover:text-texto"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                <div className="bg-fundo p-4 rounded-xl border border-borda flex items-center gap-3">
                  {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-12 h-12 rounded-full object-cover border border-borda" /> : <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-texto-sec"><User className="w-6 h-6" /></div>}
                  <div className="min-w-0">
                    <p className="text-[10px] text-texto-sec uppercase tracking-wider mb-0.5">Olá,</p>
                    <p className="font-bold text-texto truncate text-base">{activeUser?.get("name") || activeUser?.get("email")}</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-1.5">
                  <button onClick={() => { setCurrentView("store"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "store" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><ShoppingBag className="w-5 h-5" /> Vitrine da Loja</button>
                  <button onClick={() => { setCurrentView("cart"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "cart" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><ShoppingBag className="w-5 h-5" /> Meu Carrinho</button>
                  <button onClick={() => { setCurrentView("profile"); setProfileTab("data"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "data" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Settings className="w-5 h-5" /> Meus Dados</button>
                  <button onClick={() => { setCurrentView("profile"); setProfileTab("orders"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "orders" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Package className="w-5 h-5" /> Meus Pedidos</button>
                  <button onClick={() => { setCurrentView("profile"); setProfileTab("favorites"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "favorites" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Heart className="w-5 h-5" /> Meus Favoritos</button>
                </nav>
                <div className="mt-auto pt-5 border-t border-borda flex items-center justify-between">
                  <button onClick={onLogout} className="text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3"><LogOut className="w-5 h-5" /> Sair</button>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-fundo rounded-xl text-texto-sec hover:text-texto transition-colors">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-grow relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TELA 1: VITRINE */}
          {currentView === "store" && (
            <motion.main 
              key="view-store"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 mt-6 md:mt-3 space-y-12 md:space-y-16 mb-20"
            >
              {searchQuery ? (
                <section>
                  <h2 className="text-xl md:text-2xl font-medium mb-6 text-texto">Resultados para "{searchQuery}"</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-8">
                    {searchResults.map(renderProductCard)}
                    {searchResults.length === 0 && <p className="text-texto-sec col-span-full">Nenhum produto encontrado.</p>}
                  </div>
                </section>
              ) : (
                <>
                  <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[85vh] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm bg-fundo">
                    {bannersArray.map((banner, index) => (
                      <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover object-center" />
                        <div className="absolute inset-0 bg-black/30"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pb-12 md:pb-20">
                          <span className="text-neutral-100/90 uppercase tracking-[0.3em] text-[10px] md:text-sm font-bold mb-2 md:mb-3 drop-shadow-sm">{banner.tag}</span>
                          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif italic text-neutral-100 mb-4 md:mb-6 drop-shadow-md break-words">{banner.title}</h2>
                          <p className="text-sm sm:text-base md:text-xl text-neutral-100/95 max-w-2xl mb-8 md:mb-10 drop-shadow-sm font-light px-4">{banner.desc}</p>
                          <button onClick={() => scrollToSection(banner.target)} className="px-8 py-3 md:px-10 md:py-4 bg-neutral-100 text-neutral-900 font-bold rounded-full hover:bg-neutral-300 transition-colors duration-300 shadow-2xl text-sm md:text-lg">{banner.btn}</button>
                        </div>
                      </div>
                    ))}
                    {bannersArray.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                        {bannersArray.map((_, idx) => (
                          <button key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`transition-colors duration-500 rounded-full ${idx === currentBannerIndex ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
                        ))}
                      </div>
                    )}
                  </section>

                  {newArrivals.length > 0 && (
                    <section id="lancamentos" className="mt-12 md:mt-16 pt-4">
                      <div className="flex items-center gap-3 mb-6 px-1 md:px-0">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-btn text-btn-texto flex items-center justify-center"><Sparkles className="w-3 h-3 md:w-4 md:h-4" /></div>
                        <h2 className="text-xl md:text-2xl font-medium text-texto">Lançamentos</h2>
                      </div>
                      <div className="flex overflow-x-auto gap-4 md:gap-8 snap-x snap-mandatory scrollbar-hide pb-8 md:pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {newArrivals.map(renderNewArrivalCard)}
                      </div>
                    </section>
                  )}

                  {promoProducts.length > 0 && (
                    <section id="ofertas" className="mt-12 md:mt-16">
                      <div className="flex flex-col items-center text-center mb-8 md:mb-10 gap-2 md:gap-3 px-4">
                        <Timer className="w-6 h-6 md:w-8 md:h-8 text-texto mb-1" />
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-texto break-words">Ofertas Limitadas</h2>
                        <p className="text-sm md:text-base text-texto-sec max-w-xl mb-5">Peças exclusivas com descontos especiais.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {promoProducts.map((p, index) => renderMosaicPromoCard(p, index))}
                      </div>
                    </section>
                  )}

                  <section id="mais-desejados" className="mt-12 md:mt-16 pt-4">
                    <div className="flex items-center gap-3 mb-6 px-1 md:px-0">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-btn text-btn-texto flex items-center justify-center"><TrendingUp className="w-3 h-3 md:w-4 md:h-4" /></div>
                      <h2 className="text-xl md:text-2xl font-medium text-texto">Mais Desejados</h2>
                    </div>
                    <div className="flex overflow-x-auto gap-4 md:gap-8 snap-x snap-mandatory scrollbar-hide pb-8 md:pb-10 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {bestSellers.length > 0 ? bestSellers.map(renderBestSellerCard) : <p className="text-texto-sec col-span-full">Sem dados de vendas.</p>}
                    </div>
                  </section>

                  {infoBannerActive && (
                    <section className="mt-8 md:mt-24 mb-4">
                      <div className="relative w-full h-[35vh] md:h-[50vh] rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm group">
                        {/* Imagem do InfoBanner agora SEM scale para manter o Flat Design */}
                        <img src={infoBannerImageUrl} alt={infoBannerTitle} loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
                        <div className="absolute inset-0 bg-black/40 transition-colors hover:bg-black/50 duration-500"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                          <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif italic text-white mb-3 md:mb-4 drop-shadow-md break-words">{infoBannerTitle}</h2>
                          <p className="text-sm md:text-xl text-white/90 max-w-2xl mb-6 md:mb-8 drop-shadow-sm font-light px-4">{infoBannerDesc}</p>
                          {infoBannerBtn && (
                            <button className="px-6 py-2.5 md:px-8 md:py-3 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-200 transition-colors duration-300 shadow-xl text-sm md:text-base">
                              {infoBannerBtn}
                            </button>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  <section id="catalogo" className="border-t border-borda pt-8 md:pt-12 mt-8 md:mt-12">
                    {categoriesList.length > 1 && (
                      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-6 md:pb-8 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:justify-center">
                        {categoriesList.map(cat => (
                          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 whitespace-nowrap border shrink-0 ${selectedCategory === cat ? "bg-texto text-card shadow-md border-transparent" : "bg-card border-borda text-texto-sec hover:text-texto hover:bg-texto/5"}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={selectedCategory}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-8"
                      >
                        {catalogProducts.map(renderProductCard)}
                        {catalogProducts.length === 0 && <p className="text-texto-sec col-span-full text-center py-10">Nenhum produto nesta categoria.</p>}
                      </motion.div>
                    </AnimatePresence>
                  </section>
                </>
              )}
            </motion.main>
          )}

          {/* TELA 2: PERFIL */}
          {currentView === "profile" && (
             <motion.main 
             key="view-profile"
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -15 }}
             transition={{ duration: 0.4, ease: "easeInOut" }}
             className={`mx-auto px-4 sm:px-6 md:px-12 mt-8 md:mt-12 mb-20 ${profileTab === "favorites" ? "max-w-[1600px] lg:px-16" : "max-w-4xl"}`}
           >
             <div className="bg-card rounded-2xl md:rounded-3xl shadow-sm border border-borda overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col transition-colors duration-500">
               <div className="flex border-b border-borda flex-nowrap overflow-x-auto scrollbar-hide shrink-0 bg-fundo">
                 <button onClick={() => setProfileTab("data")} className={`flex-1 min-w-[120px] px-4 py-4 text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${profileTab === "data" ? "text-texto bg-card border-b-2 border-texto" : "text-texto-sec hover:text-texto hover:bg-texto/5"}`}>Meus Dados</button>
                 <button onClick={() => setProfileTab("orders")} className={`flex-1 min-w-[120px] px-4 py-4 text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${profileTab === "orders" ? "text-texto bg-card border-b-2 border-texto" : "text-texto-sec hover:text-texto hover:bg-texto/5"}`}>Histórico</button>
                 <button onClick={() => setProfileTab("favorites")} className={`flex-1 min-w-[120px] px-4 py-4 text-xs md:text-sm font-bold transition-colors whitespace-nowrap flex justify-center items-center gap-2 ${profileTab === "favorites" ? "text-texto bg-card border-b-2 border-texto" : "text-texto-sec hover:text-texto hover:bg-texto/5"}`}><Heart className="w-3 h-3 md:w-4 h-4" /> Favoritos</button>
               </div>
               <div className="p-5 sm:p-8 flex-1 relative overflow-hidden">
                 <AnimatePresence mode="wait">
                   
                   {profileTab === "data" && (
                     <motion.div key="tab-data" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="max-w-md mx-auto w-full">
                       <div className="flex flex-col items-center justify-center mb-8">
                          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-borda overflow-hidden bg-fundo group shadow-sm">
                            {userAvatar || avatarFile ? (
                              <img src={avatarFile ? URL.createObjectURL(avatarFile) : userAvatar} alt="Sua Foto" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-texto-sec bg-card"><User className="w-10 h-10 md:w-12 md:h-12" /></div>
                            )}
                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                              <Camera className="w-5 h-5 text-white mb-1" />
                              <span className="text-white text-[10px] font-bold uppercase tracking-widest">Mudar</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files[0])} />
                            </label>
                          </div>
                          <p className="text-[10px] md:text-xs text-texto-sec font-bold uppercase tracking-widest mt-3">Sua Foto de Perfil</p>
                       </div>

                       <form onSubmit={saveProfile} className="space-y-5 md:space-y-6">
                         <div>
                           <label className="block text-[10px] md:text-xs font-bold text-texto-sec uppercase mb-1">E-mail (Login)</label>
                           <input type="text" disabled value={activeUser?.get("email") || ""} className="w-full px-4 py-3 bg-fundo border border-borda rounded-xl text-sm text-texto-sec cursor-not-allowed" />
                         </div>
                         <div>
                           <label className="block text-[10px] md:text-xs font-bold text-texto-sec uppercase mb-1">Nome ou Apelido</label>
                           <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Como quer ser chamado?" className="w-full px-4 py-3 bg-card border border-borda text-sm text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none" />
                         </div>
                         <div>
                           <label className="block text-[10px] md:text-xs font-bold text-texto-sec uppercase mb-1">WhatsApp</label>
                           <input type="tel" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-card border border-borda text-sm text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none" />
                         </div>
                         <button type="submit" disabled={isSavingProfile} className="w-full bg-btn text-btn-texto font-bold py-3.5 md:py-4 rounded-xl text-sm md:text-base hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex justify-center items-center gap-2 shadow-md">
                           {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alterações"}
                         </button>
                       </form>
                     </motion.div>
                   )}

                   {profileTab === "orders" && (
                     <motion.div key="tab-orders" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4 md:space-y-6 w-full">
                       {orders.length === 0 ? (
                         <div className="text-center py-12 text-texto-sec">
                           <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                           <p className="text-sm md:text-base">Você ainda não fez nenhum pedido.</p>
                         </div>
                       ) : (
                         orders.map(order => (
                           <div key={order.id} className="border border-borda rounded-xl md:rounded-2xl p-4 sm:p-6 bg-fundo">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-borda pb-4 mb-4 gap-3 sm:gap-4">
                               <div className="flex justify-between sm:block w-full sm:w-auto">
                                 <p className="text-xs sm:text-sm text-texto-sec">Pedido feito em</p>
                                 <p className="text-sm sm:text-base font-bold text-texto">{order.createdAt.toLocaleDateString("pt-BR")}</p>
                               </div>
                               <div className="flex justify-between sm:block w-full sm:w-auto">
                                 <p className="text-xs sm:text-sm text-texto-sec">Total</p>
                                 <p className="text-sm sm:text-base font-bold text-texto">R$ {order.get("total").toFixed(2)}</p>
                               </div>
                               <div className="mt-1 sm:mt-0 self-start sm:self-auto">
                                 <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-green-500/30">{order.get("status")}</span>
                               </div>
                             </div>
                             <div className="space-y-3 md:space-y-4">
                               {order.get("items").map((item, index) => (
                                 <div key={index} className="flex items-center gap-3 sm:gap-4">
                                   <img src={item.imageUrl} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-borda shrink-0" />
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm sm:text-base font-bold text-texto truncate">{item.name}</p>
                                     <p className="text-xs sm:text-sm text-texto-sec">{item.quantity}x de R$ {item.price.toFixed(2)}</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ))
                       )}
                     </motion.div>
                   )}
                   {profileTab === "favorites" && (
                     <motion.div key="tab-favorites" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                       {favoriteProducts.length === 0 ? (
                         <div className="text-center py-12 md:py-16 text-texto-sec">
                           <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                           <p className="text-sm md:text-base mb-6">Você ainda não salvou nenhum favorito.</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
                           {favoriteProducts.map(renderProductCard)}
                         </div>
                       )}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>
           </motion.main>
          )}

          {/* TELA 3: CARRINHO E CHECKOUT */}
          {currentView === "cart" && (
            <motion.main
              key="view-cart"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 mt-6 md:mt-12 mb-20"
            >
              <AnimatePresence mode="wait">
                {checkoutStep === "processing" || checkoutStep === "success" ? (
                  <motion.div 
                    key="step-success-processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="bg-card rounded-2xl md:rounded-3xl shadow-sm border border-borda p-6 md:p-20 flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] text-center transition-colors duration-500"
                  >
                    {checkoutStep === "processing" && (
                      <>
                        <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-texto animate-spin mb-4" />
                        <p className="text-texto-sec font-bold animate-pulse text-base md:text-lg">Conectando ao banco...</p>
                      </>
                    )}

                    {checkoutStep === "success" && paymentMethod === "pix" && pixData && (
                      <div className="w-full max-w-md flex flex-col items-center">
                        <h3 className="text-2xl md:text-3xl font-bold text-texto mb-2">Quase lá!</h3>
                        <p className="text-texto-sec mb-6 md:mb-8 text-xs md:text-sm px-4">Escaneie o QR Code ou use o código Copia e Cola para pagar.</p>
                        
                        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-borda mb-6 md:mb-8">
                          <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-40 h-40 md:w-56 md:h-56 rounded-xl" />
                        </div>
                        
                        <div className="flex items-center gap-2 bg-fundo p-2 rounded-xl md:rounded-2xl w-full mb-6 md:mb-8 border border-borda min-w-0">
                          <input type="text" readOnly value={pixData.qrCode} className="bg-transparent flex-1 text-[10px] md:text-xs text-texto-sec outline-none pl-2 md:pl-3 truncate font-medium min-w-0" />
                          <button onClick={handleCopyPix} className="bg-btn text-btn-texto px-4 py-3 md:px-6 md:py-4 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl hover:opacity-90 transition-opacity duration-300 shadow-md shrink-0">Copiar</button>
                        </div>
                        
                        <button onClick={handleWhatsAppRedirect} className="w-full py-3.5 md:py-4 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-xl flex items-center justify-center gap-2 md:gap-3 text-sm md:text-lg"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /> Já paguei! Enviar comprovante</button>
                        <button onClick={closeCart} className="mt-6 md:mt-8 text-xs md:text-sm font-bold text-texto-sec hover:text-texto transition-colors">Voltar para a Loja</button>
                      </div>
                    )}

                    {checkoutStep === "success" && paymentMethod === "entrega" && (
                      <div className="w-full max-w-md flex flex-col items-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner"><CheckCircle className="w-10 h-10 md:w-12 md:h-12" /></div>
                        <h3 className="text-2xl md:text-3xl font-bold text-texto mb-2">Pedido Confirmado!</h3>
                        <p className="text-texto-sec mb-8 md:mb-10 text-sm md:text-lg px-4">Chame nossa equipe no WhatsApp para combinarmos a entrega.</p>
                        <button onClick={handleWhatsAppRedirect} className="w-full py-3.5 md:py-4 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-xl flex items-center justify-center gap-2 md:gap-3 text-sm md:text-lg"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /> Combinar Entrega</button>
                        <button onClick={closeCart} className="mt-6 md:mt-8 text-xs md:text-sm font-bold text-texto-sec hover:text-texto transition-colors">Voltar para a Loja</button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step-cart-payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start"
                  >
                    <div className="flex-1 w-full bg-card rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-sm border border-borda transition-colors duration-500">
                      
                      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-borda">
                        <button onClick={closeCart} className="p-2 md:p-3 hover:bg-fundo rounded-full transition-colors text-texto-sec hover:text-texto">
                          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <h2 className="text-2xl md:text-3xl font-serif italic text-texto">
                          {checkoutStep === "cart" ? "Sua Sacola" : "Pagamento"}
                        </h2>
                      </div>

                      <AnimatePresence mode="wait">
                        {checkoutStep === "cart" && (
                          <motion.div key="cart-list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-4 md:space-y-6">
                            {cart.length === 0 ? (
                              <div className="flex flex-col items-center justify-center text-texto-sec py-12 md:py-16">
                                <ShoppingBag className="w-16 h-16 md:w-20 md:h-20 opacity-20 mb-4 md:mb-6" />
                                <p className="text-base md:text-lg">Sua sacola está vazia.</p>
                              </div>
                            ) : (
                              cart.map((item) => {
                                const promo = getActivePromo(item.product);
                                return (
                                  <div key={`${item.product.id}-${item.variant}`} className="flex flex-row gap-4 md:gap-6 p-3 md:p-4 rounded-xl md:rounded-2xl border border-borda transition-colors hover:bg-fundo">
                                    <img src={item.product.get("imageUrl")} alt={item.product.get("name")} className="w-24 h-32 sm:w-28 sm:h-32 md:w-32 object-cover rounded-lg md:rounded-xl border border-borda shrink-0" />
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                      <div>
                                        <div className="flex justify-between items-start">
                                          <h3 className="font-bold text-texto text-sm md:text-lg pr-2 truncate">
                                            {item.product.get("name")} 
                                            {item.variant && <span className="block text-xs md:text-sm text-texto-sec mt-0.5 md:mt-1 truncate">Modelo: {item.variant}</span>}
                                          </h3>
                                          <button onClick={() => removeFromCart(item.product.id, item.variant)} className="p-1.5 md:p-2 text-texto-sec hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 shrink-0"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                        </div>
                                        {promo.isActive ? (
                                          <div className="flex items-center gap-2 mt-1 md:mt-2 flex-wrap">
                                            <p className="text-texto-sec text-xs md:text-sm line-through">R$ {item.product.get("price").toFixed(2)}</p>
                                            <p className="text-texto font-bold text-base md:text-lg">R$ {promo.price.toFixed(2)}</p>
                                          </div>
                                        ) : (
                                          <p className="text-texto font-bold text-base md:text-lg mt-1 md:mt-2">R$ {item.product.get("price").toFixed(2)}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 mt-3 md:mt-4">
                                        <div className="flex items-center gap-2 md:gap-3 bg-fundo border border-borda w-fit rounded-lg md:rounded-xl px-1.5 md:px-2 py-1">
                                          <button onClick={() => updateQuantity(item.product.id, item.variant, -1)} className="p-1 md:p-2 hover:text-texto text-texto-sec transition-colors bg-card rounded md:rounded-lg shadow-sm border border-transparent"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                          <span className="w-5 md:w-6 text-center font-bold text-xs md:text-sm text-texto">{item.quantity}</span>
                                          <button onClick={() => updateQuantity(item.product.id, item.variant, 1)} className="p-1 md:p-2 hover:text-texto text-texto-sec transition-colors bg-card rounded md:rounded-lg shadow-sm border border-transparent"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </motion.div>
                        )}

                        {checkoutStep === "payment" && (
                          <motion.div key="payment-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 md:space-y-6">
                            <p className="text-base md:text-lg text-texto-sec font-bold mb-2 md:mb-4">Escolha a forma de pagamento:</p>
                            
                            <button onClick={() => setPaymentMethod("pix")} className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left flex items-center gap-4 md:gap-6 transition-colors duration-300 ${paymentMethod === "pix" ? "border-texto bg-fundo shadow-md" : "border-borda bg-card hover:border-texto-sec hover:bg-fundo/50"}`}>
                              <div className={`p-3 md:p-4 rounded-full shrink-0 transition-colors duration-300 ${paymentMethod === "pix" ? "bg-btn text-btn-texto" : "bg-fundo text-texto-sec"}`}>
                                <QrCode className="w-6 h-6 md:w-8 md:h-8" />
                              </div>
                              <div>
                                <h4 className={`text-base md:text-xl font-bold transition-colors duration-300 ${paymentMethod === "pix" ? "text-texto" : "text-texto-sec"}`}>PIX (Na hora)</h4>
                                <p className="text-[10px] md:text-sm text-texto-sec mt-0.5 md:mt-1">Gere o código Copia e Cola na próxima tela.</p>
                              </div>
                            </button>
                            
                            <button onClick={() => setPaymentMethod("entrega")} className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left flex items-center gap-4 md:gap-6 transition-colors duration-300 ${paymentMethod === "entrega" ? "border-texto bg-fundo shadow-md" : "border-borda bg-card hover:border-texto-sec hover:bg-fundo/50"}`}>
                              <div className={`p-3 md:p-4 rounded-full shrink-0 transition-colors duration-300 ${paymentMethod === "entrega" ? "bg-btn text-btn-texto" : "bg-fundo text-texto-sec"}`}>
                                <Truck className="w-6 h-6 md:w-8 md:h-8" />
                              </div>
                              <div>
                                <h4 className={`text-base md:text-xl font-bold transition-colors duration-300 ${paymentMethod === "entrega" ? "text-texto" : "text-texto-sec"}`}>Pagar na Entrega</h4>
                                <p className="text-[10px] md:text-sm text-texto-sec mt-0.5 md:mt-1">Pague ao motoboy em dinheiro ou cartão.</p>
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-full lg:w-[400px] shrink-0 bg-card rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-borda sticky top-24 md:top-28 transition-colors duration-500">
                      <h3 className="text-lg md:text-xl font-bold text-texto mb-6 md:mb-8">Resumo do Pedido</h3>
                      
                      <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                        <div className="flex justify-between text-sm md:text-base text-texto-sec">
                          <span>Subtotal ({cartItemsCount} itens)</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm md:text-base text-texto-sec">
                          <span>Frete</span>
                          <span className="text-texto font-bold">A calcular</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-borda pt-5 md:pt-6 mb-6 md:mb-10">
                        <span className="font-bold text-base md:text-lg text-texto">Total</span>
                        <span className="text-2xl md:text-3xl font-bold text-texto">R$ {cartTotal.toFixed(2)}</span>
                      </div>

                      <AnimatePresence mode="wait">
                        {checkoutStep === "cart" && (
                          <motion.div key="btn-cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button onClick={() => setCheckoutStep("payment")} disabled={cart.length === 0} className="w-full bg-btn text-btn-texto font-bold py-4 md:py-5 rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-lg disabled:opacity-50 flex justify-center items-center text-sm md:text-lg">
                              Ir para Pagamento
                            </button>
                          </motion.div>
                        )}

                        {checkoutStep === "payment" && (
                          <motion.div key="btn-payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 md:gap-4">
                            <button onClick={submitFinalCheckout} className="w-full bg-btn text-btn-texto font-bold py-4 md:py-5 rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-lg flex justify-center items-center text-sm md:text-lg gap-2">
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> Finalizar Pedido
                            </button>
                            <button onClick={() => setCheckoutStep("cart")} className="w-full py-3 md:py-4 text-texto-sec font-bold hover:text-texto transition-colors text-xs md:text-sm">
                              Voltar para sacola
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* MINI-MODAL DE ADIÇÃO RÁPIDA (Escolher a cor ou modelo do produto) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {quickAdd.isOpen && quickAdd.product && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuickAdd({ isOpen: false, product: null, selectedVariant: "" })}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-borda relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setQuickAdd({ isOpen: false, product: null, selectedVariant: "" })} className="absolute top-4 right-4 p-2 bg-fundo hover:bg-borda rounded-full text-texto-sec hover:text-texto transition-colors"><X className="w-5 h-5" /></button>
              
              <div className="flex items-center gap-4 mb-6 pr-8">
                <img src={quickAdd.product.get("imageUrl")} alt={quickAdd.product.get("name")} className="w-16 h-16 object-cover rounded-xl border border-borda shrink-0" />
                <div>
                  <h3 className="font-bold text-texto line-clamp-1">{quickAdd.product.get("name")}</h3>
                  <p className="text-texto-sec text-sm">
                    R$ {(getActivePromo(quickAdd.product).isActive ? getActivePromo(quickAdd.product).price : quickAdd.product.get("price")).toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-xs font-bold text-texto uppercase tracking-wider mb-3">Escolha a Opção:</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(quickAdd.product.get("variants") || []).map(v => (
                  <button 
                    key={v} 
                    onClick={() => setQuickAdd({ ...quickAdd, selectedVariant: v })} 
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border ${quickAdd.selectedVariant === v ? 'border-texto bg-texto text-card shadow-md' : 'border-borda bg-fundo text-texto-sec hover:border-texto hover:text-texto'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => processAddToCart(quickAdd.product, quickAdd.selectedVariant)} 
                className="w-full py-4 bg-btn text-btn-texto font-bold rounded-xl hover:opacity-90 transition-opacity duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Adicionar à Sacola
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL GIGANTE DE DETALHES DO PRODUTO (PÁGINA SEPARADA DO PRODUTO)*/}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailedProduct && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-10 bg-black/30 backdrop-blur-md" onClick={() => setDetailedProduct(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} transition={{ type: "spring", bounce: 0, duration: 0.6 }} className="bg-card w-full h-full max-w-[1400px] sm:rounded-[32px] md:rounded-[20px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative transition-colors duration-500" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDetailedProduct(null)} className="hidden md:flex absolute top-6 right-6 lg:top-8 lg:right-8 z-20 p-3 lg:p-4 bg-fundo hover:bg-borda rounded-full transition-colors text-texto shadow-xl"><X className="w-5 h-5 lg:w-6 lg:h-6" /></button>
              
              <div className="w-full md:w-[50%] lg:w-[55%] h-[40vh] md:h-full bg-black relative shrink-0">
                {(() => {
                  const mediaUrl = detailedProduct.get("detailsMediaUrl") || detailedProduct.get("imageUrl");
                  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
                  return isVideo ? (<video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<img src={mediaUrl} alt={detailedProduct.get("name")} className="w-full h-full object-cover" />);
                })()}
                <button onClick={() => setDetailedProduct(null)} className="absolute top-4 right-4 p-2.5 bg-card/50 backdrop-blur-md hover:bg-card rounded-full transition-colors md:hidden z-10 shadow-lg text-texto"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="w-full md:w-[50%] lg:w-[45%] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col flex-1 overflow-y-auto relative">
                <div className="mb-4 md:mb-6"><span className="text-[10px] md:text-xs font-bold tracking-widest text-texto-sec uppercase">{detailedProduct.get("category") || "Premium"}</span></div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-texto mb-4 md:mb-6 leading-tight break-words pr-8 md:pr-12">{detailedProduct.get("name")}</h2>
                                
                <div className="mb-6 md:mb-8">
                  {getActivePromo(detailedProduct).isActive ? (
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <span className="text-texto-sec text-base md:text-xl line-through">R$ {detailedProduct.get("price").toFixed(2)}</span>
                      <span className="text-3xl md:text-4xl font-bold text-texto">R$ {getActivePromo(detailedProduct).price.toFixed(2)}</span>
                    </div>
                  ) : (<span className="text-3xl md:text-4xl font-bold text-texto">R$ {detailedProduct.get("price").toFixed(2)}</span>)}
                </div>
                
                <p className="text-texto-sec leading-relaxed mb-8 md:mb-10 whitespace-pre-line text-sm sm:text-base md:text-lg">{detailedProduct.get("description")}</p>
                
                {(detailedProduct.get("variants") || []).length > 0 && (
                  <div className="mb-8 md:mb-10">
                    <p className="text-[10px] md:text-xs font-bold text-texto uppercase tracking-wider mb-3 md:mb-4">Escolha a Opção</p>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {(detailedProduct.get("variants") || []).map(v => (
                        <button key={v} onClick={() => setDetailedVariant(v)} className={`px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold transition-colors border ${detailedVariant === v ? 'border-texto bg-texto text-card shadow-md' : 'border-borda bg-card text-texto-sec hover:border-texto'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AVALIAÇÕES */}
                <div className="mb-8 md:mb-10 border-t border-borda pt-6 md:pt-8">
                  <h3 className="text-sm md:text-base font-bold text-texto uppercase tracking-wider mb-4 md:mb-6">Avaliações Recentes</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {productReviews.length === 0 ? (
                      <p className="text-sm text-texto-sec italic col-span-full">Ainda não há avaliações para este produto. Seja o primeiro!</p>
                    ) : (
                      productReviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="bg-fundo p-4 rounded-xl md:rounded-2xl border border-borda flex flex-col">
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3 h-3 md:w-4 md:h-4 ${star <= review.get("rating") ? 'text-texto fill-texto' : 'text-texto/20'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-texto mb-3 flex-1 italic">"{review.get("comment")}"</p>
                          <p className="text-[10px] md:text-xs font-bold text-texto-sec uppercase">— {review.get("userName")}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {Parse.User.current() ? (
                    <form onSubmit={submitReview} className="bg-fundo p-4 md:p-5 rounded-xl md:rounded-2xl border border-borda">
                      <p className="text-xs font-bold text-texto mb-3">Deixe sua avaliação</p>
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button type="button" key={star} onClick={() => setNewReviewRating(star)} className="focus:outline-none hover:opacity-70 transition-opacity">
                            <Star className={`w-5 h-5 md:w-6 md:h-6 ${star <= newReviewRating ? 'text-texto fill-texto' : 'text-texto/20'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea required rows="2" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="O que achou deste produto?" className="w-full px-4 py-3 bg-card border border-borda text-sm text-texto rounded-xl focus:ring-2 focus:ring-texto focus:outline-none resize-none mb-3" />
                      <button type="submit" disabled={isSubmittingReview} className="px-5 py-2.5 bg-btn text-btn-texto font-bold text-xs md:text-sm rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50">
                        {isSubmittingReview ? "Enviando..." : "Enviar Avaliação"}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-fundo p-4 rounded-xl border border-borda text-center">
                      <p className="text-sm text-texto-sec">Faça login para deixar uma avaliação.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-6 md:pt-8 border-t border-borda">
                  <button onClick={() => processAddToCart(detailedProduct, detailedVariant)} disabled={detailedProduct.get("stock") <= 0} className="w-full py-4 md:py-5 lg:py-6 bg-btn text-btn-texto text-base md:text-lg font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-xl disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 md:gap-3">
                    <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" /> {detailedProduct.get("stock") <= 0 ? "Fora de Estoque" : "Adicionar à Sacola"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-card border-t border-borda pt-12 md:pt-16 pb-8 mt-auto transition-colors duration-500">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-10 md:mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h3 className="text-xl md:text-2xl font-serif italic tracking-wide text-texto mb-3 md:mb-4">Flor e Sol</h3>
              <p className="text-texto-sec text-xs md:text-sm leading-relaxed max-w-sm">Descubra o frescor e a elegância de peças pensadas para iluminar o seu dia a dia.</p>
            </div>
            <div>
              <h4 className="font-bold text-texto mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Navegação</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-texto-sec">
                <li><button onClick={() => setCurrentView("store")} className="hover:text-texto transition-colors">Página Inicial</button></li>
                <li><button onClick={() => setCurrentView("profile")} className="hover:text-texto transition-colors">Minha Conta</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-texto mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Suporte</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-texto-sec">
                <li><a href="#" className="hover:text-texto transition-colors">Fale Conosco</a></li>
                <li><a href="#" className="hover:text-texto transition-colors">Trocas e Devoluções</a></li>
              </ul>
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h4 className="font-bold text-texto mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Fique por dentro</h4>
              <p className="text-texto-sec text-xs md:text-sm mb-3 md:mb-4">Assine nossa newsletter para receber novidades.</p>
              <form onSubmit={handleSubscribeNewsletter} className="flex gap-2">
                <input type="email" required value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Seu e-mail..." className="flex-1 bg-fundo border border-borda rounded-lg px-3 md:px-4 py-2 text-xs md:text-sm focus:ring-2 focus:ring-texto focus:outline-none text-texto min-w-0" />
                <button type="submit" disabled={isSubscribing} className="bg-btn text-btn-texto px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:opacity-90 transition-opacity duration-300 shrink-0 disabled:opacity-50">
                  {isSubscribing ? "..." : "Assinar"}
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-borda pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-texto-sec text-[10px] md:text-sm text-center md:text-left">© {new Date().getFullYear()} Flor e Sol. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 md:gap-6 text-texto-sec">
              <Instagram className="w-4 h-4 md:w-5 md:h-5 hover:text-texto transition-colors cursor-pointer" />
              <Facebook className="w-4 h-4 md:w-5 md:h-5 hover:text-texto transition-colors cursor-pointer" />
              <Twitter className="w-4 h-4 md:w-5 md:h-5 hover:text-texto transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>

      {/* PÍLULA DE NOTIFICAÇÃO (Toast) */}
      <div className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 bg-btn text-btn-texto px-4 md:px-6 py-2.5 md:py-3 rounded-full shadow-2xl flex items-center gap-2 md:gap-3 transform transition-all duration-300 z-50 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}>
        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
        <span className="font-bold text-xs md:text-sm whitespace-nowrap">{toast.message}</span>
      </div>

    </div>
  );
}