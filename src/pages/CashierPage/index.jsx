import React, { useState, useEffect } from 'react';
import CashierHeader from './CashierHeader';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import { AdminPinDialog, WeightDialog, SalesHistory } from './Dialogs';
import { Toast } from './shared';

// This is where you will fetch your data from Supabase later
const useMockData = () => {
    // NOTE: Replace this with your actual Supabase data fetching logic
    const initialProducts = [
        { id: '1', name: 'Espresso Coffee', price: 3.50, costPrice: 1.20, image: 'https://images.unsplash.com/photo-1533776992670-a72f4c28235e?w=400', category: 'Beverages', stock: 25, alertCount: 10, priceType: 'fixed' },
        { id: '2', name: 'Club Sandwich', price: 8.99, costPrice: 4.50, image: 'https://images.unsplash.com/photo-1673534409216-91c3175b9b2d?w=400', category: 'Food', stock: 12, alertCount: 5, priceType: 'fixed' },
        { id: '3', name: 'Chocolate Croissant', price: 4.25, costPrice: 2.10, image: 'https://images.unsplash.com/photo-1634610814993-880e4d3e8810?w=400', category: 'Bakery', stock: 18, alertCount: 8, priceType: 'fixed' },
        { id: '4', name: 'Bottled Water', price: 1.50, costPrice: 0.65, image: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=400', category: 'Beverages', stock: 50, alertCount: 20, priceType: 'fixed' },
        { id: '7', name: 'Fresh Beef', price: 12.99, costPrice: 8.50, image: 'https://images.unsplash.com/photo-1613454320437-0c228c8b1723?w=400', category: 'Meat', stock: 50, alertCount: 10, priceType: 'weight', unit: 'kg' },
        { id: '8', name: 'Mixed Vegetables', price: 3.99, costPrice: 2.20, image: 'https://images.unsplash.com/photo-1751210769268-85d43ecfcdd8?w=400', category: 'Vegetables', stock: 100, alertCount: 25, priceType: 'weight', unit: 'kg' },
    ];
    const businessSettings = { name: 'My Store', adminPin: '1234' };
    
    return { initialProducts, businessSettings };
};


export default function CashierPage({ onUnlock }) {
    const { initialProducts, businessSettings } = useMockData();

    const [products, setProducts] = useState(initialProducts);
    const [cartItems, setCartItems] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);

    // UI State
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showAdminDialog, setShowAdminDialog] = useState(false);
    const [showSalesHistory, setShowSalesHistory] = useState(false);
    const [selectedProductForWeight, setSelectedProductForWeight] = useState(null);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleAddToCart = (product, weight) => {
        setCartItems(prevItems => {
            const newItems = [...prevItems];
            const effectiveWeight = weight || 1;
            const itemPrice = product.priceType === 'weight' ? product.price * effectiveWeight : product.price;

            const existingItem = newItems.find(item => item.productId === product.id && (product.priceType === 'fixed' || item.weight === effectiveWeight));

            if (existingItem && product.priceType === 'fixed') {
                existingItem.quantity += 1;
            } else {
                newItems.push({
                    id: product.priceType === 'weight' ? `${product.id}-${Date.now()}` : product.id,
                    productId: product.id,
                    name: product.name,
                    price: itemPrice,
                    quantity: 1,
                    image: product.image,
                    weight: product.priceType === 'weight' ? effectiveWeight : undefined,
                    originalPrice: product.price,
                    priceType: product.priceType,
                    unit: product.unit
                });
            }
            return newItems;
        });
    };

    const handleUpdateCartQuantity = (id, quantity) => {
        if (quantity <= 0) {
            handleRemoveFromCart(id);
            return;
        }
        setCartItems(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity } : item));
    };

    const handleRemoveFromCart = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const handleConfirmSale = () => {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const saleRecord = {
            id: Date.now().toString(),
            timestamp: new Date(),
            items: cartItems.map(item => ({...item})),
            total,
            paymentMethod: 'Cash'
        };

        setSalesHistory(prev => [saleRecord, ...prev]);

        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            cartItems.forEach(cartItem => {
                const product = updatedProducts.find(p => p.id === cartItem.productId);
                if (product) {
                    const stockReduction = product.priceType === 'weight' ? (cartItem.weight || cartItem.quantity) : cartItem.quantity;
                    product.stock = Math.max(0, product.stock - stockReduction);
                }
            });
            return updatedProducts;
        });

        setCartItems([]);
        setIsCartOpen(false);
        showToast(`Sale completed! Total: ${total.toFixed(2)} TND`);
    };
    
    const handleProductClick = (product) => {
        if (product.priceType === 'weight') {
            setSelectedProductForWeight(product);
        } else {
            handleAddToCart(product);
        }
    };
    
    const handleWeightConfirm = (weight) => {
        handleAddToCart(selectedProductForWeight, weight);
        setSelectedProductForWeight(null);
    };

    return (
        <div className="relative min-h-screen bg-gray-50">
            <CashierHeader
                onAdminClick={() => setShowAdminDialog(true)}
                onHistoryClick={() => setShowSalesHistory(true)}
            />

            <ProductGrid
                products={products}
                onProductClick={handleProductClick}
                searchTerm={productSearchTerm}
                setSearchTerm={setProductSearchTerm}
            />

            <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                onConfirmSale={handleConfirmSale}
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(prev => !prev)}
            />
            
            <AdminPinDialog
                isOpen={showAdminDialog}
                onClose={() => setShowAdminDialog(false)}
                onSuccess={() => {
                  showToast('Admin access granted!');
                  // Call the onUnlock function to switch to admin dashboard
                  if (onUnlock) {
                    onUnlock();
                  }
                }}
                adminPin={businessSettings.adminPin}
            />

            <SalesHistory
                isOpen={showSalesHistory}
                onClose={() => setShowSalesHistory(false)}
                sales={salesHistory}
            />
            
            {selectedProductForWeight && (
                <WeightDialog
                    product={selectedProductForWeight}
                    onClose={() => setSelectedProductForWeight(null)}
                    onConfirm={handleWeightConfirm}
                />
            )}
            
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </div>
    );
}
