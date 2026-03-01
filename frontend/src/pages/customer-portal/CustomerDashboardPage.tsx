import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Grid, Divider, Chip, Alert, TextField, Paper, AppBar, Toolbar,
  IconButton,
} from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useCustomerDashboard, useCustomerInvoices, useInitiatePayment } from '../../hooks/useCustomerPortal';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuth();
  const { data: dashboard, isLoading } = useCustomerDashboard();
  const { data: invoices } = useCustomerInvoices();
  const payMutation = useInitiatePayment();

  const [showPayForm, setShowPayForm] = useState(false);
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/customer-login');
  };

  const handlePay = async () => {
    if (!fromMonth || !toMonth) return;
    try {
      await payMutation.mutateAsync({ fromMonth, toMonth });
      setShowPayForm(false);
      setFromMonth('');
      setToMonth('');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Customer Portal
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {customer?.nameEnglish}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        {dashboard && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Room</Typography>
                    <Typography variant="h5" fontWeight={600}>{dashboard.customer.roomNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gunta: {(dashboard.customer.gunta as any)?.name || '-'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Monthly Charge</Typography>
                    <Typography variant="h5" fontWeight={600} color="primary">
                      Rs. {dashboard.customer.monthlyCharge}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Pending Bill */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {dashboard.billing.currentMonth} - Payment Status
                </Typography>
                {dashboard.billing.isPaid ? (
                  <Alert severity="success">Your payment for this month is up to date!</Alert>
                ) : (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      You have pending payments: {dashboard.billing.pendingMonths} month(s) - Rs. {dashboard.billing.pendingAmount}
                    </Alert>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Pending from: {dashboard.billing.pendingFrom}
                    </Typography>

                    {!showPayForm ? (
                      <Button variant="contained" color="primary" onClick={() => {
                        if (dashboard.billing.pendingFrom) {
                          setFromMonth(dashboard.billing.pendingFrom);
                          setToMonth(dashboard.billing.pendingFrom);
                        }
                        setShowPayForm(true);
                      }}>
                        Pay Now
                      </Button>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth label="From Month" type="month" size="small"
                              InputLabelProps={{ shrink: true }}
                              value={fromMonth}
                              InputProps={{ readOnly: true }}
                              helperText="Earliest unpaid month"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth label="To Month" type="month" size="small"
                              InputLabelProps={{ shrink: true }}
                              value={toMonth} onChange={(e) => setToMonth(e.target.value)}
                              inputProps={{ min: fromMonth, max: new Date().toISOString().slice(0, 7) }}
                            />
                          </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={handlePay}
                            disabled={payMutation.isPending || !fromMonth || !toMonth}
                          >
                            {payMutation.isPending ? <CircularProgress size={24} /> : 'Initiate Payment'}
                          </Button>
                          <Button variant="outlined" onClick={() => setShowPayForm(false)}>Cancel</Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Invoice History */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Invoice History</Typography>
          <Divider sx={{ mb: 2 }} />
          {!invoices?.length ? (
            <Typography color="text.secondary">No invoices found</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell><Typography fontWeight={500}>{inv.invoiceNumber}</Typography></TableCell>
                    <TableCell>{inv.paidFromMonth} to {inv.paidToMonth}</TableCell>
                    <TableCell>Rs. {inv.amountPaid}</TableCell>
                    <TableCell>
                      <Chip label={inv.paymentMethod} size="small" color={inv.paymentMethod === 'Cash' ? 'success' : 'primary'} />
                    </TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
