import React, { useState } from 'react';

const PinLogin = ({ onCorrectPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = '030896';

  const handleInput = (digit) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 6) {
        if (newPin === correctPin) {
          onCorrectPin();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="flex items-center justify-center p-xl" style={{ minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg-color)', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
      <div className="card text-center flex-col items-center" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Logo / Branding */}
        <div className="mb-md" style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 25px -5px rgba(30,58,138,0.3)' }}>
          <span className="text-white font-bold text-2xl" style={{ letterSpacing: '-1px' }}>FC</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-xs" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Finanzas Corp</h2>
        <p className="text-secondary text-sm mb-xl" style={{ letterSpacing: '0.02em' }}>Ingrese su PIN de Seguridad</p>
        
        {/* PIN Indicators */}
        <div className="flex justify-center gap-md mb-xl" style={{ padding: '0.5rem 0' }}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: pin.length > i ? 'var(--accent-primary)' : 'transparent',
                border: pin.length > i ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                boxShadow: error ? '0 0 12px var(--accent-danger)' : (pin.length > i ? '0 0 8px rgba(30,58,138,0.4)' : 'none'),
                transition: 'all 0.2s ease',
                transform: pin.length > i ? 'scale(1.1)' : 'scale(1)'
              }}
            ></div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid gap-md w-full" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '280px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              className="btn btn-outline" 
              style={{ 
                padding: '1rem', 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                borderRadius: '50%', 
                width: '72px', 
                height: '72px', 
                margin: 'auto',
                border: '1px solid var(--border-light)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)'
              }} 
              onClick={() => handleInput(num.toString())}
            >
              {num}
            </button>
          ))}
          <button 
            className="btn btn-outline" 
            style={{ padding: '1rem', fontSize: '1.25rem', fontWeight: '500', borderRadius: '50%', width: '72px', height: '72px', margin: 'auto', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)' }} 
            onClick={() => setPin('')}
          >
            C
          </button>
          <button 
            className="btn btn-outline" 
            style={{ padding: '1rem', fontSize: '1.5rem', fontWeight: '600', borderRadius: '50%', width: '72px', height: '72px', margin: 'auto', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: 'var(--text-primary)' }} 
            onClick={() => handleInput('0')}
          >
            0
          </button>
          <button 
            className="btn btn-outline" 
            style={{ padding: '1rem', fontSize: '1.25rem', borderRadius: '50%', width: '72px', height: '72px', margin: 'auto', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)' }} 
            onClick={handleBackspace}
          >
            ⌫
          </button>
        </div>
        
        {/* Error Message */}
        <div style={{ minHeight: '24px', marginTop: '1rem' }}>
          {error && <p className="text-xs font-semibold" style={{ color: 'var(--accent-danger)' }}>PIN Incorrecto. Reintente.</p>}
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
