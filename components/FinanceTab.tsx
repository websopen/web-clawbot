import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Newspaper, Clock, Menu, X, Globe, ChevronRight, Maximize2, BarChart3, ArrowLeft, Bell, Plus, Trash2, PieChart, Calculator, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MARKET_DATA, MERVAL_DATA, FINANCE_NEWS } from '../constants';

// Países disponibles
const COUNTRIES = [
  { id: 'AR', name: 'Argentina', flag: '🇦🇷', active: true },
  { id: 'US', name: 'Estados Unidos', flag: '🇺🇸', active: true },
  { id: 'BR', name: 'Brasil', flag: '🇧🇷', active: true },
  { id: 'GLOBAL', name: 'Global', flag: '🌍', active: true },
];

// Opciones del menú
const MENU_OPTIONS = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'heatmap', name: 'Mapa de Calor', icon: Globe },
  { id: 'calendar', name: 'Calendario', icon: Clock },
  { id: 'portfolio', name: 'Mi Portafolio', icon: PieChart },
  { id: 'calculator', name: 'Conversor', icon: Calculator },
  { id: 'alerts', name: 'Alertas', icon: Bell },
];

const menuOptionName = (id: string) => {
  const opt = MENU_OPTIONS.find(o => o.id === id);
  return opt ? opt.name : 'Mercado';
};

interface Alert {
  id: string;
  market: string;
  indicator: string;
  condition: 'above' | 'below' | 'pct_up' | 'pct_down';
  value: number;
}

const HEATMAP_TYPES = [
  { id: 'stock_us', name: 'Acciones USA (S&P 500)', url: 'https://www.tradingview.com/embed-widget/stock-heatmap/?locale=es&colorTheme=dark&width=100%25&height=100%25&isTransparent=true&defaultColumn=overview&defaultSize=market_cap_basic&symbolUrl=&colorByField=Perf.W&hasTopBar=false&hasSymbolInfo=false&market=america' },
  { id: 'stock_ar', name: 'Acciones Argentina', url: 'https://www.tradingview.com/embed-widget/stock-heatmap/?locale=es&colorTheme=dark&width=100%25&height=100%25&isTransparent=true&defaultColumn=overview&defaultSize=market_cap_basic&symbolUrl=&colorByField=Perf.W&hasTopBar=false&hasSymbolInfo=false&market=argentina' },
  { id: 'crypto', name: 'Criptomonedas', url: 'https://www.tradingview.com/embed-widget/crypto-coins-heatmap/?locale=es&colorTheme=dark&width=100%25&height=100%25&isTransparent=true&defaultColumn=overview&defaultSize=market_cap_calc&symbolUrl=&colorByField=24h_vol_change|5&hasTopBar=false&hasSymbolInfo=false' },
  { id: 'forex', name: 'Divisas (Forex)', url: 'https://www.tradingview.com/embed-widget/forex-heatmap/?locale=es&colorTheme=dark&width=100%25&height=100%25&isTransparent=true&defaultColumn=overview&defaultSize=market_cap_basic&symbolUrl=&colorByField=Perf.W&hasTopBar=false&hasSymbolInfo=false' },
];

const FinanceTab: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'heatmap', 'portfolio', 'calculator', 'alerts'
  const [selectedCountry, setSelectedCountry] = useState('AR');
  const [activeHeatmap, setActiveHeatmap] = useState(HEATMAP_TYPES[0]);

  // Estado para alertas (mock)
  const [userAlerts, setUserAlerts] = useState<Alert[]>([
    { id: '1', market: 'AR', indicator: 'Dólar Blue', condition: 'above', value: 1200 }
  ]);
  const [newAlert, setNewAlert] = useState<Partial<Alert> & { notification?: string }>({
    market: 'AR',
    indicator: 'Dólar Blue',
    condition: 'above',
    value: 0,
    notification: 'telegram'
  });

  // Estado para Portafolio (Mock)
  const [portfolioData] = useState([
    { asset: 'Bitcoin', symbol: 'BTC', amount: 0.05, value: 3500, change: 2.5 },
    { asset: 'Apple Inc.', symbol: 'AAPL', amount: 10, value: 1850, change: 1.2 },
    { asset: 'Dólar MEP', symbol: 'USD', amount: 500, value: 545, change: -0.5 },
  ]);

  // Estado para Conversor
  const [convAmount, setConvAmount] = useState(100);
  const [convFrom, setConvFrom] = useState('USD');
  const [convTo, setConvTo] = useState('AR_BLUE');
  const conversionRates: Record<string, number> = { 'USD': 1, 'AR_BLUE': 1130, 'AR_OFICIAL': 980, 'BTC': 0.000014, 'ETH': 0.00025 };

  const currentCountry = COUNTRIES.find(c => c.id === selectedCountry);
  const currentIndicators = MARKET_DATA[selectedCountry] || MARKET_DATA['AR'];

  const handleAddAlert = () => {
    if (newAlert.market && newAlert.indicator && newAlert.value) {
      setUserAlerts([...userAlerts, {
        id: Date.now().toString(),
        market: newAlert.market,
        indicator: newAlert.indicator,
        condition: newAlert.condition || 'above',
        value: Number(newAlert.value)
      } as Alert]);
      setNewAlert(prev => ({ ...prev, value: 0 })); // Reset value after adding
    }
  };

  const handleDeleteAlert = (id: string) => {
    setUserAlerts(userAlerts.filter(a => a.id !== id));
  };

  // Render Content Switch
  const renderContent = () => {
    switch (activeView) {
      case 'portfolio':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 pb-24 p-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-6 rounded-2xl border border-blue-800 shadow-xl">
              <p className="text-slate-400 text-sm font-medium mb-1">Balance Total Estimado</p>
              <h3 className="text-3xl font-mono font-bold text-white">$5,895.00 <span className="text-sm text-slate-400 font-sans">USD</span></h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                  <TrendingUp size={12} className="mr-1" /> +$125.50 (2.4%)
                </span>
                <span className="text-slate-500 text-xs">hoy</span>
              </div>
            </div>

            {/* Assets List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 font-medium text-slate-300">Tenencias</div>
              <div className="divide-y divide-slate-700/50">
                {portfolioData.map((asset, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700 p-2 rounded-lg"><DollarSign size={20} className="text-blue-400" /></div>
                      <div>
                        <p className="font-bold text-white">{asset.asset}</p>
                        <p className="text-xs text-slate-400">{asset.amount} {asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-white">${asset.value}</p>
                      <p className={`text-xs font-bold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {asset.change > 0 ? '+' : ''}{asset.change}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'calculator':
        const result = (convAmount * (conversionRates[convTo] || 1)) / (conversionRates[convFrom] || 1);
        return (
          <div className="space-y-6 animate-in fade-in duration-300 pb-24 p-4">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase">Monto</label>
                  <input
                    type="number"
                    value={convAmount}
                    onChange={(e) => setConvAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-xl font-mono text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-6">
                <select
                  value={convFrom}
                  onChange={(e) => setConvFrom(e.target.value)}
                  className="bg-slate-700 text-white p-3 rounded-xl border border-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="USD">USD (Dólar)</option>
                  <option value="AR_BLUE">ARS (Blue)</option>
                  <option value="BTC">BTC</option>
                </select>
                <ArrowRight className="text-slate-500" />
                <select
                  value={convTo}
                  onChange={(e) => setConvTo(e.target.value)}
                  className="bg-slate-700 text-white p-3 rounded-xl border border-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="AR_BLUE">ARS (Blue)</option>
                  <option value="USD">USD (Dólar)</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl text-center">
                <p className="text-sm text-slate-400 mb-1">Resultado Estimado</p>
                <p className="text-3xl font-bold text-white font-mono">
                  {result.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                  <span className="text-base text-blue-400 ml-2">{convTo.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 pb-24 p-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="font-medium text-slate-300 mb-4">Nueva Alerta</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                  value={newAlert.indicator} onChange={e => setNewAlert({ ...newAlert, indicator: e.target.value })}>
                  {currentIndicators.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                </select>
                <select className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                  value={newAlert.condition} onChange={e => setNewAlert({ ...newAlert, condition: e.target.value as any })}>
                  <option value="above">Mayor que</option>
                  <option value="below">Menor que</option>
                  <option value="pct_up">Sube %</option>
                  <option value="pct_down">Baja %</option>
                </select>
              </div>
              <div className="flex gap-2 mb-4">
                <input type="number" className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-blue-500" value={newAlert.value} onChange={e => setNewAlert({ ...newAlert, value: Number(e.target.value) })} placeholder="Valor" />
                <button onClick={handleAddAlert} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg transition-colors flex items-center justify-center"><Plus size={18} /></button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Alertas Activas</label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {userAlerts.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">No tienes alertas configuradas</p>
                ) : (
                  userAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div>
                        <div className="font-medium text-white text-sm">{alert.indicator}</div>
                        <div className="text-xs text-slate-400">
                          {alert.condition === 'above' ? 'Mayor a' : (alert.condition === 'below' ? 'Menor a' : '% Var')} <span className="text-emerald-400 font-mono">${alert.value}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAlert(alert.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'heatmap':
        return (
          // Adjusted height to account for header (60px) and approximate bottom nav (70px) + some safe padding
          // Using flex-1 is safer with a well-defined parent
          <div className="h-full flex flex-col bg-slate-900 animate-in fade-in duration-300 pb-20">
            <div className="flex-1 w-full bg-slate-900">
              <iframe
                key={activeHeatmap.id}
                src={activeHeatmap.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="TradingView Heatmap"
              />
            </div>
          </div>
        );

      case 'calendar':
        return (
          // Adjusted height, added padding-bottom for nav bar safety - Removed transform scale to fix loading issues
          <div className="h-full w-full bg-slate-900 animate-in fade-in duration-300 pb-20 overflow-hidden">
            <iframe
              src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5&calType=day&timeZone=12&lang=4"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Calendario Económico"
            />
          </div>
        );

      default: // 'dashboard'
        return (
          <div className="animate-in fade-in duration-300 pb-24 p-4">

            {/* Tickers Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {currentIndicators.map((item) => (
                <div key={item.name} className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={64} />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-300">{item.name}</h3>
                    <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${item.isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                      {Math.abs(item.variation)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div><p className="text-xs text-slate-500 uppercase font-bold">Compra</p><p className="text-xl font-mono text-white">${item.buy}</p></div>
                    <div><p className="text-xs text-slate-500 uppercase font-bold">Venta</p><p className="text-xl font-mono text-white">${item.sell}</p></div>
                  </div>
                </div>
              ))}
            </section>

            {/* Chart */}
            <section className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm mb-8">
              <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-400" /> Índice {currentCountry?.name === 'Global' ? 'Bitcoin' : (currentCountry?.name === 'Argentina' ? 'Merval' : (currentCountry?.name === 'Brasil' ? 'Bovespa' : 'S&P 500'))}</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MERVAL_DATA}>
                    <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#94a3b8' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Newspaper size={20} className="text-slate-400" /> Noticias Financieras</h3>
              <div className="space-y-3">
                {FINANCE_NEWS.map((news) => (
                  <a key={news.id} href={news.url} className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg p-4 transition-colors">
                    <h4 className="font-medium text-slate-200 mb-2 leading-snug">{news.title}</h4>
                    <div className="flex justify-between items-center text-xs text-slate-500"><span className="font-bold text-slate-400">{news.source}</span><span className="flex items-center gap-1"><Clock size={12} /> {news.time}</span></div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 relative overflow-hidden flex flex-col">
      {/* Global Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Global Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-72 bg-slate-800 z-50 transform transition-transform duration-300 flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white">Finanzas</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-2 border-b border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Vistas</p>
            {MENU_OPTIONS.map(option => (
              <button key={option.id} onClick={() => { setActiveView(option.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeView === option.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' : 'bg-slate-700/50 text-slate-200 hover:bg-slate-700'}`}>
                <option.icon size={20} className={activeView === option.id ? "text-blue-400" : "text-slate-400"} />
                <span className="font-medium">{option.name}</span>
              </button>
            ))}
          </div>
          <div className="p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Mercados</p>
            {COUNTRIES.map(country => (
              <button key={country.id} onClick={() => { if (country.active) { setSelectedCountry(country.id); setActiveView('dashboard'); setSidebarOpen(false); } }} disabled={!country.active} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedCountry === country.id ? 'bg-green-600/20 text-green-400 border border-green-600/50' : country.active ? 'bg-slate-700/50 text-slate-200 hover:bg-slate-700' : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'}`}>
                <span className="flex items-center gap-3"><span className="text-2xl">{country.flag}</span><span className="font-medium">{country.name}</span></span>
                {selectedCountry === country.id && <ChevronRight size={18} className="text-green-400" />}
              </button>
            ))}
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 text-center">
              Módulo de Trading (Demo)
            </p>
          </div>
        </div>
      </div>

      {/* FIXED HEADER */}
      <header className="h-[60px] bg-slate-900/95 backdrop-blur z-30 border-b border-slate-800 px-4 flex items-center gap-3 shadow-md shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><Menu size={24} /></button>
        <div className="flex-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white truncate">
            {/* Dynamic Title Logic */}
            {activeView === 'dashboard' ? (<><span className="text-2xl">{currentCountry?.flag}</span> Mercado {currentCountry?.name}</>) : menuOptionName(activeView)}
          </h1>

          {/* HEADER CONTROLS (Right Side) */}
          {activeView === 'heatmap' && (
            <div className="relative">
              <select
                className="appearance-none bg-slate-800 text-white pl-3 pr-8 py-1.5 rounded-lg border border-slate-600 hover:border-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer text-xs font-medium shadow-sm"
                value={activeHeatmap.id}
                onChange={(e) => {
                  const type = HEATMAP_TYPES.find(t => t.id === e.target.value);
                  if (type) setActiveHeatmap(type);
                }}
              >
                {HEATMAP_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="rotate-90" size={14} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 relative ${['heatmap', 'calendar'].includes(activeView) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default FinanceTab;