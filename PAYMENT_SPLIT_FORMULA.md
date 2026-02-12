# Payment Split Formula - MATCHIFY.PRO

## ✅ CORRECT FORMULA (Updated: January 25, 2026)

### Payment Distribution
For every tournament registration payment received:

- **Platform Fee**: 5% of TOTAL amount
- **First Payout to Organizer**: 30% of TOTAL amount (before tournament)
- **Second Payout to Organizer**: 65% of TOTAL amount (after tournament)

**Total**: 5% + 30% + 65% = **100%**

---

## 📊 Examples

### Example 1: ₹100 Entry Fee
- **Total Collected**: ₹100
- **Platform Fee (5%)**: ₹5
- **First Payout (30%)**: ₹30
- **Second Payout (65%)**: ₹65
- **Verification**: ₹5 + ₹30 + ₹65 = ₹100 ✅

### Example 2: ₹500 Entry Fee
- **Total Collected**: ₹500
- **Platform Fee (5%)**: ₹25
- **First Payout (30%)**: ₹150
- **Second Payout (65%)**: ₹325
- **Verification**: ₹25 + ₹150 + ₹325 = ₹500 ✅

### Example 3: ₹1,000 Entry Fee
- **Total Collected**: ₹1,000
- **Platform Fee (5%)**: ₹50
- **First Payout (30%)**: ₹300
- **Second Payout (65%)**: ₹650
- **Verification**: ₹50 + ₹300 + ₹650 = ₹1,000 ✅

### Example 4: Tournament with 100 Players @ ₹500 each
- **Total Collected**: ₹50,000
- **Platform Fee (5%)**: ₹2,500
- **First Payout (30%)**: ₹15,000
- **Second Payout (65%)**: ₹32,500
- **Verification**: ₹2,500 + ₹15,000 + ₹32,500 = ₹50,000 ✅

---

## 🔧 Implementation

### Backend Files Updated:
1. `backend/src/services/paymentTrackingService.js`
2. `backend/src/routes/admin/payment-verification.routes.js`
3. `backend/src/services/adminPaymentService.js`

### Calculation Code:
```javascript
const totalCollected = registrationAmount;
const platformFeeAmount = Math.round(totalCollected * 0.05); // 5% of TOTAL
const payout50Percent1 = Math.round(totalCollected * 0.30);  // 30% of TOTAL
const payout50Percent2 = Math.round(totalCollected * 0.65);  // 65% of TOTAL
```

---

## ⚠️ CRITICAL NOTES

1. **All percentages are calculated from the TOTAL amount**, not from organizer share
2. **Do NOT calculate 30% and 65% from 95%** - this was the old incorrect method
3. The `organizerShare` field (95%) is kept for display purposes only
4. The actual payouts are calculated directly from total: 30% and 65%

---

## 🔄 Migration

All existing payment records have been updated using the script:
- `backend/fix-payment-split-30-65-5.js`

Run this script if you need to fix payment calculations:
```bash
cd backend
node fix-payment-split-30-65-5.js
```

---

## ✅ Verification

To verify the calculation is correct:
```javascript
platformFee + firstPayout + secondPayout === totalCollected
// Should always be true (within 1 rupee for rounding)
```

---

## 📝 Payment Timeline

1. **Player registers** → Pays entry fee to Matchify.pro
2. **Admin approves** → Payment verified
3. **Before tournament** → Organizer receives 30% of total
4. **After tournament** → Organizer receives 65% of total
5. **Platform keeps** → 5% of total as platform fee

---

**Last Updated**: January 25, 2026
**Status**: ✅ Implemented and Verified
