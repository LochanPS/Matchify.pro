# Day 24: Registration Frontend

**Date:** December 26, 2025  
**Goal:** Build complete tournament registration UI with Razorpay integration

---

## 🎯 What We're Building Today

1. **Tournament Registration Page** - Category selection, partner input, payment summary
2. **Razorpay Checkout Integration** - Payment modal and verification
3. **My Registrations Page** - View all user registrations
4. **Registration Card Component** - Display registration details
5. **Payment Success/Failure Pages** - Handle payment callbacks

---

## 📋 Components to Create

### 1. TournamentRegistrationPage.jsx
- Display tournament details
- Show available categories with prices
- Category selection (checkboxes)
- Partner email input (for doubles)
- Payment summary
- Wallet balance display
- Register button

### 2. CategorySelector.jsx
- List of categories with checkboxes
- Display: name, format, gender, entry fee
- Calculate total on selection
- Validation for doubles (require partner)

### 3. PaymentSummary.jsx
- Show selected categories
- Display total amount
- Show wallet balance
- Calculate wallet usage
- Show Razorpay amount (if any)
- Breakdown of payment

### 4. RazorpayCheckout.jsx
- Initialize Razorpay
- Handle payment success
- Handle payment failure
- Verify payment with backend

### 5. MyRegistrationsPage.jsx
- List all user registrations
- Filter by status
- Display tournament details
- Show payment status
- Cancel registration button

### 6. RegistrationCard.jsx
- Display registration info
- Tournament details
- Category info
- Payment details
- Status badges
- Cancel button

---

## 🚀 Implementation Steps

### Step 1: Create Registration API Service (10 mins)

### Step 2: Build Category Selector Component (20 mins)

### Step 3: Build Payment Summary Component (15 mins)

### Step 4: Build Tournament Registration Page (30 mins)

### Step 5: Integrate Razorpay Checkout (30 mins)

### Step 6: Build My Registrations Page (25 mins)

### Step 7: Add Registration Routes (10 mins)

### Step 8: Test Complete Flow (20 mins)

---

## 📊 Total Time: ~2.5 hours

Let's start! 🚀
