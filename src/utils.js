// src/utils.js
export const formatCurrency = (amount, currency = 'TND') => {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return `${amount.toFixed(2)} ${currency}`;
};
