# API Routes Documentation

All API endpoints for the KESTI POS system.

## 🔐 Authentication

All API routes (except public ones) require authentication via Supabase session.

---

## 📍 Endpoints

### **Business Account Management**

#### `POST /api/create-business-consolidated`
Create a new business account with profile and auth user.

**Request Body:**
```json
{
  "email": "business@example.com",
  "password": "password123",
  "fullName": "Business Name",
  "pin": "1234",
  "subscriptionDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "profile": { ... }
}
```

---

#### `POST /api/delete-business`
Delete a business account (requires super admin).

**Request Body:**
```json
{
  "businessId": "uuid",
  "businessEmail": "business@example.com"
}
```

---

#### `POST /api/update-password`
Update user password (super admin only).

**Request Body:**
```json
{
  "userId": "uuid",
  "newPassword": "newpass123"
}
```

---

### **History Management**

#### `POST /api/clear-history`
Clear sales and expenses history for a user.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**What it deletes:**
- All sales and sale items
- All expenses

**What it keeps:**
- Products
- Categories
- Profile settings
- Saved expense templates (localStorage)

**Response:**
```json
{
  "success": true,
  "message": "History cleared successfully..."
}
```

---

## 🛡️ Security

### Row Level Security (RLS)
All database tables have RLS enabled. API routes use service role key only when necessary (admin operations).

### Super Admin Operations
These routes require super admin role:
- `create-business-consolidated`
- `delete-business`
- `update-password`
- `clear-history`

### Regular User Operations
Regular users can only access their own data via client-side Supabase calls.

---

## 🧪 Testing

### Using curl:

```bash
# Create business
curl -X POST http://localhost:3000/api/create-business-consolidated \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@business.com",
    "password": "test123",
    "fullName": "Test Business",
    "pin": "1234",
    "subscriptionDays": 30
  }'

# Clear history
curl -X POST http://localhost:3000/api/clear-history \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid-here"}'
```

---

## ⚠️ Important Notes

1. **Service Role Key**: Only use in API routes, NEVER expose to client
2. **Input Validation**: All endpoints validate inputs before processing
3. **Error Handling**: Returns proper HTTP status codes and error messages
4. **Async Operations**: All operations are asynchronous

---

## 🔧 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

---

## 📝 Adding New Endpoints

When creating new API routes:

1. Create file in `/pages/api/`
2. Export default async function handler
3. Validate request method
4. Authenticate user if needed
5. Validate input parameters
6. Handle errors with try/catch
7. Return proper status codes
8. Document in this README
