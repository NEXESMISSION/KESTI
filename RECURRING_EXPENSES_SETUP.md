# إعداد المصروفات المتكررة التلقائية
# Automatic Recurring Expenses Setup

## نظرة عامة / Overview

تم تحسين نظام المصروفات المتكررة ليعمل تلقائيًا. عند إضافة مصروف متكرر، سيتم إنشاء المصروف تلقائيًا في التواريخ المحددة.

The recurring expenses system has been improved to work automatically. When you add a recurring expense, it will be automatically created on the specified dates.

## الميزات الجديدة / New Features

1. **خيار "ابدأ اليوم"**: يبدأ المصروف فورًا من اليوم
   - **"Start Today" option**: Starts the expense immediately from today

2. **اختيار تاريخ محدد**: حدد متى تريد بدء المصروف المتكرر
   - **Choose specific date**: Select when you want the recurring expense to start

3. **معلومات واضحة**: يوضح النظام كيف ومتى سيتم إضافة المصروف
   - **Clear information**: The system shows how and when the expense will be added

4. **المعالجة التلقائية**: يتم إنشاء المصروفات تلقائيًا في التواريخ المحددة
   - **Automatic processing**: Expenses are created automatically on specified dates

## كيفية الإعداد / Setup Instructions

### الطريقة 1: استخدام Supabase Edge Functions (موصى به)

1. إنشاء Edge Function في Supabase:
```bash
supabase functions new process-recurring-expenses
```

2. أضف الكود التالي في `supabase/functions/process-recurring-expenses/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const today = new Date().toISOString().split('T')[0]
  
  const { data: dueExpenses } = await supabaseClient
    .from('expenses')
    .select('*')
    .eq('expense_type', 'recurring')
    .eq('is_active', true)
    .lte('next_occurrence_date', today)

  for (const expense of dueExpenses || []) {
    const currentDate = new Date(expense.next_occurrence_date)
    let nextDate = new Date(currentDate)

    switch (expense.recurring_frequency) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + 1)
        break
    }

    await supabaseClient
      .from('expenses')
      .update({ next_occurrence_date: nextDate.toISOString().split('T')[0] })
      .eq('id', expense.id)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

3. نشر الfunction:
```bash
supabase functions deploy process-recurring-expenses
```

4. إعداد Cron Job في Supabase (يعمل تلقائيًا كل يوم):
   - اذهب إلى Supabase Dashboard
   - Database → Extensions → Enable `pg_cron`
   - Run SQL:
```sql
SELECT cron.schedule(
  'process-recurring-expenses-daily',
  '0 0 * * *', -- يعمل يوميًا في منتصف الليل
  $$
  SELECT
    net.http_post(
      url:='YOUR_EDGE_FUNCTION_URL',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

### الطريقة 2: استخدام Next.js API Route (أبسط)

API Route جاهز في: `pages/api/process-recurring-expenses.ts`

يمكنك استدعاءه باستخدام:
1. **Cron Job خارجي** (مثل cron-job.org):
   - URL: `https://your-domain.com/api/process-recurring-expenses`
   - Method: POST
   - Headers: `x-api-key: your-secret-key`
   - Schedule: Daily at midnight

2. **GitHub Actions** (إذا كان المشروع على GitHub):
أضف `.github/workflows/recurring-expenses.yml`:
```yaml
name: Process Recurring Expenses
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-domain.com/api/process-recurring-expenses \
            -H "x-api-key: ${{ secrets.CRON_API_KEY }}"
```

3. **Vercel Cron Jobs** (إذا كنت تستخدم Vercel):
أضف `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/process-recurring-expenses",
    "schedule": "0 0 * * *"
  }]
}
```

### الطريقة 3: معالجة يدوية (للاختبار)

يمكنك استدعاء API يدويًا للاختبار:
```bash
curl -X POST http://localhost:3000/api/process-recurring-expenses \
  -H "x-api-key: your-secret-key"
```

## متغيرات البيئة المطلوبة / Required Environment Variables

أضف إلى `.env.local`:
```
CRON_API_KEY=your-secret-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
```

## كيفية الاستخدام / How to Use

1. انتقل إلى صفحة المصروفات
2. انقر على "إضافة مصروف جديد"
3. املأ التفاصيل واختر "متكرر"
4. اختر التكرار (يومي، أسبوعي، شهري، سنوي)
5. اختر "ابدأ اليوم" أو حدد تاريخ محدد
6. احفظ - سيتم معالجة المصروف تلقائيًا!

## ملاحظات مهمة / Important Notes

- يمكنك إيقاف المصروف المتكرر في أي وقت من صفحة المصروفات
- يمكنك تعديل المبلغ أو التفاصيل في أي وقت
- التواريخ تُحسب تلقائيًا بناءً على التكرار المحدد
- المصروفات غير النشطة لن تتم معالجتها

## استكشاف الأخطاء / Troubleshooting

إذا لم تعمل المصروفات التلقائية:
1. تأكد من إعداد Cron Job بشكل صحيح
2. تحقق من متغيرات البيئة
3. تأكد من أن `is_active = true` للمصروف
4. تحقق من أن `next_occurrence_date` ليس في المستقبل

## الدعم / Support

للمساعدة أو الأسئلة، يرجى الرجوع إلى وثائق Supabase أو Next.js.
