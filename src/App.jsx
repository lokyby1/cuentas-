import { useState, useEffect } from 'react'
import './App.css'
import './SmartAssistant.css'
import Dashboard from './components/Dashboard'
import MisDeudas from './components/MisDeudas'
import MisGastosFijos from './components/MisGastosFijos'
import Modal from './components/Modal'
import PinLogin from './components/PinLogin'
import SmartAssistant from './components/SmartAssistant'
import { useFinance } from './context/FinanceContext'
import { LayoutDashboard, CreditCard, WalletCards, LineChart, Settings, Plus, Menu, X, Cloud, CloudOff, Database, Loader2 } from 'lucide-react'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Settings
  const [geminiKey, setGeminiKey] = useState('');

  const { addFunds, walletBalance, syncStatus } = useFinance();

  const renderSyncStatus = () => {
    switch(syncStatus) {
      case 'conectando': return <div className="flex items-center gap-xs px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold"><Loader2 size={12} className="animate-spin" /> Conectando...</div>;
      case 'nube': return <div className="flex items-center gap-xs px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold" title="Sincronizado con Firebase"><Cloud size={14} /> En la nube</div>;
      case 'error_nube': return <div className="flex items-center gap-xs px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold" title="Error de Firebase. Tus datos están a salvo localmente."><CloudOff size={14} /> Offline (Guardado Local)</div>;
      case 'local': return <div className="flex items-center gap-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold" title="Firebase inaccesible. Guardando en tu navegador."><Database size={14} /> Modo Local</div>;
      default: return null;
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('finanzas_gemini_key');
    if (savedKey) setGeminiKey(savedKey);
  }, []);

  const handleSaveGeminiKey = () => {
    localStorage.setItem('finanzas_gemini_key', geminiKey);
    alert('API Key de Gemini guardada correctamente.');
  };

  // Check session storage for login status
  useEffect(() => {
    const auth = sessionStorage.getItem('isFinFlowAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleCorrectPin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isFinFlowAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isFinFlowAuthenticated');
  };

  const handleAddFund = (e) => {
    e.preventDefault();
    if(fundAmount && !isNaN(fundAmount) && Number(fundAmount) > 0) {
      addFunds(Number(fundAmount));
      setFundAmount('');
      setIsFundModalOpen(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'deudas': return <MisDeudas />;
      case 'gastos': return <MisGastosFijos />;
      case 'reportes': return (
        <div className="dashboard-content text-center">
          <div className="card">
            <h2 className="text-xl mb-md">Reportes y Análisis</h2>
            <div style={{height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)'}}>
              <p className="text-secondary">Próximamente: Gráficas detalladas y reportes mensuales.</p>
            </div>
          </div>
        </div>
      );
      case 'config': return (
        <div className="dashboard-content">
          <div className="card">
            <h2 className="text-xl mb-lg">Configuración</h2>
            <div className="form-group">
              <label>SEGURIDAD</label>
              <div className="flex justify-between items-center p-md" style={{backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '1rem'}}>
                <span className="font-medium">PIN de Seguridad Activado</span>
                <button className="btn-outline" style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}} onClick={handleLogout}>Cerrar Sesión</button>
              </div>
            </div>
            <div className="form-group mt-lg">
              <label>ASISTENTE INTELIGENTE (GEMINI AI)</label>
              <div className="flex-col gap-sm p-md" style={{backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)'}}>
                <p className="text-xs text-secondary mb-sm">Ingresa tu API Key de Google Gemini para habilitar el asistente conversacional avanzado.</p>
                <div className="flex gap-sm">
                  <input 
                    type="password" 
                    className="form-input flex-1" 
                    placeholder="AIzaSy..." 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                  <button className="btn-primary" onClick={handleSaveGeminiKey}>Guardar API Key</button>
                </div>
              </div>
            </div>
            <div className="form-group mt-lg">
              <label>SISTEMA</label>
              <p className="text-sm text-secondary">Versión 2.0.0 - Entorno Corporativo</p>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: <LayoutDashboard size={20} /> },
    { id: 'deudas', label: 'Mis Deudas', icon: <CreditCard size={20} /> },
    { id: 'gastos', label: 'Mis Gastos Fijos', icon: <WalletCards size={20} /> },
    { id: 'reportes', label: 'Reportes', icon: <LineChart size={20} /> },
    { id: 'config', label: 'Configuración', icon: <Settings size={20} /> }
  ];

  if (!isAuthenticated) {
    return <PinLogin onCorrectPin={handleCorrectPin} />;
  }

  return (
    <div className="app-container">
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'space-between' }}>
        <div>
            <div className="sidebar-logo mt-md text-xl font-bold flex justify-between items-center" style={{ padding: '0 2rem', letterSpacing: '-0.5px' }}>
              <div>Finanzas <span className="text-accent-primary">Corp</span></div>
              {/* Close button for mobile sidebar */}
              <button className="hamburger-btn" style={{display: isSidebarOpen ? 'block' : 'none'}} onClick={() => setIsSidebarOpen(false)}>
                 <X size={20} />
              </button>
            </div>
            
            <ul className="sidebar-nav mt-xl">
            {menuItems.map(item => (
                <li 
                key={item.id} 
                className={activeTab === item.id ? 'active' : ''}
                onClick={() => {
                   setActiveTab(item.id);
                   setIsSidebarOpen(false); // Close sidebar on mobile after navigating
                }}
                >
                <span className={activeTab === item.id ? 'text-accent-primary' : 'text-secondary'}>
                    {item.icon}
                </span>
                {item.label}
                </li>
            ))}
            </ul>
        </div>

        <div style={{padding: 'var(--spacing-xl)', borderTop: '1px solid var(--border-light)'}}>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px' }}
            onClick={() => setIsFundModalOpen(true)}
          >
            <Plus size={18} />
            AGREGAR AHORRO
          </button>
          
          <div className="text-xs text-secondary font-semibold mb-xs" style={{letterSpacing: '0.5px'}}>AHORRO GENERAL (BOLSA)</div>
          <div className="text-2xl font-bold text-primary">${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(walletBalance)}</div>
        </div>
      </nav>

      {/* Backdrop for mobile sidebar */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
           <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
           </button>
           <h2>{menuItems.find(i => i.id === activeTab)?.label}</h2>
           <div style={{width: 34}}></div> {/* Placeholder for balance */}
        </div>

        <div className="topbar flex justify-between items-center w-full">
          <h1 style={{ display: 'none' }}>{menuItems.find(i => i.id === activeTab)?.label}</h1>
          <div className="ml-auto">
            {renderSyncStatus()}
          </div>
        </div>
        
        {renderContent()}
      </main>

      <SmartAssistant />

      {/* Modal para ingresar Ahorro Global */}
      {isFundModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 className="text-lg font-bold text-primary mb-lg flex items-center gap-sm">
              <Plus size={20} className="text-accent-primary" />
              Ingresar Nuevo Ahorro
            </h3>
            
            <form onSubmit={handleAddFund}>
              <div className="form-group mb-lg">
                <label className="form-label">Monto a Ingresar a la Bolsa</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ paddingLeft: '2rem', fontSize: '1.25rem', fontWeight: 'bold' }}
                    placeholder="0.00" 
                    value={fundAmount} 
                    onChange={e => setFundAmount(e.target.value)} 
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-secondary mt-sm">Este dinero se sumará a tu Bolsa de Ahorro y la IA podrá usarlo para distribuir pagos rápida y eficientemente.</p>
              </div>
              <div className="flex justify-end gap-md mt-lg">
                <button type="button" className="btn-outline" onClick={() => setIsFundModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Ahorro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
