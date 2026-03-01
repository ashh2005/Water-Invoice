# SMS Integration Plan — MSG91 + DLT

## Overview

This document covers the full SMS integration for the Water Collection Invoice System using **MSG91** as the SMS provider. SMS is used for:
1. **Payment confirmation** — auto-sent after every cash/online payment
2. **Monthly reminders** — cron job on 1st of each month for unpaid rooms
3. **Manual resend** — staff can resend SMS for any invoice

---

## Prerequisites (Manual Setup — Do Before Implementation)

### 1. DLT Registration (TRAI Mandatory)

Register on any one DLT portal (Jio TrueConnect recommended):

| Step | What | Details |
|------|------|---------|
| 1 | Entity registration | Business name, PAN, GST (optional), ID proof. Fee ~Rs.5,900. Approval: 2–7 days |
| 2 | Sender ID (Header) | 6-character ID customers see (e.g., `WTRBIL`). Approval: 1–2 days |
| 3 | Template registration | Register each SMS template with `{#var#}` placeholders. Approval: 1–3 days |

### 2. MSG91 Account Setup

1. Create account at msg91.com
2. Go to **SMS** > **Settings** > add your DLT Entity ID
3. Add your approved Sender ID
4. Add each approved template with its DLT Template ID
5. Get your **MSG91 Auth Key** from Dashboard > API Keys

### 3. Items You'll Need

After DLT + MSG91 setup, you'll have these values to add to `.env`:

```env
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=WTRBIL          # Your 6-char DLT-approved sender ID
MSG91_DLT_TE_ID=your_entity_id  # DLT Entity ID

# Template IDs (from MSG91 dashboard after adding DLT templates)
MSG91_TEMPLATE_PAYMENT_CONFIRMATION=template_id_1
MSG91_TEMPLATE_MONTHLY_REMINDER=template_id_2
```

---

## SMS Templates to Register on DLT

Register these exact templates on your DLT portal. `{#var#}` is the standard DLT placeholder for dynamic content.

### Template 1: Payment Confirmation

```
Payment received! Invoice: {#var#}, Room: {#var#}, Name: {#var#}, Period: {#var#} to {#var#}, Amount: Rs.{#var#}, Method: {#var#}. Pending: Rs.{#var#}. Thank you!
```

**Category:** Transactional

### Template 2: Monthly Reminder

```
Water Bill Reminder: Room {#var#}, Pending: {#var#} month(s), Amount: Rs.{#var#}. Please pay at the earliest. Thank you.
```

**Category:** Transactional

---

## Implementation Plan

### What Exists Today

| File | Current State |
|------|---------------|
| `services/smsService.ts` | Uses 2Factor API — needs replacing with MSG91 |
| `services/notificationService.ts` | Builds messages and calls smsService — needs template-based approach |
| `services/reminderService.ts` | Cron logic for monthly reminders — message format needs updating |
| `services/paymentService.ts` | Auto-triggers SMS after payment — no changes needed |
| `models/Invoice.ts` | Has `smsSent` and `smsError` fields — no changes needed |
| `.env` | Missing SMS config vars — needs adding |

### Changes Required

#### 1. Update `backend/.env` and `.env.example`

Remove 2Factor vars, add MSG91 vars:

```env
# MSG91 SMS Configuration
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_DLT_TE_ID=
MSG91_TEMPLATE_PAYMENT_CONFIRMATION=
MSG91_TEMPLATE_MONTHLY_REMINDER=
```

#### 2. Rewrite `backend/src/services/smsService.ts`

Replace 2Factor API calls with MSG91 Send SMS API.

**MSG91 API details:**
- Endpoint: `https://control.msg91.com/api/v5/flow/`
- Method: POST
- Headers: `{ authkey: MSG91_AUTH_KEY }`
- Body: template ID, sender, recipients with variable values

The function signature changes from `sendSMS(mobile, message)` to `sendTemplateSMS(mobile, templateId, variables)` since MSG91 uses pre-registered templates (not raw text).

#### 3. Update `backend/src/services/notificationService.ts`

Instead of building a raw message string, pass structured variables to the template:

```
sendPaymentConfirmationSMS(invoiceId):
  1. Fetch invoice, customer, room (same as now)
  2. Call sendTemplateSMS(customer.mobile, TEMPLATE_PAYMENT_CONFIRMATION, {
       invoiceNumber, roomNumber, customerName,
       fromMonth, toMonth, amount, method, pendingAmount
     })
  3. Update invoice.smsSent flag (same as now)
```

#### 4. Update `backend/src/services/reminderService.ts`

Same change — use template-based sending:

```
sendMonthlyReminders():
  1. Find unpaid rooms (same as now)
  2. For each: call sendTemplateSMS(mobile, TEMPLATE_MONTHLY_REMINDER, {
       roomNumber, pendingMonths, pendingAmount
     })
```

#### 5. No changes needed in:
- `paymentService.ts` — already calls notificationService correctly
- `invoiceController.ts` — resend endpoint already works
- `Invoice` model — `smsSent`/`smsError` fields stay the same
- `reminderService.ts` cron schedule — stays `0 9 1 * *`

---

## MSG91 API Reference

### Send SMS via Flow (Template)

```
POST https://control.msg91.com/api/v5/flow/
Headers: { authkey: "your_auth_key", "content-type": "application/json" }
Body: {
  "template_id": "DLT_TEMPLATE_ID",
  "short_url": "0",
  "recipients": [
    {
      "mobiles": "919876543210",   // with country code
      "var1": "INV-00001",
      "var2": "301",
      "var3": "Prem"
      // ... variables map to {#var#} placeholders in order
    }
  ]
}
```

### Response

```json
{ "type": "success", "message": "..." }
```

---

## Testing

1. MSG91 provides a **sandbox/test mode** — use it before going live
2. Verify SMS delivery on a real phone number after going live
3. Check `Invoice.smsSent` field in DB to confirm tracking works
4. Test the "Resend SMS" button on the invoice page
5. Test reminder cron by manually calling `sendMonthlyReminders()`

---

## Summary of Files to Change

| File | Action |
|------|--------|
| `backend/.env` | Add MSG91 config vars |
| `backend/.env.example` | Add MSG91 config vars |
| `backend/src/services/smsService.ts` | Rewrite: 2Factor → MSG91 API |
| `backend/src/services/notificationService.ts` | Update: raw message → template variables |
| `backend/src/services/reminderService.ts` | Update: raw message → template variables |

Total: **5 files**, no new files needed.
