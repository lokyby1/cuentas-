import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from './Modal';
import { Calendar, Percent, Landmark, Trash2, Plus, Sparkles, TrendingDown, ShieldCheck, Edit2 } from 'lucide-react';

const MisDeudas = () => {
  const { debts, addDebt, deleteDebt, updateDebt, addInterest } = useFinance();
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [activeDebtId, setActiveDebtId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Add Debt Form State
  const [debtForm, setDebtForm] = useState({
    name: '', category: 'Tarjetas', currentBalance: '', 
    cutDate: '', paymentDate: '', interestRate: '',
    paymentGoals: { noInterest: '', normal: '', minimum: '' }
  });

  // Interest Form State
  const [interestForm, setInterestForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const handleDebtChange = (e) => {
    setDebtForm({ ...debtForm, [e.target.name]: e.target.value });
  };

  const handleGoalChange = (e) => {
    setDebtForm({
      ...debtForm,
      paymentGoals: { ...debtForm.paymentGoals, [e.target.name]: e.target.value }
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: debtForm.name,
      category: debtForm.category,
      currentBalance: Number(debtForm.currentBalance),
      cutDate: debtForm.cutDate,
      paymentDate: debtForm.paymentDate,
      interestRate: Number(debtForm.interestRate),
      paymentGoals: {
        noInterest: Number(debtForm.paymentGoals.noInterest),
        normal: Number(debtForm.paymentGoals.normal),
        minimum: Number(debtForm.paymentGoals.minimum)
      }
    };
    
    if (editingId) {
       updateDebt(editingId, payload);
    } else {
       addDebt({ ...payload, selectedGoal: 'noInterest' });
    }
    
    closeAddForm();
  };

  const openAddForm = (debt = null) => {
    if (debt) {
      setEditingId(debt.id);
      setDebtForm({
        name: debt.name,
        category: debt.category,
        currentBalance: debt.currentBalance,
        cutDate: debt.cutDate,
        paymentDate: debt.paymentDate,
        interestRate: debt.interestRate || '',
        paymentGoals: {
          noInterest: debt.paymentGoals?.noInterest || '',
          normal: debt.paymentGoals?.normal || '',
          minimum: debt.paymentGoals?.minimum || ''
        }
      });
    } else {
      setEditingId(null);
      setDebtForm({
        name: '', category: 'Tarjetas', currentBalance: '', cutDate: '', paymentDate: '', interestRate: '',
        paymentGoals: { noInterest: '', normal: '', minimum: '' }
      });
    }
    setIsAddModalOpen(true);
  };

  const closeAddForm = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setDebtForm({
      name: '', category: 'Tarjetas', currentBalance: '', cutDate: '', paymentDate: '', interestRate: '',
      paymentGoals: { noInterest: '', normal: '', minimum: '' }
    });
  };

  const openInterestModal = (id) => {
    setActiveDebtId(id);
    setIsInterestModalOpen(true);
  };

  const handleInterestSubmit = (e) => {
    e.preventDefault();
    if(activeDebtId && interestForm.amount) {
      addInterest(activeDebtId, Number(interestForm.amount));
      setIsInterestModalOpen(false);
      setInterestForm({ amount: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  const handleGoalSelection = (debtId, goalType) => {
    updateDebt(debtId, { selectedGoal: goalType });
  };

  // AI Advice Logic
  const aiAdvice = useMemo(() => {
    if (!debts || debts.length === 0) return null;

    // Sorting strategies
    const sortedByInterest = [...debts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    const sortedByBalance = [...debts].sort((a, b) => a.currentBalance - b.currentBalance);

    const highestInterest = sortedByInterest[0];
    const lowestBalance = sortedByBalance[0];

    let strategy = '';
    let target = null;
    let explanation = '';

    if (highestInterest && highestInterest.interestRate > 25) {
      strategy = 'Avalancha (Matemática)';
      target = highestInterest;
      explanation = `Recomendamos liquidar agresivamente '${highestInterest.name}' primero. Su alta tasa de interés (${highestInterest.interestRate}%) está generando pérdidas excesivas a largo plazo. Al destinar tu Bolsa de Ahorro aquí, detendrás la fuga de capital.`;
    } else {
      strategy = 'Bola de Nieve (Psicológica)';
      target = lowestBalance;
      explanation = `Sugerimos liquidar '${lowestBalance.name}' primero usando la Bolsa de Ahorro. Es tu deuda más pequeña. Eliminarla rápidamente liberará flujo de efectivo mensual y te dará impulso para atacar las deudas más grandes.`;
    }

    return { strategy, target, explanation };
  }, [debts]);

  return (
    <div className="dashboard-content">
      <div className="flex justify-between items-center mb-xl">
        <h2 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Mis Deudas - Detalle</h2>
        <button className="btn-primary" onClick={() => openAddForm()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Plus size={16} /> AGREGAR DEUDA
        </button>
      </div>

      {/* AI Advice Section */}
      {aiAdvice && debts.length > 0 && (
        <div className="card mb-xl" style={{ border: '1px solid var(--accent-primary)', backgroundColor: '#F8FAFC', padding: '1.5rem 2rem' }}>
          <div className="flex items-center gap-sm mb-md">
             <Sparkles size={20} className="text-accent-primary" />
             <h3 className="text-lg font-bold text-primary">Análisis Inteligente: Estrategia Óptima</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-lg mt-md">
            <div>
              <p className="text-sm text-secondary mb-md leading-relaxed">{aiAdvice.explanation}</p>
              <div className="flex items-center gap-sm text-xs font-semibold px-md py-sm rounded bg-white text-primary inline-flex" style={{ border: '1px solid var(--border-light)' }}>
                 {aiAdvice.strategy.includes('Avalancha') ? <TrendingDown size={14} className="text-warning"/> : <ShieldCheck size={14} className="text-success"/>}
                 Método: {aiAdvice.strategy}
              </div>
            </div>
            
            <div className="bg-white p-md rounded flex-col justify-center items-start w-full" style={{ border: '1px solid var(--border-light)', borderLeft: '4px solid var(--accent-primary)', minWidth: 0 }}>
               <span className="text-xs font-semibold text-secondary mb-xs whitespace-nowrap block">OBJETIVO PRIORITARIO</span>
               <span className="text-lg font-bold text-primary truncate w-full" style={{ letterSpacing: '-0.02em' }}>{aiAdvice.target?.name}</span>
               <div className="flex items-center gap-lg mt-sm">
                 <div>
                    <span className="text-xs text-secondary block">Saldo</span>
                    <span className="text-sm font-semibold">{formatCurrency(aiAdvice.target?.currentBalance)}</span>
                 </div>
                 {aiAdvice.target?.interestRate && (
                   <div>
                      <span className="text-xs text-secondary block">Interés</span>
                      <span className="text-sm font-bold text-warning">{aiAdvice.target?.interestRate}%</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-col gap-xl">
        {debts.length === 0 ? (
          <div className="card text-center py-xl">
            <Landmark size={48} className="text-secondary mx-auto mb-md" style={{ opacity: 0.2 }} />
            <p className="text-secondary">No tienes deudas registradas.</p>
          </div>
        ) : debts.map(debt => (
          <div key={debt.id} className="card relative transition-all hover-shadow" style={{ overflow: 'hidden' }}>
             {/* Decorative top border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: aiAdvice?.target?.id === debt.id ? 'var(--accent-primary)' : '#4B5563' }}></div>
            
            {aiAdvice?.target?.id === debt.id && (
              <div style={{ position: 'absolute', top: '10px', left: '1.5rem' }}>
                 <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded flex items-center gap-xs">
                   <Sparkles size={12}/> PRIORIDAD AI
                 </span>
              </div>
            )}

            <div className="mb-xl pt-lg">
              <div className="flex items-center gap-sm">
                <h3 className="text-xl font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>{debt.name}</h3>
                
                <div className="flex gap-xs" style={{ marginTop: '-0.1rem' }}>
                  <button 
                      onClick={() => openAddForm(debt)}
                      className="btn btn-outline text-secondary border-none" 
                      style={{ padding: '0.2rem' }}
                      title="Editar Deuda"
                  >
                      <Edit2 size={16} />
                  </button>
                  <button 
                      onClick={() => { if(window.confirm('¿Eliminar deuda?')) deleteDebt(debt.id) }}
                      className="btn btn-outline text-secondary border-none" 
                      style={{ padding: '0.2rem' }}
                      title="Eliminar Deuda"
                  >
                      <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-xl">
              {/* Left Column - Details */}
              <div className="flex-col gap-md border-r-to-b" style={{ borderRight: '1px solid var(--border-light)', paddingRight: '2rem' }}>
                <div className="p-sm" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC' }}>
                  <label className="text-xs font-semibold text-secondary">Saldo Total Actual:</label>
                  <div className="text-2xl font-bold text-primary mt-xs">{formatCurrency(debt.currentBalance)}</div>
                </div>
                
                <div className="flex items-center justify-between p-sm" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <span className="text-sm font-medium text-secondary flex items-center gap-sm">
                    <Calendar size={16} /> Fecha de Corte
                  </span>
                  <span className="text-sm font-semibold">{new Date(debt.cutDate).toLocaleDateString('es-MX', {timeZone: 'UTC'})}</span>
                </div>

                <div className="flex items-center justify-between p-sm" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <span className="text-sm font-medium text-secondary flex items-center gap-sm">
                    <Calendar size={16} /> Fecha Límite de Pago
                  </span>
                  <span className="text-sm font-semibold text-warning">{new Date(debt.paymentDate).toLocaleDateString('es-MX', {timeZone: 'UTC'})}</span>
                </div>

                <div className="flex items-center justify-between p-sm">
                  <span className="text-sm font-medium text-secondary flex items-center gap-sm">
                    <Percent size={16} /> Tasa de Interés
                  </span>
                  <span className="text-sm font-semibold">{debt.interestRate ? `${debt.interestRate}%` : 'N/A'}</span>
                </div>
              </div>

              {/* Right Column - Goal Selection */}
              <div className="flex-col" style={{ paddingLeft: '1rem' }}>
                <h4 className="text-xs font-semibold text-secondary mb-md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Pago Meta Elegido</h4>
                
                <div className="flex-col gap-sm mb-lg">
                   <label className={`flex items-start gap-sm p-sm rounded cursor-pointer transition-all ${debt.selectedGoal === 'noInterest' ? 'bg-blue-50' : 'hover:bg-gray-50'}`} style={{ border: debt.selectedGoal === 'noInterest' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                      <input 
                        type="radio" name={`goal-${debt.id}`} value="noInterest" 
                        checked={debt.selectedGoal === 'noInterest'} 
                        onChange={() => handleGoalSelection(debt.id, 'noInterest')}
                        style={{ width: 'auto', marginTop: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      <div>
                        <span className="text-sm font-semibold block text-primary">PAGO PARA NO GENERAR INTERESES</span>
                        <span className="text-xs text-secondary">(Efectivo: {formatCurrency(debt.paymentGoals?.noInterest)})</span>
                      </div>
                   </label>

                   <label className={`flex items-start gap-sm p-sm rounded cursor-pointer transition-all ${debt.selectedGoal === 'normal' ? 'bg-blue-50' : 'hover:bg-gray-50'}`} style={{ border: debt.selectedGoal === 'normal' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                      <input 
                        type="radio" name={`goal-${debt.id}`} value="normal" 
                        checked={debt.selectedGoal === 'normal'} 
                        onChange={() => handleGoalSelection(debt.id, 'normal')}
                        style={{ width: 'auto', marginTop: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      <div>
                        <span className="text-sm font-medium block text-primary">PAGO MENSUAL NORMAL</span>
                        <span className="text-xs text-secondary">(Mínimo requerido: {formatCurrency(debt.paymentGoals?.normal)})</span>
                      </div>
                   </label>

                   <label className={`flex items-start gap-sm p-sm rounded cursor-pointer transition-all ${debt.selectedGoal === 'minimum' ? 'bg-blue-50' : 'hover:bg-gray-50'}`} style={{ border: debt.selectedGoal === 'minimum' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}>
                      <input 
                        type="radio" name={`goal-${debt.id}`} value="minimum" 
                        checked={debt.selectedGoal === 'minimum'} 
                        onChange={() => handleGoalSelection(debt.id, 'minimum')}
                        style={{ width: 'auto', marginTop: '0.25rem', transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                      <div>
                        <span className="text-sm font-medium block text-primary">PAGO MÍNIMO</span>
                        <span className="text-xs text-secondary">(Mínimo: {formatCurrency(debt.paymentGoals?.minimum)}, Genera Intereses)</span>
                      </div>
                   </label>
                </div>

                <div className="mt-auto pt-md flex gap-sm">
                  <button className="btn-primary w-full text-xs font-bold" onClick={() => openInterestModal(debt.id)} style={{ padding: '0.75rem', backgroundColor: '#111827', borderColor: '#111827', width: '100%' }}>
                    REGISTRAR INTERESES
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Debt Modal */}
      <Modal isOpen={isAddModalOpen} onClose={closeAddForm} title={editingId ? "Editar Deuda" : "Agregar Nueva Deuda"}>
        <form onSubmit={handleAddSubmit}>
          <div className="grid grid-cols-2 gap-md form-group">
            <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
              <label>Nombre de la Deuda</label>
              <input type="text" name="name" value={debtForm.name} onChange={handleDebtChange} required placeholder="Ej. Tarjeta de Crédito BBVA" />
            </div>
            <div>
              <label>Categoría</label>
              <select name="category" value={debtForm.category} onChange={handleDebtChange}>
                <option value="Tarjetas">Tarjetas de Crédito</option>
                <option value="Préstamos">Préstamos Personales</option>
                <option value="Hipotecas">Hipotecas</option>
                <option value="Automotriz">Crédito Automotriz</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label>Saldo Total Actual</label>
              <input type="number" name="currentBalance" value={debtForm.currentBalance} onChange={handleDebtChange} required placeholder="0.00" />
            </div>
            <div>
              <label>Fecha de Corte</label>
              <input type="date" name="cutDate" value={debtForm.cutDate} onChange={handleDebtChange} required />
            </div>
            <div>
              <label>Fecha Límite de Pago</label>
              <input type="date" name="paymentDate" value={debtForm.paymentDate} onChange={handleDebtChange} required />
            </div>
            <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
                <label>Tasa de Interés (%) Opcional</label>
                <input type="number" step="0.01" name="interestRate" value={debtForm.interestRate} onChange={handleDebtChange} placeholder="E.g 2.6" />
            </div>
            
            <div className="col-span-2 mt-md" style={{ gridColumn: 'span 2' }}>
                <label style={{borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem'}}>Opciones de Pago del Mes</label>
            </div>
            <div className="col-span-2" style={{ gridColumn: 'span 2' }}>
              <label>Pago para NO generar intereses</label>
              <input type="number" name="noInterest" value={debtForm.paymentGoals.noInterest} onChange={handleGoalChange} required placeholder="0.00" />
            </div>
            <div>
              <label>Pago Mensual Normal</label>
              <input type="number" name="normal" value={debtForm.paymentGoals.normal} onChange={handleGoalChange} required placeholder="0.00"/>
            </div>
            <div>
              <label>Pago Mínimo</label>
              <input type="number" name="minimum" value={debtForm.paymentGoals.minimum} onChange={handleGoalChange} required placeholder="0.00"/>
            </div>
          </div>
          <div className="flex justify-end gap-sm mt-lg">
            <button type="button" className="btn-outline" onClick={closeAddForm}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{backgroundColor: '#111827', color: 'white', borderColor: '#111827'}}>{editingId ? "Guardar Cambios" : "Guardar Deuda"}</button>
          </div>
        </form>
      </Modal>

      {/* Interest Event Modal */}
      <Modal isOpen={isInterestModalOpen} onClose={() => setIsInterestModalOpen(false)} title="Registrar Intereses">
        <form onSubmit={handleInterestSubmit}>
            <div className="form-group mb-md">
                <label>Amount</label>
                <input type="number" name="amount" value={interestForm.amount} onChange={e => setInterestForm({...interestForm, amount: e.target.value})} required placeholder="$XX,XXX.XX" autoFocus/>
            </div>
            <div className="form-group mb-lg">
                <label className="flex items-center gap-xs">Fecha <Calendar size={14} /></label>
                <input type="date" name="date" value={interestForm.date} onChange={e => setInterestForm({...interestForm, date: e.target.value})} required />
             </div>
             <div className="flex justify-end gap-sm mt-lg">
                <button type="button" className="btn-outline" onClick={() => setIsInterestModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{backgroundColor: '#b91c1c', color: 'white', borderColor: '#b91c1c'}}>Aplicar Interés</button>
             </div>
        </form>
      </Modal>
    </div>
  );
};

export default MisDeudas;
