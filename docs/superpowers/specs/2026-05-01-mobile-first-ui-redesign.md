# Mobile-First UI Redesign — Staff & Customer Views

**Date:** 2026-05-01
**Approach:** C — Mobile-First Rebuild + PWA

---

## Scope

Redesign the **staff** and **customer portal** views to be mobile-first. The admin view is out of scope for this sprint. Backend is unchanged.

Both views are single-column layouts that centre in a `maxWidth: 480px` container on desktop — they look intentional on large screens, not broken.

---

## 1. Staff View

### What staff does
One action: record a cash (or online) payment for a customer. The current 4-step stepper flow is kept but rebuilt for mobile.

### Layout
- No sidebar, no drawer. Staff has nothing else to navigate to.
- Simple top bar: app name left, logout avatar right.
- The entire screen is the payment stepper.

### Stepper redesign
Replace the horizontal MUI `Stepper` with text labels (clips on mobile) with:
- A thin progress bar (fills 25% → 50% → 75% → 100% per step)
- A `Step N of 4 · <Step Name>` label in small text above the bar

### Step 1 — Search Customer
- Large search input, full-width, focused on mount
- Results render as a scrollable list of touch-friendly rows (min 44px height)
- Each row: room number avatar, customer name, gunta + monthly charge
- Replaces the MUI `Autocomplete` dropdown which has small touch targets
- Skeleton: 3 placeholder rows animate while customers load

### Step 2 — Select Period
- Customer summary pill pinned below the progress bar (stays visible every step after selection): avatar initial, name, room, monthly charge
- From month: read-only field, auto-set to earliest unpaid month
- To month: native `<input type="month">` picker
- Amount summary block: "N months × ₹X = ₹Total" — updates live as To month changes

### Step 3 — Confirm Payment
- Customer pill still pinned
- Cash / Online toggle (MUI `ToggleButtonGroup`, full-width, large)
- Payment summary: period, months, method, amount
- Amount displayed large and prominent

### Step 4 — Result
- Header bar turns green on success
- Invoice number, customer, period, amount in a success card
- WhatsApp button: full-width green block (not secondary), sends pre-filled message
- "New Payment" button below resets to Step 1

### Action buttons
All Back / Next / Confirm buttons span the full width at the bottom of the card, separated by a border. Next/Confirm takes 2/3 width, Back takes 1/3.

### Loading & error states
- Step 1 customer list: skeleton rows (shimmer) while loading
- Confirm action: button shows inline spinner, disabled during mutation
- API error: inline `Alert` above the buttons, not just a toast

---

## 2. Customer Portal View

### What customers see
Read-mostly. Customers check their payment status and can initiate an online payment. No navigation needed.

### Layout
- No sidebar. Single scrollable column.
- Header bar (blue): customer name, "Room N · Gunta X", monthly charge inline, logout button.

### Hero status card
The most prominent element — immediately communicates whether payment is needed.

**Paid state:** Green gradient card, large checkmark, "All paid up!", current month.

**Pending state:** Red gradient card with:
- "PENDING BALANCE" label
- Large rupee amount (e.g. ₹1,200)
- "N months · Since MMM YYYY"
- A divider
- "Paying for" block: formatted period (e.g. "Apr – May 2026") + amount
- Full-width "Pay Now →" button below (white background, red text) — not side-by-side with the period

### Invoice history
Replaces the MUI `Table` (which clips horizontally on mobile) with a card list:
- Each row: invoice number + human-readable period on the left, amount + method chip on the right
- Period format: "Feb – Mar 2026" not "2026-02 to 2026-03"
- No table headers needed — layout is self-evident

### Loading state
Skeleton screen mirrors the exact layout: header skeleton (blue-tinted), hero card placeholder, 2–3 invoice row placeholders. No centered spinner.

---

## 3. Cross-Cutting

### Skeleton loaders
Replace all `if (isLoading) return <CircularProgress>` patterns in staff and customer views with layout-matched skeleton screens using MUI `Skeleton`. Shimmer animation via `animation="wave"`.

### Touch targets
All interactive elements (buttons, list rows, toggles) minimum 44×44px. Icon-only buttons get explicit `sx={{ p: '10px' }}` or similar padding.

### ARIA
- Search input: `aria-label="Search customers by room number or name"`
- Progress bar region: `aria-label="Step N of 4"` + `role="progressbar"`
- Status hero card: `role="status"` so screen readers announce it
- Stepper step: `aria-current="step"`
- Buttons: descriptive labels (not just "Next" — "Next: Select Period")

### Error states
Inline `Alert` component for mutation errors in both views. Toast (`react-hot-toast`) retained for success confirmations only.

### Focus management
- On step advance: focus moves to the top of the new step content
- On result screen: focus moves to the invoice number heading
- No focus traps outside of dialogs

### Date formatting
Utility function `formatMonth(yyyyMm: string): string` → "Apr 2026". Used everywhere months are displayed to users (not in form inputs).

---

## 4. PWA

### Configuration (vite-plugin-pwa — already installed)
```
registerType: 'autoUpdate'
manifest:
  name: Water Invoice
  short_name: Water Invoice
  theme_color: #2563eb
  background_color: #ffffff
  display: standalone
  start_url: /
  icons: 192×192 + 512×512 (blue background, water droplet)
workbox:
  strategy: NetworkFirst for /api/*
  strategy: CacheFirst for static assets
  offlineFallback: /offline.html
```

### Offline fallback page (`/offline.html`)
Static HTML served by the service worker when a navigation request fails due to no network. Shows: app icon, "No connection" heading, brief message, "Try again" button that reloads.

### Install prompt
Uses the `beforeinstallprompt` event. A custom banner appears at the bottom of the screen (above the action buttons) the first time the app is loaded in a browser session. Dismissible ("Not now" hides it for the session). Not shown if already installed (`display-mode: standalone`).

### Gitignore
Add `.superpowers/` to `.gitignore`.

---

## Out of Scope

- Admin view (dashboard, customer management, reports, gunta management)
- Backend changes
- Push notifications
- Offline payment queuing (service worker caches static assets only; API calls still require network)
