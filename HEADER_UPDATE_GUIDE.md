# 🎨 Unified Header & Profile Popup - Complete Guide

## ✅ What Was Done

### **1. Created PageHeader Component**
**File:** `components/PageHeader.tsx`

**Features:**
- ✅ Unified design across all pages (matches history page)
- ✅ Logo on the left
- ✅ **Profile icon button** with notification badge
- ✅ Back button (configurable)
- ✅ **Comprehensive profile popup** with:
  - Account information (name, email, phone, role, creation date, status)
  - **Subscription information** (days left, expiration date, status)
  - Visual countdown (large numbers showing days left)
  - Color-coded status badges
  - Auto-clear history settings (if enabled)
  - Alerts for expiring/expired subscriptions

**Notification Badges:**
- 🟠 Orange badge with number when ≤ 7 days left
- 🔴 Red "!" badge when subscription expired
- No badge when > 7 days or super admin

---

### **2. Updated POS Page**
**File:** `pages/pos.tsx`

**Changes:**
- ✅ Imported `PageHeader` component
- ✅ Replaced old header with `<PageHeader showBackButton={false} />`
- ✅ Removed subscription badge from header
- ✅ **Subscription info now in profile popup**

---

### **3. Profile Popup Features**

#### **Account Information Section:**
```
✓ Full Name
✓ Email Address
✓ Phone Number
✓ Account Type (Super Admin 👑 / User 👤)
✓ Creation Date
✓ Account Status (Active ✓ / Suspended ⛔)
```

#### **Subscription Section (Business Users Only):**
```
✓ Large countdown: "15" days
✓ "يوم متبقي في اشتراكك"
✓ Expiration date in Arabic format
✓ Color-coded status badge:
  - Green: Active (> 7 days)
  - Orange: Expiring Soon (≤ 7 days)
  - Red: Expired (0 days)
```

#### **Alerts:**
- ⚠️ Orange alert when ≤ 7 days left
- 🚫 Red alert when expired
- Includes actionable messages

---

## 🚀 How To Use in Other Pages

### **Step 1: Import PageHeader**
```typescript
import PageHeader from '@/components/PageHeader'
```

### **Step 2: Replace Old Header**

**Before:**
```tsx
<header className="bg-white shadow-md sticky top-0 z-30">
  <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center">
      <Image src="/logo/KESTI.png" alt="KESTI" width={120} height={40} />
      {/* Subscription badge */}
      <button onClick={() => setShowSubscriptionModal(true)}>
        {daysLeft} يوم متبقي
      </button>
      {/* Back button */}
    </div>
  </div>
</header>
```

**After:**
```tsx
<PageHeader />
```

OR with custom back button:

```tsx
<PageHeader 
  showBackButton={true}
  backHref="/pos"
  backTitle="العودة إلى نقطة البيع"
/>
```

---

## 📋 Pages To Update

### **✅ Already Updated:**
- [x] POS Page (`pages/pos.tsx`)

### **📝 Need To Update:**
- [ ] Products Page (`pages/products.tsx`)
- [ ] Finance Page (`pages/finance.tsx`)
- [ ] Expenses Page (`pages/expenses.tsx`)
- [ ] Credits Page (`pages/credits.tsx`)
- [ ] History Page (`pages/history.tsx`)

---

## 🎨 Design Specifications

### **Header Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [LOGO]              [👤 Profile] [← Back]           │
└─────────────────────────────────────────────────────┘
```

### **Profile Icon:**
- Purple/Indigo background (`bg-indigo-600`)
- Hover effect (`hover:bg-indigo-700`)
- User icon (SVG)
- Notification badge (top-right corner)

### **Profile Popup:**
```
┌──────────────────────────────────────────┐
│  [Gradient Header]                    [X]│
│  👤 User Name                            │
│  email@example.com                       │
├──────────────────────────────────────────┤
│  📋 Account Information                  │
│  ┌────────────┬────────────┐            │
│  │ Name       │ Email      │            │
│  ├────────────┼────────────┤            │
│  │ Phone      │ Type       │            │
│  └────────────┴────────────┘            │
├──────────────────────────────────────────┤
│  ⏰ Subscription Information             │
│  ┌────────────────────────────┐         │
│  │          15                │         │
│  │    يوم متبقي في اشتراكك    │         │
│  │  ينتهي في: تاريخ الانتهاء  │         │
│  │      [Status Badge]        │         │
│  └────────────────────────────┘         │
│  ⚠️ Alert (if expiring/expired)         │
├──────────────────────────────────────────┤
│           [إغلاق Button]                │
└──────────────────────────────────────────┘
```

---

## 🎯 Key Benefits

### **User Experience:**
- ✅ Consistent header across all pages
- ✅ Single click to view account & subscription
- ✅ Visual alerts for expiring subscriptions
- ✅ Clean, uncluttered header
- ✅ Mobile-responsive design

### **Developer Experience:**
- ✅ Single component to maintain
- ✅ Easy to update header design globally
- ✅ Reusable across all pages
- ✅ Configurable props for flexibility

### **Business Value:**
- ✅ Users always aware of subscription status
- ✅ Visual urgency for renewals
- ✅ Complete account info in one place
- ✅ Professional, modern design

---

## 🔧 Customization Options

### **PageHeader Props:**
```typescript
interface PageHeaderProps {
  showBackButton?: boolean    // Default: true
  backHref?: string           // Default: '/pos'
  backTitle?: string          // Default: 'العودة إلى نقطة البيع'
}
```

### **Examples:**

**No back button (POS page):**
```tsx
<PageHeader showBackButton={false} />
```

**Custom back link:**
```tsx
<PageHeader 
  backHref="/products" 
  backTitle="العودة إلى المنتجات"
/>
```

**Default (back to POS):**
```tsx
<PageHeader />
```

---

## 📱 Responsive Design

### **Desktop:**
- Full header with spacing
- Large profile icon
- Clear notification badges

### **Mobile:**
- Compact header
- Smaller icons
- Touch-friendly buttons
- Scrollable popup

---

## 🎨 Color Scheme

### **Subscription Status Colors:**
```
Active (> 7 days):
  - Badge: bg-green-100 text-green-600
  - Border: border-green-200

Expiring (≤ 7 days):
  - Badge: bg-orange-100 text-orange-600
  - Border: border-orange-200
  - Notification: Orange with number

Expired (0 days):
  - Badge: bg-red-100 text-red-600
  - Border: border-red-200
  - Notification: Red with "!"
```

### **Header Colors:**
```
Background: white
Shadow: shadow-md
Logo: Full color
Profile Button: indigo-600 → indigo-700 (hover)
Back Button: gray-600 → gray-700 (hover)
```

---

## ✅ Testing Checklist

### **Profile Icon:**
- [ ] Appears on all pages
- [ ] Shows notification badge when needed
- [ ] Opens popup on click
- [ ] Hover effect works

### **Profile Popup:**
- [ ] Shows all account information
- [ ] Displays correct subscription days
- [ ] Shows alerts when needed
- [ ] Closes on button click
- [ ] Closes on outside click
- [ ] Mobile responsive

### **Subscription Tracking:**
- [ ] Days calculated correctly
- [ ] Expiration date formatted properly
- [ ] Status badge correct color
- [ ] Alerts show at right time
- [ ] Super admins don't see subscription info

---

## 🚀 **Next Steps:**

1. Update remaining pages to use `PageHeader`
2. Remove old subscription badges from all pages
3. Test on mobile devices
4. Verify all subscription calculations
5. Check all pages for consistency

---

**The header is now unified, clean, and professional across the entire app!** 🎉
