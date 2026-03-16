import React, { useState, useEffect } from "react";
import Parse from "../parseSetup";
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Package, Calendar, Clock, ShoppingBag, Trash2, Link as LinkIcon, Image as ImageIcon, Plus, ChevronUp, ChevronDown } from "lucide-react";

const DEFAULT_PRODUCT_IMG = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop";
const DEFAULT_INFO_BANNER_IMG = "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop";
const DEFAULT_CAROUSEL_IMG = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";

export default function AdminPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, monthRevenue: 0, todayRevenue: 0, totalOrders: 0, topProducts: [] });
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(null);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState(""); 
  const [variants, setVariants] = useState(""); 
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountEndsAt, setDiscountEndsAt] = useState("");
  const [hasDetails, setHasDetails] = useState(false);
  const [description, setDescription] = useState("");
  const [detailsMediaFile, setDetailsMediaFile] = useState(null);
  const [currentDetailsMediaUrl, setCurrentDetailsMediaUrl] = useState("");
  const [linkDetailsMediaUrl, setLinkDetailsMediaUrl] = useState(""); 
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [linkImageUrl, setLinkImageUrl] = useState(""); 
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================================
  // ESTADOS DO CARROSSEL PRINCIPAL (NOVO)
  // =========================================
  const [settingsId, setSettingsId] = useState(null);
  const [banners, setBanners] = useState([
    {
      id: Date.now().toString(),
      imageUrl: DEFAULT_CAROUSEL_IMG,
      tag: "Novidades",
      title: "Coleção Essência",
      desc: "Descubra o frescor e a elegância de peças pensadas para iluminar o seu dia a dia.",
      btn: "Descobrir Agora",
      target: "lancamentos",
      file: null,
      linkUrl: ""
    }
  ]);

  // ESTADOS DO BANNER INFORMATIVO (SECUNDÁRIO)
  const [infoBannerActive, setInfoBannerActive] = useState(true);
  const [infoBannerTitle, setInfoBannerTitle] = useState("Coleção de Outono");
  const [infoBannerDesc, setInfoBannerDesc] = useState("Não perca nossa coleção exclusiva por tempo limitado.");
  const [infoBannerBtn, setInfoBannerBtn] = useState("Explorar");
  const [infoBannerFile, setInfoBannerFile] = useState(null);
  const [currentInfoBannerUrl, setCurrentInfoBannerUrl] = useState(DEFAULT_INFO_BANNER_IMG);
  const [linkInfoBannerUrl, setLinkInfoBannerUrl] = useState(""); 

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchOrdersAndStats();
  }, []);

  const fetchOrdersAndStats = async () => {
    const query = new Parse.Query("Order");
    query.descending("createdAt");
    query.limit(1000);
    query.include("user"); 
    try {
      const results = await query.find();
      setOrders(results);
      let totalRev = 0, monthRev = 0, todayRev = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const productSales = {};

      results.forEach(order => {
        const orderTotal = order.get("total") || 0;
        const orderDate = order.createdAt;
        totalRev += orderTotal;
        if (orderDate >= startOfMonth) monthRev += orderTotal;
        if (orderDate >= startOfToday) todayRev += orderTotal;
        (order.get("items") || []).forEach(item => {
          const cleanName = item.name.split(" (")[0]; 
          productSales[cleanName] = (productSales[cleanName] || 0) + item.quantity;
        });
      });

      const topProdArray = Object.keys(productSales).map(key => ({ name: key, qty: productSales[key] })).sort((a, b) => b.qty - a.qty).slice(0, 5);
      setStats({ totalRevenue: totalRev, monthRevenue: monthRev, todayRevenue: todayRev, totalOrders: results.length, topProducts: topProdArray });
    } catch (error) { console.error("Erro estatísticas: ", error); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderStatus(orderId);
    try {
      const query = new Parse.Query("Order");
      const orderToUpdate = await query.get(orderId);
      const oldStatus = orderToUpdate.get("status");

      if (newStatus === "Cancelado" && oldStatus !== "Cancelado") {
        const items = orderToUpdate.get("items") || [];
        const productsToUpdate = [];
        for (const item of items) {
          const productQuery = new Parse.Query("Product");
          try {
            const product = await productQuery.get(item.productId);
            product.increment("stock", item.quantity); 
            product.increment("salesCount", -item.quantity); 
            productsToUpdate.push(product);
          } catch (e) {
            console.log("Produto não encontrado:", item.productId);
          }
        }
        if (productsToUpdate.length > 0) { await Parse.Object.saveAll(productsToUpdate); }
      }

      orderToUpdate.set("status", newStatus);
      await orderToUpdate.save();
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? orderToUpdate : o));
      fetchProducts(); 
    } catch (error) { alert("Erro ao atualizar status: " + error.message); } 
    finally { setUpdatingOrderStatus(null); }
  };

  const sanitizeFilename = (filename) => {
    const ext = filename.includes('.') ? filename.split('.').pop() : 'file';
    return `midia_${Date.now()}.${ext}`;
  };

  const fetchProducts = async () => {
    try { setProducts(await new Parse.Query("Product").find()); } catch (error) { console.error(error); }
  };

  const fetchSettings = async () => {
    try {
      const results = await new Parse.Query("StoreSettings").find();
      if (results.length > 0) {
        const s = results[0];
        setSettingsId(s.id);
        
        // CARREGA O CARROSSEL (Se tiver, puxa. Se não, tenta o legado ou fallback)
        const savedBanners = s.get("banners");
        if (savedBanners && savedBanners.length > 0) {
          setBanners(savedBanners.map((b, i) => ({ ...b, id: `saved-${i}`, file: null, linkUrl: "" })));
        } else {
          // Fallback pra dados antigos se for a primeira vez
          setBanners([{
            id: "legacy",
            imageUrl: s.get("bannerImageUrl") || DEFAULT_CAROUSEL_IMG,
            tag: s.get("bannerTag") !== undefined ? s.get("bannerTag") : "Novidades",
            title: s.get("bannerTitle") !== undefined ? s.get("bannerTitle") : "Coleção Essência",
            desc: s.get("bannerDesc") !== undefined ? s.get("bannerDesc") : "",
            btn: s.get("bannerBtn") !== undefined ? s.get("bannerBtn") : "Descobrir Agora",
            target: s.get("bannerTarget") || "lancamentos",
            file: null,
            linkUrl: ""
          }]);
        }
        
        setInfoBannerActive(s.get("infoBannerActive") !== false);
        setInfoBannerTitle(s.get("infoBannerTitle") !== undefined ? s.get("infoBannerTitle") : "Coleção de Outono");
        setInfoBannerDesc(s.get("infoBannerDesc") !== undefined ? s.get("infoBannerDesc") : "Não perca nossa coleção exclusiva por tempo limitado.");
        setInfoBannerBtn(s.get("infoBannerBtn") !== undefined ? s.get("infoBannerBtn") : "Explorar");
        setCurrentInfoBannerUrl(s.get("infoBannerImageUrl") || DEFAULT_INFO_BANNER_IMG);
      }
    } catch (error) { console.error(error); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let product = editingId ? await new Parse.Query("Product").get(editingId) : new Parse.Object("Product");
      const variantsArray = variants.split(",").map(v => v.trim()).filter(Boolean);

      product.set("name", name); product.set("price", Number(price)); product.set("stock", Number(stock));
      product.set("category", category); product.set("variants", variantsArray); 

      if (discountPrice && discountEndsAt) { product.set("discountPrice", Number(discountPrice)); product.set("discountEndsAt", new Date(discountEndsAt)); } 
      else { product.unset("discountPrice"); product.unset("discountEndsAt"); }

      product.set("hasDetails", hasDetails);
      if (hasDetails) {
        product.set("description", description);
        if (detailsMediaFile) { const parseFile = new Parse.File(sanitizeFilename(detailsMediaFile.name), detailsMediaFile); await parseFile.save(); product.set("detailsMediaUrl", parseFile.url()); } 
        else if (linkDetailsMediaUrl.trim() !== "") { product.set("detailsMediaUrl", linkDetailsMediaUrl.trim()); } 
        else if (!currentDetailsMediaUrl) { product.unset("detailsMediaUrl"); } 
        else { product.set("detailsMediaUrl", currentDetailsMediaUrl); }
      } else { product.unset("description"); product.unset("detailsMediaUrl"); }

      if (imageFile) { const parseFile = new Parse.File(sanitizeFilename(imageFile.name), imageFile); await parseFile.save(); product.set("imageUrl", parseFile.url()); } 
      else if (linkImageUrl.trim() !== "") { product.set("imageUrl", linkImageUrl.trim()); } 
      else if (!currentImageUrl) { product.set("imageUrl", DEFAULT_PRODUCT_IMG); } 
      else { product.set("imageUrl", currentImageUrl); }

      await product.save();
      alert(editingId ? "Produto atualizado!" : "Produto cadastrado!");
      
      setName(""); setPrice(""); setStock(""); setCategory(""); setVariants(""); setDiscountPrice(""); setDiscountEndsAt("");
      setHasDetails(false); setDescription(""); setDetailsMediaFile(null); setCurrentDetailsMediaUrl(""); setLinkDetailsMediaUrl("");
      setImageFile(null); setCurrentImageUrl(""); setLinkImageUrl(""); setEditingId(null);
      if (document.getElementById("file-upload")) document.getElementById("file-upload").value = "";
      if (document.getElementById("media-upload")) document.getElementById("media-upload").value = "";
      fetchProducts();
    } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setLoading(false); }
  };

  const handleEditProduct = (product) => {
    setName(product.get("name")); setPrice(product.get("price")); setStock(product.get("stock") || 0);
    setCategory(product.get("category") || ""); setVariants((product.get("variants") || []).join(", ")); 
    setDiscountPrice(product.get("discountPrice") || "");
    const dEnd = product.get("discountEndsAt");
    if (dEnd) { const tzoffset = (new Date()).getTimezoneOffset() * 60000; setDiscountEndsAt((new Date(dEnd - tzoffset)).toISOString().slice(0, 16)); } 
    else { setDiscountEndsAt(""); }
    setHasDetails(product.get("hasDetails") || false); setDescription(product.get("description") || "");
    setCurrentDetailsMediaUrl(product.get("detailsMediaUrl") || ""); setDetailsMediaFile(null); setLinkDetailsMediaUrl(""); 
    setCurrentImageUrl(product.get("imageUrl")); setImageFile(null); setLinkImageUrl(""); 
    setEditingId(product.id); setActiveTab("products");
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Apagar este produto para sempre?")) return;
    try { await (await new Parse.Query("Product").get(id)).destroy(); fetchProducts(); } 
    catch (error) { alert("Erro ao deletar: " + error.message); }
  };

  // =========================================
  // FUNÇÕES DE GERENCIAMENTO DO CARROSSEL
  // =========================================
  const handleAddBanner = () => {
    setBanners([...banners, {
      id: Date.now().toString(),
      imageUrl: DEFAULT_CAROUSEL_IMG, tag: "Nova Tag", title: "Novo Banner", desc: "Descrição aqui...", btn: "Explorar", target: "lancamentos", file: null, linkUrl: ""
    }]);
  };

  const handleRemoveBanner = (idToRemove) => {
    if (banners.length <= 1) { alert("Você precisa ter pelo menos um banner ativo!"); return; }
    setBanners(banners.filter(b => b.id !== idToRemove));
  };

  const handleUpdateBanner = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleMoveBanner = (index, direction) => {
    const newBanners = [...banners];
    if (direction === "up" && index > 0) {
      [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    } else if (direction === "down" && index < newBanners.length - 1) {
      [newBanners[index + 1], newBanners[index]] = [newBanners[index], newBanners[index + 1]];
    }
    setBanners(newBanners);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      let settingsObj = settingsId ? await new Parse.Query("StoreSettings").get(settingsId) : new Parse.Object("StoreSettings");
      
      // PROCESSA E SALVA O ARRAY DE BANNERS (Fazendo upload das imagens novas se tiver)
      const finalBanners = [];
      for (const b of banners) {
        let finalImageUrl = b.imageUrl;
        if (b.file) {
          const parseFile = new Parse.File(sanitizeFilename(b.file.name), b.file);
          await parseFile.save();
          finalImageUrl = parseFile.url();
        } else if (b.linkUrl.trim() !== "") {
          finalImageUrl = b.linkUrl.trim();
        }
        
        finalBanners.push({
          imageUrl: finalImageUrl,
          tag: b.tag,
          title: b.title,
          desc: b.desc,
          btn: b.btn,
          target: b.target
        });
      }
      
      settingsObj.set("banners", finalBanners);

      // Salva Banner Informativo
      settingsObj.set("infoBannerActive", infoBannerActive);
      settingsObj.set("infoBannerTitle", infoBannerTitle);
      settingsObj.set("infoBannerDesc", infoBannerDesc);
      settingsObj.set("infoBannerBtn", infoBannerBtn);
      if (infoBannerFile) { const parseFile = new Parse.File(sanitizeFilename(infoBannerFile.name), infoBannerFile); await parseFile.save(); settingsObj.set("infoBannerImageUrl", parseFile.url()); setCurrentInfoBannerUrl(parseFile.url()); } 
      else if (linkInfoBannerUrl.trim() !== "") { settingsObj.set("infoBannerImageUrl", linkInfoBannerUrl.trim()); setCurrentInfoBannerUrl(linkInfoBannerUrl.trim()); } 
      else if (!currentInfoBannerUrl) { settingsObj.set("infoBannerImageUrl", DEFAULT_INFO_BANNER_IMG); setCurrentInfoBannerUrl(DEFAULT_INFO_BANNER_IMG); } 
      else { settingsObj.set("infoBannerImageUrl", currentInfoBannerUrl); }

      await settingsObj.save();
      
      // Recarrega os banners limpos do banco para tirar os arquivos pendentes
      setSettingsId(settingsObj.id);
      setBanners(finalBanners.map((b, i) => ({ ...b, id: `saved-${i}`, file: null, linkUrl: "" })));
      setLinkInfoBannerUrl(""); 
      
      alert("Configurações salvas! A vitrine foi atualizada.");
      if (document.getElementById("info-banner-upload")) document.getElementById("info-banner-upload").value = "";
    } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setSavingSettings(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-neutral-500 hover:text-neutral-900 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar para a Loja
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-neutral-100 bg-neutral-50 flex-wrap">
            <button onClick={() => setActiveTab("overview")} className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === "overview" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"}`}>📊 Visão Geral</button>
            <button onClick={() => setActiveTab("products")} className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === "products" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"}`}>📦 Gestão de Produtos</button>
            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-4 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === "settings" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"}`}>⚙️ Aparência da Loja</button>
          </div>

          <div className="p-6 md:p-10">
            {/* ABA 1: VISÃO GERAL */}
            {activeTab === "overview" && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Vendas Hoje</p><div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div></div><h3 className="text-3xl font-bold text-neutral-900">R$ {stats.todayRevenue.toFixed(2)}</h3></div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Vendas no Mês</p><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-5 h-5" /></div></div><h3 className="text-3xl font-bold text-neutral-900">R$ {stats.monthRevenue.toFixed(2)}</h3></div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total Histórico</p><div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg"><DollarSign className="w-5 h-5" /></div></div><h3 className="text-3xl font-bold text-neutral-900">R$ {stats.totalRevenue.toFixed(2)}</h3></div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Total de Pedidos</p><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Package className="w-5 h-5" /></div></div><h3 className="text-3xl font-bold text-neutral-900">{stats.totalOrders}</h3></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-neutral-400" /> Histórico Recente</h3>
                    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead><tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500"><th className="p-4 font-medium">Data</th><th className="p-4 font-medium">Cliente</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Status do Pedido</th></tr></thead>
                          <tbody className="divide-y divide-neutral-100">
                            {orders.slice(0, 10).map((order) => {
                              const user = order.get("user");
                              let statusColor = "bg-neutral-100 text-neutral-700 border-neutral-200";
                              const currentStatus = order.get("status") || "Pagamento Aprovado";
                              if (currentStatus === "Aguardando PIX") statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                              if (currentStatus === "Aguardando Entrega") statusColor = "bg-orange-50 text-orange-700 border-orange-200";
                              if (currentStatus === "Pagamento Aprovado") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                              if (currentStatus === "Preparando Envio") statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                              if (currentStatus === "Enviado") statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                              if (currentStatus === "Entregue") statusColor = "bg-green-50 text-green-700 border-green-200";
                              if (currentStatus === "Cancelado") statusColor = "bg-red-50 text-red-700 border-red-200";
                              return (
                                <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                                  <td className="p-4 text-sm text-neutral-600 whitespace-nowrap">{order.createdAt.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="p-4 text-sm font-medium text-neutral-900">{user ? (user.get("name") || user.get("email") || "Cliente") : "Desconhecido"}</td>
                                  <td className="p-4 text-sm font-bold text-neutral-900">R$ {order.get("total").toFixed(2)}</td>
                                  <td className="p-4">
                                    <div className="relative inline-block">
                                      <select value={currentStatus} onChange={(e) => handleStatusChange(order.id, e.target.value)} disabled={updatingOrderStatus === order.id} className={`appearance-none outline-none text-xs font-bold uppercase tracking-wider px-4 py-2 pr-8 rounded-full border cursor-pointer transition-all focus:ring-2 focus:ring-neutral-900 disabled:opacity-50 ${statusColor}`}>
                                        <option value="Aguardando PIX">Aguardando PIX</option><option value="Aguardando Entrega">Aguardando Entrega</option><option value="Pagamento Aprovado">Pagamento Aprovado</option><option value="Preparando Envio">Preparando Envio</option><option value="Enviado">Enviado</option><option value="Entregue">Entregue</option><option value="Cancelado">Cancelado</option>
                                      </select>
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-current opacity-70">
                                        {updatingOrderStatus === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {orders.length === 0 && (<tr><td colSpan="4" className="p-8 text-center text-neutral-500">Nenhum pedido recebido ainda.</td></tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-neutral-400" /> Mais Vendidos</h3>
                    <div className="bg-neutral-900 rounded-2xl p-6 shadow-sm text-white">
                      <div className="space-y-5">
                        {stats.topProducts.map((prod, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${index === 0 ? "bg-yellow-400 text-yellow-900" : index === 1 ? "bg-neutral-300 text-neutral-800" : index === 2 ? "bg-amber-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>{index + 1}º</div>
                              <p className="font-medium truncate text-neutral-200">{prod.name}</p>
                            </div>
                            <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg shrink-0">{prod.qty} unid.</span>
                          </div>
                        ))}
                        {stats.topProducts.length === 0 && (<p className="text-neutral-400 text-center py-4 text-sm">Sem dados de vendas ainda.</p>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: PRODUTOS */}
            {activeTab === "products" && (
              <div className="animate-in fade-in duration-500 max-w-4xl">
                <h2 className="text-2xl font-semibold mb-6">{editingId ? "✏️ Editar Produto" : "📦 Cadastrar Novo Produto"}</h2>
                <form onSubmit={handleSaveProduct} className="flex flex-col gap-6 mb-12 bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Nome do Produto</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                    <div className="w-32"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Preço Normal</label><input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                    <div className="w-32"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Estoque</label><input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                  </div>
                  <div className="flex flex-wrap gap-4 p-4 border border-red-100 bg-red-50/50 rounded-lg">
                    <div className="w-full"><span className="text-xs font-bold text-red-500 uppercase">⚡ Oferta Relâmpago (Opcional)</span></div>
                    <div className="w-40"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Preço c/ Desconto</label><input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Ex: 49.90" /></div>
                    <div className="flex-1 min-w-[200px]"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Promoção válida até</label><input type="datetime-local" value={discountEndsAt} onChange={(e) => setDiscountEndsAt(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
                  </div>
                  <div className="flex flex-col gap-4 p-4 border border-blue-100 bg-blue-50/50 rounded-lg transition-all">
                    <div className="flex items-center gap-3"><input type="checkbox" id="hasDetails" checked={hasDetails} onChange={(e) => setHasDetails(e.target.checked)} className="w-5 h-5 text-blue-600 rounded cursor-pointer" /><label htmlFor="hasDetails" className="text-sm font-bold text-blue-800 cursor-pointer uppercase tracking-wider">✨ Ativar Página de Detalhes Exclusiva (Pop-up)</label></div>
                    {hasDetails && (
                      <div className="grid grid-cols-1 gap-4 mt-2">
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Descrição Longa</label><textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte a história do produto..." className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" /></div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Mídia Destaque (Foto/Vídeo)</label>
                          <div className="flex flex-col gap-2 p-3 bg-white border border-blue-200 rounded-lg">
                            <input id="media-upload" type="file" accept="video/mp4,video/webm,image/*" onChange={(e) => {setDetailsMediaFile(e.target.files[0]); setLinkDetailsMediaUrl("");}} className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-100"></div><span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">OU COLOQUE O LINK</span><div className="flex-1 h-px bg-neutral-100"></div></div>
                            <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LinkIcon className="w-4 h-4 text-neutral-400" /></div><input type="url" placeholder="https://exemplo.com/video.mp4" value={linkDetailsMediaUrl} onChange={(e) => {setLinkDetailsMediaUrl(e.target.value); setDetailsMediaFile(null); if (document.getElementById("media-upload")) document.getElementById("media-upload").value = "";}} className="w-full pl-10 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                          </div>
                          {currentDetailsMediaUrl && !detailsMediaFile && !linkDetailsMediaUrl && (<button type="button" onClick={() => setCurrentDetailsMediaUrl("")} className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Remover mídia atual</button>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-48"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Categoria</label><input type="text" placeholder="Ex: Sapatos" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                    <div className="flex-1 min-w-[250px]"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Modelos / Cores</label><input type="text" placeholder="Ex: Preta, Azul (separado por vírgula)" value={variants} onChange={(e) => setVariants(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                  </div>
                  <div className="flex flex-col md:flex-row items-end gap-4 mt-2">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Foto Principal da Vitrine</label>
                      <div className="flex flex-col gap-2 p-3 bg-white border border-neutral-200 rounded-lg">
                        <input id="file-upload" type="file" accept="image/*" onChange={(e) => {setImageFile(e.target.files[0]); setCurrentImageUrl(""); setLinkImageUrl("");}} className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200" />
                        <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-100"></div><span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">OU COLOQUE O LINK</span><div className="flex-1 h-px bg-neutral-100"></div></div>
                        <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LinkIcon className="w-4 h-4 text-neutral-400" /></div><input type="url" placeholder="https://exemplo.com/foto.jpg" value={linkImageUrl} onChange={(e) => {setLinkImageUrl(e.target.value); setImageFile(null); if (document.getElementById("file-upload")) document.getElementById("file-upload").value = "";}} className="w-full pl-10 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                      </div>
                      {currentImageUrl && currentImageUrl !== DEFAULT_PRODUCT_IMG && !imageFile && !linkImageUrl && (<button type="button" onClick={() => setCurrentImageUrl("")} className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3" /> Remover foto atual</button>)}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {editingId && (<button type="button" onClick={() => { setEditingId(null); setCurrentImageUrl(""); setLinkImageUrl(""); setCategory(""); setVariants(""); setDiscountPrice(""); setDiscountEndsAt(""); setHasDetails(false); setDescription(""); setDetailsMediaFile(null); setLinkDetailsMediaUrl(""); setCurrentDetailsMediaUrl(""); if(document.getElementById("file-upload")) document.getElementById("file-upload").value = ""; if (document.getElementById("media-upload")) document.getElementById("media-upload").value = ""; }} className="flex-1 md:flex-none px-6 py-2 h-[50px] bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition">Cancelar</button>)}
                      <button disabled={loading} type="submit" className="flex-1 md:flex-none px-8 py-2 h-[50px] bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition shadow-md">{loading ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}</button>
                    </div>
                  </div>
                </form>

                <h3 className="text-xl font-medium mb-4">Estoque Atual</h3>
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  {products.map((p) => {
                    const pVariants = p.get("variants") || [];
                    const dp = p.get("discountPrice");
                    const isPromoActive = dp && p.get("discountEndsAt") && new Date() < p.get("discountEndsAt");
                    return (
                      <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                        <div className="flex items-center gap-4">
                          <img src={p.get("imageUrl")} alt={p.get("name")} className="w-16 h-16 object-cover rounded-lg border border-neutral-200 shadow-sm" />
                          <div>
                            <p className="font-medium text-lg text-neutral-900 flex items-center gap-2 flex-wrap">
                              {p.get("name")}
                              {isPromoActive && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Oferta</span>}
                              {p.get("hasDetails") && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Premium</span>}
                            </p>
                            <div className="text-neutral-500 text-sm flex items-center gap-2">
                              {isPromoActive ? (<><span className="line-through text-neutral-300">R$ {p.get("price").toFixed(2)}</span><span className="text-red-500 font-bold">R$ {dp.toFixed(2)}</span></>) : (<span>R$ {p.get("price")?.toFixed(2)}</span>)}
                              <span className="text-neutral-300">•</span> <span className={p.get("stock") > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{p.get("stock")} em estoque</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditProduct(p)} className="px-4 py-2 text-sm bg-white border border-neutral-200 hover:bg-neutral-100 rounded-md font-medium transition shadow-sm">Editar</button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="px-4 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium transition">Excluir</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 3: CONFIGURAÇÕES */}
            {activeTab === "settings" && (
              <div className="max-w-4xl animate-in fade-in duration-500 pb-20">
                <form onSubmit={handleSaveSettings} className="space-y-16">
                  
                  {/* --- SESSÃO 1: GERENCIADOR DE CARROSSEL PRINCIPAL --- */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-neutral-400" /> Carrossel Principal</h2>
                        <p className="text-neutral-500 text-sm">Adicione quantos banners quiser. Se deixar apenas um, o carrossel fica parado.</p>
                      </div>
                      <button type="button" onClick={handleAddBanner} className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Banner
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {banners.map((banner, index) => (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Preview Visual (AGORA ATUALIZA EM TEMPO REAL COM O LINK) */}
                            <div className="w-full h-48 lg:h-full rounded-xl overflow-hidden relative shadow-inner border border-neutral-200 bg-neutral-900">
                              <img 
                                src={banner.file ? URL.createObjectURL(banner.file) : (banner.linkUrl || banner.imageUrl)} 
                                alt="Preview" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                                onError={(e) => { e.target.src = DEFAULT_CAROUSEL_IMG; }} // Se o link for inválido, não quebra a tela
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-white/80 uppercase tracking-widest text-[10px] font-medium mb-1 drop-shadow-sm">{banner.tag || "TAG AQUI"}</span>
                                <h3 className="text-2xl font-serif italic text-white mb-2 drop-shadow-md">{banner.title || "TÍTULO AQUI"}</h3>
                                {banner.btn && <button type="button" className="px-4 py-1.5 bg-white text-neutral-900 text-xs font-bold rounded-full shadow-md">{banner.btn}</button>}
                              </div>
                            </div>
                            
                            {/* Campos de Edição */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Pequena Tag Superior</label><input type="text" value={banner.tag || ""} onChange={(e) => handleUpdateBanner(banner.id, "tag", e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm" placeholder="Ex: Verão 2026" /></div>
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Título Grande Principal</label><input type="text" value={banner.title || ""} onChange={(e) => handleUpdateBanner(banner.id, "title", e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm" placeholder="Ex: Nova Coleção" /></div>
                              </div>
                              
                              <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Breve Descrição</label><textarea rows="2" value={banner.desc || ""} onChange={(e) => handleUpdateBanner(banner.id, "desc", e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none resize-none text-sm" placeholder="Ex: As peças mais quentes da estação..." /></div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto do Botão</label><input type="text" value={banner.btn || ""} onChange={(e) => handleUpdateBanner(banner.id, "btn", e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm" placeholder="Ex: Ver Ofertas" /></div>
                                <div>
                                  <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Ao Clicar, rolar para...</label>
                                  <select value={banner.target || "lancamentos"} onChange={(e) => handleUpdateBanner(banner.id, "target", e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm bg-white">
                                    <option value="lancamentos">Lançamentos</option>
                                    <option value="ofertas">Ofertas Limitadas</option>
                                    <option value="mais-desejados">Mais Desejados</option>
                                    <option value="catalogo">Catálogo Completo (Categorias)</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* INPUT DE FOTO/LINK CORRIGIDO DEFINITIVAMENTE */}
                              <div>
                                <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Imagem de Fundo (Foto HD)</label>
                                <div className="flex flex-col gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                                  
                                  {/* UPLOAD DE ARQUIVO */}
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => { 
                                      const file = e.target.files[0];
                                      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, file: file, linkUrl: "" } : b)); 
                                    }} 
                                    className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-neutral-700 hover:file:bg-neutral-100 text-xs" 
                                  />
                                  
                                  <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-200"></div><span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">OU COLOQUE O LINK</span><div className="flex-1 h-px bg-neutral-200"></div></div>
                                  
                                  {/* COLAR O LINK */}
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                      <LinkIcon className="w-3 h-3 text-neutral-400" />
                                    </div>
                                    <input 
                                      type="url" 
                                      placeholder="https://exemplo.com/foto.jpg" 
                                      value={banner.linkUrl || ""} 
                                      onChange={(e) => { 
                                        const text = e.target.value;
                                        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, linkUrl: text, file: null } : b)); 
                                      }} 
                                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:ring-1 focus:ring-neutral-900 focus:outline-none" 
                                    />
                                  </div>

                                </div>
                              </div>

                            </div>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* --- SESSÃO 2: BANNER INFORMATIVO (SECUNDÁRIO) --- */}
                  <div className="pt-10 border-t border-neutral-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2"><ImageIcon className="w-6 h-6 text-neutral-400" /> Banner Secundário</h2>
                        <p className="text-neutral-500 text-sm">Aparece no meio da loja para informar campanhas, coleções ou frete.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input type="checkbox" className="sr-only peer" checked={infoBannerActive} onChange={(e) => setInfoBannerActive(e.target.checked)} />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
                        <span className="ml-3 text-sm font-bold text-neutral-900 uppercase">Ativado</span>
                      </label>
                    </div>
                    
                    <div className={`transition-opacity duration-300 mt-6 ${!infoBannerActive && "opacity-40 pointer-events-none"}`}>
                      <div className="w-full h-32 rounded-xl overflow-hidden relative shadow-sm border border-neutral-200 bg-neutral-900 mb-6">
                        {currentInfoBannerUrl && <img src={infoBannerFile ? URL.createObjectURL(infoBannerFile) : currentInfoBannerUrl} alt="Preview Info" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                          <h3 className="text-xl font-serif italic text-white mb-1">{infoBannerTitle}</h3>
                          <p className="text-[10px] text-white/80">{infoBannerDesc}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Título Principal</label><input type="text" value={infoBannerTitle} onChange={(e) => setInfoBannerTitle(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto Menor</label><input type="text" value={infoBannerDesc} onChange={(e) => setInfoBannerDesc(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto do Botão (Opcional - deixe vazio para tirar)</label><input type="text" value={infoBannerBtn} onChange={(e) => setInfoBannerBtn(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none" placeholder="Ex: Ver Coleção" /></div>
                        
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Imagem de Fundo</label>
                          <div className="flex flex-col gap-2 p-3 bg-white border border-neutral-200 rounded-xl">
                            <input id="info-banner-upload" type="file" accept="image/*" onChange={(e) => {setInfoBannerFile(e.target.files[0]); setCurrentInfoBannerUrl(""); setLinkInfoBannerUrl("");}} className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200" />
                            <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-100"></div><span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">OU COLOQUE O LINK</span><div className="flex-1 h-px bg-neutral-100"></div></div>
                            <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LinkIcon className="w-4 h-4 text-neutral-400" /></div><input type="url" placeholder="https://exemplo.com/banner-outono.jpg" value={linkInfoBannerUrl} onChange={(e) => {setLinkInfoBannerUrl(e.target.value); setInfoBannerFile(null); if (document.getElementById("info-banner-upload")) document.getElementById("info-banner-upload").value = "";}} className="w-full pl-10 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-neutral-900 focus:outline-none" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTÃO FIXO DE SALVAR */}
                  <div className="fixed bottom-8 right-8 z-50">
                    <button type="submit" disabled={savingSettings} className="px-8 py-4 bg-neutral-900 text-white font-bold rounded-full hover:scale-105 transition-all shadow-2xl shadow-neutral-900/30 flex items-center gap-3">
                      {savingSettings ? <><Loader2 className="w-5 h-5 animate-spin" /> Atualizando Site...</> : "💾 Salvar Configurações do Site"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}