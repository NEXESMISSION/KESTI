import React, { useState } from 'react';
import { Icon } from './shared';

export const AdminPinDialog = ({ isOpen, onClose, onSuccess, adminPin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (pin === adminPin) {
            onSuccess();
            handleClose();
        } else {
            setError('Incorrect PIN.');
            setPin('');
        }
    };

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="lock" className="w-5 h-5" />Admin Access</h2>
                <p className="text-sm text-gray-600 mt-2 mb-4">Enter admin PIN to access management features.</p>
                <input
                    id="pin-input"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full text-center text-lg tracking-widest border rounded-md p-2 mb-2"
                    placeholder="Enter PIN"
                    maxLength="6"
                    autoFocus
                />
                <p className="text-sm text-red-600 h-5">{error}</p>
                <div className="flex gap-2 mt-4">
                    <button onClick={handleClose} className="flex-1 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Access</button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">Demo PIN: {adminPin}</p>
            </div>
        </div>
    );
};

export const WeightDialog = ({ product, onClose, onConfirm }) => {
    const [weight, setWeight] = useState('1');
    const totalPrice = (parseFloat(weight) || 0) * product.price;

    const handleConfirm = () => {
        const weightValue = parseFloat(weight);
        if (weightValue > 0 && weightValue <= product.stock) {
            onConfirm(weightValue);
        }
    };
    
    if(!product) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-lg font-semibold">Select Weight - {product.name}</h2>
                <div className="text-center mt-4">
                    <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{`${product.price.toFixed(2)} TND`} per {product.unit}</p>
                </div>
                <div className="mt-4">
                    <label htmlFor="weight-input" className="text-sm font-medium">Weight ({product.unit})</label>
                    <input
                        id="weight-input"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max={product.stock}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">Available stock: {product.stock} {product.unit}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mt-4">
                    <div className="flex justify-between items-center font-bold">
                        <span>Total Price:</span>
                        <span>{`${totalPrice.toFixed(2)} TND`}</span>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
                    <button onClick={handleConfirm} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

export const SalesHistory = ({ isOpen, onClose, sales }) => {
    if (!isOpen) return null;
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <h2 className="text-lg font-semibold">Sales History</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><Icon name="x" className="w-5 h-5" /></button>
                </div>
                <div className="p-4 border-b bg-white">
                    <div className="flex justify-between items-center font-semibold">
                        <span>Total Sales:</span>
                        <span>{`${totalSales.toFixed(2)} TND`}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sales.length > 0 ? (
                        [...sales].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(sale => (
                            <div key={sale.id} className="bg-white p-3 rounded-lg border">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm">
                                        <div className="font-medium">{new Date(sale.timestamp).toLocaleDateString()}</div>
                                        <div className="text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <span className="font-bold text-blue-600">{`${sale.total.toFixed(2)} TND`}</span>
                                </div>
                                <div className="space-y-1">
                                    {sale.items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-xs text-gray-600">
                                            <span>{item.name} {item.weight ? `(${item.weight}kg)`: ''}</span>
                                            <span>{item.quantity}x {`${item.price.toFixed(2)} TND`}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 mt-8">No sales yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
