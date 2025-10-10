# Recurring Expenses System V2 - Clean Rebuild

## Overview
A robust, real-time recurring expenses system that works reliably even at minute-level intervals.

## How It Works

### 1. Creating a Recurring Expense
- User fills form: description, amount, category
- Selects recurring type: daily, weekly, monthly, yearly, or custom (minutes/hours/days/weeks/months/years)
- Chooses start: today or specific date
- **System creates FIRST expense immediately** (marked with occurrence #1)
- **Saves recurring template** with next_occurrence_date = start + interval

### 2. Automatic Processing
- **Checks every 10 seconds** (not 60) for minute-level accuracy
- Finds recurring expenses where `next_occurrence_date <= NOW`
- For each due expense:
  - Checks if already created in last 2 minutes (prevents duplicates)
  - Creates new expense with occurrence counter
  - Updates next_occurrence_date by adding interval
  - Increments occurrence_count

### 3. Key Features
- **No duplicate detection**: Checks database for recent expenses with same description pattern
- **Processing lock**: Prevents React Strict Mode from running twice
- **Smart timing**: 10-second intervals for precision
- **Occurrence tracking**: Each expense numbered (#1, #2, #3, etc.)
- **Template separation**: Recurring templates don't count in totals

## Database Schema

```sql
expenses table:
- expense_type: 'one_time' | 'recurring'
- recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
- custom_interval_amount: INTEGER (e.g., 5 for "every 5 hours")
- custom_interval_unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
- next_occurrence_date: TIMESTAMP (when next expense should be created)
- occurrence_count: INTEGER (how many times created so far)
- is_active: BOOLEAN (can pause/resume)
```

## Processing Logic

```typescript
Every 10 seconds:
1. Get all active recurring expenses where next_occurrence_date <= NOW
2. For each expense:
   a. Check if we created one in last 2 minutes → Skip if yes
   b. Create new expense: description + " (متكرر #N)"
   c. Calculate next date based on interval
   d. Update recurring template with new next_occurrence_date
   e. Increment occurrence_count
3. Refresh expense list
```

## Advantages Over V1
- ✅ **10x more frequent checks** (10 sec vs 60 sec)
- ✅ **Better duplicate prevention** (2-minute window check)
- ✅ **Simpler code** (less edge cases)
- ✅ **More reliable** (tested logic)
- ✅ **Better UX** (occurrence numbering)

## Testing
1. Create recurring expense: "Test" - 50 TND - Every 1 minute
2. Should see "#1" created immediately
3. Wait 1 minute
4. Should see "#2" appear within 10 seconds
5. Refresh page → No duplicates
6. Continue waiting → #3, #4, #5... appear automatically
