# 🔍 Google Search Console - DNS Verification Guide

## تحقق من ملكية النطاق kestipro.com عبر DNS

### الخطوة 1: إنشاء حساب Google Search Console

1. انتقل إلى: https://search.google.com/search-console
2. قم بتسجيل الدخول باستخدام حساب Google الخاص بك
3. انقر على "إضافة موقع" أو "Add Property"

### الخطوة 2: اختيار طريقة التحقق بالنطاق (Domain)

**مهم**: اختر "Domain" وليس "URL Prefix"

```
Domain: kestipro.com
```

### الخطوة 3: الحصول على سجل TXT من Google

بعد إدخال النطاق، ستحصل على سجل DNS من نوع TXT مثل:

```
Type: TXT
Name: @ (or kestipro.com)
Value: google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**مثال:**
```
google-site-verification=abc123xyz456def789ghi012jkl345mno678pqr901stu234
```

### الخطوة 4: إضافة سجل DNS عند مزود النطاق

#### أ. إذا كنت تستخدم **GoDaddy**:

1. اذهب إلى: https://dcc.godaddy.com/
2. سجل الدخول إلى حسابك
3. اختر النطاق: `kestipro.com`
4. انتقل إلى **DNS Management** (إدارة DNS)
5. انقر على **Add** في قسم Records
6. أضف السجل التالي:
   - **Type**: TXT
   - **Name**: @ (أو kestipro.com)
   - **Value**: القيمة التي حصلت عليها من Google
   - **TTL**: 1 Hour (أو Default)
7. احفظ التغييرات **Save**

#### ب. إذا كنت تستخدم **Namecheap**:

1. اذهب إلى: https://www.namecheap.com/
2. سجل الدخول
3. انتقل إلى **Domain List** > اختر `kestipro.com`
4. انقر على **Manage**
5. اذهب إلى **Advanced DNS**
6. انقر على **Add New Record**
7. أضف:
   - **Type**: TXT Record
   - **Host**: @ (أو اتركه فارغاً)
   - **Value**: القيمة من Google
   - **TTL**: Automatic
8. احفظ **Save All Changes**

#### ج. إذا كنت تستخدم **Cloudflare**:

1. اذهب إلى: https://dash.cloudflare.com/
2. اختر النطاق `kestipro.com`
3. انتقل إلى **DNS** > **Records**
4. انقر على **Add record**
5. أضف:
   - **Type**: TXT
   - **Name**: @ (أو kestipro.com)
   - **Content**: القيمة من Google
   - **TTL**: Auto
   - **Proxy status**: DNS only (رمادي)
6. احفظ **Save**

#### د. إذا كنت تستخدم **Hostinger**:

1. اذهب إلى لوحة التحكم Hostinger
2. انتقل إلى **Domains** > اختر `kestipro.com`
3. انقر على **DNS / Name Servers**
4. في قسم **DNS Records**، انقر **Add Record**
5. أضف:
   - **Type**: TXT
   - **Name**: @ (أو اتركه فارغاً)
   - **Points to**: القيمة من Google
   - **TTL**: 14400
6. احفظ

### الخطوة 5: التحقق من Google Search Console

1. ارجع إلى Google Search Console
2. انتظر **5-10 دقائق** (أحياناً يحتاج حتى 24-48 ساعة)
3. انقر على **Verify** (تحقق)

**ملاحظة مهمة**: إذا ظهرت رسالة خطأ، انتظر 24 ساعة ثم حاول مرة أخرى. تحديثات DNS تأخذ وقتاً.

### الخطوة 6: التحقق من صحة السجل (اختياري)

يمكنك التحقق من إضافة السجل بنجاح باستخدام:

**عبر الإنترنت:**
- https://mxtoolbox.com/TXTLookup.aspx
- أدخل: `kestipro.com`
- يجب أن ترى السجل `google-site-verification=...`

**عبر Command Prompt (Windows):**
```cmd
nslookup -type=TXT kestipro.com
```

**عبر Terminal (Mac/Linux):**
```bash
dig TXT kestipro.com
```

## 🎯 بعد التحقق الناجح

### 1. إضافة Sitemap
```
URL: https://kestipro.com/sitemap.xml
```

في Google Search Console:
1. اذهب إلى **Sitemaps** (خرائط الموقع)
2. أدخل: `sitemap.xml`
3. انقر **Submit**

### 2. طلب الفهرسة (Request Indexing)

1. اذهب إلى **URL Inspection** (فحص عنوان URL)
2. أدخل: `https://kestipro.com`
3. انقر **Request Indexing**

كرر العملية للصفحات المهمة:
- `https://kestipro.com/signup`
- `https://kestipro.com/login`

### 3. ربط Google Analytics (اختياري)

1. أنشئ حساب Google Analytics
2. احصل على Measurement ID (مثل: G-XXXXXXXXXX)
3. أضفه إلى ملف `_app.tsx`:

```typescript
import Script from 'next/script'

// في return، بعد <Component {...pageProps} />
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

## ❌ حل المشاكل الشائعة

### المشكلة 1: "Verification failed"
**الحل:**
- انتظر 24-48 ساعة
- تأكد من السجل بدون أخطاء إملائية
- تأكد من عدم وجود مسافات زائدة في القيمة

### المشكلة 2: "DNS record not found"
**الحل:**
- امسح DNS cache على جهازك:
  ```cmd
  ipconfig /flushdns
  ```
- انتظر وقتاً أطول (قد يحتاج 48 ساعة)

### المشكلة 3: سجل DNS القديم لا يزال موجوداً
**الحل:**
- احذف السجلات المكررة
- أبقِ سجل واحد فقط من Google

## 📊 ما بعد التحقق - المراقبة

### مقاييس مهمة في Search Console:

1. **Performance** (الأداء):
   - Impressions (مرات الظهور)
   - Clicks (النقرات)
   - CTR (معدل النقر)
   - Position (الموقع في نتائج البحث)

2. **Coverage** (التغطية):
   - Indexed pages (الصفحات المفهرسة)
   - Errors (الأخطاء)
   - Warnings (التحذيرات)

3. **Enhancements** (التحسينات):
   - Mobile Usability (قابلية الاستخدام على الجوال)
   - Core Web Vitals (المؤشرات الحيوية)

## 🚀 نصائح لتحسين الترتيب

### 1. محتوى منتظم
- انشر محتوى جديد بانتظام
- استخدم الكلمات المفتاحية المستهدفة
- اكتب بالعربية للسوق التونسي

### 2. سرعة الموقع
- راقب Core Web Vitals
- استخدم ضغط الصور
- فعّل التخزين المؤقت (Caching)

### 3. روابط خلفية (Backlinks)
- اطلب مراجعات من العملاء
- انشر في مواقع تونسية
- شارك على وسائل التواصل

### 4. تحديثات منتظمة
- راجع Search Console أسبوعياً
- حل أي أخطاء فوراً
- تتبع الكلمات المفتاحية

## 📞 دعم إضافي

**مساعدة Google:**
- https://support.google.com/webmasters

**أدوات مفيدة:**
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Rich Results Test: https://search.google.com/test/rich-results

---

**✅ قائمة التحقق السريعة:**

- [ ] تسجيل الدخول إلى Google Search Console
- [ ] إضافة النطاق kestipro.com
- [ ] نسخ سجل TXT من Google
- [ ] إضافة السجل عند مزود النطاق (GoDaddy/Namecheap/etc)
- [ ] الانتظار 10 دقائق - 24 ساعة
- [ ] النقر على "Verify" في Search Console
- [ ] إضافة Sitemap: sitemap.xml
- [ ] طلب فهرسة الصفحة الرئيسية
- [ ] ربط Google Analytics (اختياري)
- [ ] مراقبة الأداء أسبوعياً

---

**تاريخ آخر تحديث**: نوفمبر 2024
**الحالة**: ✅ جاهز للتطبيق
