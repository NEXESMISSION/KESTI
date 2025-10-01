import React from 'react';
import { Icon } from './shared';

const ProductGrid = ({ products, onProductClick, searchTerm, setSearchTerm }) => {
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const productsByCategory = filteredProducts.reduce((acc, product) => {
        const category = product.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    return (
        <main className="p-4 space-y-6">
            <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>
            <div className="space-y-6">
                {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                    <div key={category} className="space-y-3">
                        <h2 className="text-lg font-semibold text-gray-800">{category}</h2>
                        <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
                            {categoryProducts.map(p => {
                                const isOutOfStock = p.stock === 0;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => !isOutOfStock && onProductClick(p)}
                                        className={`flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="relative">
                                            <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-t-lg" />
                                            {isOutOfStock && <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Out of Stock</span>}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium text-gray-900 mb-1 truncate">{p.name}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{`${p.price.toFixed(2)} TND`}{p.priceType === 'weight' ? `/${p.unit}` : ''}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                                                {p.priceType === 'weight' && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">By {p.unit}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default ProductGrid;
