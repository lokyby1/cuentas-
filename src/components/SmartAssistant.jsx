import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Sparkles, MessageCircle, X, ChevronRight, Send, RefreshCcw, Landmark, ShieldCheck, TrendingDown, Loader2 } from 'lucide-react';
import { initGeminiChat, askGemini } from '../utils/gemini';
import '../App.css';

const SmartAssistant = () => {
  const { 
    debts, 
    walletBalance, 
    calculateSmartDistribution, 
    applySmartDistribution,
    fixedExpenses
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: '¡Hola! Soy tu Asistente Inteligente de Finanzas Corp. ¿En qué te puedo ayudar hoy?'
    }
  ]);
  const [options, setOptions] = useState([
    { id: 'analyze_debts', label: '📊 Analizar mis Deudas' },
    { id: 'smart_distribute', label: '💰 Repartir mi Ahorro' }
  ]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [distAmount, setDistAmount] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  
  const messagesEndRef = useRef(null);
  const chatInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !chatInitialized.current) {
      const apiKey = localStorage.getItem('finanzas_gemini_key');
      if (apiKey) {
        const financeData = { walletBalance, debts, fixedExpenses, transactions: [] };
        const success = initGeminiChat(apiKey, financeData);
        if (success) chatInitialized.current = true;
      }
    }
  }, [isOpen, walletBalance, debts, fixedExpenses]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, options, activeWorkflow]);

  const addMessage = (text, sender, isInteractive = false, payload = null) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, isInteractive, payload }]);
  };

  // ----- WORKFLOW: ANALIZAR DEUDAS -----
  const analyzeDebts = () => {
    if (!debts || debts.length === 0) {
      addMessage('Actualmente no tienes deudas registradas en el sistema.', 'ai');
      setOptions([{ id: 'smart_distribute', label: '💰 Repartir mi Ahorro' }]);
      return;
    }

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
      explanation = `Te recomiendo liquidar agresivamente **'${highestInterest.name}'** primero. Su tasa de interés del ${highestInterest.interestRate}% está generando demasiadas pérdidas a largo plazo.`;
    } else {
      strategy = 'Bola de Nieve (Psicológica)';
      target = lowestBalance;
      explanation = `Sugiero liquidar **'${lowestBalance.name}'** primero. Es tu deuda más pequeña. Eliminarla liberará flujo de caja y te dará impulso.`;
    }

    // Return the response through interactive block
    addMessage('He terminado el análisis de tus deudas.', 'ai', true, {
        type: 'DEBT_ANALYSIS',
        strategy,
        target,
        explanation
    });

    setOptions([
      { id: 'smart_distribute', label: '💰 Repartir mi Ahorro' },
      { id: 'back_to_menu', label: '⬅️ Volver al Menú' }
    ]);
  };

  // ----- WORKFLOW: DISTRIBUCIÓN INTELIGENTE -----
  const startDistribution = () => {
      setActiveWorkflow('DISTRIBUTION');
      addMessage('Excelente. Voy a calcular la mejor forma de distribuir tu ahorro para pagar deudas y gastos fijos.', 'ai');
      
      setTimeout(() => {
          if(walletBalance > 0) {
            setDistAmount(walletBalance.toString());
            addMessage(`Veo que tienes **${formatCurrency(walletBalance)}** en tu Bolsa de Ahorro. ¿Deseas usar este monto total o ingresar otra cantidad?`, 'ai');
          } else {
            addMessage('Tu Bolsa de Ahorro está en $0.00. Por favor, indícame qué cantidad de ahorro nuevo deseas procesar:', 'ai');
          }
      }, 500);
      setOptions([]);
  };

  const processDistribution = (amountStr) => {
      const amount = Number(amountStr);
      if(isNaN(amount) || amount <= 0) {
          addMessage('Por favor ingresa un monto válido.', 'ai');
          return;
      }
      
      const plan = calculateSmartDistribution(amount);
      
      addMessage(`Analizando ${formatCurrency(amount)}...`, 'ai');
      
      setTimeout(() => {
          if(plan.plan.length === 0) {
              addMessage('No encontré pagos pendientes o próximos por cubrir. ¡Tus finanzas están al día!', 'ai');
          } else {
              addMessage('Listo. Aquí tienes mi propuesta de distribución óptima:', 'ai', true, {
                  type: 'DISTRIBUTION_PLAN',
                  planData: plan,
                  amount: amount
              });
          }
          setActiveWorkflow(null);
          setDistAmount('');
          setOptions([{ id: 'back_to_menu', label: '⬅️ Volver al Menú' }]);
      }, 800);
  };

  const handleApplyPlan = (planData) => {
     addMessage('Aplicando pagos...', 'user');
     applySmartDistribution(planData.plan, planData.totalDistributed);
     
     // Remove interactivity from current plan box to prevent double click
     setMessages(prev => prev.map(msg => 
        msg.payload?.type === 'DISTRIBUTION_PLAN' ? {...msg, isInteractive: false} : msg
     ));

     setTimeout(() => {
        addMessage('✅ ¡Pagos aplicados exitosamente! Los saldos han sido actualizados y los movimientos se registraron en tu historial.', 'ai');
        resetMenu();
     }, 1000);
  };


  const handleOptionClick = (optId, label) => {
    addMessage(label, 'user');
    
    // Process option
    setTimeout(() => {
        if (optId === 'analyze_debts') {
            analyzeDebts();
        } else if (optId === 'smart_distribute') {
            startDistribution();
        } else if (optId === 'back_to_menu') {
            resetMenu();
            addMessage('Menú principal cargado. ¿Qué deseas hacer?', 'ai');
        }
    }, 500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput || chatInput.trim() === '') return;

    if (activeWorkflow === 'DISTRIBUTION') {
      const currentInput = chatInput;
      setChatInput('');
      addMessage(currentInput, 'user');
      processDistribution(currentInput);
      return;
    }

    const currentInput = chatInput;
    setChatInput('');
    addMessage(currentInput, 'user');

    const apiKey = localStorage.getItem('finanzas_gemini_key');
    if (!apiKey) {
      setTimeout(() => {
        addMessage('⚠️ Para usar el chat libre necesitas configurar tu **API Key de Gemini** en la pestaña de Configuración.', 'ai');
      }, 500);
      return;
    }

    if (!chatInitialized.current) {
      const financeData = { walletBalance, debts, fixedExpenses, transactions: [] };
      const success = initGeminiChat(apiKey, financeData);
      if (success) chatInitialized.current = true;
      else {
        addMessage('⚠️ Hubo un problema al inicializar Gemini. Revisa que tu API Key sea correcta.', 'ai');
        return;
      }
    }

    setIsLoading(true);
    try {
      const responseText = await askGemini(currentInput);
      addMessage(responseText, 'ai');
    } catch (err) {
      addMessage('Error: ' + err.message, 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInputSubmit = (e) => {
     e.preventDefault();
     // legacy generic handler, safe to remove if we replaced with handleSendMessage
  };

  const resetMenu = () => {
      setActiveWorkflow(null);
      setOptions([
        { id: 'analyze_debts', label: '📊 Analizar mis Deudas' },
        { id: 'smart_distribute', label: '💰 Repartir mi Ahorro' }
      ]);
  };


  return (
    <>
      {/* Floating Button */}
      <button 
        className={`assistant-fab ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <Sparkles size={24} className="fab-icon" />
      </button>

      {/* Assistant Panel */}
      <div className={`assistant-panel ${isOpen ? 'open' : ''}`}>
        <div className="assistant-header">
           <div className="flex items-center gap-sm">
             <div className="assistant-avatar">
               <Sparkles size={16} className="text-white" />
             </div>
             <div>
                <h3 className="text-white font-bold text-sm m-0 leading-tight">AI Advisor</h3>
                <span className="text-xs text-blue-200">Online</span>
             </div>
           </div>
           <button onClick={() => setIsOpen(false)} className="close-btn border-none bg-transparent cursor-pointer text-white">
             <X size={20} />
           </button>
        </div>

        <div className="assistant-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
               {msg.sender === 'ai' && <div className="chat-avatar"><Sparkles size={12}/></div>}
               
               <div className="chat-content">
                  {/* Normal Text message */}
                  {!msg.isInteractive && (
                    <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                  )}

                  {/* Interactive: Debt Analysis */}
                  {msg.isInteractive && msg.payload?.type === 'DEBT_ANALYSIS' && (
                     <div className="chat-interactive-box">
                         <div className="flex items-center gap-xs mb-sm">
                             {msg.payload.strategy.includes('Avalancha') ? <TrendingDown size={14} className="text-warning"/> : <ShieldCheck size={14} className="text-success"/>}
                             <span className="text-xs font-bold text-primary">{msg.payload.strategy}</span>
                         </div>
                         <p className="text-sm text-secondary mb-md leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.payload.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                         <div className="bg-light p-sm rounded mb-sm border-light">
                             <div className="text-xs text-secondary font-semibold">Prioridad N° 1</div>
                             <div className="text-sm font-bold text-primary truncate">{msg.payload.target.name}</div>
                             <div className="text-sm font-bold mt-xs">{formatCurrency(msg.payload.target.currentBalance)}</div>
                         </div>
                         <button className="btn-primary w-full text-xs py-sm" onClick={() => {
                             addMessage('He transferido tu prioridad. Para pagar directamente usa el botón inferior.', 'ai');
                         }}>
                             <ChevronRight size={14} className="mr-xs" />  Ir a pagar deuda
                         </button>
                     </div>
                  )}

                  {/* Interactive: Smart Distribution Plan */}
                  {msg.isInteractive && msg.payload?.type === 'DISTRIBUTION_PLAN' && (
                      <div className="chat-interactive-box">
                          <h4 className="text-sm font-bold text-primary mb-xs">Resumen de Propuesta</h4>
                          <p className="text-xs text-secondary mb-sm">Ahorro a distribuir: {formatCurrency(msg.payload.amount)}</p>
                          
                          <div className="flex-col gap-xs mb-md max-h-40 overflow-y-auto">
                              {msg.payload.planData.plan.map((p, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-xs rounded border-light">
                                      <div className="text-xs text-secondary truncate max-w-[120px]">{p.name}</div>
                                      <div className="text-xs font-bold text-success">-{formatCurrency(p.amountPaid)}</div>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="flex justify-between items-center border-t border-light pt-xs mb-sm">
                              <span className="text-xs font-bold text-primary">Sobra en Bolsa:</span>
                              <span className="text-xs font-bold text-primary">{formatCurrency(msg.payload.planData.remaining)}</span>
                          </div>

                          <button className="btn-primary w-full text-xs py-sm bg-accent hover-bg-accent" onClick={() => handleApplyPlan(msg.payload.planData)}>
                             Confirmar y Pagar Todo
                          </button>
                      </div>
                  )}
               </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="assistant-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '0.75rem', backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
           {/* Option Chips */}
           {options && options.length > 0 && !activeWorkflow && (
             <div className="flex flex-wrap gap-xs mb-sm px-sm">
                {options.map(opt => (
                    <button key={opt.id} className="assistant-chip" onClick={() => handleOptionClick(opt.id, opt.label)}>
                        {opt.label}
                    </button>
                ))}
             </div>
           )}

           {/* General Input Form */}
           <form className="assistant-input-area mt-sm flex gap-xs" onSubmit={handleSendMessage} style={{ position: 'relative' }}>
               <input 
                 type={activeWorkflow === 'DISTRIBUTION' ? "number" : "text"}
                 placeholder={activeWorkflow === 'DISTRIBUTION' ? "Monto ej. 1500.00" : "Escribe tu duda financiera..."}
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 className="assistant-input flex-1"
                 disabled={isLoading}
                 style={{ borderRadius: '20px', padding: '0.6rem 1rem', border: '1px solid var(--border-light)' }}
               />
               <button type="submit" className="assistant-send-btn flex items-center justify-center text-white" disabled={isLoading || !chatInput} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: chatInput ? 'var(--accent-primary)' : 'var(--border-light)', border: 'none', transition: 'all 0.2s', cursor: chatInput ? 'pointer' : 'default' }}>
                   {isLoading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Send size={16} />}
               </button>
           </form>
        </div>
      </div>
    </>
  );
};

export default SmartAssistant;
