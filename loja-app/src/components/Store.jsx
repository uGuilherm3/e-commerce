import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Parse from "../parseSetup";
import { Search, LogOut, ShoppingBag, X, Plus, Minus, Trash2, CheckCircle, Loader2, User, Package, Settings, Instagram, Facebook, Twitter, Timer, Menu, CreditCard, QrCode, Truck, MessageCircle, Heart, TrendingUp, Sun, Moon, ArrowLeft, Star, Sparkles, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, MapPin, Github } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ============================================================================
// COMPONENTES ISOLADOS E BLINDADOS (PERFORMANCE HIGH-END)
// O React.memo impede que os cards sejam redesenhados quando o banner gira
// ============================================================================

const PromoTimer = React.memo(({ endsAt }) => {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const total = Date.parse(endsAt) - Date.parse(now);
  if (total <= 0) return <span className="text-white font-bold text-[10px] tracking-widest uppercase">Encerrada</span>;
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  
  if (days > 0) return <span className="text-white font-bold text-[10px] tracking-widest uppercase">Termina em {days}d {hours}h</span>;
  return <span className="text-white font-bold text-[10px] tracking-widest uppercase">Termina em {hours}h {minutes}m</span>;
});

// Card Padrão Blindado
const StandardProductCard = React.memo(({ product, config, isFav, promo, onOpenDetails, onToggleFav, onAddToCart }) => {
  const { aspectClass = "aspect-[3/4]", tag = null, wrapClass = "w-full" } = config;
  const isOutOfStock = product.get("stock") <= 0;
  const hasDetails = product.get("hasDetails");

  return (
    <div className={`relative shrink-0 ${wrapClass} snap-center pb-4 pt-2`}>
      <div onClick={() => !isOutOfStock && onOpenDetails(product)} className={`group w-full h-full ${aspectClass} relative rounded-[24px] md:rounded-[32px] overflow-hidden bg-card shadow-sm transition-shadow duration-300 ${!isOutOfStock ? 'cursor-pointer' : ''}`}>
        <img src={product.get("imageUrl")} alt={product.get("name")} loading="lazy" decoding="async" className={`absolute inset-0 w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
        
        <div className="absolute top-4 left-4 md:top-5 md:left-5 flex items-center gap-2 z-30 pointer-events-none">
          {tag && <div className="bg-texto text-card text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest shadow-md">{tag}</div>}
          {hasDetails && !isOutOfStock && (
            <div className={`backdrop-blur-md text-neutral-900 text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2 transition-opacity ${tag ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100 bg-white/30'}`}>
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" /> Premium
            </div>
          )}
        </div>

        <button onClick={(e) => onToggleFav(product.id, e)} className="absolute top-4 right-4 md:top-5 md:right-5 p-2.5 md:p-3 bg-card/30 backdrop-blur-lg rounded-full text-texto hover:bg-card/50 transition-colors duration-300 z-30 shadow-sm">
          <Heart className="w-4 h-4 md:w-5 md:h-5 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>

        {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30"><span className="bg-card text-texto text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">Esgotado</span></div>}
        
        <div className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[35%] pointer-events-none z-10 bg-gradient-to-t from-texto/30 via-card/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col gap-2 z-20 opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
          <span className="text-[10px] md:text-[10px] font-bold uppercase tracking-widest text-texto-sec drop-shadow-sm">{product.get("category")}</span>
          <h3 className="font-serif italic text-2xl sm:text-3xl text-texto line-clamp-1 drop-shadow-sm">{product.get("name")}</h3>
          <div className="flex items-center gap-2 mt-1 pointer-events-auto drop-shadow-sm">
            {promo.isActive ? (<><span className="text-xs md:text-sm line-through text-texto-sec pr-1">R$ {product.get("price").toFixed(2)}</span><span className="font-bold text-texto text-xl sm:text-2xl">R$ {promo.price.toFixed(2)}</span></>) : (<span className="font-bold text-texto text-xl sm:text-2xl">R$ {product.get("price").toFixed(2)}</span>)}
          </div>
          <button onClick={(e) => onAddToCart(product, e)} disabled={isOutOfStock} className="pointer-events-auto mt-4 w-full h-12 md:h-14 text-sm md:text-base bg-texto text-card font-bold rounded-xl md:rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 gap-2 shadow-lg">
            {isOutOfStock ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}
            {isOutOfStock ? "Esgotado" : "Adicionar à sacola"}
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.isFav === next.isFav && prev.promo.isActive === next.promo.isActive && prev.config?.tag === next.config?.tag);

// Card Promoção Blindado
const PromoBannerCard = React.memo(({ product, isFav, promo, onOpenDetails, onToggleFav, onAddToCart }) => {
  const isOutOfStock = product.get("stock") <= 0;
  const hasDetails = product.get("hasDetails");

  return (
    <div className="relative shrink-0 w-[80vw] max-w-[280px] sm:max-w-[340px] md:w-full md:max-w-[340px] snap-center pb-4 pt-4">
      <div onClick={() => !isOutOfStock && onOpenDetails(product)} className={`group/card relative aspect-[3/4] w-full overflow-hidden rounded-[24px] md:rounded-[32px] bg-black transition-all duration-300 ${hasDetails && !isOutOfStock ? 'cursor-pointer hover:shadow-white/5' : ''}`}>
        <img src={product.get("imageUrl")} alt={product.get("name")} loading="lazy" decoding="async" className={`absolute inset-0 w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
        
        <div className="absolute top-4 left-4 md:top-5 md:left-5 flex flex-col gap-2 z-30 pointer-events-none">
          {!isOutOfStock && (
            <div className="bg-black/80 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Timer className="w-3 h-3 md:w-4 md:h-4" />
              <PromoTimer endsAt={promo.endsAt} />
            </div>
          )}
        </div>

        <button onClick={(e) => onToggleFav(product.id, e)} className="absolute top-4 right-4 md:top-5 md:right-5 p-2.5 md:p-3 bg-white/30 backdrop-blur-lg rounded-full text-texto hover:bg-white/50 transition-colors duration-300 z-30 shadow-sm border border-white/10">
          <Heart className="w-4 h-4 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>

        {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30"><span className="bg-card text-texto text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">Esgotado</span></div>}

        <div className="absolute inset-x-0 bottom-0 h-[70%] pointer-events-none z-10 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[24px] md:rounded-[32px]" style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[45%] pointer-events-none z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-[24px] md:rounded-[32px]" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col gap-2 z-20 opacity-0 translate-y-6 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 pointer-events-none rounded-[24px] md:rounded-[32px]">
          <span className="text-[10px] md:text-[10px] font-bold uppercase tracking-widest text-white/70 drop-shadow-sm">{product.get("category")}</span>
          <h3 className="font-serif italic text-2xl sm:text-3xl text-white line-clamp-1 drop-shadow-sm">{product.get("name")}</h3>
          
          <div className="flex items-center gap-2 mt-1 pointer-events-auto drop-shadow-sm">
            {promo.isActive ? (
              <>
                <span className="text-xs md:text-sm line-through text-white/60 pr-1">R$ {product.get("price").toFixed(2)}</span>
                <span className="font-bold text-white text-xl sm:text-2xl">R$ {promo.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-bold text-white text-xl sm:text-2xl">R$ {product.get("price").toFixed(2)}</span>
            )}
          </div>
          
          <button onClick={(e) => onAddToCart(product, e)} disabled={isOutOfStock} className="pointer-events-auto mt-4 w-full h-12 md:h-14 text-sm md:text-base bg-white text-black font-bold rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-neutral-200 transition-colors duration-300 disabled:opacity-50 gap-2 shadow-lg">
            {isOutOfStock ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}
            {isOutOfStock ? "Esgotado" : "Adicionar à sacola"}
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.isFav === next.isFav && prev.promo.isActive === next.promo.isActive);

// Card de Listagem (Catálogo) Blindado
const CatalogProductCard = React.memo(({ product, isFav, promo, onOpenDetails, onToggleFav, onAddToCart }) => {
  const isOutOfStock = product.get("stock") <= 0;
  const variants = product.get("variants") || [];
  const hasDetails = product.get("hasDetails");
  
  return (
    <div className="group relative flex flex-row min-[400px]:flex-col h-full bg-card min-[400px]:bg-transparent rounded-2xl min-[400px]:rounded-none p-3 min-[400px]:p-0 border border-borda min-[400px]:border-transparent shadow-sm min-[400px]:shadow-none gap-4 min-[400px]:gap-0">
      
      <div onClick={() => !isOutOfStock && onOpenDetails(product)} className={`w-[110px] min-[400px]:w-full shrink-0 aspect-[4/5] overflow-hidden rounded-xl min-[400px]:rounded-[20px] md:rounded-[24px] bg-card min-[400px]:mb-3 md:mb-4 relative border border-transparent hover:border-borda transition-colors ${!isOutOfStock ? 'cursor-pointer' : ''}`}>
        <img src={product.get("imageUrl")} alt={product.get("name")} loading="lazy" decoding="async" className={`w-full h-full object-cover object-center ${isOutOfStock ? "opacity-50 grayscale" : ""}`} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        
        <button onClick={(e) => onToggleFav(product.id, e)} className="absolute top-2 right-2 min-[400px]:top-3 min-[400px]:right-3 md:top-4 md:right-4 p-1.5 min-[400px]:p-2.5 bg-card/30 backdrop-blur-md rounded-full text-texto shadow-sm hover:bg-card transition-colors duration-300 z-20">
          <Heart className="w-3 h-3 min-[400px]:w-4 min-[400px]:h-4 transition-colors" fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} />
        </button>

        {isOutOfStock && <div className="absolute top-2 left-2 min-[400px]:top-3 min-[400px]:left-3 md:top-4 md:left-4 bg-card/90 backdrop-blur-sm text-texto text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full uppercase tracking-wider shadow-sm z-20">Esgotado</div>}
        
        {hasDetails && !isOutOfStock && !promo.isActive && (
          <div className="absolute top-2 left-2 min-[400px]:top-3 min-[400px]:left-3 md:top-4 md:left-4 backdrop-blur-md text-neutral-900 text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-2.5 md:py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 opacity-100 min-[400px]:opacity-0 min-[400px]:group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> <span className="hidden min-[400px]:inline">Premium</span>
          </div>
        )}
        
        {!isOutOfStock && (
          <div className="hidden sm:block absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 translate-y-[120%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-auto">
            <button onClick={(e) => onAddToCart(product, e)} className="w-full bg-btn text-btn-texto font-bold py-3 md:py-4 text-sm md:text-base rounded-xl shadow-lg hover:opacity-90 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5" /> Adicionar à sacola
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 py-1 min-[400px]:py-0 justify-between">
        <div>
          <h3 className="font-medium text-sm md:text-base text-texto line-clamp-2 mb-1 min-[400px]:mb-0 leading-tight">{product.get("name")}</h3>
          {variants.length > 0 && <span className="text-[9px] md:text-[10px] uppercase font-bold text-texto-sec bg-fundo border border-borda px-1.5 py-0.5 rounded-md inline-block min-[400px]:hidden mb-1">{variants.length} Cores</span>}
        </div>
        
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:justify-between min-[400px]:items-end mt-auto min-[400px]:mt-1">
          {promo.isActive ? (
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs line-through text-texto-sec">R$ {product.get("price").toFixed(2)}</span>
              <span className="text-texto font-bold text-base">R$ {promo.price.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-texto-sec text-sm md:text-base font-bold min-[400px]:font-normal text-texto min-[400px]:text-texto-sec">R$ {product.get("price").toFixed(2)}</p>
          )}
          {variants.length > 0 && <span className="hidden min-[400px]:inline-block text-[9px] md:text-[10px] uppercase font-bold text-texto-sec bg-fundo border border-borda px-1.5 md:px-2 py-0.5 rounded-md shrink-0">{variants.length} Cores</span>}
        </div>

        {!isOutOfStock ? (
          <button onClick={(e) => onAddToCart(product, e)} className="sm:hidden mt-3 w-full bg-texto text-card font-bold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        ) : (
          <div className="sm:hidden mt-3 w-full bg-fundo text-texto-sec font-bold py-2.5 text-xs rounded-xl flex items-center justify-center border border-borda">
            Esgotado
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.isFav === next.isFav && prev.promo.isActive === next.promo.isActive);


// ============================================================================
// COMPONENTE PRINCIPAL DA LOJA
// ============================================================================
export default function Store({ currentUser, onLogout, onRequireLogin }) {
  const activeUser = Parse.User.current();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tudo");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storeError, setStoreError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState("cart"); 
  const [paymentMethod, setPaymentMethod] = useState("pix"); 
  const [lastOrderId, setLastOrderId] = useState(null); 
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" }); 
  const [pixData, setPixData] = useState(null); 
  
  // 👇 ESTADO PARA SALVAR O TEXTO DO WPP 👇
  const [lastOrderWhatsAppText, setLastOrderWhatsAppText] = useState("");

  const [currentView, setCurrentView] = useState("store"); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("data"); 
  const [orders, setOrders] = useState([]);
  
  const [userName, setUserName] = useState(activeUser?.get("name") || "");
  const [userPhone, setUserPhone] = useState(activeUser?.get("phone") || "");
  const [userAvatar, setUserAvatar] = useState(activeUser?.get("avatar")?.url() || null);
  const [favorites, setFavorites] = useState(activeUser?.get("favorites") || []);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [detailedQuantity, setDetailedQuantity] = useState(1);

  // Shop the Look
  const [lookConfig, setLookConfig] = useState(null);
  const [selectedLookItem, setSelectedLookItem] = useState(null);

  useEffect(() => {
    if (!activeUser) {
      setUserName(""); setUserPhone(""); setUserAvatar(null); setFavorites([]);
    } else {
      setUserName(activeUser.get("name") || "");
      setUserPhone(activeUser.get("phone") || "");
      setUserAvatar(activeUser.get("avatar")?.url() || null);
      setFavorites(activeUser.get("favorites") || []);
    }
  }, [activeUser]);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [quickAdd, setQuickAdd] = useState({ isOpen: false, product: null, selectedVariant: "" });
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [detailedVariant, setDetailedVariant] = useState("");
  const [productReviews, setProductReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const promoScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handlePromoScroll = useCallback(() => {
    if (promoScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = promoScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  }, []);

  // Parallax Shop the Look
  const shopTheLookRef = useRef(null);
  const { scrollYProgress: lookScrollProgress } = useScroll({ target: shopTheLookRef, offset: ["start end", "end start"] });
  const lookY = useTransform(lookScrollProgress, [0, 0.35, 0.65, 1], ["20%", "0%", "0%", "-30%"]);
  const lookOpacity = useTransform(lookScrollProgress, [0, 0.25, 0.75, 0.95], [0, 1, 1, 0]);

  useEffect(() => {
    if (detailedProduct) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '0px';
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '0px';
    };
  }, [detailedProduct]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView, profileTab]);

  useEffect(() => {
    handlePromoScroll();
    window.addEventListener('resize', handlePromoScroll);
    return () => window.removeEventListener('resize', handlePromoScroll);
  }, [products, handlePromoScroll]); 

  const scrollPromo = useCallback((direction) => {
    if (promoScrollRef.current) {
      const scrollAmount = 340; 
      promoScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // O respiro mágico para não esconder o título
      const headerOffset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  }, []);

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
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const adminLookImage = storeSettings?.get("lookImageUrl");
      const adminLookItems = storeSettings?.get("lookItems");
      if (adminLookImage && adminLookItems && adminLookItems.length > 0) {
        const mappedItems = adminLookItems.map(item => {
          const prod = products.find(p => p.id === item.productId);
          return prod ? { product: prod, x: item.x, y: item.y, label: item.label } : null;
        }).filter(Boolean);
        setLookConfig({ imageUrl: adminLookImage, items: mappedItems });
        if (mappedItems.length > 0) setSelectedLookItem(mappedItems[0].product);
      } else {
        const fallbackImage = "https://i.pinimg.com/1200x/4f/11/ca/4f11cae418ee95f4a64d4895b7298928.jpg";
        const fallbackProducts = products.slice(0, 4);
        const coords = [{ x: 45, y: 35, label: "Blusa" }, { x: 50, y: 65, label: "Calça" }, { x: 35, y: 88, label: "Bolsa" }, { x: 60, y: 15, label: "Acessório" }];
        const mappedFallback = fallbackProducts.map((p, i) => ({ product: p, x: coords[i % coords.length].x, y: coords[i % coords.length].y, label: coords[i % coords.length].label }));
        setLookConfig({ imageUrl: fallbackImage, items: mappedFallback });
        if (mappedFallback.length > 0) setSelectedLookItem(mappedFallback[0].product);
      }
    }
  }, [products, storeSettings]);

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
    setIsLoading(true); setStoreError(false);
    try {
      const results = await new Parse.Query("Product").find();
      setProducts(results);
      const savedCart = localStorage.getItem("florESol_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          const restoredCart = parsed.map(item => {
            const p = results.find(prod => prod.id === item.id);
            return p ? { product: p, variant: item.variant, quantity: item.quantity } : null;
          }).filter(Boolean); 
          setCart(restoredCart);
        } catch (e) {}
      }
      setIsCartLoaded(true); 
    } catch (error) { setStoreError(true); } 
    finally { setIsLoading(false); }
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
    query.equalTo("user", safeUser); query.descending("createdAt");
    try { setOrders(await query.find()); } catch (error) {}
  };

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault(); setIsSavingProfile(true);
    try {
      const userToUpdate = Parse.User.current();
      if (!userToUpdate) throw new Error("Sessão expirada.");
      userToUpdate.set("name", userName); userToUpdate.set("phone", userPhone);
      if (avatarFile) {
        const parseFile = new Parse.File("avatar.jpg", avatarFile);
        await parseFile.save(); userToUpdate.set("avatar", parseFile);
      }
      await userToUpdate.save();
      if (userToUpdate.get("avatar")) { setUserAvatar(userToUpdate.get("avatar").url()); }
      showToast("Dados atualizados com sucesso!");
    } catch (error) { showToast("Erro ao salvar perfil."); } 
    finally { setIsSavingProfile(false); setAvatarFile(null); }
  };

  const toggleFavorite = useCallback(async (productId, e) => {
    if (e) e.stopPropagation(); 
    const safeUser = Parse.User.current();
    if (!safeUser) { onRequireLogin(); return; }

    setFavorites(prev => {
      const isFav = prev.includes(productId);
      if (isFav) {
        safeUser.remove("favorites", productId);
        safeUser.save().catch(()=>{});
        return prev.filter(id => id !== productId);
      } else {
        safeUser.addUnique("favorites", productId);
        safeUser.save().catch(()=>{});
        return [...prev, productId];
      }
    });
  }, [onRequireLogin]);

  const getActivePromo = useCallback((product) => {
    const discountPrice = product.get("discountPrice");
    const discountEndsAt = product.get("discountEndsAt");
    if (discountPrice && discountEndsAt && discountEndsAt > new Date()) {
      return { isActive: true, price: discountPrice, endsAt: discountEndsAt };
    }
    return { isActive: false, price: product.get("price") };
  }, []);

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
        const sub = new Newsletter(); sub.set("email", newsletterEmail);
        if (Parse.User.current()) { sub.set("user", Parse.User.current()); }
        await sub.save(); showToast("Inscrição realizada com sucesso! 🎉"); setNewsletterEmail("");
      }
    } catch (error) { showToast("Erro ao assinar."); } 
    finally { setIsSubscribing(false); }
  };

  const fetchReviews = async (product) => {
    try {
      const query = new Parse.Query("Review");
      query.equalTo("product", product); query.descending("createdAt"); query.limit(10); 
      setProductReviews(await query.find());
    } catch (error) {}
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const currentUser = Parse.User.current();
    if (!currentUser) { onRequireLogin(); return; } 
    if (!newReviewComment.trim()) { showToast("Escreva um comentário."); return; }

    setIsSubmittingReview(true);
    try {
      const review = new Parse.Object("Review");
      review.set("product", detailedProduct); review.set("user", currentUser);
      review.set("userName", currentUser.get("name") || "Cliente"); review.set("rating", newReviewRating); review.set("comment", newReviewComment);
      await review.save();
      setProductReviews([review, ...productReviews]); setNewReviewComment(""); showToast("Avaliação enviada!");
    } catch (error) { showToast("Erro ao avaliar."); } 
    finally { setIsSubmittingReview(false); }
  };

  const processAddToCart = useCallback((product, variant, qtyToAdd = 1) => {
    const stock = product.get("stock") || 0;
    if (stock <= 0) { showToast("Produto esgotado!"); return; }
    
    setCart((prevCart) => {
      const totalOfThisProductInCart = prevCart.filter(item => item.product.id === product.id).reduce((sum, item) => sum + item.quantity, 0);
      if (totalOfThisProductInCart + qtyToAdd > stock) { showToast(`Temos apenas ${stock} unidades!`); return prevCart; }
      const existingItem = prevCart.find(item => item.product.id === product.id && item.variant === variant);
      if (existingItem) { return prevCart.map(item => (item.product.id === product.id && item.variant === variant) ? { ...item, quantity: item.quantity + qtyToAdd } : item); }
      return [...prevCart, { product, quantity: qtyToAdd, variant }];
    });
    setQuickAdd({ isOpen: false, product: null, selectedVariant: "" });
    setDetailedProduct(null); 
    showToast(`${product.get("name")} adicionado!`);
  }, [showToast]);

  const handleAddToCartClick = useCallback((product, e = null) => {
    if (e) e.stopPropagation(); 
    const variants = product.get("variants") || [];
    if (variants.length > 0) { setQuickAdd({ isOpen: true, product, selectedVariant: variants[0] }); } 
    else { processAddToCart(product, null); }
  }, [processAddToCart]);

  const openProductDetails = useCallback((product) => {
    if (!product) return;
    const variants = product.get("variants") || [];
    setDetailedVariant(variants.length > 0 ? variants[0] : "");
    setDetailedQuantity(1); setDetailedProduct(product);
    setNewReviewRating(5); setNewReviewComment(""); setProductReviews([]);
    fetchReviews(product);
  }, []);

  const updateQuantity = useCallback((productId, variant, delta) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item.product.id === productId && item.variant === variant) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0 && newQuantity <= item.product.get("stock")) { return { ...item, quantity: newQuantity }; }
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((productId, variant) => setCart((prevCart) => prevCart.filter(item => !(item.product.id === productId && item.variant === variant))), []);

  const normalizeText = (text) => (text || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryRaw = normalizeText(searchQuery);
    const searchTerms = queryRaw.split(" ").filter(term => term.length > 0);
    return products.filter((p) => {
      const searchableText = `${normalizeText(p.get("name"))} ${normalizeText(p.get("category"))} ${normalizeText(p.get("description"))} ${(p.get("variants") || []).map(normalizeText).join(" ")}`;
      return searchTerms.every(term => searchableText.includes(term) || searchableText.includes(term.endsWith('s') ? term.slice(0, -1) : term));
    });
  }, [products, searchQuery]);

  const promoProducts = useMemo(() => products.filter(p => getActivePromo(p).isActive), [products, getActivePromo, currentTime]);
  const bestSellers = useMemo(() => [...products].sort((a, b) => (b.get("salesCount") || 0) - (a.get("salesCount") || 0)).slice(0, 5), [products]);
  const newArrivals = useMemo(() => [...products].sort((a, b) => b.createdAt > a.createdAt ? 1 : -1).slice(0, 4), [products]);
  const infoBannerProducts = useMemo(() => products.filter(p => p.get("isInfoBannerProduct")), [products]);

  const categoriesList = useMemo(() => ["Tudo", ...new Set(products.map(p => p.get("category")).filter(Boolean))], [products]);
  const catalogProducts = useMemo(() => products.filter((p) => selectedCategory === "Tudo" || p.get("category") === selectedCategory), [products, selectedCategory]);
  const totalCatalogPages = Math.ceil(catalogProducts.length / 12);
  const currentCatalogPageItems = useMemo(() => catalogProducts.slice((currentPage - 1) * 12, currentPage * 12), [catalogProducts, currentPage]);
  const favoriteProducts = useMemo(() => products.filter(p => favorites.includes(p.id)), [products, favorites]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (getActivePromo(item.product).price * item.quantity), 0), [cart, getActivePromo]);
  const cartItemsCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

  const submitFinalCheckout = async () => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true); setCheckoutStep("processing");
    
    try {
      const productsToUpdate = []; const orderItems = []; const quantityMap = {};
      cart.forEach(item => { quantityMap[item.product.id] = (quantityMap[item.product.id] || 0) + item.quantity; });

      for (const [productId, qtyToDeduct] of Object.entries(quantityMap)) {
        const parseProduct = await new Parse.Query("Product").get(productId);
        if ((parseProduct.get("stock") || 0) < qtyToDeduct) { throw new Error(`Estoque insuficiente.`); }
        parseProduct.increment("stock", -qtyToDeduct); parseProduct.increment("salesCount", qtyToDeduct); 
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
      await order.save(); setLastOrderId(order.id); 

      if (paymentMethod === "pix") {
        try {
          const pixResponse = await Parse.Cloud.run("createPixPayment", { total: cartTotal, description: `Pedido #${order.id.slice(-6).toUpperCase()}`, email: activeUser?.get("email") || "cliente@loja.com" });
          setPixData({ qrCode: pixResponse.qr_code, qrCodeBase64: pixResponse.qr_code_base64 });
          order.set("paymentId", String(pixResponse.payment_id)); await order.save();
        } catch (error) { await order.destroy(); setCheckoutStep("payment"); return; }
      }

      await Parse.Object.saveAll(productsToUpdate);

      // 👇 NOVA LÓGICA DO WHATSAPP AQUI 👇
      let wppText = `${activeUser?.get("name") ? `Olá, me chamo ${activeUser.get("name")}!` : "Olá!"} Acabei de fazer um pedido na loja (Pedido #${order.id.slice(-6).toUpperCase()}).\n\n*Resumo da Compra:*\n`;
      cart.forEach(item => {
        const promo = getActivePromo(item.product);
        wppText += `▪️ ${item.quantity}x ${item.product.get("name")} ${item.variant ? `(${item.variant})` : ''} - R$ ${(promo.price * item.quantity).toFixed(2)}\n`;
      });
      wppText += `\n*Total do Pedido:* R$ ${cartTotal.toFixed(2)}`;
      wppText += `\n*Pagamento:* ${paymentMethod === "pix" ? "PIX" : "Pagamento na Entrega"}`;
      
      setLastOrderWhatsAppText(wppText);
      // 👆 FIM DA LÓGICA DO WHATSAPP 👆

      setCart([]); localStorage.removeItem("florESol_cart"); setCheckoutStep("success"); 
      fetchProducts(); if (profileTab === "orders") fetchOrders();
      
    } catch (error) { showToast("Erro: " + error.message); setCheckoutStep("payment"); } 
    finally { setIsProcessingOrder(false); }
  };

  const closeCart = () => { 
    window.scrollTo(0, 0); setCurrentView("store"); 
    setTimeout(() => { setCheckoutStep("cart"); setLastOrderId(null); setPixData(null); }, 400); 
  };

  // 👇 LÓGICA DE REDIRECIONAMENTO ATUALIZADA 👇
  const handleWhatsAppRedirect = () => {
    const telefone = "5585999113659";
    const texto = lastOrderWhatsAppText || "Olá! Acabei de fazer um pedido na loja.";
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`, '_blank');
    closeCart();
  };

  const handleCopyPix = () => { 
    if (pixData?.qrCode) { navigator.clipboard.writeText(pixData.qrCode); setIsCopied(true); showToast("Código copiado!"); setTimeout(() => setIsCopied(false), 2000); } 
  };

  const tabVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }, exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } } };

  // ============================================================================
  // DADOS DOS BANNERS (Variáveis Diretas do storeSettings para melhor performance)
  // ============================================================================
  const bannersArray = storeSettings?.get("banners") || [{ imageUrl: storeSettings?.get("bannerImageUrl") || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop", tag: storeSettings?.get("bannerTag") || "Novidades", title: storeSettings?.get("bannerTitle") || "Coleção Essência", desc: storeSettings?.get("bannerDesc") || "Descubra o frescor.", btn: storeSettings?.get("bannerBtn") || "Descobrir Agora", target: storeSettings?.get("bannerTarget") || "lancamentos" }];
  
  // Banner 2 (O Secundário de Informações)
  const infoBannerActive = storeSettings ? storeSettings.get("infoBannerActive") !== false : true;
  const infoBannerTitle = storeSettings?.get("infoBannerTitle") !== undefined ? storeSettings.get("infoBannerTitle") : "Coleção de Outono";
  const infoBannerDesc = storeSettings?.get("infoBannerDesc") !== undefined ? storeSettings.get("infoBannerDesc") : "Não perca nossa coleção exclusiva por tempo limitado.";
  const infoBannerBtn = storeSettings?.get("infoBannerBtn") !== undefined ? storeSettings.get("infoBannerBtn") : "Explorar";
  const infoBannerImageUrl = storeSettings?.get("infoBannerImageUrl") || "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop";

  // Banner de Promoção
  const promoBannerTitle = storeSettings?.get("promoBannerTitle") || "Ofertas Especiais";
  const promoBannerDesc = storeSettings?.get("promoBannerDesc") || "Uma seleção exclusiva de peças com condições únicas. Não deixe para depois.";
  const promoBannerImageUrl = storeSettings?.get("promoBannerImageUrl") || "";

  // Banner Terciário
  const thirdBannerActive = storeSettings ? storeSettings.get("thirdBannerActive") !== false : true;
  const thirdBannerTitle = storeSettings?.get("thirdBannerTitle") || "";
  const thirdBannerDesc = storeSettings?.get("thirdBannerDesc") || "";
  const thirdBannerBtn = storeSettings?.get("thirdBannerBtn") || "";
  const thirdBannerBtnLink = storeSettings?.get("thirdBannerBtnLink") || "#";
  const thirdBannerImageUrl = storeSettings?.get("thirdBannerImageUrl") || "";

  // MOTOR INTELIGENTE DO BANNER
  useEffect(() => {
    if (bannersArray.length <= 1) return;
    let interval;
    const handleScroll = () => {
      if (window.scrollY < 600) {
        if (!interval) {
          interval = setInterval(() => { setCurrentBannerIndex((prev) => (prev + 1) % bannersArray.length); }, 9000);
        }
      } else {
        if (interval) { clearInterval(interval); interval = null; }
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("scroll", handleScroll); if (interval) clearInterval(interval); };
  }, [bannersArray.length]);

  return (
    <div className="min-h-screen bg-fundo transition-colors duration-500 font-sans relative flex flex-col text-texto">
      
      <header className="bg-fundo backdrop-blur-md transition-colors duration-500 sticky top-0 z-50">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-4">
          
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => { 
                setDetailedProduct(null); 
                window.innerWidth < 768 ? setIsMobileMenuOpen(true) : setCurrentView("store"); 
              }} 
              className="text-2xl md:text-3xl font-serif italic tracking-wide text-texto hover:opacity-70 transition-opacity truncate"
            >
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
            
            <div 
              className="relative hidden md:block ml-1"
              onMouseEnter={() => activeUser && setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <button 
                onClick={() => activeUser ? setIsUserMenuOpen(!isUserMenuOpen) : onRequireLogin()} 
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

              <AnimatePresence>
                {isUserMenuOpen && activeUser && (
                  <motion.div 
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full pt-2 w-56 z-50"
                  >
                    <div className="bg-card rounded-2xl shadow-xl border border-borda overflow-hidden py-2">
                      <div className="px-4 py-3 border-b border-borda mb-2 flex items-center gap-3">
                        {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-10 h-10 rounded-full object-cover border border-borda" /> : <div className="w-10 h-10 rounded-full bg-fundo flex items-center justify-center text-texto-sec"><User className="w-5 h-5" /></div>}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-texto truncate">{activeUser.get("name") || "Bem-vindo!"}</p>
                          <p className="text-xs text-texto-sec truncate">{activeUser.get("email")}</p>
                        </div>
                      </div>
                      <button onClick={() => { setCurrentView("profile"); setProfileTab("data"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Settings className="w-4 h-4" /> Meus Dados</button>
                      <button onClick={() => { setCurrentView("profile"); setProfileTab("orders"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Package className="w-4 h-4" /> Meus Pedidos</button>
                      <button onClick={() => { setCurrentView("profile"); setProfileTab("favorites"); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-texto-sec hover:bg-fundo hover:text-texto flex items-center gap-3 transition-colors"><Heart className="w-4 h-4" /> Meus Favoritos</button>
                      <div className="h-px bg-borda my-2"></div>
                      <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"><LogOut className="w-4 h-4" /> Sair da Conta</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-card shadow-2xl z-50 flex flex-col md:hidden">
              <div className="flex items-center justify-between p-5 border-b border-borda">
                <h2 className="text-xl font-serif italic text-texto">Flor e Sol</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-fundo rounded-full transition text-texto-sec hover:text-texto"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                
                <div className="bg-fundo p-4 rounded-xl border border-borda flex items-center gap-3">
                  {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-12 h-12 rounded-full object-cover border border-borda" /> : <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-texto-sec"><User className="w-6 h-6" /></div>}
                  <div className="min-w-0">
                    {activeUser ? (
                      <>
                        <p className="text-[10px] text-texto-sec uppercase tracking-wider mb-0.5">Olá,</p>
                        <p className="font-bold text-texto truncate text-base">{activeUser.get("name") || activeUser.get("email")}</p>
                      </>
                    ) : (
                      <button onClick={() => { setIsMobileMenuOpen(false); onRequireLogin(); }} className="text-left">
                        <p className="font-bold text-texto text-base">Fazer Login</p>
                        <p className="text-xs text-texto-sec">ou Cadastre-se</p>
                      </button>
                    )}
                  </div>
                </div>

                <nav className="flex flex-col gap-1.5">
                  <button onClick={() => { setCurrentView("store"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "store" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><ShoppingBag className="w-5 h-5" /> Vitrine da Loja</button>
                  <button onClick={() => { setCurrentView("cart"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "cart" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><ShoppingBag className="w-5 h-5" /> Meu Carrinho</button>
                  <button onClick={() => { if(!activeUser){ onRequireLogin(); setIsMobileMenuOpen(false); return;} setCurrentView("profile"); setProfileTab("data"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "data" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Settings className="w-5 h-5" /> Meus Dados</button>
                  <button onClick={() => { if(!activeUser){ onRequireLogin(); setIsMobileMenuOpen(false); return;} setCurrentView("profile"); setProfileTab("orders"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "orders" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Package className="w-5 h-5" /> Meus Pedidos</button>
                  <button onClick={() => { if(!activeUser){ onRequireLogin(); setIsMobileMenuOpen(false); return;} setCurrentView("profile"); setProfileTab("favorites"); setIsMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${currentView === "profile" && profileTab === "favorites" ? "bg-texto text-card" : "text-texto-sec hover:bg-fundo hover:text-texto"}`}><Heart className="w-5 h-5" /> Meus Favoritos</button>
                </nav>
                
                <div className="mt-auto pt-5 border-t border-borda flex items-center justify-between">
                  {activeUser ? (
                    <button onClick={onLogout} className="text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3"><LogOut className="w-5 h-5" /> Sair</button>
                  ) : (
                    <div></div>
                  )}
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-fundo rounded-xl text-texto-sec hover:text-texto transition-colors">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-grow relative">
        <AnimatePresence mode="wait">
          
          {currentView === "store" && (
            <motion.main 
              key="view-store"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 mt-6 md:mt-0 space-y-12 md:space-y-16 mb-20"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <Loader2 className="w-12 h-12 text-texto animate-spin mb-6 opacity-80" />
                  <p className="text-texto-sec font-bold tracking-widest uppercase text-sm animate-pulse">Preparando a vitrine...</p>
                </div>
              ) : storeError ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <div className="w-20 h-20 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mb-6">
                    <X className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-serif italic text-texto mb-2">Ops! Falha na conexão.</h3>
                  <p className="text-texto-sec mb-8 max-w-sm">Tivemos um problema para carregar a vitrine. Verifique sua internet e tente novamente.</p>
                  <button onClick={fetchProducts} className="bg-texto text-card font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <>
                  {searchQuery ? (
                    <section>
                      <h2 className="text-xl md:text-2xl font-medium mb-6 text-texto">Resultados para "{searchQuery}"</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-8">
                        {searchResults.map(p => (
                          <StandardProductCard key={p.id} product={p} config={{}} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                        ))}
                        {searchResults.length === 0 && <p className="text-texto-sec col-span-full">Nenhum produto encontrado.</p>}
                      </div>
                    </section>
                  ) : (
                    <>
                      {/* SESSÃO BANNER PRINCIPAL */}
                      <section className="relative w-full h-[25vh] min-h-[220px] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] rounded-[20px] md:rounded-[32px] overflow-hidden shadow-sm bg-fundo mt-3 sm:mt-0">
                        <AnimatePresence initial={false}>
                          <motion.div 
                            key={bannersArray.length > 1 ? currentBannerIndex : "static-banner"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.0, ease: "easeInOut" }}
                            className="absolute inset-0 z-10"
                            style={{ willChange: "opacity" }}
                          >
                            <img 
                              src={bannersArray[currentBannerIndex].imageUrl} 
                              alt={bannersArray[currentBannerIndex].title} 
                              loading={currentBannerIndex === 0 ? "eager" : "lazy"}
                              decoding={currentBannerIndex === 0 ? "sync" : "async"}
                              fetchPriority={currentBannerIndex === 0 ? "high" : "auto"}
                              className="absolute inset-0 w-full h-full object-cover object-center" 
                            />
                            <div className="absolute inset-0 bg-black/30"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 pb-8 md:pb-20">
                              <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-neutral-100/90 uppercase tracking-[0.3em] text-[8px] sm:text-[10px] md:text-sm font-bold mb-1 md:mb-3 drop-shadow-sm">{bannersArray[currentBannerIndex].tag}</motion.span>
                              <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="text-2xl sm:text-4xl md:text-7xl lg:text-8xl font-serif italic text-neutral-100 mb-2 md:mb-6 drop-shadow-md break-words leading-tight">{bannersArray[currentBannerIndex].title}</motion.h2>
                              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="text-[10px] sm:text-base md:text-xl text-neutral-100/95 max-w-2xl mb-4 md:mb-10 drop-shadow-sm font-light px-2 sm:px-4">{bannersArray[currentBannerIndex].desc}</motion.p>
                              {bannersArray[currentBannerIndex].btn && (
                                <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} onClick={() => scrollToSection(bannersArray[currentBannerIndex].target)} className="px-5 py-2 md:px-10 md:py-4 bg-neutral-100 text-neutral-900 font-bold rounded-full hover:bg-neutral-300 transition-colors duration-300 shadow-2xl text-[10px] sm:text-base md:text-lg">{bannersArray[currentBannerIndex].btn}</motion.button>
                              )}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                        
                        {bannersArray.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
                            {bannersArray.map((_, idx) => (
                              <button key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`transition-all duration-500 rounded-full ${idx === currentBannerIndex ? 'w-5 h-1.5 sm:w-8 sm:h-2 bg-white' : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/50 hover:bg-white/80'}`} />
                            ))}
                          </div>
                        )}
                      </section>

                      {/* SESSÃO LANÇAMENTOS */}
                      {newArrivals.length > 0 && (
                        <section id="lancamentos" className="mt-12 md:mt-16 pt-4">
                          <div className="flex items-center gap-3 mb-6 px-1 md:px-0">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-btn text-btn-texto flex items-center justify-center"><Sparkles className="w-3 h-3 md:w-4 md:h-4" /></div>
                            <h2 className="text-xl md:text-2xl font-medium text-texto">Lançamentos</h2>
                          </div>
                          <div className="flex overflow-x-auto gap-4 md:gap-8 snap-x snap-mandatory scrollbar-hide pb-8 md:pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {newArrivals.map(p => (
                              <StandardProductCard key={p.id} product={p} config={{ tag: "Novo", wrapClass: "w-[80vw] max-w-[280px] sm:max-w-[340px] md:w-full md:max-w-none" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* SESSÃO OFERTAS LIMITADAS */}
                      {promoProducts.length > 0 && (
                        <section id="ofertas" className="mt-12 md:mt-24 relative w-full rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm group bg-texto">
                          
                          {promoBannerImageUrl && (
                            <>
                              <img 
                                src={promoBannerImageUrl} 
                                alt={promoBannerTitle} 
                                className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20"></div>
                            </>
                          )}

                          <div className="relative z-10 flex flex-col lg:flex-row items-center p-6 sm:p-10 md:p-16 gap-8 md:gap-12 h-full">
                            
                            <div className="w-full lg:w-1/3 flex flex-col justify-center text-left">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center backdrop-blur-md border border-amber-500/30">
                                  <Timer className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-500">Tempo Limitado</span>
                              </div>
                              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-serif italic mb-4 drop-shadow-md leading-tight ${promoBannerImageUrl ? 'text-white' : 'text-card'}`}>{promoBannerTitle}</h2>
                              <p className={`text-sm md:text-base max-w-sm mb-8 font-light ${promoBannerImageUrl ? 'text-white/80' : 'text-card/80'}`}>{promoBannerDesc}</p>
                            </div>

                            <div className="w-full lg:w-2/3 relative group/slider">
                              
                              {canScrollLeft && (
                                <button 
                                  onClick={() => scrollPromo('left')} 
                                  className="hidden md:flex absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white text-black hover:scale-110 hover:bg-neutral-200 transition-all duration-300 shadow-xl z-40 opacity-0 group-hover/slider:opacity-100"
                                >
                                  <ArrowLeft className="w-6 h-6" />
                                </button>
                              )}

                              <div 
                                ref={promoScrollRef} 
                                onScroll={handlePromoScroll} 
                                className="flex overflow-x-auto gap-4 md:gap-6 scroll-smooth scrollbar-hide py-10 px-4 -mx-4 md:px-8 md:-mx-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                              >
                                {promoProducts.map(p => (
                                  <PromoBannerCard key={p.id} product={p} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                                ))}
                              </div>

                              {canScrollRight && promoProducts.length > 1 && (
                                <button 
                                  onClick={() => scrollPromo('right')} 
                                  className="hidden md:flex absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white text-black hover:scale-110 hover:bg-neutral-200 transition-all duration-300 shadow-xl z-40 opacity-0 group-hover/slider:opacity-100 rotate-180"
                                >
                                  <ArrowLeft className="w-6 h-6" />
                                </button>
                              )}

                            </div>
                            
                          </div>
                        </section>
                      )}

                      {/* SESSÃO MAIS DESEJADOS */}
                      <section id="mais-desejados" className="mt-12 md:mt-16 pt-4">
                        <div className="flex items-center gap-3 mb-6 px-1 md:px-0">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-btn text-btn-texto flex items-center justify-center"><TrendingUp className="w-3 h-3 md:w-4 md:h-4" /></div>
                          <h2 className="text-xl md:text-2xl font-medium text-texto">Mais Desejados</h2>
                        </div>
                        <div className="flex overflow-x-auto gap-4 md:gap-8 snap-x snap-mandatory scrollbar-hide pb-8 md:pb-10 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {bestSellers.length > 0 ? bestSellers.map(p => (
                            <StandardProductCard key={p.id} product={p} config={{ wrapClass: "w-[80vw] max-w-[280px] sm:max-w-[320px] md:w-full md:max-w-none" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                          )) : <p className="text-texto-sec col-span-full">Sem dados de vendas.</p>}
                        </div>
                      </section>

                      {infoBannerActive && (
                        <section className="mt-8 md:mt-24 mb-4">
                          
                          {/* 👇 BANNER SECUNDÁRIO OTIMIZADO 👇 */}
                          <div className="relative w-full h-[20vh] min-h-[160px] md:h-[50vh] shadow-sm group bg-texto rounded-[20px] md:rounded-[32px]">
                            
                            {infoBannerImageUrl && /\.(mp4|webm|ogg|mov)$/i.test(infoBannerImageUrl) ? (
                              <video 
                                src={infoBannerImageUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none rounded-[20px] md:rounded-[32px]" 
                              />
                            ) : infoBannerImageUrl ? (
                              <img 
                                src={infoBannerImageUrl} 
                                alt={infoBannerTitle} 
                                loading="lazy" 
                                className="absolute inset-0 w-full h-full object-cover object-center z-0 rounded-[20px] md:rounded-[32px]" 
                              />
                            ) : null}
                            
                            {/* Película escura com rounded direto nela */}
                            <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none rounded-[20px] md:rounded-[32px]"></div>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif italic text-white mb-2 md:mb-4 drop-shadow-md break-words">{infoBannerTitle}</h2>
                              <p className="text-xs md:text-xl text-white/90 max-w-2xl mb-4 md:mb-8 drop-shadow-sm font-light px-4">{infoBannerDesc}</p>
                              {infoBannerBtn && (
                                <button className="px-5 py-2 md:px-8 md:py-3 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-200 transition-colors duration-300 shadow-xl text-xs md:text-base">
                                  {infoBannerBtn}
                                </button>
                              )}
                            </div>
                          </div>

                          {infoBannerProducts.length > 0 && (
                            <>
                              {/* =========================================================
                                  LAYOUT MOBILE (md:hidden): Cartões de Catálogo Limpos
                                  ========================================================= */}
                              <div className="mt-6 md:hidden grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                {infoBannerProducts.map(p => (
                                  <CatalogProductCard 
                                    key={p.id} 
                                    product={p} 
                                    isFav={favorites.includes(p.id)} 
                                    promo={getActivePromo(p)} 
                                    onOpenDetails={openProductDetails} 
                                    onToggleFav={toggleFavorite} 
                                    onAddToCart={handleAddToCartClick} 
                                  />
                                ))}
                              </div>

                              {/* =========================================================
                                  LAYOUT DESKTOP (hidden md:block): Mosaico Dinâmico Antigo
                                  ========================================================= */}
                              <div className="hidden md:block mt-10">
                                {infoBannerProducts.length === 6 || infoBannerProducts.length === 2 || infoBannerProducts.length === 3 ? (
                                  <div className="flex flex-wrap gap-4 md:gap-6">
                                    {infoBannerProducts.map(p => (
                                      <div key={p.id} className="flex-1 min-w-[150px] sm:min-w-[200px] md:min-w-[30%]">
                                         <StandardProductCard product={p} config={{ aspectClass: "aspect-square md:aspect-[4/3]" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                                      </div>
                                    ))}
                                  </div>

                                ) : infoBannerProducts.length === 4 || infoBannerProducts.length === 5 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                    {infoBannerProducts.map(p => (
                                       <div key={p.id} className="w-full">
                                         <StandardProductCard product={p} config={{ aspectClass: "aspect-[3/4]" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                                       </div>
                                    ))}
                                  </div>

                                ) : (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                      {infoBannerProducts.slice(0, 5).map(p => (
                                         <div key={p.id} className="w-full"><StandardProductCard product={p} config={{ aspectClass: "aspect-[3/4]" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} /></div>
                                      ))}
                                    </div>
                                    
                                    {infoBannerProducts.length > 5 && (
                                      <div className="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-6">
                                        {infoBannerProducts.slice(5).map(p => (
                                          <div key={p.id} className="flex-1 min-w-[150px] sm:min-w-[200px] md:min-w-[280px]">
                                             <StandardProductCard product={p} config={{ aspectClass: "aspect-square md:aspect-[4/3]" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </section>
                      )}

                      {/* SESSÃO SHOP THE LOOK */}
                      {lookConfig && lookConfig.items.length > 0 && (
                        <section ref={shopTheLookRef} id="shop-the-look" className="relative h-[150vh] md:h-[180vh] mt-12 md:mt-20 mb-8 md:mb-16 border-t border-borda">
                          
                          {/* 👇 CAIXA ÚNICA PEGAJOSA COM WILL-CHANGE PARA SALVAR A GPU 👇 */}
                          <motion.div 
                            style={{ y: lookY, opacity: lookOpacity }}
                            className="will-change-transform sticky top-16 md:top-15 w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden py-4 md:py-0"
                          >
                              
                            {/* TÍTULO DA SESSÃO */}
                            <div className="flex items-center gap-3 mb-6 md:mb-10 px-4 md:px-0">
                              <div className="w-8 h-8 rounded-full bg-texto text-card flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                              <h2 className="text-2xl md:text-3xl font-serif italic text-texto">Shop the Look</h2>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 lg:gap-24 mx-4 md:mx-0">
                              
                              {/* === LADO ESQUERDO: INFORMAÇÕES === */}
                              <div className="w-full md:w-1/2 flex flex-col justify-center relative min-h-[220px] md:min-h-[300px] order-2 md:order-1">
                                <AnimatePresence mode="wait">
                                  {selectedLookItem && (
                                    <motion.div
                                      key={selectedLookItem.id}
                                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                      className="space-y-4 md:space-y-6"
                                    >
                                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} className="space-y-1.5">
                                        <span className="text-[10px] md:text-xs font-bold tracking-widest text-texto-sec uppercase">{selectedLookItem.get("category")}</span>
                                        <h3 className="text-3xl md:text-5xl lg:text-6xl font-serif italic text-texto leading-tight break-words line-clamp-2">{selectedLookItem.get("name")}</h3>
                                      </motion.div>
                                      
                                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }} className="flex items-baseline gap-2">
                                        {getActivePromo(selectedLookItem).isActive ? (
                                          <><span className="text-2xl md:text-3xl font-bold text-texto tabular-nums">R$ {getActivePromo(selectedLookItem).price.toFixed(2)}</span><span className="text-base md:text-lg line-through text-texto-sec tabular-nums">R$ {selectedLookItem.get("price").toFixed(2)}</span></>
                                        ) : (
                                          <span className="text-2xl md:text-3xl font-bold text-texto tabular-nums">R$ {selectedLookItem.get("price").toFixed(2)}</span>
                                        )}
                                      </motion.div>
                                      
                                      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }} className="text-texto-sec leading-relaxed text-xs md:text-base whitespace-pre-line line-clamp-3 max-w-md">
                                        {selectedLookItem.get("description")}
                                      </motion.p>
                                      
                                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }} className="flex items-center gap-3 pt-2 md:pt-4">
                                        <button onClick={() => handleAddToCartClick(selectedLookItem)} className="flex-1 max-w-[300px] px-6 py-3.5 md:py-4 bg-texto text-card font-bold rounded-full text-xs md:text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5 shadow-xl active:scale-95 transition-transform">
                                          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" /> Adicionar à Sacola
                                        </button>
                                        <button onClick={() => openProductDetails(selectedLookItem)} className="p-3.5 md:p-4 bg-neutral-100 text-texto-sec rounded-full hover:bg-neutral-200 hover:text-texto transition-colors shrink-0" title="Ver detalhes completos">
                                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* === LADO DIREITO: IMAGEM EDITORIAL RETANGULAR === */}
                              <div className="w-full md:w-1/2 max-w-[280px] md:max-w-md lg:max-w-lg aspect-[3/4] max-h-[40vh] md:max-h-none mx-auto relative order-1 md:order-2 rounded-[20px] md:rounded-[24px] overflow-hidden group shadow-md">
                                <img src={lookConfig.imageUrl} alt="Shop the Look" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/10 pointer-events-none"></div>

                                {lookConfig.items.map((item, index) => {
                                  const isActive = selectedLookItem?.id === item.product.id;
                                  return (
                                    <button 
                                      key={`${item.product.id}-${index}`} onClick={() => setSelectedLookItem(item.product)} style={{ top: `${item.y}%`, left: `${item.x}%` }}
                                      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group/hotspot focus:outline-none" title={`Selecionar ${item.label}`}
                                    >
                                      <div className={`relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full transition-all duration-500 ${isActive ? 'scale-110' : 'hover:scale-110'}`}>
                                        {!isActive && <span className="absolute inset-0 rounded-full bg-white/50 animate-ping opacity-75"></span>}
                                        <span className={`absolute inset-0 rounded-full border-2 transition-colors duration-300 shadow-sm ${isActive ? 'bg-texto border-texto shadow-xl' : 'bg-white/40 border-white/70 backdrop-blur-sm'}`}></span>
                                        <span className={`relative w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors duration-300 ${isActive ? 'bg-card' : 'bg-white'}`}></span>
                                      </div>
                                      <span className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/hotspot:opacity-100 transition-opacity shadow-xl pointer-events-none ${isActive ? 'bg-texto text-card' : 'bg-card text-texto border border-borda'}`}>
                                        {item.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                            </div>
                          </motion.div>

                        </section>
                      )}

                      {/*SESSÃO TODOS OS PRODUTOS*/}
                      <section id="catalogo" className="border-t border-borda pt-8 md:pt-12 mt-8 md:mt-12 relative">
                        {categoriesList.length > 1 && (
                          <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto pb-6 md:pb-8 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:justify-center">
                            {categoriesList.map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                                className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 ${
                                  selectedCategory === cat 
                                    ? "bg-texto text-card shadow-md scale-105" 
                                    : "bg-neutral-100 text-texto-sec hover:bg-neutral-200 hover:text-texto cursor-pointer"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="relative w-full">
                          {currentPage > 1 && (
                            <button 
                              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToSection('catalogo'); }} 
                              className="hidden md:flex absolute -left-12 lg:-left-16 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-texto text-card hover:opacity-70 transition-opacity z-20 shadow-sm"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                          )}

                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={`${selectedCategory}-${currentPage}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-8"                        >
                              {currentCatalogPageItems.map(p => (
                                <CatalogProductCard key={p.id} product={p} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                              ))}
                              {currentCatalogPageItems.length === 0 && <p className="text-texto-sec col-span-full text-center py-10">Nenhum produto nesta categoria.</p>}
                            </motion.div>
                          </AnimatePresence>

                          {currentPage < totalCatalogPages && (
                            <button 
                              onClick={() => { setCurrentPage(p => Math.min(totalCatalogPages, p + 1)); scrollToSection('catalogo'); }} 
                              className="hidden md:flex absolute -right-12 lg:-right-16 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-texto text-card hover:opacity-70 transition-opacity z-20 shadow-sm rotate-180"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {totalCatalogPages > 1 && (
                          <div className="md:hidden flex justify-center items-center gap-4 mt-10">
                            <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); scrollToSection('catalogo'); }} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-borda text-texto hover:bg-fundo disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold text-texto-sec tracking-wider">
                              <span className="text-texto">{currentPage}</span> / {totalCatalogPages}
                            </span>
                            <button onClick={() => { setCurrentPage(p => Math.min(totalCatalogPages, p + 1)); scrollToSection('catalogo'); }} disabled={currentPage === totalCatalogPages} className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-borda text-texto hover:bg-fundo disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm rotate-180">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </section>

                      {/* ==============================================================================
                          👇 BANNER TERCIÁRIO OTIMIZADO (Abaixo do Catálogo) 👇
                          ============================================================================== */}
                      {thirdBannerActive && (
                        <section className="mt-12 md:mt-24 mb-10 md:mb-16">
                          
                          <div className="relative w-full h-[20vh] min-h-[160px] md:h-[50vh] shadow-sm group bg-texto rounded-[20px] md:rounded-[32px]">
                            
                            {thirdBannerImageUrl && /\.(mp4|webm|ogg|mov)$/i.test(thirdBannerImageUrl) ? (
                              <video 
                                src={thirdBannerImageUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none rounded-[20px] md:rounded-[32px]" 
                              />
                            ) : thirdBannerImageUrl ? (
                              <img 
                                src={thirdBannerImageUrl} 
                                alt={thirdBannerTitle} 
                                loading="lazy" 
                                className="absolute inset-0 w-full h-full object-cover object-center z-0 rounded-[20px] md:rounded-[32px]" 
                              />
                            ) : null}

                            {/* Película escura com rounded direto nela */}
                            <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none rounded-[20px] md:rounded-[32px]"></div>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                              <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif italic text-white mb-2 md:mb-4 drop-shadow-md break-words">{thirdBannerTitle}</h2>
                              <p className="text-xs md:text-xl text-white/90 max-w-2xl mb-4 md:mb-8 drop-shadow-sm font-light px-4">{thirdBannerDesc}</p>
                              
                              {thirdBannerBtn && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (!thirdBannerBtnLink) return;

                                    // 1. Limpa o link caso tenha sido salvo com '#' no início
                                    const targetId = thirdBannerBtnLink.replace('#', '').trim();
                                    
                                    // 2. Verifica se existe alguma sessão no site com esse nome
                                    const sectionExists = document.getElementById(targetId);

                                    if (sectionExists) {
                                      // Se achou a sessão, desliza até ela!
                                      scrollToSection(targetId);
                                    } else if (thirdBannerBtnLink.startsWith('http')) {
                                      // Se não achou a sessão e começa com http, é um link externo (abre em nova aba)
                                      window.open(thirdBannerBtnLink, '_blank');
                                    } else {
                                      // Se deu tudo errado (digitou errado no painel), desliza para o catálogo por segurança
                                      scrollToSection('catalogo');
                                    }
                                  }}
                                  className="inline-block px-5 py-2 md:px-8 md:py-3 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-200 transition-colors duration-300 shadow-xl text-xs md:text-base pointer-events-auto"
                                >
                                  {thirdBannerBtn}
                                </button>
                              )}
                            </div>
                          </div>
                        </section>
                      )}
                      {/* ==============================================================================
                          👆 FIM DO BANNER TERCIÁRIO 👆
                          ============================================================================== */}

                    </>
                  )}
                </>
              )}
            </motion.main>
          )}

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
                         <button type="submit" disabled={isSavingProfile} className="w-full h-12 md:h-14 bg-btn text-btn-texto font-bold rounded-xl text-sm md:text-base hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex justify-center items-center gap-2 shadow-md">
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
                           {favoriteProducts.map(p => (
                             <StandardProductCard key={p.id} product={p} config={{ wrapClass: "w-[80vw] max-w-[280px] sm:max-w-[320px] md:w-full md:max-w-none" }} isFav={favorites.includes(p.id)} promo={getActivePromo(p)} onOpenDetails={openProductDetails} onToggleFav={toggleFavorite} onAddToCart={handleAddToCartClick} />
                           ))}
                         </div>
                       )}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>
           </motion.main>
          )}

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
                          <input type="text" readOnly value={pixData?.qrCode || ""} className="bg-transparent flex-1 text-[10px] md:text-xs text-texto-sec outline-none pl-2 md:pl-3 truncate font-medium min-w-0" />
                          <button 
                            onClick={handleCopyPix} 
                            disabled={isCopied}
                            className={`px-4 py-3 md:px-6 md:py-4 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all duration-300 shadow-md shrink-0 flex items-center justify-center gap-1.5 ${isCopied ? 'bg-green-500 text-white' : 'bg-btn text-btn-texto hover:opacity-90'}`}
                          >
                            {isCopied ? (
                              <><CheckCircle className="w-3 h-3 md:w-4 md:h-4" /> Copiado!</>
                            ) : (
                              "Copiar"
                            )}
                          </button>
                        </div>
                        
                        <button onClick={handleWhatsAppRedirect} className="w-full h-14 md:h-16 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-xl flex items-center justify-center gap-2 md:gap-3 text-sm md:text-lg"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /> Já paguei!</button>
                        <button onClick={closeCart} className="mt-6 md:mt-8 text-xs md:text-sm font-bold text-texto-sec hover:text-texto transition-colors">Voltar para a Loja</button>
                      </div>
                    )}

                    {checkoutStep === "success" && paymentMethod === "entrega" && (
                      <div className="w-full max-w-md flex flex-col items-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner"><CheckCircle className="w-10 h-10 md:w-12 md:h-12" /></div>
                        <h3 className="text-2xl md:text-3xl font-bold text-texto mb-2">Pedido Confirmado!</h3>
                        <p className="text-texto-sec mb-8 md:mb-10 text-sm md:text-lg px-4">Chame nossa equipe no WhatsApp para combinarmos a entrega.</p>
                        <button onClick={handleWhatsAppRedirect} className="w-full h-14 md:h-16 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-xl flex items-center justify-center gap-2 md:gap-3 text-sm md:text-lg"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /> Combinar Entrega</button>
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
                    <div className="flex-1 w-full bg-card rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-sm border border-borda transition-colors duration-500 overflow-hidden">
                      
                      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-borda">
                        <button onClick={closeCart} className="p-2 md:p-3 hover:bg-fundo rounded-full transition-colors text-texto-sec hover:text-texto">
                          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <h2 className="text-2xl md:text-3xl font-serif italic text-texto truncate">
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
                                  <div key={`${item.product.id}-${item.variant}`} className="flex flex-row gap-3.5 md:gap-6 p-3 md:p-4 rounded-xl md:rounded-2xl border border-borda transition-colors hover:bg-fundo relative">
                                    <img src={item.product.get("imageUrl")} alt={item.product.get("name")} className="w-20 h-28 sm:w-28 sm:h-32 md:w-32 object-cover rounded-lg md:rounded-xl border border-borda shrink-0" />
                                    <div className="flex-1 flex flex-col justify-between min-w-0 pr-6 sm:pr-0">
                                      <div>
                                        <h3 className="font-bold text-texto text-sm md:text-lg truncate leading-snug">
                                          {item.product.get("name")} 
                                        </h3>
                                        {item.variant && <span className="block text-[11px] md:text-sm text-texto-sec mt-0.5 md:mt-1 truncate">Modelo: {item.variant}</span>}
                                        {promo.isActive ? (
                                          <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2 flex-wrap">
                                            <p className="text-texto font-bold text-sm md:text-lg">R$ {promo.price.toFixed(2)}</p>
                                            <p className="text-texto-sec text-[11px] md:text-sm line-through">R$ {item.product.get("price").toFixed(2)}</p>
                                          </div>
                                        ) : (
                                          <p className="text-texto font-bold text-sm md:text-lg mt-1 md:mt-2">R$ {item.product.get("price").toFixed(2)}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 mt-2 sm:mt-4">
                                        <div className="flex items-center gap-1.5 md:gap-3 bg-fundo border border-borda w-fit rounded-lg md:rounded-xl px-1 md:px-2 py-0.5 sm:py-1">
                                          <button onClick={() => updateQuantity(item.product.id, item.variant, -1)} className="p-1 sm:p-2 hover:text-texto text-texto-sec transition-colors rounded-md sm:rounded-lg"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                          <span className="w-4 sm:w-6 text-center font-bold text-xs md:text-sm text-texto">{item.quantity}</span>
                                          <button onClick={() => updateQuantity(item.product.id, item.variant, 1)} className="p-1 sm:p-2 hover:text-texto text-texto-sec transition-colors rounded-md sm:rounded-lg"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                        </div>
                                      </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id, item.variant)} className="absolute top-3 right-3 p-1.5 sm:static sm:p-2 text-texto-sec hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10 shrink-0"><Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5" /></button>
                                  </div>
                                );
                              })
                            )}
                          </motion.div>
                        )}

                        {checkoutStep === "payment" && (
                          <motion.div key="payment-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4 md:space-y-6">
                            <p className="text-sm sm:text-lg text-texto-sec font-bold mb-2 md:mb-4">Escolha a forma de pagamento:</p>
                            
                            <button onClick={() => setPaymentMethod("pix")} className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left flex items-center gap-4 md:gap-6 transition-colors duration-300 ${paymentMethod === "pix" ? "border-texto bg-fundo shadow-md" : "border-borda bg-card hover:border-texto-sec hover:bg-fundo/50"}`}>
                              <div className={`p-2.5 md:p-4 rounded-full shrink-0 transition-colors duration-300 ${paymentMethod === "pix" ? "bg-btn text-btn-texto" : "bg-fundo text-texto-sec"}`}>
                                <QrCode className="w-5 h-5 md:w-8 md:h-8" />
                              </div>
                              <div className="min-w-0">
                                <h4 className={`text-sm md:text-xl font-bold transition-colors duration-300 ${paymentMethod === "pix" ? "text-texto" : "text-texto-sec"}`}>PIX (Aprovação na hora)</h4>
                                <p className="text-[10px] md:text-sm text-texto-sec mt-0.5 md:mt-1 truncate">Código Copia e Cola na próxima tela.</p>
                              </div>
                            </button>
                            
                            <button onClick={() => setPaymentMethod("entrega")} className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left flex items-center gap-4 md:gap-6 transition-colors duration-300 ${paymentMethod === "entrega" ? "border-texto bg-fundo shadow-md" : "border-borda bg-card hover:border-texto-sec hover:bg-fundo/50"}`}>
                              <div className={`p-2.5 md:p-4 rounded-full shrink-0 transition-colors duration-300 ${paymentMethod === "entrega" ? "bg-btn text-btn-texto" : "bg-fundo text-texto-sec"}`}>
                                <Truck className="w-5 h-5 md:w-8 md:h-8" />
                              </div>
                              <div className="min-w-0">
                                <h4 className={`text-sm md:text-xl font-bold transition-colors duration-300 ${paymentMethod === "entrega" ? "text-texto" : "text-texto-sec"}`}>Pagar na Entrega</h4>
                                <p className="text-[10px] md:text-sm text-texto-sec mt-0.5 md:mt-1 truncate">Dinheiro ou Cartão ao motoboy.</p>
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-full lg:w-[400px] shrink-0 bg-card rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-borda sticky top-20 md:top-28 transition-colors duration-500">
                      <h3 className="text-lg md:text-xl font-bold text-texto mb-5 md:mb-8">Resumo do Pedido</h3>
                      
                      <div className="space-y-3 md:space-y-4 mb-5 md:mb-8">
                        <div className="flex justify-between text-[13px] md:text-base text-texto-sec">
                          <span>Subtotal ({cartItemsCount} itens)</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[13px] md:text-base text-texto-sec">
                          <span>Entrega</span>
                          <span className="text-texto font-bold">A combinar</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-borda pt-5 md:pt-6 mb-6 md:mb-10">
                        <span className="font-bold text-base md:text-lg text-texto">Total</span>
                        <span className="text-2xl md:text-3xl font-bold text-texto">R$ {cartTotal.toFixed(2)}</span>
                      </div>

                      <AnimatePresence mode="wait">
                        {checkoutStep === "cart" && (
                          <motion.div key="btn-cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button 
                              onClick={() => activeUser ? setCheckoutStep("payment") : onRequireLogin()} 
                              disabled={cart.length === 0} 
                              className="w-full h-14 md:h-16 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-lg disabled:opacity-50 flex justify-center items-center text-sm md:text-lg"
                            >
                              Escolher Pagamento
                            </button>
                          </motion.div>
                        )}

                        {checkoutStep === "payment" && (
                          <motion.div key="btn-payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 md:gap-4">
                            <button onClick={submitFinalCheckout} disabled={isProcessingOrder} className="w-full h-14 md:h-16 bg-btn text-btn-texto font-bold rounded-xl md:rounded-2xl hover:opacity-90 transition-opacity duration-300 shadow-lg disabled:opacity-50 flex justify-center items-center text-sm md:text-lg gap-2">
                              {isProcessingOrder ? (
                                <><Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> Finalizando...</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> Confirmar Pedido</>
                              )}
                            </button>
                            <button onClick={() => setCheckoutStep("cart")} className="w-full text-texto-sec font-bold hover:text-texto transition-colors text-xs md:text-sm py-1">
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
              <button onClick={() => setQuickAdd({ isOpen: false, product: null, selectedVariant: "" })} className="absolute top-4 right-4 p-2.5 bg-fundo hover:bg-borda rounded-full text-texto-sec hover:text-texto transition-colors"><X className="w-4 h-4" /></button>
              
              <div className="flex items-center gap-4 mb-6 pr-8 mt-1">
                <img src={quickAdd.product.get("imageUrl")} alt={quickAdd.product.get("name")} className="w-16 h-16 object-cover rounded-xl border border-borda shrink-0" />
                <div>
                  <h3 className="font-bold text-texto line-clamp-1">{quickAdd.product.get("name")}</h3>
                  <p className="text-texto-sec text-sm">
                    R$ {(getActivePromo(quickAdd.product).isActive ? getActivePromo(quickAdd.product).price : quickAdd.product.get("price")).toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-texto uppercase tracking-wider mb-2.5">Escolha o Modelo:</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(quickAdd.product.get("variants") || []).map(v => (
                  <button 
                    key={v} 
                    onClick={() => setQuickAdd({ ...quickAdd, selectedVariant: v })} 
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors border ${quickAdd.selectedVariant === v ? 'border-texto bg-texto text-card shadow-md' : 'border-borda bg-fundo text-texto-sec hover:border-texto hover:text-texto'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => processAddToCart(quickAdd.product, quickAdd.selectedVariant)} 
                className="w-full h-12 bg-btn text-btn-texto font-bold rounded-xl hover:opacity-90 transition-opacity duration-300 shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar à Sacola
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 top-0 z-50 bg-fundo overflow-hidden flex flex-col md:block"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
              
              <div className="w-full h-[45vh] md:h-[100dvh] bg-fundo shrink-0 p-2 md:p-3 lg:p-4">
                <div className="relative w-full h-full rounded-[20px] md:rounded-[24px] overflow-hidden shadow-sm">
                  
                  <button 
                    onClick={() => setDetailedProduct(null)} 
                    className="absolute top-4 left-4 md:top-6 md:left-6 p-2.5 bg-card/80 backdrop-blur-md rounded-full text-texto hover:bg-card transition-all shadow-sm z-40 group"
                    title="Voltar para a loja"
                  >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </button>

                  {(() => {
                    const mediaUrl = detailedProduct.get("detailsMediaUrl") || detailedProduct.get("imageUrl");
                    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
                    return isVideo ? (
                      <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={mediaUrl} alt={detailedProduct.get("name")} className="w-full h-full object-cover" />
                    );
                  })()}
                  
                  {detailedProduct.get("isInfoBannerProduct") && (
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-card/80 backdrop-blur-md text-texto px-3 py-1.5 rounded-full flex items-center gap-1.5 z-40 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Destaque</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[55vh] md:h-full overflow-y-auto p-6 sm:p-10 lg:p-16 flex flex-col relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div>
                  <div className="mb-2 md:mb-3"><span className="text-[10px] md:text-xs font-bold tracking-widest text-texto-sec uppercase">{(detailedProduct.get("categories") || [detailedProduct.get("category")]).filter(Boolean).join(" , ") || "Premium"}</span></div>
                  
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif italic text-texto leading-tight break-words pr-2 mb-4">{detailedProduct.get("name")}</h1>
                  
                  <div className="mb-8">
                    {getActivePromo(detailedProduct).isActive ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-2xl md:text-3xl font-bold text-texto tabular-nums">R$ {getActivePromo(detailedProduct).price.toFixed(2)}</span>
                        <span className="text-base md:text-lg line-through text-texto-sec tabular-nums">R$ {detailedProduct.get("price").toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-2xl md:text-3xl font-bold text-texto tabular-nums">R$ {detailedProduct.get("price").toFixed(2)}</span>
                    )}
                  </div>
                  
                  <p className="text-texto-sec leading-relaxed mb-8 whitespace-pre-line text-sm sm:text-base md:text-lg">{detailedProduct.get("description")}</p>
                  
                  {(detailedProduct.get("variants") || []).length > 0 && (
                    <div className="mb-10">
                      <p className="text-[10px] font-bold text-texto uppercase tracking-wider mb-3.5">Escolha a Opção</p>
                      <div className="flex flex-wrap gap-2.5">
                        {(detailedProduct.get("variants") || []).map(v => (
                          <button 
                            key={v} 
                            onClick={() => setDetailedVariant(v)} 
                            className={`px-5 py-3 sm:px-6 sm:py-3 rounded-full text-xs md:text-sm font-bold transition-colors ${detailedVariant === v ? 'bg-texto text-card shadow-md' : 'bg-neutral-100 text-texto-sec hover:bg-neutral-200'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-8 pb-2 space-y-8">
                  
                  <div className="border-t border-borda pt-8">
                    <h3 className="text-[11px] md:text-sm font-bold text-texto uppercase tracking-wider mb-4">Avaliações</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                      {productReviews.length === 0 ? (
                        <p className="text-xs text-texto-sec italic md:col-span-3">Ainda não há avaliações.</p>
                      ) : (
                        [...productReviews].reverse().slice(0, 3).map((review) => (
                          <div key={review.id} className="bg-neutral-50 p-3 md:p-4 rounded-xl border border-borda flex flex-col shadow-sm">
                            <div className="flex items-center gap-0.5 mb-2.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-3 h-3 ${star <= review.get("rating") ? 'text-texto fill-texto' : 'text-texto/20'}`} />
                              ))}
                            </div>
                            <p className="text-[10px] md:text-xs text-texto mb-2 flex-1 italic leading-relaxed line-clamp-3">"{review.get("comment")}"</p>
                            <p className="text-[8px] md:text-[9px] font-bold text-texto-sec uppercase">— {review.get("userName")}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {activeUser ? (
                      <form onSubmit={submitReview} className="bg-card p-1.5 rounded-full border border-borda flex items-center gap-2 focus-within:ring-1 focus-within:ring-texto focus-within:border-texto transition-all shadow-sm">
                        <div className="flex items-center pl-3 shrink-0">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button type="button" key={star} onClick={() => setNewReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                              <Star className={`w-4 h-4 md:w-5 md:h-5 ${star <= newReviewRating ? 'text-texto fill-texto' : 'text-texto/20'}`} />
                            </button>
                          ))}
                        </div>
                        <input required type="text" value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="Deixe sua avaliação..." className="flex-1 bg-transparent text-xs text-texto outline-none placeholder:text-texto/40 min-w-0 py-2" />
                        <button type="submit" disabled={isSubmittingReview} className="shrink-0 px-4 py-2 bg-btn text-btn-texto font-bold text-[10px] rounded-full hover:opacity-90 transition-opacity duration-300 disabled:opacity-50">
                          {isSubmittingReview ? "..." : "Enviar"}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-fundo p-4 rounded-xl border border-borda text-center">
                        <p className="text-xs text-texto-sec mb-2">Faça login para avaliar.</p>
                        <button onClick={onRequireLogin} className="text-texto font-bold text-xs hover:underline">Fazer Login</button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 md:gap-4 active:scale-[0.98] transition-transform">
                    <button 
                      type="button" 
                      onClick={(e) => toggleFavorite(detailedProduct.id, e)}
                      className={`flex-none w-14 h-14 md:w-16 md:h-16 aspect-square flex items-center justify-center rounded-full transition-all duration-300 ${
                        favorites.includes(detailedProduct.id)
                          ? 'bg-texto text-card shadow-md' 
                          : 'bg-neutral-100 text-texto-sec hover:bg-neutral-200 hover:text-texto'
                      }`}
                      title={favorites.includes(detailedProduct.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Heart 
                        className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${
                          favorites.includes(detailedProduct.id) 
                            ? 'fill-current scale-110' 
                            : 'scale-100'
                        }`} 
                      />
                    </button>

                    <button 
                      onClick={() => processAddToCart(detailedProduct, detailedVariant, detailedQuantity)} 
                      disabled={detailedProduct.get("stock") <= 0} 
                      className="flex-1 min-w-[200px] h-14 md:h-16 bg-btn text-btn-texto text-sm md:text-base font-bold rounded-full hover:opacity-90 transition-opacity duration-300 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" /> {detailedProduct.get("stock") <= 0 ? "Esgotado" : "Adicionar à Sacola"}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-texto pt-12 md:pt-16 pb-8 mt-auto transition-colors duration-500">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-10 md:mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h3 className="text-xl md:text-2xl font-serif italic tracking-wide text-card mb-3 md:mb-4">Flor e Sol</h3>
              <p className="text-card/70 text-xs md:text-sm leading-relaxed max-w-sm">Descubra o frescor e a elegância de peças pensadas para iluminar o seu dia a dia.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-card mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Navegação</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-card/70">
                <li><button onClick={() => setCurrentView("store")} className="hover:text-card transition-colors">Página Inicial</button></li>
                <li><button onClick={() => activeUser ? setCurrentView("profile") : onRequireLogin()} className="hover:text-card transition-colors">Minha Conta</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-card mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Suporte</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-card/70">
                <li><a href="#" className="hover:text-card transition-colors">Fale Conosco</a></li>
                <li><a href="#" className="hover:text-card transition-colors">Trocas e Devoluções</a></li>
              </ul>
            </div>
            
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <h4 className="font-bold text-card mb-3 md:mb-4 uppercase text-[10px] md:text-xs tracking-wider">Fique por dentro</h4>
              <p className="text-card/70 text-xs md:text-sm mb-3 md:mb-4">Assine nossa newsletter para receber novidades.</p>
              <form onSubmit={handleSubscribeNewsletter} className="flex gap-2">
                {/* Campo de input escurecido com texto claro */}
                <input 
                  type="email" 
                  required 
                  value={newsletterEmail} 
                  onChange={(e) => setNewsletterEmail(e.target.value)} 
                  placeholder="Seu e-mail..." 
                  className="flex-1 h-10 bg-card/10 border border-card/20 rounded-lg px-3 md:px-4 text-xs md:text-sm focus:outline-none focus:border-card text-card placeholder:text-card/50 min-w-0 transition-colors" 
                />
                {/* Botão invertido (Branco) */}
                <button type="submit" disabled={isSubscribing} className="bg-card text-texto h-10 px-4 rounded-lg text-xs md:text-sm font-bold hover:bg-card/90 transition-colors duration-300 shrink-0 disabled:opacity-50">
                  {isSubscribing ? "..." : "Assinar"}
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-card/10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-card/50 text-[10px] md:text-sm text-center md:text-left">© {new Date().getFullYear()} Flor e Sol. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 md:gap-6 text-card/70">
              <Instagram className="w-4 h-4 md:w-5 md:h-5 hover:text-card transition-colors cursor-pointer" />
              <Facebook className="w-4 h-4 md:w-5 md:h-5 hover:text-card transition-colors cursor-pointer" />
            
              <a 
                href="https://github.com/uGuilherm3" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-card transition-colors"
              >
                <Github className="w-4 h-4 md:w-5 md:h-5 cursor-pointer" />
              </a>
            </div>
          </div>
          
        </div>
      </footer>

      <div className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 bg-btn text-btn-texto px-4 md:px-6 py-2.5 md:py-3 rounded-full shadow-2xl flex items-center gap-2 md:gap-3 transform transition-all duration-300 z-[999] ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}>
        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
        <span className="font-bold text-xs md:text-sm whitespace-nowrap">{toast.message}</span>
      </div>

    </div>
  );
}