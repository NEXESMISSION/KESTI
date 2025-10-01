import React from 'react';
import { Icon } from './shared';

const Cart = ({ items, onUpdateQuantity, onRemoveItem, onConfirmSale, isOpen, onClose }) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!isOpen) {
        return (
            <button onClick={onClose} className="fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110">
                <Icon name="shopping-cart" className="w-7 h-7" />
                {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{itemCount}</span>}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <h2 className="text-lg font-semibold">Cart ({itemCount} items)</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><Icon name="x" className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8 flex flex-col items-center">
                            <Icon name="shopping-cart" className="w-12 h-12 mb-3 text-gray-300" />
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-sm">{item.name} {item.weight ? `(${item.weight}${item.unit})` : ''}</h3>
                                        <p className="text-xs text-gray-500">{`${item.originalPrice.toFixed(2)} TND`} {item.priceType === 'weight' ? `/${item.unit}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 p-0 border rounded-md hover:bg-gray-100 flex items-center justify-center"><Icon name="minus" className="w-3 h-3" /></button>
                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 p-0 border rounded-md hover:bg-gray-100 flex items-center justify-center"><Icon name="plus" className="w-3 h-3" /></button>
                                    </div>
                                    <p className="font-semibold w-24 text-right">{`${(item.price * item.quantity).toFixed(2)} TND`}</p>
                                    <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Icon name="x" className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {items.length > 0 && (
                    <div className="p-4 border-t bg-white space-y-3">
                        <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total:</span>
                            <span className="text-xl font-bold text-blue-600">{`${total.toFixed(2)} TND`}</span>
                        </div>
                        <button onClick={onConfirmSale} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Confirm Sale</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
