import React from 'react';
import { Icon } from './shared';

const CashierHeader = ({ onAdminClick, onHistoryClick }) => (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
                <button onClick={onHistoryClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                    <Icon name="history" className="w-5 h-5" />
                </button>
                <button onClick={onAdminClick} className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-50">
                    <Icon name="lock" className="w-4 h-4" />
                    Admin
                </button>
            </div>
        </div>
    </header>
);

export default CashierHeader;
