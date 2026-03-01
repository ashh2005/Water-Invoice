import React, { useState, useMemo } from 'react';
import {
  Box, Stepper, Step, StepLabel, Paper, Typography, TextField,
  Autocomplete, Button, ToggleButtonGroup, ToggleButton, Card,
  CardContent, Grid, Divider, CircularProgress, Alert, Chip,
} from '@mui/material';
import { useCustomers } from '../../hooks/useCustomers';
import { useRecordCashPayment, useCreateOnlinePayment } from '../../hooks/usePayments';
import { useInvoices } from '../../hooks/useInvoices';
import { Customer, Gunta, Invoice } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../components/common/PageHeader';

const steps = ['Search Customer', 'Select Period', 'Payment', 'Result'];

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

export const PaymentPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [result, setResult] = useState<{ invoice: Invoice; razorpayOrder?: any; razorpayKeyId?: string } | null>(null);
  const [error, setError] = useState('');

  const { data: customers, isLoading: customersLoading } = useCustomers({ status: 'Rented' });
  const cashMutation = useRecordCashPayment();
  const onlineMutation = useCreateOnlinePayment();
  const { data: customerInvoices } = useInvoices(
    selectedCustomer ? { customerId: selectedCustomer._id } : undefined
  );

  const gunta = selectedCustomer?.guntaId as Gunta | undefined;

  // Build set of already-paid months from existing invoices
  const paidMonths = useMemo(() => {
    const set = new Set<string>();
    if (!customerInvoices) return set;
    for (const inv of customerInvoices) {
      const [fy, fm] = inv.paidFromMonth.split('-').map(Number);
      const [ty, tm] = inv.paidToMonth.split('-').map(Number);
      let y = fy, m = fm;
      while (y < ty || (y === ty && m <= tm)) {
        set.add(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }
    return set;
  }, [customerInvoices]);

  // Find the next unpaid month (starting from the earliest gap or after last paid)
  // Returns null if customer is fully paid up through current month
  const nextUnpaidMonth = useMemo((): string | null => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!selectedCustomer || paidMonths.size === 0) {
      return currentMonth;
    }
    // Start from the earliest paid month and scan forward to find the first gap
    const sorted = Array.from(paidMonths).sort();
    const [sy, sm] = sorted[0].split('-').map(Number);
    let y = sy, m = sm;
    while (`${y}-${String(m).padStart(2, '0')}` <= currentMonth) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (!paidMonths.has(key)) return key;
      m++;
      if (m > 12) { m = 1; y++; }
    }
    // All months up to current are paid — no payment needed
    return null;
  }, [selectedCustomer, paidMonths]);

  // Check if selected range overlaps with already-paid months
  const overlapWarning = useMemo(() => {
    if (!fromMonth || !toMonth || paidMonths.size === 0) return '';
    const overlapping: string[] = [];
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (paidMonths.has(key)) overlapping.push(key);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    if (overlapping.length === 0) return '';
    return `Already paid: ${overlapping.join(', ')}`;
  }, [fromMonth, toMonth, paidMonths]);

  const months = useMemo(() => {
    if (!fromMonth || !toMonth) return 0;
    return Math.max(monthDiff(fromMonth, toMonth), 0);
  }, [fromMonth, toMonth]);

  const amount = useMemo(() => {
    return months * (selectedCustomer?.monthlyCharge || 0);
  }, [months, selectedCustomer]);

  const handleSubmit = async () => {
    setError('');
    if (!selectedCustomer || !fromMonth || !toMonth || amount <= 0) return;

    try {
      if (paymentMethod === 'Cash') {
        const res = await cashMutation.mutateAsync({
          customerId: selectedCustomer._id,
          fromMonth,
          toMonth,
          amount,
        });
        setResult({ invoice: res.invoice });
      } else {
        const res = await onlineMutation.mutateAsync({
          customerId: selectedCustomer._id,
          fromMonth,
          toMonth,
          amount,
        });
        setResult({
          invoice: res.invoice,
          razorpayOrder: res.razorpayOrder,
          razorpayKeyId: res.razorpayKeyId,
        });
      }
      setActiveStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment failed');
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedCustomer(null);
    setFromMonth('');
    setToMonth('');
    setPaymentMethod('Cash');
    setResult(null);
    setError('');
  };

  return (
    <Box>
      <PageHeader title="Record Payment" subtitle="Process water collection payments" />

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Select Customer</Typography>
            <Autocomplete
              options={customers || []}
              loading={customersLoading}
              getOptionLabel={(customer) =>
                `${customer.roomNumber} - ${customer.nameEnglish} (${typeof customer.guntaId === 'object' ? (customer.guntaId as Gunta).name : ''})`
              }
              value={selectedCustomer}
              onChange={(_, value) => { setSelectedCustomer(value); setFromMonth(''); setToMonth(''); }}
              renderInput={(params) => <TextField {...params} label="Search by room number or customer name" />}
              sx={{ mb: 2 }}
            />
            {selectedCustomer && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Room</Typography>
                      <Typography fontWeight={500}>{selectedCustomer.roomNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Gunta</Typography>
                      <Typography>{gunta?.name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Customer</Typography>
                      <Typography fontWeight={500}>{selectedCustomer.nameEnglish}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Mobile</Typography>
                      <Typography>{selectedCustomer.mobile}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Monthly Charge</Typography>
                      <Typography fontWeight={600} color="primary">Rs. {selectedCustomer.monthlyCharge}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
            {selectedCustomer && nextUnpaidMonth === null && (
              <Alert severity="success" sx={{ mt: 2 }}>This customer is fully paid up through the current month. No payment needed.</Alert>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" disabled={!selectedCustomer || nextUnpaidMonth === null} onClick={() => {
                if (!fromMonth && nextUnpaidMonth) {
                  setFromMonth(nextUnpaidMonth);
                  setToMonth(nextUnpaidMonth);
                }
                setActiveStep(1);
              }}>
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Select Billing Period</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="From Month" type="month" InputLabelProps={{ shrink: true }}
                  value={fromMonth}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-set to earliest unpaid month"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth label="To Month" type="month" InputLabelProps={{ shrink: true }}
                  value={toMonth} onChange={(e) => setToMonth(e.target.value)}
                  inputProps={{ min: fromMonth, max: new Date().toISOString().slice(0, 7) }}
                />
              </Grid>
            </Grid>
            {overlapWarning && (
              <Alert severity="error" sx={{ mb: 2 }}>{overlapWarning}. Please select a different period.</Alert>
            )}
            {months > 0 && !overlapWarning && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Summary</Typography>
                  <Typography>Months: <strong>{months}</strong></Typography>
                  <Typography>Rate: Rs. {selectedCustomer?.monthlyCharge}/month</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" color="primary">Total: Rs. {amount}</Typography>
                </CardContent>
              </Card>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" disabled={months < 1 || !!overlapWarning} onClick={() => setActiveStep(2)}>Next</Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Payment Method</Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={(_, val) => val && setPaymentMethod(val)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="Cash">Cash</ToggleButton>
              <ToggleButton value="Online">Online (Razorpay)</ToggleButton>
            </ToggleButtonGroup>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography color="text.secondary">Room:</Typography></Grid>
                  <Grid item xs={6}><Typography>{selectedCustomer?.roomNumber}</Typography></Grid>
                  <Grid item xs={6}><Typography color="text.secondary">Customer:</Typography></Grid>
                  <Grid item xs={6}><Typography>{selectedCustomer?.nameEnglish}</Typography></Grid>
                  <Grid item xs={6}><Typography color="text.secondary">Period:</Typography></Grid>
                  <Grid item xs={6}><Typography>{fromMonth} to {toMonth}</Typography></Grid>
                  <Grid item xs={6}><Typography color="text.secondary">Months:</Typography></Grid>
                  <Grid item xs={6}><Typography>{months}</Typography></Grid>
                  <Grid item xs={6}><Typography color="text.secondary">Method:</Typography></Grid>
                  <Grid item xs={6}><Chip label={paymentMethod} color={paymentMethod === 'Cash' ? 'success' : 'primary'} size="small" /></Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" color="primary" fontWeight={600}>Amount: Rs. {amount}</Typography>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={cashMutation.isPending || onlineMutation.isPending}
              >
                {(cashMutation.isPending || onlineMutation.isPending) ? <CircularProgress size={24} /> : 'Confirm Payment'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && result && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="success.main" gutterBottom>Payment Recorded!</Typography>
            <Card variant="outlined" sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Invoice #{result.invoice.invoiceNumber}</Typography>
                <Typography>Room: {selectedCustomer?.roomNumber}</Typography>
                <Typography>Customer: {selectedCustomer?.nameEnglish}</Typography>
                <Typography>Period: {result.invoice.paidFromMonth} to {result.invoice.paidToMonth}</Typography>
                <Typography>Amount: Rs. {result.invoice.amountPaid}</Typography>
                <Typography>Method: {result.invoice.paymentMethod}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  SMS {result.invoice.smsSent ? 'sent to customer' : 'will be sent automatically'}
                </Typography>

                {result.razorpayOrder && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>Scan QR to pay:</Typography>
                    <QRCodeSVG
                      value={`upi://pay?pa=&pn=WaterCollection&am=${result.invoice.amountPaid}&tn=${result.invoice.invoiceNumber}`}
                      size={200}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
            <Button variant="contained" sx={{ mt: 3 }} onClick={handleReset}>New Payment</Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
