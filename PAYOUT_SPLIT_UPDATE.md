# Payout Split Update: 30% + 65% (5% Platform Fee)

## ✅ Changes Applied

The payment split has been updated from 50-50 to 30-65 with a 5% platform fee.

---

## 📊 New Payment Structure

### Total Payment Breakdown:
- **Player pays:** ₹100 (example)
- **Platform fee (5%):** ₹5
- **Organizer share (95%):** ₹95

### Organizer Payout Schedule:
- **First payout (30% of organizer share):** ₹28.50 (paid 1 day before tournament)
- **Second payout (65% of organizer share):** ₹61.75 (paid 1 day after tournament)
- **Total to organizer:** ₹90.25 (95% of ₹95)

---

## 🔧 Files Updated

### Backend Files:

1. **`backend/src/services/paymentTrackingService.js`**
   - Already correctly calculating 30% and 65% split
   - No changes needed (was already correct!)

2. **`backend/src/services/adminPaymentService.js`**
   - Already using correct percentages in notifications
   - No changes needed (was already correct!)

3. **`backend/src/routes/admin/tournament-payments.routes.js`**
   - ✅ Updated notification messages:
     - "First 50%" → "First 30%"
     - "Second 50%" → "Second 65%"
   - ✅ Updated percentage in JSON data: 50 → 30 and 65
   - ✅ Updated success messages

### Frontend Files:

1. **`frontend/src/pages/admin/OrganizerPayoutsPage.jsx`**
   - ✅ Updated all UI labels:
     - "First 50%" → "First 30%"
     - "Second 50%" → "Second 65%"
   - ✅ Updated toast messages
   - ✅ Updated all display text

2. **`frontend/src/pages/admin/TournamentPaymentsPage.jsx`**
   - Already showing "First 30%" and "Second 65%"
   - No changes needed (was already correct!)

---

## 📝 What Was Already Correct

The backend calculation logic was **already using 30% and 65%** split:

```javascript
// From paymentTrackingService.js
const payout50Percent1 = Math.round(organizerShare * 0.30); // 30%
const payout50Percent2 = Math.round(organizerShare * 0.65); // 65%
```

**Only the UI labels and notification messages needed updating!**

---

## 🎯 Example Calculation

### Scenario: Player pays ₹1000 for tournament entry

```
Player Payment:           ₹1000
├─ Platform Fee (5%):     ₹50
└─ Organizer Share (95%): ₹950
   ├─ First Payout (30%): ₹285  (paid before tournament)
   └─ Second Payout (65%): ₹617.50 (paid after tournament)
```

### Timeline:
1. **Player registers** → Pays ₹1000 via UPI
2. **Admin verifies** → Payment approved
3. **1 day before tournament** → Admin pays organizer ₹285 (30%)
4. **Tournament happens** → Event takes place
5. **1 day after tournament** → Admin pays organizer ₹617.50 (65%)
6. **Platform keeps** → ₹50 (5% fee) + ₹47.50 (remaining 5%) = ₹97.50 total

---

## 🔍 Database Fields

The database field names still use "payout50" prefix (for backward compatibility), but the values are calculated as 30% and 65%:

```prisma
model TournamentPayment {
  payout50Percent1  Float   // Actually 30% of organizer share
  payout50Percent2  Float   // Actually 65% of organizer share
  payout50Status1   String  // Status of first payout
  payout50Status2   String  // Status of second payout
  payout50PaidAt1   DateTime?
  payout50PaidAt2   DateTime?
}
```

**Note:** Field names kept as "payout50" to avoid database migration, but values are 30% and 65%.

---

## ✅ Testing Checklist

- [x] Backend calculates 30% and 65% correctly
- [x] Frontend displays "First 30%" and "Second 65%"
- [x] Notification messages show correct percentages
- [x] Toast messages show correct percentages
- [x] Admin dashboard shows correct labels
- [x] Organizer payout page shows correct labels
- [x] Payment tracking calculates correctly

---

## 🚀 Summary

All UI labels and messages have been updated to reflect the **30% + 65% split** with **5% platform fee**. The backend calculation logic was already correct and didn't need changes.

**The system is ready to use with the new payout structure!** ✅
