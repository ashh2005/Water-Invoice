# Feature Enhancements Design
Date: 2026-05-01

## Overview

Four features to add to the Water Collection Invoice System:
1. Name-wise invoice filter
2. Report generation (monthly summary + per-gunta detail)
3. Gunta-to-staff allocation (informational)
4. WhatsApp payment reminders for defaulters

---

## Feature 1: Name-wise Invoice Filter

### Backend
- **File**: `backend/src/controllers/invoiceController.ts` / `backend/src/services/invoiceService.ts`
- Accept `customerName` as an optional query param on `GET /api/invoices`.
- Implementation: find all customer IDs where `nameEnglish` matches a case-insensitive regex on `customerName`, then add those IDs as an `$in` filter on the invoice query.
- No new routes needed.

### Frontend
- **File**: `frontend/src/pages/invoices/InvoicePage.tsx`
- Add a "Customer Name" text field alongside the existing date and payment method filters.
- Debounce input by 300ms before passing to `useInvoices` hook as `customerName` param.
- Update `useInvoices` hook and `invoiceService` to pass `customerName` to the API.

---

## Feature 2: Report Generation

### 2a. Monthly Summary Tab

**What it shows**: Total collected for a chosen month, cash vs online split, gunta-wise breakdown table, defaulter count for that month.

**Backend**: No new endpoint. Reuses existing `GET /api/reports/collection-summary?fromDate=&toDate=` with month start/end dates. Defaulter count comes from the existing defaulters endpoint filtered conceptually (already returns current-month defaulters).

**Frontend** (`frontend/src/pages/reports/ReportsPage.tsx`):
- New tab: "Monthly Summary"
- Month picker (year-month input)
- On selection, derive `fromDate` = first of month, `toDate` = last of month, call existing `useCollectionSummary`
- Display: summary cards (total, cash, online), gunta-wise table
- Export buttons: PDF and Excel

### 2b. Per-Gunta Detail Tab

**What it shows**: For a selected gunta + month range, two sections — Paid (customers with invoices in that period) and Unpaid (customers with no invoice).

**Backend**:
- New endpoint: `GET /api/reports/gunta-detail?guntaId=&fromMonth=&toMonth=`
- New service method `getGuntaDetail(guntaId, fromMonth, toMonth)` in `backend/src/services/reportService.ts`:
  1. Fetch all customers in the gunta
  2. For each customer, check if an invoice exists with `paidFromMonth <= toMonth` and `paidToMonth >= fromMonth`
  3. Return `{ paid: [...], unpaid: [...], paidTotal, unpaidTotal }`
- New controller method in `backend/src/controllers/reportController.ts`
- New route in `backend/src/routes/reportRoutes.ts`

**Frontend** (`frontend/src/pages/reports/ReportsPage.tsx`):
- New tab: "Gunta Detail"
- Gunta dropdown (fetched from existing guntas API) + from/to month pickers
- Two tables: Paid (room, name, amount, date, method) and Unpaid (room, name, monthly charge, pending amount)
- Export to PDF and Excel (both sections together)
- New hook `useGuntaDetail` and service call in `frontend/src/services/reportService.ts`

---

## Feature 3: Gunta-to-Staff Allocation

### Backend
- **`backend/src/models/Gunta.ts`**: Add optional field `assignedStaff: { type: ObjectId, ref: 'User' }`
- **`backend/src/services/guntaService.ts`**: Populate `assignedStaff` with `username, role` in `getGuntas` and `getGuntaById`. Accept `assignedStaff` in create/update.
- **New endpoint**: `GET /api/users/staff` — returns all active users with `role: 'staff'`. Added to a new `backend/src/routes/userRoutes.ts` with admin-only auth middleware.

### Frontend
- **`frontend/src/pages/guntas/GuntaManagementPage.tsx`**:
  - Add "Assigned Staff" column to the table (shows username or "Unassigned")
  - In create/edit dialog, add optional dropdown populated from new `/api/users/staff` endpoint
- **`frontend/src/services/guntaService.ts`**: pass `assignedStaff` in create/update payloads
- **`frontend/src/types/index.ts`**: update `Gunta` type to include `assignedStaff` (optional User object)

---

## Feature 4: WhatsApp Payment Reminders

### Scope
Per-row WhatsApp button on the defaulters list. No bulk send. No backend changes.

### Frontend (`frontend/src/pages/reports/ReportsPage.tsx`)
- In the Defaulters tab, add a WhatsApp icon button to each row.
- On click, construct reminder message:
  > "Dear [nameEnglish], your water bill of Rs.[pendingAmount] is pending for [pendingMonths] month(s) since [pendingFrom]. Please pay at the earliest. Thank you."
- Open `https://wa.me/91[mobile]?text=[encodedMessage]` in a new tab.
- Track sent status in local component state (a `Set` of customer IDs that have been reminded this session). Show a green WhatsApp icon / "Sent" chip once sent — resets on page refresh.

---

## Data Flow Summary

| Feature | Backend changes | Frontend changes |
|---|---|---|
| Name filter | invoiceService query + param | InvoicePage filter + hook param |
| Monthly Summary | None (reuse existing) | New tab + month picker |
| Gunta Detail | New endpoint + service method | New tab + hook + service |
| Gunta-Staff alloc | Gunta model field + users endpoint | Gunta page dropdown + column |
| WhatsApp reminders | None | Defaulters tab row button |

---

## Out of Scope
- "Send to All" bulk WhatsApp (deferred)
- Access control based on gunta-staff assignment
- Persisting WhatsApp reminder status to DB
