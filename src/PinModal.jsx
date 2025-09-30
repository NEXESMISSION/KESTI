import { useState } from 'react';
import { supabase } from './supabaseClient';
import './PinModal.css';

function PinModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Use the RPC function to securely verify the PIN
      const { data, error } = await supabase.rpc('verify_business_pin', {
        entered_pin: pin
      });

      if (error) throw error;

      if (data === true) {
        onSuccess();
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('Error verifying PIN: ' + error.message);
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key);
    }
  };

  return (
    <div className="pin-modal-overlay" onClick={onClose}>
      <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pin-modal-header">
          <h2>🔐 Enter Admin PIN</h2>
          <button className="pin-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="pin-modal-content">
          <div className="pin-display">
            <input
              type="password"
              value={pin}
              readOnly
              placeholder="Enter PIN"
              maxLength={6}
              className="pin-input"
              onKeyDown={handleKeyPress}
              autoFocus
            />
            <div className="pin-dots">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </div>
          </div>

          {error && <div className="pin-error">{error}</div>}

          <div className="pin-keypad">
            <div className="keypad-row">
              <button className="key-button" onClick={() => handleNumberClick('1')}>1</button>
              <button className="key-button" onClick={() => handleNumberClick('2')}>2</button>
              <button className="key-button" onClick={() => handleNumberClick('3')}>3</button>
            </div>
            <div className="keypad-row">
              <button className="key-button" onClick={() => handleNumberClick('4')}>4</button>
              <button className="key-button" onClick={() => handleNumberClick('5')}>5</button>
              <button className="key-button" onClick={() => handleNumberClick('6')}>6</button>
            </div>
            <div className="keypad-row">
              <button className="key-button" onClick={() => handleNumberClick('7')}>7</button>
              <button className="key-button" onClick={() => handleNumberClick('8')}>8</button>
              <button className="key-button" onClick={() => handleNumberClick('9')}>9</button>
            </div>
            <div className="keypad-row">
              <button className="key-button action" onClick={handleClear}>Clear</button>
              <button className="key-button" onClick={() => handleNumberClick('0')}>0</button>
              <button className="key-button action" onClick={handleBackspace}>⌫</button>
            </div>
          </div>

          <button 
            className="pin-submit-button" 
            onClick={handleSubmit}
            disabled={verifying || pin.length < 4}
          >
            {verifying ? 'Verifying...' : 'Unlock Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinModal;
