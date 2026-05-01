# Mobile-First UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the staff payment flow and customer portal as mobile-first, PWA-installable views with skeleton loaders, 44px touch targets, and proper ARIA labels.

**Architecture:** Staff `/payments` gets a new `StaffLayout` (no sidebar) and a rebuilt `PaymentPage` that replaces the MUI `Stepper` with a progress bar and touch-friendly components. The customer `/dashboard` is rebuilt in-place as a single-column layout with a hero status card and invoice card list. Cross-cutting utilities (`formatMonth`) and the PWA config are shared infrastructure built first.

**Tech Stack:** React 18, TypeScript, MUI v5, TanStack Query v5, vite-plugin-pwa (already installed), vitest + testing-library

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `frontend/src/utils/formatMonth.ts` | `formatMonth("2026-04")` → `"Apr 2026"`, `formatMonthRange("2026-02","2026-03")` → `"Feb – Mar 2026"` |
| `frontend/src/utils/formatMonth.test.ts` | Unit tests for above |
| `frontend/src/layouts/StaffLayout.tsx` | Minimal layout: blue top bar + children, no sidebar |
| `frontend/src/components/staff/PaymentProgress.tsx` | Progress bar + "Step N of 4 · Name" label |
| `frontend/src/components/staff/CustomerPill.tsx` | Pinned customer summary pill (avatar, name, room, charge) |
| `frontend/src/components/staff/CustomerSearchList.tsx` | Touch-friendly customer rows + shimmer skeleton |
| `frontend/src/components/staff/CustomerSearchList.test.tsx` | Renders skeleton while loading; renders rows when data arrives |
| `frontend/src/components/customer-portal/HeroStatusCard.tsx` | Green (paid) / red (pending) hero card with Pay Now CTA |
| `frontend/src/components/customer-portal/InvoiceCardList.tsx` | Card list replacing the MUI Table |
| `frontend/src/hooks/usePWAInstall.ts` | Captures `beforeinstallprompt`, exposes `prompt()` + `canInstall` |
| `frontend/src/components/common/InstallBanner.tsx` | Dismissible bottom banner; hidden if already installed |
| `frontend/public/offline.html` | Offline fallback page served by service worker |

### Modified files
| File | Change |
|------|--------|
| `frontend/src/pages/payments/PaymentPage.tsx` | Replace all JSX with mobile-first components; keep all state logic |
| `frontend/src/pages/customer-portal/CustomerDashboardPage.tsx` | Full JSX rebuild; keep data fetching hooks |
| `frontend/src/App.tsx` | `/payments` → `StaffLayout` instead of `DashboardLayout`; add `<InstallBanner>` |
| `frontend/vite.config.ts` | Add `navigateFallback: '/offline.html'` to workbox config |
| `.gitignore` | Add `.superpowers/` |

---

## Task 1: `formatMonth` utility

**Files:**
- Create: `frontend/src/utils/formatMonth.ts`
- Create: `frontend/src/utils/formatMonth.test.ts`

- [ ] **Step 1.1 — Write failing tests**

```ts
// frontend/src/utils/formatMonth.test.ts
import { describe, it, expect } from 'vitest';
import { formatMonth, formatMonthRange } from './formatMonth';

describe('formatMonth', () => {
  it('formats a single month', () => {
    expect(formatMonth('2026-04')).toBe('Apr 2026');
    expect(formatMonth('2026-01')).toBe('Jan 2026');
    expect(formatMonth('2026-12')).toBe('Dec 2026');
  });
});

describe('formatMonthRange', () => {
  it('formats a same-month range as a single month', () => {
    expect(formatMonthRange('2026-04', '2026-04')).toBe('Apr 2026');
  });
  it('formats a multi-month range', () => {
    expect(formatMonthRange('2026-02', '2026-03')).toBe('Feb – Mar 2026');
    expect(formatMonthRange('2025-11', '2026-01')).toBe('Nov 2025 – Jan 2026');
  });
});
```

- [ ] **Step 1.2 — Run to confirm failure**

```bash
cd frontend && npx vitest run src/utils/formatMonth.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 1.3 — Implement**

```ts
// frontend/src/utils/formatMonth.ts
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatMonthRange(from: string, to: string): string {
  if (from === to) return formatMonth(from);
  return `${formatMonth(from)} – ${formatMonth(to)}`;
}
```

- [ ] **Step 1.4 — Run to confirm pass**

```bash
cd frontend && npx vitest run src/utils/formatMonth.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 1.5 — Commit**

```bash
git add frontend/src/utils/formatMonth.ts frontend/src/utils/formatMonth.test.ts
git commit -m "feat: add formatMonth utility"
```

---

## Task 2: `StaffLayout`

**Files:**
- Create: `frontend/src/layouts/StaffLayout.tsx`

- [ ] **Step 2.1 — Create the component**

```tsx
// frontend/src/layouts/StaffLayout.tsx
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ minHeight: 52 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
            Record Payment
          </Typography>
          <Typography variant="caption" sx={{ mr: 1, opacity: 0.8 }}>
            {user?.username}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="Logout"
            size="small"
            sx={{ p: '10px' }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
              <Logout fontSize="small" />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 2.2 — Verify it renders (manual check)**

Start the dev server (`cd frontend && npm run dev`) and temporarily change the `/payments` route in `frontend/src/App.tsx` to use `<StaffLayout>` instead of `<DashboardLayout>`, log in as staff, and confirm the top bar appears with the logout button. Revert the App.tsx change — this will be done properly in Task 9.

- [ ] **Step 2.3 — Commit**

```bash
git add frontend/src/layouts/StaffLayout.tsx
git commit -m "feat: add StaffLayout — minimal top bar, no sidebar"
```

---

## Task 3: `PaymentProgress` component

**Files:**
- Create: `frontend/src/components/staff/PaymentProgress.tsx`

- [ ] **Step 3.1 — Create the component**

```tsx
// frontend/src/components/staff/PaymentProgress.tsx
import { Box, Typography, LinearProgress } from '@mui/material';

const STEP_NAMES = ['Search Customer', 'Select Period', 'Confirm Payment', 'Done'];

interface PaymentProgressProps {
  step: number; // 0-indexed, 0–3
}

export const PaymentProgress: React.FC<PaymentProgressProps> = ({ step }) => {
  const pct = ((step + 1) / 4) * 100;
  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography
          variant="caption"
          fontWeight={700}
          color="primary"
          aria-live="polite"
          aria-label={`Step ${step + 1} of 4: ${STEP_NAMES[step]}`}
        >
          Step {step + 1} of 4
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {STEP_NAMES[step]}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={4}
        sx={{ height: 4, borderRadius: 2 }}
      />
    </Box>
  );
};
```

- [ ] **Step 3.2 — Commit**

```bash
git add frontend/src/components/staff/PaymentProgress.tsx
git commit -m "feat: add PaymentProgress bar component"
```

---

## Task 4: `CustomerPill` component

**Files:**
- Create: `frontend/src/components/staff/CustomerPill.tsx`

- [ ] **Step 4.1 — Create the component**

```tsx
// frontend/src/components/staff/CustomerPill.tsx
import { Box, Typography, Avatar } from '@mui/material';
import { Customer, Gunta } from '../../types';

interface CustomerPillProps {
  customer: Customer;
}

export const CustomerPill: React.FC<CustomerPillProps> = ({ customer }) => {
  const guntaName = typeof customer.guntaId === 'object'
    ? (customer.guntaId as Gunta).name
    : '';
  const initial = customer.nameEnglish.charAt(0).toUpperCase();

  return (
    <Box
      sx={{
        mx: 2, mt: 1.5, p: 1.5,
        bgcolor: 'primary.50',
        border: '1px solid',
        borderColor: 'primary.200',
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
      aria-label={`Selected customer: ${customer.nameEnglish}, Room ${customer.roomNumber}`}
    >
      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
        {initial}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={700} color="text.primary" lineHeight={1.2}>
          {customer.nameEnglish} · Room {customer.roomNumber}
        </Typography>
        <Typography variant="caption" color="primary.main">
          ₹{customer.monthlyCharge}/month · {guntaName}
        </Typography>
      </Box>
    </Box>
  );
};
```

- [ ] **Step 4.2 — Commit**

```bash
git add frontend/src/components/staff/CustomerPill.tsx
git commit -m "feat: add CustomerPill summary component"
```

---

## Task 5: `CustomerSearchList` component

**Files:**
- Create: `frontend/src/components/staff/CustomerSearchList.tsx`
- Create: `frontend/src/components/staff/CustomerSearchList.test.tsx`

- [ ] **Step 5.1 — Write failing tests**

```tsx
// frontend/src/components/staff/CustomerSearchList.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerSearchList } from './CustomerSearchList';
import { Customer } from '../../types';

const mockCustomers: Customer[] = [
  { _id: '1', nameEnglish: 'Prem Thatikonda', roomNumber: '101', mobile: '9876543210', monthlyCharge: 600, status: 'Rented', guntaId: { _id: 'g1', name: 'Gunta A' } as any, createdAt: '', updatedAt: '' },
  { _id: '2', nameEnglish: 'Aayush Chounkar', roomNumber: '103', mobile: '9876543211', monthlyCharge: 600, status: 'Rented', guntaId: { _id: 'g1', name: 'Gunta A' } as any, createdAt: '', updatedAt: '' },
];

describe('CustomerSearchList', () => {
  it('shows skeleton rows while loading', () => {
    render(
      <CustomerSearchList
        customers={[]}
        isLoading={true}
        search=""
        onSearchChange={() => {}}
        onSelect={() => {}}
      />
    );
    expect(screen.getAllByTestId('customer-row-skeleton')).toHaveLength(3);
  });

  it('renders customer rows when loaded', () => {
    render(
      <CustomerSearchList
        customers={mockCustomers}
        isLoading={false}
        search=""
        onSearchChange={() => {}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('Prem Thatikonda')).toBeInTheDocument();
    expect(screen.getByText('Aayush Chounkar')).toBeInTheDocument();
  });

  it('calls onSelect with the customer when a row is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <CustomerSearchList
        customers={mockCustomers}
        isLoading={false}
        search=""
        onSearchChange={() => {}}
        onSelect={onSelect}
      />
    );
    await userEvent.click(screen.getByText('Prem Thatikonda'));
    expect(onSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });
});
```

- [ ] **Step 5.2 — Run to confirm failure**

```bash
cd frontend && npx vitest run src/components/staff/CustomerSearchList.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 5.3 — Implement**

```tsx
// frontend/src/components/staff/CustomerSearchList.tsx
import { Box, TextField, InputAdornment, Skeleton, Typography, Avatar } from '@mui/material';
import { Search } from '@mui/icons-material';
import { Customer, Gunta } from '../../types';

interface CustomerSearchListProps {
  customers: Customer[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
}

export const CustomerSearchList: React.FC<CustomerSearchListProps> = ({
  customers, isLoading, search, onSearchChange, onSelect,
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Search by room number or name"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
        inputProps={{ 'aria-label': 'Search customers by room number or name' }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
          sx: { borderRadius: 2.5, fontSize: 15 },
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <Box
              key={i}
              data-testid="customer-row-skeleton"
              sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: i < 2 ? '1px solid' : 'none', borderColor: 'divider' }}
            >
              <Skeleton variant="circular" width={36} height={36} animation="wave" />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="65%" height={14} animation="wave" sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="45%" height={11} animation="wave" />
              </Box>
            </Box>
          ))
        ) : customers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No customers found</Typography>
          </Box>
        ) : (
          customers.map((customer, i) => {
            const guntaName = typeof customer.guntaId === 'object' ? (customer.guntaId as Gunta).name : '';
            return (
              <Box
                key={customer._id}
                onClick={() => onSelect(customer)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${customer.nameEnglish}, Room ${customer.roomNumber}`}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(customer)}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderBottom: i < customers.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  minHeight: 56,
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-2px' },
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 13, fontWeight: 700 }}>
                  {customer.roomNumber}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {customer.nameEnglish}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {guntaName} · ₹{customer.monthlyCharge}/mo
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 5.4 — Run to confirm pass**

```bash
cd frontend && npx vitest run src/components/staff/CustomerSearchList.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5.5 — Commit**

```bash
git add frontend/src/components/staff/CustomerSearchList.tsx frontend/src/components/staff/CustomerSearchList.test.tsx
git commit -m "feat: add CustomerSearchList with skeleton loading"
```

---

## Task 6: Rebuild `PaymentPage` — Steps 1 & 2

**Files:**
- Modify: `frontend/src/pages/payments/PaymentPage.tsx`

All existing state variables and hooks (`selectedCustomer`, `fromMonth`, `toMonth`, `paidMonths`, `nextUnpaidMonth`, `overlapWarning`, `months`, `amount`, `handleSubmit`, `handleReset`) stay unchanged. Only the JSX returned is replaced.

- [ ] **Step 6.1 — Replace the full file**

```tsx
// frontend/src/pages/payments/PaymentPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, TextField, Button, ToggleButtonGroup, ToggleButton,
  Typography, Divider, CircularProgress, Alert, Chip,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCustomers } from '../../hooks/useCustomers';
import { useRecordCashPayment, useCreateOnlinePayment } from '../../hooks/usePayments';
import { useInvoices, useMarkWhatsappSent } from '../../hooks/useInvoices';
import { Customer, Gunta, Invoice } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentProgress } from '../../components/staff/PaymentProgress';
import { CustomerPill } from '../../components/staff/CustomerPill';
import { CustomerSearchList } from '../../components/staff/CustomerSearchList';
import { formatMonth, formatMonthRange } from '../../utils/formatMonth';

// ── helpers ──────────────────────────────────────────────────────────────────

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

// ── shared bottom button bar ──────────────────────────────────────────────────

const ActionBar: React.FC<{
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextColor?: 'primary' | 'success';
}> = ({ onBack, onNext, nextLabel, nextDisabled, nextLoading, nextColor = 'primary' }) => (
  <Box sx={{ display: 'flex', borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
    {onBack && (
      <Button
        onClick={onBack}
        sx={{ flex: 1, borderRadius: 0, py: 1.5, color: 'text.secondary', borderRight: '1px solid', borderColor: 'divider' }}
        aria-label="Go back to previous step"
      >
        ← Back
      </Button>
    )}
    <Button
      variant="contained"
      color={nextColor}
      onClick={onNext}
      disabled={nextDisabled || nextLoading}
      sx={{ flex: 2, borderRadius: 0, py: 1.5, fontWeight: 700 }}
    >
      {nextLoading ? <CircularProgress size={20} color="inherit" /> : nextLabel}
    </Button>
  </Box>
);

// ── main page ─────────────────────────────────────────────────────────────────

export const PaymentPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [result, setResult] = useState<{ invoice: Invoice; razorpayOrder?: any; razorpayKeyId?: string } | null>(null);
  const [error, setError] = useState('');
  const stepTopRef = useRef<HTMLDivElement>(null);

  const { data: customers, isLoading: customersLoading } = useCustomers({ status: 'Rented' });
  const cashMutation = useRecordCashPayment();
  const onlineMutation = useCreateOnlinePayment();
  const markWhatsappSent = useMarkWhatsappSent();
  const { data: customerInvoices } = useInvoices(
    selectedCustomer ? { customerId: selectedCustomer._id } : undefined
  );

  // Move focus to top of new step on advance
  useEffect(() => {
    stepTopRef.current?.focus();
  }, [activeStep]);

  const paidMonths = useMemo(() => {
    const set = new Set<string>();
    if (!customerInvoices) return set;
    for (const inv of customerInvoices) {
      const [fy, fm] = inv.paidFromMonth.split('-').map(Number);
      const [ty, tm] = inv.paidToMonth.split('-').map(Number);
      let y = fy, m = fm;
      while (y < ty || (y === ty && m <= tm)) {
        set.add(`${y}-${String(m).padStart(2, '0')}`);
        m++; if (m > 12) { m = 1; y++; }
      }
    }
    return set;
  }, [customerInvoices]);

  const nextUnpaidMonth = useMemo((): string | null => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!selectedCustomer || paidMonths.size === 0) return currentMonth;
    const sorted = Array.from(paidMonths).sort();
    const [sy, sm] = sorted[0].split('-').map(Number);
    let y = sy, m = sm;
    while (`${y}-${String(m).padStart(2, '0')}` <= currentMonth) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (!paidMonths.has(key)) return key;
      m++; if (m > 12) { m = 1; y++; }
    }
    return null;
  }, [selectedCustomer, paidMonths]);

  const overlapWarning = useMemo(() => {
    if (!fromMonth || !toMonth || paidMonths.size === 0) return '';
    const overlapping: string[] = [];
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (paidMonths.has(key)) overlapping.push(formatMonth(key));
      m++; if (m > 12) { m = 1; y++; }
    }
    return overlapping.length ? `Already paid: ${overlapping.join(', ')}` : '';
  }, [fromMonth, toMonth, paidMonths]);

  const months = useMemo(() => {
    if (!fromMonth || !toMonth) return 0;
    return Math.max(monthDiff(fromMonth, toMonth), 0);
  }, [fromMonth, toMonth]);

  const amount = useMemo(() => months * (selectedCustomer?.monthlyCharge || 0), [months, selectedCustomer]);

  const handleSubmit = async () => {
    setError('');
    if (!selectedCustomer || !fromMonth || !toMonth || amount <= 0) return;
    try {
      if (paymentMethod === 'Cash') {
        const res = await cashMutation.mutateAsync({ customerId: selectedCustomer._id, fromMonth, toMonth, amount });
        setResult({ invoice: res.invoice });
      } else {
        const res = await onlineMutation.mutateAsync({ customerId: selectedCustomer._id, fromMonth, toMonth, amount });
        setResult({ invoice: res.invoice, razorpayOrder: res.razorpayOrder, razorpayKeyId: res.razorpayKeyId });
      }
      setActiveStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment failed. Please try again.');
    }
  };

  const handleReset = () => {
    setActiveStep(0); setSelectedCustomer(null); setSearch('');
    setFromMonth(''); setToMonth(''); setPaymentMethod('Cash');
    setResult(null); setError('');
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.nameEnglish.toLowerCase().includes(q) ||
      c.roomNumber.toLowerCase().includes(q) ||
      c.mobile.includes(q)
    );
  }, [customers, search]);

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 480, mx: 'auto', width: '100%', outline: 'none' }}
      ref={stepTopRef}
      tabIndex={-1}
    >
      <PaymentProgress step={activeStep} />

      {selectedCustomer && activeStep > 0 && (
        <CustomerPill customer={selectedCustomer} />
      )}

      {/* ── STEP 0: Search ── */}
      {activeStep === 0 && (
        <>
          <CustomerSearchList
            customers={filteredCustomers}
            isLoading={customersLoading}
            search={search}
            onSearchChange={setSearch}
            onSelect={(c) => setSelectedCustomer(c)}
          />
          {selectedCustomer && nextUnpaidMonth === null && (
            <Alert severity="success" sx={{ mx: 2, mb: 1 }}>
              This customer is fully paid up through the current month.
            </Alert>
          )}
          <ActionBar
            onNext={() => {
              if (!fromMonth && nextUnpaidMonth) { setFromMonth(nextUnpaidMonth); setToMonth(nextUnpaidMonth); }
              setActiveStep(1);
            }}
            nextLabel="Next: Select Period →"
            nextDisabled={!selectedCustomer || nextUnpaidMonth === null}
          />
        </>
      )}

      {/* ── STEP 1: Period ── */}
      {activeStep === 1 && (
        <>
          <Box sx={{ p: 2, flex: 1 }}>
            <TextField
              fullWidth label="From month (auto-set)" type="month"
              value={fromMonth} InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              helperText="Earliest unpaid month — cannot be changed"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="To month" type="month"
              value={toMonth} onChange={(e) => setToMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: fromMonth, max: new Date().toISOString().slice(0, 7) }}
              sx={{ mb: 2 }}
            />
            {overlapWarning && <Alert severity="error" sx={{ mb: 2 }}>{overlapWarning}</Alert>}
            {months > 0 && !overlapWarning && (
              <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 2, p: 2 }}>
                <Typography variant="caption" color="text.secondary">Summary</Typography>
                <Typography variant="body2">{months} month{months > 1 ? 's' : ''} × ₹{selectedCustomer?.monthlyCharge}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" color="primary.dark" fontWeight={800}>Total: ₹{amount}</Typography>
              </Box>
            )}
          </Box>
          <ActionBar
            onBack={() => setActiveStep(0)}
            onNext={() => setActiveStep(2)}
            nextLabel="Next: Confirm →"
            nextDisabled={months < 1 || !!overlapWarning}
          />
        </>
      )}

      {/* ── STEP 2: Confirm ── */}
      {activeStep === 2 && (
        <>
          <Box sx={{ p: 2, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Payment Method
            </Typography>
            <ToggleButtonGroup
              value={paymentMethod} exclusive
              onChange={(_, val) => val && setPaymentMethod(val)}
              fullWidth sx={{ mt: 1, mb: 2, '& .MuiToggleButton-root': { py: 1.5, fontWeight: 600 } }}
              aria-label="Select payment method"
            >
              <ToggleButton value="Cash" aria-label="Cash payment">💵 Cash</ToggleButton>
              <ToggleButton value="Online" aria-label="Online payment via Razorpay">📱 Online (Razorpay)</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
              {[
                ['Period', formatMonthRange(fromMonth, toMonth)],
                ['Months', String(months)],
                ['Method', paymentMethod],
              ].map(([label, value], i, arr) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  {label === 'Method'
                    ? <Chip label={value} size="small" color={value === 'Cash' ? 'success' : 'primary'} />
                    : <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  }
                </Box>
              ))}
            </Box>

            <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 2, p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Amount</Typography>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>₹{amount}</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
          <ActionBar
            onBack={() => setActiveStep(1)}
            onNext={handleSubmit}
            nextLabel="✓ Confirm Payment"
            nextColor="success"
            nextLoading={cashMutation.isPending || onlineMutation.isPending}
          />
        </>
      )}

      {/* ── STEP 3: Result ── */}
      {activeStep === 3 && result && (
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{ border: '2px solid', borderColor: 'success.light', bgcolor: 'success.50', borderRadius: 2.5, overflow: 'hidden', mb: 2 }}
            role="status"
            aria-label="Payment recorded successfully"
            tabIndex={-1}
            ref={(el: HTMLDivElement | null) => el?.focus()}
          >
            <Box sx={{ bgcolor: 'success.main', color: '#fff', p: 1.5, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>✓ Payment Recorded</Typography>
            </Box>
            {[
              ['Invoice', result.invoice.invoiceNumber],
              ['Customer', `${selectedCustomer?.nameEnglish} · Room ${selectedCustomer?.roomNumber}`],
              ['Period', formatMonthRange(result.invoice.paidFromMonth, result.invoice.paidToMonth)],
              ['Method', result.invoice.paymentMethod],
            ].map(([label, value], i, arr) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderBottom: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'success.light' }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>{value}</Typography>
              </Box>
            ))}
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Amount Collected</Typography>
              <Typography variant="h4" color="success.main" fontWeight={800}>₹{result.invoice.amountPaid}</Typography>
            </Box>
          </Box>

          {result.razorpayOrder && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Scan QR to pay:</Typography>
              <QRCodeSVG value={`upi://pay?pa=&pn=WaterCollection&am=${result.invoice.amountPaid}&tn=${result.invoice.invoiceNumber}`} size={160} />
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 'auto' }}>
            {selectedCustomer?.mobile && (
              <Button
                fullWidth variant="contained"
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe57' }, py: 1.5, fontWeight: 700, fontSize: 15 }}
                startIcon={<WhatsAppIcon />}
                onClick={() => {
                  const msg = `Your payment for ${formatMonthRange(result.invoice.paidFromMonth, result.invoice.paidToMonth)} has been received. Amount: ₹${result.invoice.amountPaid}. Invoice: ${result.invoice.invoiceNumber}.`;
                  const phone = selectedCustomer.mobile.startsWith('+') ? selectedCustomer.mobile.slice(1) : `91${selectedCustomer.mobile}`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                  markWhatsappSent.mutate(result.invoice._id);
                }}
                aria-label="Send WhatsApp receipt to customer"
              >
                Send WhatsApp Receipt
              </Button>
            )}
            <Button fullWidth variant="outlined" onClick={handleReset} sx={{ py: 1.5 }}>
              + New Payment
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
```

- [ ] **Step 6.2 — Run dev server and test manually**

```bash
cd frontend && npm run dev
```
Log in as staff at `/admin-login`, navigate to `/payments`. Verify:
- Progress bar shows "Step 1 of 4 · Search Customer" at 25%
- Search field is focused immediately
- Customer rows are touch-friendly (tall enough)
- Skeleton shimmer appears before customers load

- [ ] **Step 6.3 — Commit**

```bash
git add frontend/src/pages/payments/PaymentPage.tsx
git commit -m "feat: rebuild PaymentPage as mobile-first stepper"
```

---

## Task 7: Wire `/payments` to `StaffLayout` in `App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 7.1 — Update the payments route**

In `frontend/src/App.tsx`, change the import and the `/payments` route:

```tsx
// Add import at the top with other layout imports:
import { StaffLayout } from './layouts/StaffLayout';

// Change the /payments route from:
<Route path="/payments" element={
  <ProtectedRoute><DashboardLayout><PaymentPage /></DashboardLayout></ProtectedRoute>
} />

// To:
<Route path="/payments" element={
  <ProtectedRoute><StaffLayout><PaymentPage /></StaffLayout></ProtectedRoute>
} />
```

- [ ] **Step 7.2 — Verify manually**

Log in as staff. Confirm:
- No sidebar visible
- Top bar shows "Record Payment" and logout avatar
- The stepper fills the full width

Log in as admin and navigate to `/payments`. Confirm admin also sees the same staff-style layout (this is correct — admin can also record payments via the same flow).

- [ ] **Step 7.3 — Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire /payments to StaffLayout"
```

---

## Task 8: Rebuild `CustomerDashboardPage`

**Files:**
- Create: `frontend/src/components/customer-portal/HeroStatusCard.tsx`
- Create: `frontend/src/components/customer-portal/InvoiceCardList.tsx`
- Modify: `frontend/src/pages/customer-portal/CustomerDashboardPage.tsx`

- [ ] **Step 8.1 — Create `HeroStatusCard`**

```tsx
// frontend/src/components/customer-portal/HeroStatusCard.tsx
import { Box, Typography, Button } from '@mui/material';
import { formatMonth, formatMonthRange } from '../../utils/formatMonth';

interface BillingInfo {
  isPaid: boolean;
  currentMonth: string;
  pendingAmount: number;
  pendingMonths: number;
  pendingFrom: string | null;
}

interface HeroStatusCardProps {
  billing: BillingInfo;
  onPayNow: () => void;
  isPaying: boolean;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({ billing, onPayNow, isPaying }) => {
  if (billing.isPaid) {
    return (
      <Box
        role="status"
        aria-label="Payment status: all paid up"
        sx={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          borderRadius: 3.5,
          p: 3,
          color: '#fff',
          textAlign: 'center',
          mb: 2,
        }}
      >
        <Typography fontSize={36}>✓</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>
          Payment Status
        </Typography>
        <Typography variant="h6" fontWeight={700} mt={0.5}>All paid up!</Typography>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>{formatMonth(billing.currentMonth)}</Typography>
      </Box>
    );
  }

  const toMonth = billing.currentMonth;
  const fromMonth = billing.pendingFrom ?? billing.currentMonth;

  return (
    <Box
      role="status"
      aria-label={`Payment status: ₹${billing.pendingAmount} pending`}
      sx={{
        background: 'linear-gradient(160deg, #dc2626, #b91c1c)',
        borderRadius: 3.5,
        p: 3,
        color: '#fff',
        mb: 2,
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>
        Pending Balance
      </Typography>
      <Typography variant="h3" fontWeight={800} lineHeight={1.1} mt={0.5}>
        ₹{billing.pendingAmount.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5, mb: 2 }}>
        {billing.pendingMonths} month{billing.pendingMonths > 1 ? 's' : ''} · Since {formatMonth(fromMonth)}
      </Typography>

      <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />

      <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, p: 1.5, mb: 1.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.75 }}>Paying for</Typography>
        <Typography variant="body1" fontWeight={700}>{formatMonthRange(fromMonth, toMonth)}</Typography>
        <Typography variant="h6" fontWeight={800}>₹{billing.pendingAmount.toLocaleString()}</Typography>
      </Box>

      <Button
        fullWidth variant="contained"
        onClick={onPayNow}
        disabled={isPaying}
        aria-label={`Pay ₹${billing.pendingAmount} now`}
        sx={{
          bgcolor: '#fff',
          color: '#dc2626',
          fontWeight: 800,
          fontSize: 15,
          py: 1.5,
          borderRadius: 2,
          '&:hover': { bgcolor: '#fee2e2' },
          '&:disabled': { bgcolor: 'rgba(255,255,255,0.5)' },
        }}
      >
        {isPaying ? 'Processing…' : 'Pay Now →'}
      </Button>
    </Box>
  );
};
```

- [ ] **Step 8.2 — Create `InvoiceCardList`**

```tsx
// frontend/src/components/customer-portal/InvoiceCardList.tsx
import { Box, Typography, Chip, Skeleton } from '@mui/material';
import { Invoice } from '../../types';
import { formatMonthRange } from '../../utils/formatMonth';

interface InvoiceCardListProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export const InvoiceCardList: React.FC<InvoiceCardListProps> = ({ invoices, isLoading }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
      Payment History
    </Typography>
    <Box sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {isLoading ? (
        [0, 1, 2].map((i) => (
          <Box key={i} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: i < 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Box>
              <Skeleton variant="text" width={80} height={14} animation="wave" sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={90} height={11} animation="wave" />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Skeleton variant="text" width={50} height={14} animation="wave" sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" width={36} height={20} animation="wave" />
            </Box>
          </Box>
        ))
      ) : invoices.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No payments yet</Typography>
        </Box>
      ) : (
        invoices.map((inv, i) => (
          <Box
            key={inv._id}
            sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < invoices.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
          >
            <Box>
              <Typography variant="body2" fontWeight={700}>{inv.invoiceNumber}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMonthRange(inv.paidFromMonth, inv.paidToMonth)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={700} color="success.main">
                ₹{inv.amountPaid.toLocaleString()}
              </Typography>
              <Chip
                label={inv.paymentMethod}
                size="small"
                color={inv.paymentMethod === 'Cash' ? 'success' : 'primary'}
                sx={{ height: 18, fontSize: 10 }}
              />
            </Box>
          </Box>
        ))
      )}
    </Box>
  </Box>
);
```

- [ ] **Step 8.3 — Rebuild `CustomerDashboardPage`**

```tsx
// frontend/src/pages/customer-portal/CustomerDashboardPage.tsx
import { Box, AppBar, Toolbar, Typography, IconButton, Skeleton } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useCustomerDashboard, useCustomerInvoices, useInitiatePayment } from '../../hooks/useCustomerPortal';
import { HeroStatusCard } from '../../components/customer-portal/HeroStatusCard';
import { InvoiceCardList } from '../../components/customer-portal/InvoiceCardList';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const { data: dashboard, isLoading } = useCustomerDashboard();
  const { data: invoices, isLoading: invoicesLoading } = useCustomerInvoices();
  const payMutation = useInitiatePayment();

  const handleLogout = () => { logout(); navigate('/login'); };

  const handlePayNow = async () => {
    if (!dashboard?.billing.pendingFrom) return;
    const toMonth = new Date().toISOString().slice(0, 7);
    await payMutation.mutateAsync({ fromMonth: dashboard.billing.pendingFrom, toMonth });
  };

  const guntaName = (dashboard?.customer.gunta as any)?.name ?? '';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1, minHeight: 'auto' }}>
          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
              {customer?.nameEnglish ?? 'Customer Portal'}
            </Typography>
            <IconButton
              color="inherit" onClick={handleLogout}
              aria-label="Logout" sx={{ p: '10px' }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Box>
          {dashboard && (
            <Typography variant="caption" sx={{ opacity: 0.8, mt: -0.5, mb: 0.5 }}>
              Room {dashboard.customer.roomNumber} · {guntaName}
            </Typography>
          )}
          <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Monthly charge</Typography>
            <Typography variant="subtitle1" fontWeight={800}>
              {isLoading ? <Skeleton width={50} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} /> : `₹${dashboard?.customer.monthlyCharge ?? ''}`}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, p: 2, maxWidth: 480, mx: 'auto', width: '100%' }}>
        {isLoading ? (
          <>
            <Skeleton variant="rounded" height={200} animation="wave" sx={{ borderRadius: 3.5, mb: 2 }} />
            <Skeleton variant="text" width={120} height={16} animation="wave" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={120} animation="wave" sx={{ borderRadius: 2.5 }} />
          </>
        ) : dashboard ? (
          <>
            <HeroStatusCard
              billing={dashboard.billing}
              onPayNow={handlePayNow}
              isPaying={payMutation.isPending}
            />
            <InvoiceCardList invoices={invoices ?? []} isLoading={invoicesLoading} />
          </>
        ) : null}
      </Box>
    </Box>
  );
};
```

- [ ] **Step 8.4 — Test manually**

```bash
cd frontend && npm run dev
```
Log in at `/login` as a customer. Verify:
- Header shows name, room, gunta, monthly charge, logout
- If balance pending: red hero card with pending amount, period, Pay Now button stacked vertically
- If paid: green hero card with checkmark
- Invoice history shows card list with "Feb – Mar 2026" style dates (not "2026-02 to 2026-03")
- Skeleton screens appear briefly before data loads

- [ ] **Step 8.5 — Commit**

```bash
git add frontend/src/components/customer-portal/HeroStatusCard.tsx \
        frontend/src/components/customer-portal/InvoiceCardList.tsx \
        frontend/src/pages/customer-portal/CustomerDashboardPage.tsx
git commit -m "feat: rebuild customer portal as mobile-first layout"
```

---

## Task 9: PWA — offline fallback + icons

**Files:**
- Create: `frontend/public/offline.html`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 9.1 — Create offline fallback page**

```html
<!-- frontend/public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>No Connection — Water Invoice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #1e293b; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; max-width: 280px; margin-bottom: 24px; }
    button { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 12px 28px; font-size: 14px; font-weight: 700; cursor: pointer; }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="icon">📶</div>
  <h1>No connection</h1>
  <p>You're offline. Connect to the internet to record or view payments.</p>
  <button onclick="window.location.reload()">Try again</button>
</body>
</html>
```

- [ ] **Step 9.2 — Add PWA icons**

Create simple placeholder SVG icons and convert to PNG, or use any 192×192 and 512×512 blue square PNG files named `pwa-192x192.png` and `pwa-512x512.png` in `frontend/public/`. If you have an icon tool, generate a blue (#2563eb) square with a white water droplet emoji. If not, use any placeholder PNGs — the app will still install, just with a generic icon.

- [ ] **Step 9.3 — Add navigateFallback to vite.config**

In `frontend/vite.config.ts`, inside the `VitePWA({ workbox: { ... } })` block, add `navigateFallback`:

```ts
workbox: {
  navigateFallback: '/offline.html',   // ← add this line
  runtimeCaching: [
    // ... existing entries unchanged ...
  ],
},
```

- [ ] **Step 9.4 — Build and verify the service worker registers**

```bash
cd frontend && npm run build && npm run preview
```
Open `http://localhost:4173`. In Chrome DevTools → Application → Service Workers: confirm service worker is registered and active. Navigate to Application → Manifest: confirm name, icons, theme colour. Turn on offline mode (Network tab → Offline) and reload — confirm the offline.html page appears instead of a browser error.

- [ ] **Step 9.5 — Commit**

```bash
git add frontend/public/offline.html frontend/public/pwa-192x192.png frontend/public/pwa-512x512.png frontend/vite.config.ts
git commit -m "feat: configure PWA offline fallback and icons"
```

---

## Task 10: Install banner

**Files:**
- Create: `frontend/src/hooks/usePWAInstall.ts`
- Create: `frontend/src/components/common/InstallBanner.tsx`
- Modify: `frontend/src/layouts/StaffLayout.tsx`
- Modify: `frontend/src/pages/customer-portal/CustomerDashboardPage.tsx`
- Modify: `.gitignore`

- [ ] **Step 10.1 — Create `usePWAInstall` hook**

```ts
// frontend/src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const canInstall = !!deferredPrompt && !isStandalone;

  const prompt = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall, prompt };
}
```

- [ ] **Step 10.2 — Create `InstallBanner`**

```tsx
// frontend/src/components/common/InstallBanner.tsx
import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const InstallBanner: React.FC = () => {
  const { canInstall, prompt } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: 'primary.50',
        borderTop: '1px solid',
        borderColor: 'primary.200',
        px: 2, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        zIndex: 1200,
      }}
      role="banner"
      aria-label="Install app banner"
    >
      <Box sx={{ fontSize: 28 }}>💧</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary" lineHeight={1.2}>Add to Home Screen</Typography>
        <Typography variant="caption" color="text.secondary">Quick access, works offline</Typography>
      </Box>
      <Button size="small" variant="contained" onClick={prompt} sx={{ flexShrink: 0, fontWeight: 700 }}>
        Add
      </Button>
      <Button size="small" onClick={() => setDismissed(true)} sx={{ flexShrink: 0, color: 'text.disabled', minWidth: 'auto', px: 0.5 }}>
        ✕
      </Button>
    </Box>
  );
};
```

- [ ] **Step 10.3 — Add `InstallBanner` to `StaffLayout`**

In `frontend/src/layouts/StaffLayout.tsx`, import and add `<InstallBanner />` just before the closing `</Box>`:

```tsx
import { InstallBanner } from '../components/common/InstallBanner';

// Inside the return, before </Box>:
      <InstallBanner />
    </Box>
  );
```

- [ ] **Step 10.4 — Add `InstallBanner` to `CustomerDashboardPage`**

In `frontend/src/pages/customer-portal/CustomerDashboardPage.tsx`, import and add `<InstallBanner />` before the closing `</Box>` of the outer container:

```tsx
import { InstallBanner } from '../../components/common/InstallBanner';

// At the bottom of the outer Box, before </Box>:
      <InstallBanner />
    </Box>
  );
```

- [ ] **Step 10.5 — Add `.superpowers/` to `.gitignore`**

Add to the root `.gitignore`:
```
.superpowers/
```

- [ ] **Step 10.6 — Commit**

```bash
git add frontend/src/hooks/usePWAInstall.ts \
        frontend/src/components/common/InstallBanner.tsx \
        frontend/src/layouts/StaffLayout.tsx \
        frontend/src/pages/customer-portal/CustomerDashboardPage.tsx \
        .gitignore
git commit -m "feat: add PWA install banner for staff and customer views"
```

---

## Final verification

- [ ] Run the full test suite:
  ```bash
  cd frontend && npx vitest run
  ```
  All tests pass.

- [ ] TypeScript check:
  ```bash
  cd frontend && npx tsc --noEmit
  ```
  No errors.

- [ ] Manual smoke test on a real mobile device or Chrome DevTools mobile emulation (iPhone SE viewport — 375px wide):
  - Staff: complete a full payment flow (steps 1→4), verify progress bar, customer pill, full-width buttons, WhatsApp button
  - Customer (pending): verify red hero card, "Pay Now" stacked vertically, invoice card list with readable dates
  - Customer (paid): verify green hero card
  - Offline: disable network, reload — verify offline.html appears

- [ ] Final commit if any last tweaks:
  ```bash
  git add -p
  git commit -m "fix: mobile-first polish from smoke test"
  ```
