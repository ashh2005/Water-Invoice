import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, TextField, Button, ToggleButtonGroup, ToggleButton,
  Typography, Divider, CircularProgress, Alert, Chip,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useCustomers } from '../../hooks/useCustomers';
import { useRecordCashPayment, useCreateOnlinePayment } from '../../hooks/usePayments';
import { useInvoices, useMarkWhatsappSent } from '../../hooks/useInvoices';
import { Customer, Invoice } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentProgress } from '../../components/staff/PaymentProgress';
import { CustomerPill } from '../../components/staff/CustomerPill';
import { CustomerSearchList } from '../../components/staff/CustomerSearchList';
import { formatMonth, formatMonthRange } from '../../utils/formatMonth';

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

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

  useEffect(() => {
    stepTopRef.current?.focus();
  }, [activeStep]);

  const paidMonths = useMemo(() => {
    const set = new Set<string>();
    if (!customerInvoices) return set;
    for (const inv of customerInvoices) {
      const [fy, fm] = inv.paidFromMonth.split('-').map(Number);
      const [ty, tm] = inv.paidToMonth.split('-').map(Number);
      if (fy > ty || (fy === ty && fm > tm)) continue;
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
    const startKey = sorted[0] <= currentMonth ? sorted[0] : currentMonth;
    const [sy, sm] = startKey.split('-').map(Number);
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
              <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2, p: 2 }}>
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

            <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2, p: 2, textAlign: 'center' }}>
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

      {activeStep === 3 && result && (
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{ border: '2px solid', borderColor: 'success.light', bgcolor: '#f0fdf4', borderRadius: 2.5, overflow: 'hidden', mb: 2 }}
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

          {result.razorpayOrder && import.meta.env.VITE_UPI_VPA && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Scan QR to pay:</Typography>
              <QRCodeSVG value={`upi://pay?pa=${import.meta.env.VITE_UPI_VPA}&pn=WaterCollection&am=${result.invoice.amountPaid}&tn=${result.invoice.invoiceNumber}`} size={160} />
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
