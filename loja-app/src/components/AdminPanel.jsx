import React, { useState, useEffect } from "react";
import Parse from "../parseSetup";
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Package, Calendar, Clock, ShoppingBag, Trash2, Link as LinkIcon, Image as ImageIcon, Plus, Wallet, BarChart, Activity, X } from "lucide-react";

const DEFAULT_PRODUCT_IMG = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop";
const DEFAULT_INFO_BANNER_IMG = "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop";
const DEFAULT_CAROUSEL_IMG = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";

export default function AdminPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ grossRevenue: 0, netRevenue: 0, monthRevenue: 0, todayRevenue: 0, totalOrders: 0, ticketMedio: 0, topProducts: [], chartData: Array(7).fill({label: '', total: 0}), chartMax: 1 });
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(null);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  
  // ESTADOS PARA MULTI-CATEGORIAS
  const [selectedCategories, setSelectedCategories] = useState([]); 
  const [categoryInput, setCategoryInput] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // ESTADOS PARA VARIANTES
  const [variantsList, setVariantsList] = useState([]); 
  const [variantInput, setVariantInput] = useState("");

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

  // ESTADOS DO CARROSSEL E SETTINGS
  const [settingsId, setSettingsId] = useState(null);
  const [banners, setBanners] = useState([]);
  const [infoBannerActive, setInfoBannerActive] = useState(true);
  const [infoBannerTitle, setInfoBannerTitle] = useState("");
  const [infoBannerDesc, setInfoBannerDesc] = useState("");
  const [infoBannerBtn, setInfoBannerBtn] = useState("");
  const [infoBannerFile, setInfoBannerFile] = useState(null);
  const [currentInfoBannerUrl, setCurrentInfoBannerUrl] = useState(DEFAULT_INFO_BANNER_IMG);
  const [linkInfoBannerUrl, setLinkInfoBannerUrl] = useState(""); 
  const [savingSettings, setSavingSettings] = useState(false);

  const availableCategories = [...new Set(products.flatMap(p => p.get("categories") || [p.get("category")]).filter(Boolean))];

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchOrdersAndStats();
  }, []);

  const fetchOrdersAndStats = async () => {
    const query = new Parse.Query("Order");
    query.descending("createdAt").limit(1000).include("user");
    try {
      const results = await query.find();
      setOrders(results);
      let grossTotal = 0, netTotal = 0, monthRev = 0, todayRev = 0, validOrdersCount = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const productSales = {};
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
        return { date: d, label: d.toLocaleDateString('pt-BR', {weekday: 'short'}), total: 0 };
      });

      results.forEach(order => {
        const status = order.get("status");
        if (status === "Cancelado") return;
        const orderTotal = order.get("total") || 0;
        const orderDate = order.createdAt;
        grossTotal += orderTotal; validOrdersCount++;
        if (["Pagamento Aprovado", "Preparando Envio", "Enviado", "Entregue"].includes(status)) netTotal += orderTotal;
        if (orderDate >= startOfMonth) monthRev += orderTotal;
        if (orderDate >= startOfToday) todayRev += orderTotal;
        const dZero = new Date(orderDate); dZero.setHours(0,0,0,0);
        const chartDay = last7Days.find(d => d.date.getTime() === dZero.getTime());
        if (chartDay) chartDay.total += orderTotal;
        (order.get("items") || []).forEach(item => {
          const cleanName = item.name.split(" (")[0];
          productSales[cleanName] = (productSales[cleanName] || 0) + item.quantity;
        });
      });
      const topProdArray = Object.keys(productSales).map(key => ({ name: key, qty: productSales[key] })).sort((a, b) => b.qty - a.qty).slice(0, 5);
      setStats({ grossRevenue: grossTotal, netRevenue: netTotal, monthRevenue: monthRev, todayRevenue: todayRev, totalOrders: validOrdersCount, ticketMedio: validOrdersCount > 0 ? grossTotal / validOrdersCount : 0, topProducts: topProdArray, chartData: last7Days, chartMax: Math.max(...last7Days.map(d => d.total), 1) });
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderStatus(orderId);
    try {
      const order = await new Parse.Query("Order").get(orderId);
      const oldStatus = order.get("status");

      if (newStatus === "Cancelado" && oldStatus !== "Cancelado") {
        const items = order.get("items") || [];
        const productsToUpdate = [];
        for (const item of items) {
          try {
            const p = await new Parse.Query("Product").get(item.productId);
            p.increment("stock", item.quantity); p.increment("salesCount", -item.quantity); 
            productsToUpdate.push(p);
          } catch (e) { console.log(e); }
        }
        if (productsToUpdate.length > 0) await Parse.Object.saveAll(productsToUpdate);
      }

      order.set("status", newStatus);
      await order.save();
      fetchOrdersAndStats();
      fetchProducts();
    } catch (e) { alert(e.message); } finally { setUpdatingOrderStatus(null); }
  };

  const fetchProducts = async () => {
    try { setProducts(await new Parse.Query("Product").find()); } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await new Parse.Query("StoreSettings").find();
      if (res.length > 0) {
        const s = res[0]; setSettingsId(s.id);
        setBanners(s.get("banners")?.map((b, i) => ({ ...b, id: `b-${i}`, file: null, linkUrl: "" })) || []);
        setInfoBannerActive(s.get("infoBannerActive") !== false);
        setInfoBannerTitle(s.get("infoBannerTitle") || "");
        setInfoBannerDesc(s.get("infoBannerDesc") || "");
        setInfoBannerBtn(s.get("infoBannerBtn") || "");
        setCurrentInfoBannerUrl(s.get("infoBannerImageUrl") || DEFAULT_INFO_BANNER_IMG);
      }
    } catch (e) { console.error(e); }
  };

  const handleAddCategoryTag = (val) => {
    if (val?.trim() && !selectedCategories.includes(val.trim())) setSelectedCategories([...selectedCategories, val.trim()]);
    setCategoryInput(""); setIsAddingNewCategory(false);
  };

  const handleAddVariantTag = () => {
    if (variantInput.trim() && !variantsList.includes(variantInput.trim())) setVariantsList([...variantsList, variantInput.trim()]);
    setVariantInput("");
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (selectedCategories.length === 0) return alert("Selecione pelo menos uma categoria!");
    setLoading(true);
    try {
      let p = editingId ? await new Parse.Query("Product").get(editingId) : new Parse.Object("Product");
      p.set("name", name); p.set("price", Number(price)); p.set("stock", Number(stock));
      p.set("categories", selectedCategories); p.set("category", selectedCategories[0]);
      p.set("variants", variantsList); p.set("hasDetails", hasDetails);

      if (discountPrice && discountEndsAt) { p.set("discountPrice", Number(discountPrice)); p.set("discountEndsAt", new Date(discountEndsAt)); }
      else { p.unset("discountPrice"); p.unset("discountEndsAt"); }

      if (hasDetails) {
        p.set("description", description);
        if (detailsMediaFile) { const f = new Parse.File("media", detailsMediaFile); await f.save(); p.set("detailsMediaUrl", f.url()); }
        else if (linkDetailsMediaUrl.trim()) p.set("detailsMediaUrl", linkDetailsMediaUrl.trim());
      }
      if (imageFile) { const f = new Parse.File("img", imageFile); await f.save(); p.set("imageUrl", f.url()); }
      else if (linkImageUrl.trim()) p.set("imageUrl", linkImageUrl.trim());
      else if (!editingId) p.set("imageUrl", DEFAULT_PRODUCT_IMG);

      await p.save(); alert("Produto salvo com sucesso!"); resetForm(); fetchProducts();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const resetForm = () => {
    setName(""); setPrice(""); setStock(""); setSelectedCategories([]); setVariantsList([]); setVariantInput("");
    setDiscountPrice(""); setDiscountEndsAt(""); setHasDetails(false); setDescription(""); setDetailsMediaFile(null);
    setLinkDetailsMediaUrl(""); setImageFile(null); setLinkImageUrl(""); setEditingId(null);
  };

  const handleEditProduct = (p) => {
    setName(p.get("name")); setPrice(p.get("price")); setStock(p.get("stock") || 0);
    setSelectedCategories(p.get("categories") || [p.get("category")].filter(Boolean));
    setVariantsList(p.get("variants") || []); setDiscountPrice(p.get("discountPrice") || "");
    const d = p.get("discountEndsAt");
    if (d) { const off = new Date().getTimezoneOffset() * 60000; setDiscountEndsAt(new Date(d - off).toISOString().slice(0, 16)); }
    setHasDetails(p.get("hasDetails") || false); setDescription(p.get("description") || "");
    setCurrentImageUrl(p.get("imageUrl")); setEditingId(p.id); setActiveTab("products");
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Tem certeza que deseja apagar este produto para sempre?")) return;
    try { await (await new Parse.Query("Product").get(id)).destroy(); fetchProducts(); } catch (error) { alert(error.message); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault(); setSavingSettings(true);
    try {
      let s = settingsId ? await new Parse.Query("StoreSettings").get(settingsId) : new Parse.Object("StoreSettings");
      const finalBanners = [];
      for (const b of banners) {
        let url = b.imageUrl;
        if (b.file) { const f = new Parse.File("banner", b.file); await f.save(); url = f.url(); }
        else if (b.linkUrl?.trim()) url = b.linkUrl.trim();
        finalBanners.push({ imageUrl: url, tag: b.tag, title: b.title, desc: b.desc, btn: b.btn, target: b.target });
      }
      s.set("banners", finalBanners);
      s.set("infoBannerActive", infoBannerActive); s.set("infoBannerTitle", infoBannerTitle);
      s.set("infoBannerDesc", infoBannerDesc); s.set("infoBannerBtn", infoBannerBtn);
      if (infoBannerFile) { const f = new Parse.File("info", infoBannerFile); await f.save(); s.set("infoBannerImageUrl", f.url()); }
      else if (linkInfoBannerUrl.trim()) s.set("infoBannerImageUrl", linkInfoBannerUrl.trim());
      await s.save(); alert("Aparência da loja atualizada!"); fetchSettings();
    } catch (err) { alert(err.message); } finally { setSavingSettings(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-[1400px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-6 text-neutral-500 hover:text-neutral-900 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar para a Loja
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-neutral-100 bg-neutral-50 flex-wrap">
            <button onClick={() => setActiveTab("overview")} className={`flex-1 py-4 px-4 font-medium transition-colors ${activeTab === "overview" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:bg-white/50"}`}>📊 Visão Geral</button>
            <button onClick={() => setActiveTab("products")} className={`flex-1 py-4 px-4 font-medium transition-colors ${activeTab === "products" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:bg-white/50"}`}>📦 Gestão de Produtos</button>
            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-4 px-4 font-medium transition-colors ${activeTab === "settings" ? "text-neutral-900 bg-white border-b-2 border-neutral-900" : "text-neutral-500 hover:bg-white/50"}`}>⚙️ Aparência da Loja</button>
          </div>

          <div className="p-6 md:p-10">
            {/* ABA 1: VISÃO GERAL */}
            {activeTab === "overview" && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Vendas Hoje</p><div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div></div>
                    <h3 className="text-3xl font-bold text-neutral-900">R$ {stats.todayRevenue.toFixed(2)}</h3>
                    <p className="text-xs text-neutral-400 mt-2">Faturamento de pedidos válidos do dia</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Vendas no Mês</p><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-5 h-5" /></div></div>
                    <h3 className="text-3xl font-bold text-neutral-900">R$ {stats.monthRevenue.toFixed(2)}</h3>
                    <p className="text-xs text-neutral-400 mt-2">Faturamento total do mês atual</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Fat. Bruto (Previsto)</p><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BarChart className="w-5 h-5" /></div></div>
                    <h3 className="text-3xl font-bold text-neutral-900">R$ {stats.grossRevenue.toFixed(2)}</h3>
                    <p className="text-xs text-neutral-400 mt-2">Inclui pendentes (Aguardando PIX)</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10"><p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Em Caixa (Garantido)</p><div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Wallet className="w-5 h-5" /></div></div>
                    <h3 className="text-3xl font-bold text-emerald-600 relative z-10">R$ {stats.netRevenue.toFixed(2)}</h3>
                    <p className="text-xs text-neutral-400 mt-2 relative z-10">Apenas pagamentos já aprovados</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold mb-8 flex items-center gap-2"><Activity className="w-5 h-5 text-neutral-400" /> Desempenho (Últimos 7 dias)</h3>
                    <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto pb-2">
                      {stats.chartData.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3 flex-1 group h-full justify-end">
                          <div className="relative w-full max-w-[40px] bg-neutral-50 rounded-t-lg h-full flex items-end border-b border-neutral-200">
                            <div className="w-full bg-neutral-900 rounded-t-lg transition-all duration-700 ease-out group-hover:bg-neutral-700" style={{ height: `${(day.total / stats.chartMax) * 100}%`, minHeight: day.total > 0 ? '4px' : '0px' }}></div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">R$ {day.total.toFixed(2)}</div>
                          </div>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-neutral-400" /> Mais Vendidos</h3>
                    <div className="bg-neutral-900 rounded-2xl p-6 shadow-sm text-white h-full max-h-[300px]">
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
                        {stats.topProducts.length === 0 && <p className="text-neutral-400 text-center py-4 text-sm">Sem dados de vendas.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-neutral-400" /> Histórico Recente</h3>
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500"><th className="p-4 font-medium">Data</th><th className="p-4 font-medium">Cliente</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Status do Pedido</th></tr></thead>
                        <tbody className="divide-y divide-neutral-100">
                          {orders.slice(0, 20).map((order) => {
                            const user = order.get("user");
                            let statusColor = "bg-neutral-100 text-neutral-700 border-neutral-200";
                            const currentStatus = order.get("status") || "Pagamento Aprovado";
                            if (currentStatus === "Aguardando PIX") statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                            if (currentStatus === "Aguardando Entrega") statusColor = "bg-orange-50 text-orange-700 border-orange-200";
                            if (currentStatus === "Pagamento Aprovado") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            if (currentStatus === "Preparando Envio") statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                            if (currentStatus === "Enviado") statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                            if (currentStatus === "Entregue") statusColor = "bg-green-50 text-green-700 border-green-200";
                            if (currentStatus === "Cancelado") statusColor = "bg-red-50 text-red-700 border-red-200 opacity-60";
                            return (
                              <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                                <td className="p-4 text-sm text-neutral-600 whitespace-nowrap">{order.createdAt.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-4 text-sm font-medium text-neutral-900">{user ? (user.get("name") || user.get("email") || "Cliente") : "Desconhecido"}</td>
                                <td className={`p-4 text-sm font-bold ${currentStatus === "Cancelado" ? "text-neutral-400 line-through" : "text-neutral-900"}`}>R$ {order.get("total").toFixed(2)}</td>
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
              </div>
            )}

            {/* ABA 2: PRODUTOS */}
            {activeTab === "products" && (
              <div className="animate-in fade-in duration-500 max-w-4xl">
                <h2 className="text-2xl font-semibold mb-6">{editingId ? "✏️ Editar Produto" : "📦 Cadastrar Novo Produto"}</h2>
                <form onSubmit={handleSaveProduct} className="flex flex-col gap-6 bg-neutral-50 p-6 rounded-xl border border-neutral-100 mb-10">
                  
                  {/* DADOS BÁSICOS */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Nome do Produto</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                    <div className="w-32"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Preço R$</label><input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                    <div className="w-32"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Estoque</label><input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                  </div>

                  {/* USABILIDADE PADRONIZADA: CATEGORIAS E VARIANTES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    
                    {/* CATEGORIAS (ESTILO TAGS) */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Categorias</label>
                      <div className="flex flex-col gap-2">
                        
                        {/* INPUTS DE CATEGORIA */}
                        <div className="flex items-center gap-2">
                          {isAddingNewCategory ? (
                            <input 
                              type="text" 
                              placeholder="Nova categoria..." 
                              value={categoryInput} 
                              autoFocus 
                              onChange={(e) => setCategoryInput(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategoryTag(categoryInput))} 
                              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" 
                            />
                          ) : (
                            <select 
                              value="" 
                              onChange={(e) => handleAddCategoryTag(e.target.value)} 
                              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none bg-white"
                            >
                              <option value="">Selecione...</option>
                              {availableCategories.filter(c => !selectedCategories.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                          <button 
                            type="button" 
                            onClick={() => setIsAddingNewCategory(!isAddingNewCategory)} 
                            className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                          >
                            {isAddingNewCategory ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        {/* TAGS DE CATEGORIA COM BOTÃO DE EXCLUIR CORRIGIDO */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedCategories.map(c => (
                            <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                              {c} 
                              <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setSelectedCategories(prev => prev.filter(x => x !== c)); }} 
                                className="hover:text-red-400 ml-1 focus:outline-none"
                              >
                                <X className="w-3 h-3 pointer-events-none" />
                              </button>
                            </span>
                          ))}
                        </div>

                      </div>
                    </div>

                    {/* CORES OU MODELOS (ESTILO TAGS) */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Cores ou Modelos (Opcional)</label>
                      <div className="flex flex-col gap-2">
                        
                        {/* INPUT DE VARIANTE */}
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Azul, P, etc..." 
                            value={variantInput} 
                            onChange={(e) => setVariantInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVariantTag())} 
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" 
                          />
                          <button 
                            type="button" 
                            onClick={handleAddVariantTag} 
                            className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* TAGS DE VARIANTE COM BOTÃO DE EXCLUIR CORRIGIDO */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {variantsList.map(v => (
                            <span key={v} className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                              {v} 
                              <button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setVariantsList(prev => prev.filter(x => x !== v)); }} 
                                className="hover:text-red-400 ml-1 focus:outline-none"
                              >
                                <X className="w-3 h-3 pointer-events-none" />
                              </button>
                            </span>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* OFERTA RELÂMPAGO */}
                  <div className="flex flex-wrap gap-4 p-4 border border-red-100 bg-red-50/50 rounded-lg">
                    <div className="w-full"><span className="text-xs font-bold text-red-500 uppercase">⚡ Oferta Relâmpago (Opcional)</span></div>
                    <div className="w-40"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Preço c/ Desconto</label><input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Ex: 49.90" /></div>
                    <div className="flex-1 min-w-[200px]"><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Válido até</label><input type="datetime-local" value={discountEndsAt} onChange={(e) => setDiscountEndsAt(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" /></div>
                  </div>

                  {/* PREMIUM POPUP */}
                  <div className="flex flex-col gap-4 p-4 border border-blue-100 bg-blue-50/50 rounded-lg transition-all">
                    <div className="flex items-center gap-3"><input type="checkbox" id="hasDetails" checked={hasDetails} onChange={(e) => setHasDetails(e.target.checked)} className="w-5 h-5 text-blue-600 rounded cursor-pointer" /><label htmlFor="hasDetails" className="text-sm font-bold text-blue-800 cursor-pointer uppercase tracking-wider">✨ Ativar Página de Detalhes Exclusiva</label></div>
                    {hasDetails && (
                      <div className="grid grid-cols-1 gap-4 mt-2">
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Descrição Longa</label><textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte a história do produto..." className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Mídia Destaque (Foto/Vídeo)</label>
                          <div className="flex flex-col gap-2 p-3 bg-white border border-blue-200 rounded-lg">
                            <input type="file" accept="video/mp4,video/webm,image/*" onChange={(e) => {setDetailsMediaFile(e.target.files[0]); setLinkDetailsMediaUrl("");}} className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-100"></div><span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">OU LINK</span><div className="flex-1 h-px bg-neutral-100"></div></div>
                            <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LinkIcon className="w-4 h-4 text-neutral-400" /></div><input type="url" placeholder="https://exemplo.com/video.mp4" value={linkDetailsMediaUrl} onChange={(e) => {setLinkDetailsMediaUrl(e.target.value); setDetailsMediaFile(null);}} className="w-full pl-10 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOTO PRINCIPAL E BOTÕES */}
                  <div className="flex flex-col md:flex-row items-end gap-4 mt-2 border-t border-neutral-200 pt-6">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Foto Principal da Vitrine</label>
                      <div className="flex flex-col gap-2 p-3 bg-white border border-neutral-200 rounded-lg">
                        <input type="file" accept="image/*" onChange={(e) => {setImageFile(e.target.files[0]); setCurrentImageUrl(""); setLinkImageUrl("");}} className="w-full file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200" />
                        <div className="flex items-center gap-2"><div className="flex-1 h-px bg-neutral-100"></div><span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">OU LINK</span><div className="flex-1 h-px bg-neutral-100"></div></div>
                        <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LinkIcon className="w-4 h-4 text-neutral-400" /></div><input type="url" placeholder="https://exemplo.com/foto.jpg" value={linkImageUrl} onChange={(e) => {setLinkImageUrl(e.target.value); setImageFile(null);}} className="w-full pl-10 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {editingId && (<button type="button" onClick={resetForm} className="flex-1 md:flex-none px-6 py-2 h-[50px] bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition">Cancelar</button>)}
                      <button disabled={loading} type="submit" className="flex-1 md:flex-none px-8 py-2 h-[50px] bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition shadow-md">{loading ? "Salvando..." : editingId ? "Atualizar" : "Salvar Produto"}</button>
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
                            <div className="flex gap-1 mt-1 flex-wrap">
                               {(p.get("categories") || [p.get("category")]).filter(Boolean).map(c => <span key={c} className="text-[9px] bg-neutral-200 text-neutral-600 px-1.5 rounded uppercase font-bold">{c}</span>)}
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
                  {products.length === 0 && <div className="p-8 text-center text-neutral-500">Nenhum produto cadastrado.</div>}
                </div>
              </div>
            )}

            {/* ABA 3: CONFIGURAÇÕES */}
            {activeTab === "settings" && (
              <div className="max-w-4xl animate-in fade-in duration-500 pb-20">
                <form onSubmit={handleSaveSettings} className="space-y-16">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-neutral-400" /> Carrossel Principal</h2>
                        <p className="text-neutral-500 text-sm">Adicione quantos banners quiser. Se deixar apenas um, o carrossel fica parado.</p>
                      </div>
                      <button type="button" onClick={() => setBanners([...banners, {id: Date.now().toString(), tag: 'Nova Tag', title: 'Novo Banner', desc: '', btn: 'Ver', target: 'lancamentos', imageUrl: DEFAULT_CAROUSEL_IMG}])} className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Banner
                      </button>
                    </div>
                    <div className="space-y-6">
                      {banners.map((banner) => (
                        <div key={banner.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm relative">
                            {banners.length > 1 && (<button type="button" onClick={() => setBanners(banners.filter(x => x.id !== banner.id))} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-md z-10"><Trash2 className="w-4 h-4" /></button>)}
                            <div className="w-full h-48 lg:h-full rounded-xl overflow-hidden relative shadow-inner border border-neutral-200 bg-neutral-900">
                              <img src={banner.file ? URL.createObjectURL(banner.file) : (banner.linkUrl || banner.imageUrl)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" onError={(e) => { e.target.src = DEFAULT_CAROUSEL_IMG; }}/>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <span className="text-white/80 uppercase tracking-widest text-[10px] font-medium mb-1 drop-shadow-sm">{banner.tag}</span>
                                <h3 className="text-2xl font-serif italic text-white mb-2 drop-shadow-md">{banner.title}</h3>
                                {banner.btn && <button type="button" className="px-4 py-1.5 bg-white text-neutral-900 text-xs font-bold rounded-full shadow-md">{banner.btn}</button>}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Tag</label><input type="text" value={banner.tag || ""} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, tag: e.target.value} : x))} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none text-sm" /></div>
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Título</label><input type="text" value={banner.title || ""} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, title: e.target.value} : x))} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none text-sm" /></div>
                              </div>
                              <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Descrição</label><textarea rows="2" value={banner.desc || ""} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, desc: e.target.value} : x))} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none resize-none text-sm" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto Botão</label><input type="text" value={banner.btn || ""} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, btn: e.target.value} : x))} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none text-sm" /></div>
                                <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Ir para...</label><select value={banner.target || "lancamentos"} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, target: e.target.value} : x))} className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none text-sm bg-white"><option value="lancamentos">Lançamentos</option><option value="ofertas">Ofertas</option><option value="mais-desejados">Mais Desejados</option><option value="catalogo">Catálogo</option></select></div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Fundo (Foto)</label>
                                <div className="flex flex-col gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                                  <input type="file" accept="image/*" onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, file: e.target.files[0], linkUrl: ""} : x))} className="w-full text-xs" />
                                  <input type="url" placeholder="Ou link..." value={banner.linkUrl || ""} onChange={(e) => setBanners(banners.map(x => x.id === banner.id ? {...x, linkUrl: e.target.value, file: null} : x))} className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-md outline-none" />
                                </div>
                              </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-neutral-200">
                    <div className="flex justify-between items-start mb-2">
                      <div><h2 className="text-2xl font-semibold mb-1 flex items-center gap-2"><ImageIcon className="w-6 h-6 text-neutral-400" /> Banner Secundário</h2><p className="text-neutral-500 text-sm">Aparece no meio da loja para informar campanhas, coleções ou frete.</p></div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1"><input type="checkbox" className="sr-only peer" checked={infoBannerActive} onChange={(e) => setInfoBannerActive(e.target.checked)} /><div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div><span className="ml-3 text-sm font-bold text-neutral-900 uppercase">Ativado</span></label>
                    </div>
                    <div className={`transition-opacity duration-300 mt-6 ${!infoBannerActive && "opacity-40 pointer-events-none"}`}>
                      <div className="w-full h-32 rounded-xl overflow-hidden relative shadow-sm border border-neutral-200 bg-neutral-900 mb-6">
                        {currentInfoBannerUrl && <img src={infoBannerFile ? URL.createObjectURL(infoBannerFile) : currentInfoBannerUrl} alt="Preview Info" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"><h3 className="text-xl font-serif italic text-white mb-1">{infoBannerTitle}</h3><p className="text-[10px] text-white/80">{infoBannerDesc}</p></div>
                      </div>
                      <div className="space-y-4">
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Título Principal</label><input type="text" value={infoBannerTitle} onChange={(e) => setInfoBannerTitle(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto Menor</label><input type="text" value={infoBannerDesc} onChange={(e) => setInfoBannerDesc(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                        <div><label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Texto do Botão</label><input type="text" value={infoBannerBtn} onChange={(e) => setInfoBannerBtn(e.target.value)} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" /></div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Imagem de Fundo</label>
                          <div className="flex flex-col gap-2 p-3 bg-white border border-neutral-200 rounded-xl">
                            <input type="file" accept="image/*" onChange={(e) => {setInfoBannerFile(e.target.files[0]); setCurrentInfoBannerUrl(""); setLinkInfoBannerUrl("");}} className="w-full text-xs" />
                            <input type="url" placeholder="Ou link..." value={linkInfoBannerUrl} onChange={(e) => {setLinkInfoBannerUrl(e.target.value); setInfoBannerFile(null);}} className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-md outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <button type="submit" disabled={savingSettings} className="px-8 py-4 bg-neutral-900 text-white font-bold rounded-full hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
                      {savingSettings ? <><Loader2 className="w-5 h-5 animate-spin" /> Atualizando...</> : "💾 Salvar Configurações"}
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