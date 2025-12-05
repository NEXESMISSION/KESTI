# ✅ Products Page Updated - Now Update These Pages

## ✅ **DONE:** Products Page
- Replaced header with `<PageHeader />`
- Removed subscription badge "26 يوم متبقي"
- Profile icon now visible

---

## 📋 **TODO:** Update These Pages Same Way

### **1. Finance Page** (`pages/finance.tsx`)
### **2. Credits Page** (`pages/credits.tsx`)  
### **3. Expenses Page** (`pages/expenses.tsx`)

---

## 🔧 **How To Fix Each Page:**

### **Step 1: Add Import**
```typescript
// Add this import at the top
import PageHeader from '@/components/PageHeader'

// Remove this (if exists):
import SubscriptionBadge from '@/components/SubscriptionBadge'
```

### **Step 2: Replace Header**

**Find this:**
```tsx
<header className="bg-white shadow-md sticky top-0 z-30">
  <div className="max-w-7xl mx-auto py-3 px-4 flex justify-between items-center">
    <Image src="/logo/KESTI.png" alt="KESTI" width={120} height={40} />
    
    <div className="flex items-center gap-2">
      <SubscriptionBadge profile={profile} onClick={() => setShowSubscriptionModal(true)} />
      
      <button onClick={() => window.location.href = '/pos'}>
        {/* Back button SVG */}
      </button>
    </div>
  </div>
</header>
```

**Replace with:**
```tsx
<PageHeader />
```

---

## ✅ **After Update, Each Page Should Have:**

1. ✅ Profile icon in header (purple/indigo)
2. ✅ Back button (to POS)
3. ❌ NO "26 يوم متبقي" text in header
4. ✅ Subscription info IN profile popup

---

## 🎯 **Expected Result:**

### **Header Will Show:**
```
[LOGO] ━━━━━━━━ [👤 Profile Icon] [← Back to POS]
```

### **Click Profile Icon:**
```
┌────────────────────┐
│ معلومات الاشتراك  │
│       26           │
│ يوم متبقي في اشتراكك│
│  [تجديد الاشتراك]  │
└────────────────────┘
```

---

## 📝 **Quick Copy-Paste Code:**

For each page (finance, credits, expenses), use this exact code:

### **At the top (imports):**
```typescript
import PageHeader from '@/components/PageHeader'
```

### **In the return statement:**
```tsx
return (
  <div className="min-h-screen bg-gray-50">
    <PageHeader />
    
    {/* Rest of your page content */}
  </div>
)
```

---

**That's it! Just replace the header in 3 more pages and you're done!** 🚀
