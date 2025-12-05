# Bulk Product Import & Super Admin See-Through Features

This document explains the newly implemented features for bulk product import and super admin see-through functionality.

## 🚀 Feature 1: Bulk Product Import

### Overview
Business owners can now import multiple products at once using a CSV file, instead of adding them one by one.

### How to Use

1. **Navigate to Owner Dashboard** (`/owner-dashboard`)
2. **Click "استيراد ملف" (Import File)** button
3. **Download the CSV template** by clicking "تنزيل نموذج CSV"
4. **Fill in the CSV file** with your products
5. **Upload the file** and preview the products
6. **Click "استيراد" (Import)** to add all products

### CSV Format

#### Required Columns
- `name` - Product name (text)
- `selling_price` - Selling price (number, e.g., 15.50)
- `cost_price` - Cost price (number, e.g., 10.00)
- `unit_type` - Unit type (must be one of: `item`, `kg`, `g`, `l`, `ml`)

#### Optional Columns
- `category_name` - Category name (text). Categories will be created automatically if they don't exist
- `stock_quantity` - Stock quantity (number)
- `low_stock_threshold` - Low stock alert threshold (number)

### Example CSV File

```csv
name,selling_price,cost_price,unit_type,category_name,stock_quantity,low_stock_threshold
Cola 1.5L,3.50,2.50,item,Beverages,100,20
Fresh Milk,4.00,3.00,l,Dairy,50,10
Tomatoes,2.50,1.80,kg,Vegetables,200,30
Olive Oil,12.00,9.00,l,Cooking,30,5
Bread,1.50,0.80,item,Bakery,150,25
```

### Features
- **Automatic Category Creation**: If a category doesn't exist, it will be created automatically
- **Batch Processing**: Import hundreds of products in seconds
- **Preview Before Import**: Review all products before adding them
- **Error Handling**: Clear error messages if data is invalid
- **Progress Feedback**: See import status and success count

### Validation Rules
- All required fields must be filled
- Prices must be valid numbers (can include decimals)
- Unit type must be one of the allowed values
- Stock quantities must be positive numbers (if provided)

---

## 👁️ Feature 2: Super Admin See-Through

### Overview
Super admins can now log in as any business owner to view their dashboard and experience the system exactly as they see it, **without affecting their device limits**.

### Key Benefits
- **Zero Device Impact**: See-through sessions don't count against the business owner's device limit
- **Complete View**: See exactly what the business owner sees
- **No Interference**: Business owner can continue working on their own devices
- **Easy Exit**: Simply log out to return to super admin dashboard

### How to Use

1. **Log in as Super Admin**
2. **Navigate to Super Admin Dashboard** (`/super-admin`)
3. **Find the business owner** you want to view
4. **Click "👁️ See Through"** button (purple button at the top of actions)
5. **System will:**
   - Store see-through flags in localStorage
   - Create a session for the business owner
   - Redirect you to their POS dashboard
6. **You are now viewing as the business owner**
   - Use the system normally
   - Changes are real (be careful!)
   - Device limits don't apply
7. **To exit:** Log out to return to your admin account

### Mobile View
On mobile devices, the "👁️ See Through (Admin View)" button appears as a full-width button at the top of the actions section.

### Technical Details

#### Device Limit Bypass
The see-through functionality works by:
1. Setting `admin_see_through` flag in localStorage
2. Modifying device registration to skip for see-through sessions
3. Bypassing all device authorization checks
4. Not tracking device activity for see-through sessions

This ensures that:
- ✅ Super admin can view any business owner's dashboard
- ✅ No device slot is consumed
- ✅ Business owner's device limits remain unaffected
- ✅ Multiple admins can see-through simultaneously
- ✅ See-through sessions never get kicked out for device limits

#### Security
- Only authenticated super admins can initiate see-through sessions
- API endpoint validates super admin role
- Session creation uses Supabase admin API
- See-through flag is cleared on normal logout

### API Endpoints

#### `/api/admin-create-session`
**POST** - Creates a new session for the business user

Request:
```json
{
  "userId": "uuid-of-business-user"
}
```

Response:
```json
{
  "success": true,
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "userData": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "Business Name"
  }
}
```

### Important Notes

⚠️ **When using See-Through:**
- All actions are real and will affect the business owner's data
- Be careful when modifying products, sales, or settings
- Always log out when done to avoid confusion
- The business owner can see changes immediately

✅ **Best Practices:**
- Use see-through for support and troubleshooting
- Inform the business owner if you need to make changes
- Document any changes made during see-through sessions
- Log out immediately after resolving issues

---

## 🔧 Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for:
- Creating sessions in see-through login
- Admin-level operations

---

## 📝 Files Modified/Created

### Bulk Product Import
- **Created**: `components/BulkProductImport.tsx`
- **Modified**: `pages/owner-dashboard.tsx`

### Super Admin See-Through
- **Created**: `pages/api/admin-create-session.ts`
- **Modified**: `pages/super-admin.tsx`
- **Modified**: `utils/deviceManager.ts`

---

## 🎯 Future Enhancements

### Bulk Import
- [ ] Excel file support (.xlsx, .xls) without conversion
- [ ] Bulk image upload via ZIP file
- [ ] Import validation with detailed error report
- [ ] Export current products to CSV
- [ ] Update existing products via CSV

### See-Through
- [ ] Activity logging for see-through sessions
- [ ] Time limit for see-through sessions
- [ ] Read-only mode option
- [ ] Notification to business owner when admin is viewing
- [ ] See-through session history in audit log

---

## 🐛 Troubleshooting

### Bulk Import Issues

**"Failed to parse file"**
- Ensure CSV is properly formatted
- Check that all commas are in the right place
- Make sure there are no extra empty rows

**"Missing required columns"**
- Verify header row has: name, selling_price, cost_price, unit_type
- Column names are case-sensitive

**"Invalid unit_type"**
- Must be exactly one of: item, kg, g, l, ml
- Check for extra spaces or typos

### See-Through Issues

**"Failed to create session"**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that the user is a business_user (not super_admin)
- Ensure business owner account is active

**"Device limit enforcement still applies"**
- Check localStorage has `admin_see_through = 'true'`
- Clear browser cache and try again
- Verify deviceManager.ts has the see-through checks

---

## 📞 Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify environment variables are set correctly
3. Ensure Supabase service role key has admin permissions
4. Check that business owner account exists and is active

---

**Last Updated**: November 2024
**Version**: 1.0.0
