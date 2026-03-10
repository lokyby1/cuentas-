import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  // Sincronización síncrona inicial desde localStorage
  const getInitialState = (key, fallback) => {
    try {
      const backup = localStorage.getItem('finanzas_backup');
      if (backup) {
        return JSON.parse(backup)[key] || fallback;
      }
    } catch(e) {}
    return fallback;
  };

  const [walletBalance, setWalletBalance] = useState(() => getInitialState('walletBalance', 0));
  const [debts, setDebts] = useState(() => getInitialState('debts', []));
  const [fixedExpenses, setFixedExpenses] = useState(() => getInitialState('fixedExpenses', []));
  const [transactions, setTransactions] = useState(() => getInitialState('transactions', [])); // Historial
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false); // Flag para saber si ya recibimos la verdad de la nube
  const isRemoteUpdate = useRef(false);
  const hasLocalChanges = useRef(false); // <--- NUEVO: Candado anti-vaciado automático

  const [dailySavingsGoal, setDailySavingsGoal] = useState(0);
  const [totalDebts, setTotalDebts] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Firestore Sync - Load on Mount
  useEffect(() => {
    const docRef = doc(db, 'finances', 'userData'); // Fixed doc for MVP
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      isRemoteUpdate.current = true;
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setWalletBalance(data.walletBalance || 0);
        setDebts(data.debts || []);
        setFixedExpenses(data.fixedExpenses || []);
        setTransactions(data.transactions || []);
        
        // Actualizamos backup local con lo que llegó de la nube
        localStorage.setItem('finanzas_backup', JSON.stringify({
            walletBalance: data.walletBalance || 0,
            debts: data.debts || [],
            fixedExpenses: data.fixedExpenses || [],
            transactions: data.transactions || [],
            updatedAt: data.updatedAt || new Date().toISOString()
        }));
      }
      setIsDataLoaded(true);
      setIsCloudSynced(true); // Indicamos que recibimos la conexión inicial exitosa de Firebase
      
      // Reset the flag after resolving state batch
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 500); // Aumentado a 500ms para asegurar que renders locales terminen
    }, (error) => {
      console.error("Error en onSnapshot (posible cuota excedida o sin internet):", error);
      // Fallback: marcamos como cargado para la UI, no activamos isCloudSynced para evitar sobrescribir
      setIsDataLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync - Save on Changes (after initial load)
  useEffect(() => {
    // IMPORTANTE: Solo permitir guardar a Firebase si YA recibimos los datos originales
    // Y SÓLO si el usuario hizo un cambio manual (addDebt, addFunds, etc.)
    if (isDataLoaded && isCloudSynced && !isRemoteUpdate.current && hasLocalChanges.current) {
      const saveData = async () => {
        // Marcamos que ya procesamos el cambio local para no hacer loops
        hasLocalChanges.current = false;
        
        // 1. Siempre guardar en local como primera capa de seguridad
        const currentData = { walletBalance, debts, fixedExpenses, transactions, updatedAt: new Date().toISOString() };
        localStorage.setItem('finanzas_backup', JSON.stringify(currentData));

        // 2. Intentar respaldar en Firebase
        try {
          await setDoc(doc(db, 'finances', 'userData'), currentData);
        } catch (e) {
          console.error("Error saving to Firestore", e);
          hasLocalChanges.current = true; // Si falló la red, intentar de nuevo al próximo render/reconexión
          if (e.code === 'resource-exhausted') {
             console.warn("Cuota de Firebase excedida. Los datos se guardaron localmente de forma segura en tu navegador.");
          }
        }
      };
      
      // We use a small timeout to debounce multiple rapid local state updates
      const timeoutId = setTimeout(() => {
        saveData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [walletBalance, debts, fixedExpenses, transactions, isDataLoaded, isCloudSynced]);

  // Algorithm to calculate "Ahorro Diario Requerido"
  useEffect(() => {
    const calculateDailySavings = () => {
      const today = new Date();
      let totalRequired = 0;
      let totalDays = 0;
      let itemsCount = 0;

      let debtsTotal = 0;
      debts.forEach(debt => {
        let amountNeeded = 0;
        if (debt.selectedGoal === 'noInterest') amountNeeded = debt.paymentGoals?.noInterest || 0;
        else if (debt.selectedGoal === 'normal') amountNeeded = debt.paymentGoals?.normal || 0;
        else amountNeeded = debt.paymentGoals?.minimum || 0;
        
        debtsTotal += amountNeeded;

        const dueDate = new Date(debt.paymentDate);
        const diffTime = Math.abs(dueDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if(diffDays > 0) {
           totalRequired += amountNeeded;
           totalDays += diffDays;
           itemsCount++;
        }
      });
      setTotalDebts(debtsTotal);

      let expensesTotal = 0;
      fixedExpenses.forEach(expense => {
        expensesTotal += Number(expense.amount);
        
        const dueDate = new Date(expense.dueDate);
        const diffTime = Math.abs(dueDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if(diffDays > 0) {
          totalRequired += Number(expense.amount);
          totalDays += diffDays;
          itemsCount++;
        }
      });
      setTotalExpenses(expensesTotal);

      if (itemsCount > 0) {
         const avgDays = totalDays / itemsCount;
         const dailyNeeded = totalRequired / avgDays;
         setDailySavingsGoal(dailyNeeded);
      } else {
         setDailySavingsGoal(0);
      }
    };

    calculateDailySavings();
  }, [debts, fixedExpenses]);

  // Funciones Lógicas Clásicas
  const addFunds = (amount) => {
    hasLocalChanges.current = true;
    setWalletBalance(prev => prev + amount);
    setTransactions(prev => [{
      id: Date.now().toString(),
      type: 'INCOME',
      title: 'Agregar Fondos',
      amount: amount,
      date: new Date().toISOString()
    }, ...prev]);
  };
  
  const addDebt = (debt) => {
    hasLocalChanges.current = true;
    setDebts(prev => [...prev, { ...debt, id: Date.now().toString() }]);
  };
  
  const updateDebt = (id, updatedDebt) => {
    hasLocalChanges.current = true;
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updatedDebt } : d));
  };
  
  const deleteDebt = (id) => {
    hasLocalChanges.current = true;
    setDebts(prev => prev.filter(d => d.id !== id));
  };
  
  const addInterest = (id, amount) => {
    hasLocalChanges.current = true;
    setDebts(prev => prev.map(d => {
      if(d.id === id) {
        const newBalance = d.currentBalance + amount;
        return { 
          ...d, 
          currentBalance: newBalance, 
          paymentGoals: { ...d.paymentGoals, noInterest: (d.paymentGoals?.noInterest || d.currentBalance) + amount } 
        };
      }
      return d;
    }));
  };

  const addFixedExpense = (expense) => {
    hasLocalChanges.current = true;
    setFixedExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };
  
  const updateFixedExpense = (id, updatedExpense) => {
    hasLocalChanges.current = true;
    setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedExpense } : e));
  };
  
  const deleteFixedExpense = (id) => {
    hasLocalChanges.current = true;
    setFixedExpenses(prev => prev.filter(e => e.id !== id));
  };

  // --- IA DE PAGOS (Smart Distribution) ---
  
  // 1. Calcular la propuesta de distribución
  const calculateSmartDistribution = (availableAmount) => {
    let remaining = availableAmount;
    let distributionPlan = [];

    // Juntar todas las obligaciones y ordenarlas por fecha de vencimiento (más urgente primero)
    const today = new Date();
    
    // Preparar Gastos Fijos
    const expensesList = fixedExpenses.map(e => ({
      ...e,
      itemType: 'EXPENSE',
      sortDate: new Date(e.dueDate).getTime(),
      amountNeeded: Number(e.amount)
    }));

    // Preparar Deudas (buscamos pagar la meta seleccionada)
    const debtsList = debts.map(d => {
      let amountNeeded = 0;
      if (d.selectedGoal === 'noInterest') amountNeeded = d.paymentGoals?.noInterest || 0;
      else if (d.selectedGoal === 'normal') amountNeeded = d.paymentGoals?.normal || 0;
      else amountNeeded = d.paymentGoals?.minimum || 0;

      return {
        ...d,
        itemType: 'DEBT',
        sortDate: new Date(d.paymentDate).getTime(),
        amountNeeded: Number(amountNeeded)
      };
    });

    // Unir y ordenar por urgencia (fecha más cercana primero)
    const allObligations = [...expensesList, ...debtsList].sort((a, b) => a.sortDate - b.sortDate);

    // Asignar el dinero
    for (const item of allObligations) {
      if (remaining <= 0) break; // Si ya no hay dinero, parar

      const amountToPay = Math.min(item.amountNeeded, remaining);
      
      if (amountToPay > 0) {
        distributionPlan.push({
          id: item.id,
          name: item.name,
          itemType: item.itemType,
          amountPaid: amountToPay,
          originalAmountNeeded: item.amountNeeded
        });
        remaining -= amountToPay;
      }
    }

    return {
      plan: distributionPlan,
      remaining: remaining,
      totalDistributed: availableAmount - remaining
    };
  };

  // 2. Aplicar la propuesta de distribución a la base de datos local (que luego va a firestore)
  const applySmartDistribution = (distributionPlan, totalUsed) => {
    hasLocalChanges.current = true;
    const newTransactions = [];

    // Procesar cada pago del plan
    distributionPlan.forEach(payment => {
      if (payment.itemType === 'DEBT') {
        setDebts(prevDebts => prevDebts.map(d => {
          if (d.id === payment.id) {
            // Descontar del saldo y de las metas
            const updatedBalance = Math.max(0, d.currentBalance - payment.amountPaid);
            const remainingNoInt = Math.max(0, (d.paymentGoals?.noInterest || 0) - payment.amountPaid);
            const remainingNormal = Math.max(0, (d.paymentGoals?.normal || 0) - payment.amountPaid);
            const remainingMin = Math.max(0, (d.paymentGoals?.minimum || 0) - payment.amountPaid);

            return {
              ...d,
              currentBalance: updatedBalance,
              paymentGoals: {
                ...d.paymentGoals,
                noInterest: remainingNoInt,
                normal: remainingNormal,
                minimum: remainingMin
              }
            };
          }
          return d;
        }));
      } else if (payment.itemType === 'EXPENSE') {
        // Para gastos fijos, si lo pagó completo, podríamos "avanzar" su mes,
        // o si es MVP simplemente lo marcamos bajando su `amount` restante a pagar si quisiéramos.
        // Como es MVP, simplemente lo descontamos de su monto
        setFixedExpenses(prevExpenses => prevExpenses.map(e => {
            if (e.id === payment.id) {
                // Restamos el monto
                return { ...e, amount: Math.max(0, e.amount - payment.amountPaid) };
            }
            return e;
        }));
      }

      // Registrar historial de por qué y cuánto se abonó
      newTransactions.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'PAYMENT',
        itemType: payment.itemType,
        title: `Abono a ${payment.name}`,
        amount: payment.amountPaid,
        date: new Date().toISOString()
      });
    });

    // Descontar del wallet general SI la app lo maneja así (o sumar un historial del IA Distribution)
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const value = {
    walletBalance,
    addFunds,
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    addInterest,
    fixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    transactions,
    dailySavingsGoal,
    totalDebts,
    totalExpenses,
    isDataLoaded,
    calculateSmartDistribution,
    applySmartDistribution
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
