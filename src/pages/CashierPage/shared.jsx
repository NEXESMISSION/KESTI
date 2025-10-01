import React, { useEffect } from 'react';

// --- Icon Components (using inline SVG for a single-file setup) ---
export const Icon = ({ name, className }) => {
    const icons = {
        lock: <path d="M20 13V9a8 8 0 1 0-16 0v4H1v6a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-6h-3Zm-6-1H7V9a5 5 0 0 1 10 0v3Z" />,
        history: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
        search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
        'shopping-cart': <><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" /></>,
        plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
        minus: <path d="M5 12h14" />,
        x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    };
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {icons[name]}
        </svg>
    );
};

// --- Toast Component ---
export const Toast = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] toast text-white px-6 py-3 rounded-full shadow-lg ${bgColor}`}>
            {message}
        </div>
    );
};
