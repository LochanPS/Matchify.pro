# Remove Organizer Approval Controls - Implementation Guide

## Issue
Organizers currently have the ability to approve/reject player registrations, but this should be handled only by admin. The payment flow should be:

**Current (Incorrect):**
```
Player pays → Organizer approves/rejects → Player registered
```

**Correct Flow:**
```
Player pays → Admin approves/rejects → Player registered
```

## Changes Required

### 1. TournamentManagementPage.jsx
**Remove these functions:**
- `handleApprove()`
- `handleReject()` 
- `handleApproveRefund()`
- `handleRejectRefund()`

**Remove these imports:**
- `approveRegistration`
- `rejectRegistration`
- `approveRefund`
- `rejectRefund`

**Update UI for pending registrations:**
```jsx
// BEFORE: Approve/Reject buttons
{registration.status === 'pending' && (
  <div className="flex items-center gap-2">
    <button onClick={() => approve()}>✓</button>
    <button onClick={() => reject()}>✗</button>
  </div>
)}

// AFTER: Status message only
{registration.status === 'pending' && (
  <span className="text-yellow-400 text-sm flex items-center gap-1">
    <Clock className="h-4 w-4" />
    Pending Admin Approval
  </span>
)}
```

**Update UI for refund requests:**
```jsx
// BEFORE: Approve/Reject refund buttons
{registration.status === 'cancellation_requested' && (
  <div className="flex items-center gap-2">
    <button onClick={() => approveRefund()}>✓</button>
    <button onClick={() => rejectRefund()}>✗</button>
  </div>
)}

// AFTER: Status message only
{registration.status === 'cancellation_requested' && (
  <span className="text-orange-400 text-sm flex items-center gap-1">
    <AlertTriangle className="h-4 w-4" />
    Awaiting Admin Decision
  </span>
)}
```

**Remove confirmation modals:**
- Remove `approve` modal
- Remove `reject` modal  
- Remove `approveRefund` modal
- Remove `rejectRefund` modal
- Keep only `remove` modal for organizer actions

### 2. Update Status Messages
**Show clear messages to organizers:**
- "Pending Admin Approval" - for pending registrations
- "Awaiting Admin Decision" - for refund requests
- "Admin will handle payment verification" - informational text

### 3. Admin-Only Approval Flow
**Ensure only admin can:**
- Approve/reject player payments
- Approve/reject refund requests
- Manage registration status changes

**Organizers can only:**
- View registration details
- View payment screenshots (read-only)
- Remove registrations (if needed)
- Export participant lists

## Implementation Steps

1. **Remove approval functions** from TournamentManagementPage.jsx
2. **Update UI elements** to show status messages instead of action buttons
3. **Remove confirmation modals** for approve/reject actions
4. **Update imports** to remove unused approval functions
5. **Test the flow** to ensure organizers cannot approve/reject

## Expected Result

**Organizer View:**
- Can see all registrations and their status
- Can view payment details (read-only)
- Cannot approve or reject payments
- Clear status messages showing admin is handling approvals

**Admin View:**
- Full control over payment approvals
- Can approve/reject from admin payment verification page
- Organizers notified automatically when admin takes action

## Status Messages for Organizers

```jsx
// Pending Registration
<span className="text-yellow-400">
  <Clock className="w-4 h-4" />
  Pending Admin Approval
</span>

// Confirmed Registration  
<span className="text-green-400">
  <CheckCircle className="w-4 h-4" />
  Approved by Admin
</span>

// Refund Request
<span className="text-orange-400">
  <AlertTriangle className="w-4 h-4" />
  Awaiting Admin Decision
</span>
```

This ensures organizers understand that admin handles all payment-related decisions while they can still manage their tournament logistics.