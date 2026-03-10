import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, Landmark, ReceiptText, Sparkles, X, ArrowRight, Activity } from 'lucide-react';

const Dashboard = () => {
  const { 
    dailySavingsGoal, 
    totalDebts, 
    totalExpenses, 
    debts, 
    fixedExpenses,
    transactions,
    walletBalance,
    calculateSmartDistribution,
    applySmartDistribution
  } = useFinance();

  // Estados para el Modal Inteligente
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [smartAmount, setSmartAmount] = useState('');
  const [smartPlan, setSmartPlan] = useState(null);

  // Auto-fill wallet balance if available when modal opens
  useEffect(() => {
     if(isSmartModalOpen && walletBalance > 0 && !smartAmount) {
         setSmartAmount(walletBalance.toString());
     }
  }, [isSmartModalOpen, walletBalance]);

  // Combine and sort by next due date
  const upcomingPayments = [...debts.map(d => ({...d, type: 'debt', dateObj: new Date(d.paymentDate || new Date())})), 
                            ...fixedExpenses.map(e => ({...e, type: 'expense', dateObj: new Date(e.dueDate || new Date())}))]
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 4);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  const chartData = [
    { name: 'Deudas', value: totalDebts },
    { name: 'Gastos Fijos', value: totalExpenses }
  ];

  const handleCalculatePlan = () => {
    if(!smartAmount || isNaN(smartAmount) || smartAmount <= 0) return;
    const result = calculateSmartDistribution(Number(smartAmount));
    setSmartPlan(result);
  };

  const handleApplyPlan = () => {
    if(smartPlan) {
        applySmartDistribution(smartPlan.plan, smartPlan.totalDistributed);
        setIsSmartModalOpen(false);
        setSmartPlan(null);
        setSmartAmount('');
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '2rem' }}>
      {/* Hero Card */}
      <div className="card text-center mb-lg" style={{ padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <h3 className="text-secondary text-sm font-semibold mb-sm" style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}>Ahorro Diario Requerido</h3>
        <div className="text-3xl font-bold text-primary mb-lg" style={{ fontSize: '2.5rem' }}>{formatCurrency(dailySavingsGoal)}</div>
        
        <button 
          className="btn-primary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '50px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e3a8a 100%)',
            boxShadow: '0 4px 14px 0 rgba(30, 64, 175, 0.39)'
          }}
          onClick={() => { setIsSmartModalOpen(true); setSmartPlan(null); setSmartAmount(walletBalance > 0 ? walletBalance.toString() : ''); }}
        >
          <Sparkles size={18} />
          DISTRIBUCIÓN INTELIGENTE
        </button>
      </div>

      <div className="grid grid-cols-2 gap-lg mb-lg">
        <div className="card text-center" style={{ padding: '2rem' }}>
          <h4 className="text-secondary text-xs font-semibold mb-sm" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Total Deudas</h4>
          <div className="text-2xl font-bold text-primary mb-md">{formatCurrency(totalDebts)}</div>
          <div style={{ height: '4px', backgroundColor: 'var(--bg-color)', width: '100%', borderRadius: '2px', overflow: 'hidden' }}>
             <div style={{ height: '100%', width: '70%', backgroundColor: 'var(--accent-primary)' }}></div>
          </div>
        </div>
        <div className="card text-center" style={{ padding: '2rem' }}>
          <h4 className="text-secondary text-xs font-semibold mb-sm" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Total Gastos Fijos</h4>
          <div className="text-2xl font-bold text-primary mb-md">{formatCurrency(totalExpenses)}</div>
          <div style={{ height: '4px', backgroundColor: 'var(--bg-color)', width: '100%', borderRadius: '2px', overflow: 'hidden' }}>
             <div style={{ height: '100%', width: '40%', backgroundColor: '#4B5563' }}></div>
          </div>
        </div>
      </div>

      {/* Historial de Movimientos (NUEVO) */}
      <div className="card mb-lg">
        <div className="flex justify-between items-center mb-md">
            <h4 className="text-secondary text-sm font-semibold flex items-center gap-xs">
                <Activity size={16} /> Movimientos Recientes
            </h4>
        </div>
        <div className="flex-col gap-sm">
          {(!transactions || transactions.length === 0) ? (
            <p className="text-center py-md text-sm text-secondary">Aún no hay movimientos registrados.</p>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => (
              <div key={tx.id || idx} className="flex justify-between items-center py-sm" style={{ borderBottom: idx < Math.min(transactions.length, 5) - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div className="flex items-center gap-md">
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: tx.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2', color: tx.type === 'INCOME' ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tx.type === 'INCOME' ? <ArrowRight size={16} style={{transform: 'rotate(90deg)'}}/> : <ArrowRight size={16} style={{transform: 'rotate(-90deg)'}}/>}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-primary">{tx.title}</div>
                    <div className="text-xs text-secondary mt-xs">{formatDate(tx.date)}</div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-success' : 'text-primary'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <div className="card">
          <h4 className="text-secondary text-sm font-semibold mb-lg">Deudas vs Gastos Fijos</h4>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h4 className="text-secondary text-sm font-semibold mb-lg">Próximos Pagos</h4>
          <div className="flex-col gap-md">
            {upcomingPayments.length === 0 ? (
              <p className="text-center mt-md text-sm text-secondary">No hay pagos próximos registrados.</p>
            ) : upcomingPayments.map((item, index) => {
              const isClose = item.dateObj - new Date() < 7 * 24 * 60 * 60 * 1000;
              
              return (
                <div key={index} className="flex justify-between items-center" style={{ borderBottom: index < upcomingPayments.length - 1 ? '1px solid var(--border-light)' : 'none', paddingBottom: index < upcomingPayments.length - 1 ? '0.75rem' : '0' }}>
                  <div className="flex items-center gap-md">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: item.type === 'debt' ? '#EBF0F9' : '#F3F4F6', color: item.type === 'debt' ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.type === 'debt' ? <Landmark size={18} /> : <ReceiptText size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-secondary mt-xs">{formatCurrency(item.amount || item.currentBalance)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded font-medium ${isClose ? 'text-warning' : 'text-success'}`} style={{ backgroundColor: isClose ? '#FEF3C7' : '#D1FAE5', display: 'inline-block' }}>
                      {isClose ? 'Próximo' : 'Futuro'}
                    </div>
                    <div className="text-xs text-secondary mt-xs flex items-center justify-end gap-xs">
                       {formatDate(item.dateObj)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Inteligente */}
      {isSmartModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-lg font-bold text-primary flex items-center gap-sm">
                <Sparkles size={20} className="text-accent" />
                IA de Pagos
              </h3>
              <button 
                onClick={() => setIsSmartModalOpen(false)}
                className="text-secondary hover-text-primary transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {!smartPlan ? (
              <div className="form-group mb-lg">
                <label className="form-label">¿Cuánto ahorro deseas distribuir hoy?</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ paddingLeft: '2rem', fontSize: '1.25rem', fontWeight: 'bold' }}
                    placeholder="0.00" 
                    value={smartAmount} 
                    onChange={e => setSmartAmount(e.target.value)} 
                  />
                </div>
                <p className="text-xs text-secondary mt-sm">El sistema buscará los próximos compromisos y priorizará los pagos basados en las fechas de vencimiento más urgentes. (Monto pre-llenado con tu Bolsa actual).</p>
                
                <div className="flex justify-end gap-md mt-lg">
                  <button className="btn-outline" onClick={() => setIsSmartModalOpen(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleCalculatePlan}>Calcular Plan</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-light rounded p-md mb-md" style={{ border: '1px solid var(--border-light)' }}>
                   <h4 className="text-md font-bold text-primary mb-sm">Resumen de Distribución</h4>
                   <p className="text-sm text-secondary mb-md">Monto analizado: <strong>{formatCurrency(smartAmount)}</strong></p>
                   
                   {smartPlan.plan.length === 0 ? (
                     <p className="text-sm text-warning font-medium">No se encontraron pagos pendientes de realizar.</p>
                   ) : (
                     <div className="flex-col gap-sm">
                       {smartPlan.plan.map((p, idx) => (
                           <div key={idx} className="flex justify-between items-center px-sm py-xs" style={{ background: '#fff', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
                              <div>
                                 <span className="text-xs font-semibold mr-xs" style={{ color: p.itemType === 'DEBT' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                     {p.itemType === 'DEBT' ? '[Deuda]' : '[Fijo]'}
                                 </span>
                                 <span className="text-sm">{p.name}</span>
                              </div>
                              <span className="text-sm font-bold text-success">-{formatCurrency(p.amountPaid)}</span>
                           </div>
                       ))}
                     </div>
                   )}
                   
                   <div className="mt-md pt-sm flex justify-between items-center" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <span className="text-sm font-semibold">Sobra/Remanente de Bolsa:</span>
                      <span className="text-sm font-bold text-primary">{formatCurrency(smartPlan.remaining)}</span>
                   </div>
                </div>

                <div className="flex justify-end gap-md mt-lg">
                  <button className="btn-outline" onClick={() => setSmartPlan(null)}>Atrás</button>
                  <button className="btn-primary" onClick={handleApplyPlan} disabled={smartPlan.plan.length === 0}>
                    Confirmar, Pagar y Descontar Bolsa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
