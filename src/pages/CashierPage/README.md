# CashierPage Component - Implementation Guide

## ✅ What Has Been Completed

### 1. **New File Structure Created**
All the new components have been created in the `src/pages/CashierPage/` directory:
- ✅ `index.jsx` - Main component with all state management and logic
- ✅ `CashierHeader.jsx` - Header with Admin and History buttons
- ✅ `ProductGrid.jsx` - Product display with search and categories
- ✅ `Cart.jsx` - Shopping cart with add/remove functionality
- ✅ `Dialogs.jsx` - Modals for PIN, Weight selection, and Sales History
- ✅ `shared.jsx` - Reusable Icon and Toast components

### 2. **Old CSS Cleaned Up**
- ✅ `src/CashierView.css` has been cleared (new design uses Tailwind CSS)

### 3. **Integration Completed**
- ✅ `ClientApp.jsx` has been updated to use the new `CashierPage` component
- ✅ The admin unlock functionality is properly connected

## 🔧 Next Steps (Required)

### 1. **Replace Mock Data with Supabase**
The current implementation uses hardcoded mock data in the `useMockData()` function in `index.jsx`. You need to replace this with actual Supabase queries.

**In `index.jsx`, replace the `useMockData()` function with:**

```javascript
const useSupabaseData = () => {
    const [initialProducts, setInitialProducts] = useState([]);
    const [businessSettings, setBusinessSettings] = useState({ name: 'My Store', adminPin: '1234' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Get business_id from profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('business_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.business_id) {
                    // Fetch products
                    const { data: products } = await supabase
                        .from('products')
                        .select('*')
                        .eq('business_id', profile.business_id);
                    
                    // Fetch business settings
                    const { data: business } = await supabase
                        .from('businesses')
                        .select('name, admin_pin')
                        .eq('id', profile.business_id)
                        .single();
                    
                    if (products) setInitialProducts(products);
                    if (business) setBusinessSettings({
                        name: business.name,
                        adminPin: business.admin_pin
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return { initialProducts, businessSettings, loading };
};
```

### 2. **Update Sales to Supabase**
In the `handleConfirmSale()` function, add code to save sales to Supabase:

```javascript
const handleConfirmSale = async () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        // Get current user and business_id
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('id', user.id)
            .single();

        if (profile?.business_id) {
            // Save sale to database
            const { data: sale } = await supabase
                .from('sales')
                .insert({
                    business_id: profile.business_id,
                    total: total,
                    payment_method: 'Cash',
                    items: cartItems
                })
                .select()
                .single();

            // Update product stock
            for (const cartItem of cartItems) {
                const product = products.find(p => p.id === cartItem.productId);
                if (product) {
                    const stockReduction = product.priceType === 'weight' 
                        ? (cartItem.weight || cartItem.quantity) 
                        : cartItem.quantity;
                    
                    await supabase
                        .from('products')
                        .update({ stock: Math.max(0, product.stock - stockReduction) })
                        .eq('id', product.id);
                }
            }

            // Add to local sales history for immediate display
            setSalesHistory(prev => [{
                id: sale.id,
                timestamp: new Date(),
                items: cartItems.map(item => ({...item})),
                total,
                paymentMethod: 'Cash'
            }, ...prev]);
        }

        setCartItems([]);
        setIsCartOpen(false);
        showToast(\`Sale completed! Total: \${total.toFixed(2)} TND\`);
    } catch (error) {
        console.error('Error saving sale:', error);
        showToast('Error completing sale', 'error');
    }
};
```

### 3. **Import Supabase Client**
Add this import at the top of `index.jsx`:

```javascript
import { supabase } from '../../supabaseClient';
```

### 4. **Fetch Sales History**
Add a function to fetch sales history from Supabase:

```javascript
useEffect(() => {
    fetchSalesHistory();
}, []);

const fetchSalesHistory = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('id', user.id)
            .single();

        if (profile?.business_id) {
            const { data: sales } = await supabase
                .from('sales')
                .select('*')
                .eq('business_id', profile.business_id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (sales) setSalesHistory(sales);
        }
    } catch (error) {
        console.error('Error fetching sales:', error);
    }
};
```

## 🎨 Design Features

The new cashier page includes:
- ✅ Modern, clean Tailwind CSS design
- ✅ Responsive layout
- ✅ Product search functionality
- ✅ Category-based product grouping
- ✅ Support for both fixed-price and weight-based products
- ✅ Interactive shopping cart
- ✅ Admin PIN protection
- ✅ Sales history tracking
- ✅ Toast notifications
- ✅ Out-of-stock indicators

## 📝 Notes

- The design is fully built with Tailwind CSS, so no additional CSS files are needed
- Make sure your Tailwind configuration includes all necessary utilities
- The component is ready to use with your existing authentication flow
- All modular components make it easy to customize individual features
