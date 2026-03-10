import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from './Modal';
import { Calendar, Repeat, Receipt, Trash2, Plus, Edit2 } from 'lucide-react';

const MisGastosFijos = () => {
  const { fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', amount: '', frequency: 'Mensual', dueDate: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateFixedExpense(editingId, {
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        dueDate: formData.dueDate
      });
    } else {
      addFixedExpense({
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        dueDate: formData.dueDate
      });
    }
    closeModal();
  };

  const openForm = (expense = null) => {
    if (expense) {
      setEditingId(expense.id);
      setFormData({
        name: expense.name,
        amount: expense.amount,
        frequency: expense.frequency,
        dueDate: expense.dueDate
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', amount: '', frequency: 'Mensual', dueDate: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', amount: '', frequency: 'Mensual', dueDate: '' });
  };

  const handleDelete = (id) => {
    if(window.confirm('¿Seguro que deseas eliminar este gasto?')) {
      deleteFixedExpense(id);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="flex justify-between items-center mb-xl">
        <h2 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Mis Gastos Fijos</h2>
        <button className="btn btn-primary" onClick={() => openForm()} style={{ gap: '0.5rem' }}>
          <Plus size={16} /> AGREGAR GASTO
        </button>
      </div>

      <div className="grid grid-cols-2 gap-xl">
        {fixedExpenses.length === 0 ? (
           <div className="card col-span-2 text-center py-xl">
             <Receipt size={48} className="text-secondary mx-auto mb-md" style={{ opacity: 0.2 }} />
             <p className="text-secondary">No tienes gastos fijos registrados.</p>
           </div>
        ) : fixedExpenses.map(expense => (
          <div key={expense.id} className="card relative" style={{ overflow: 'hidden' }}>
            {/* Decorative top border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--accent-primary)' }}></div>
            
            <div className="flex items-start mb-lg pt-sm">
              <div className="flex items-start gap-md">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                  <Receipt size={24} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-sm">
                    <h3 className="text-lg font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2 }}>{expense.name}</h3>
                    <div className="flex gap-xs" style={{ marginTop: '-0.1rem' }}>
                      <button 
                          onClick={() => openForm(expense)}
                          className="btn btn-outline text-secondary border-none" 
                          style={{ padding: '0.2rem' }}
                          title="Editar Gasto"
                      >
                          <Edit2 size={16} />
                      </button>
                      <button 
                          onClick={() => handleDelete(expense.id)}
                          className="btn btn-outline text-secondary border-none" 
                          style={{ padding: '0.2rem' }}
                          title="Eliminar Gasto"
                      >
                          <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary mt-xs">{formatCurrency(expense.amount)}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-md p-md" style={{ backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div>
                   <span className="text-xs font-semibold text-secondary flex items-center gap-xs mb-xs"><Repeat size={12} /> Frecuencia</span>
                   <div className="text-sm font-medium">{expense.frequency}</div>
                </div>
                <div>
                   <span className="text-xs font-semibold text-secondary flex items-center gap-xs mb-xs"><Calendar size={12} /> Próximo Cobro</span>
                   <div className="text-sm font-bold text-warning">{new Date(expense.dueDate).toLocaleDateString('es-MX', {timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric'})}</div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Editar Gasto Fijo" : "Agregar Gasto Fijo"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-md">
            <label>Nombre del Gasto</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ej. Renta, Netflix, CFE" />
          </div>
          <div className="grid grid-cols-2 gap-md form-group mb-md">
            <div>
              <label>Monto</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required placeholder="0.00" />
            </div>
            <div>
              <label>Frecuencia de Pago</label>
              <select name="frequency" value={formData.frequency} onChange={handleInputChange}>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>
          <div className="form-group mb-lg">
            <label>Fecha del Próximo Pago</label>
            <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required />
          </div>
          <div className="flex justify-end gap-sm mt-lg">
            <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{backgroundColor: '#111827', color: 'white', borderColor: '#111827'}}>{editingId ? "Guardar Cambios" : "Guardar Gasto"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MisGastosFijos;
