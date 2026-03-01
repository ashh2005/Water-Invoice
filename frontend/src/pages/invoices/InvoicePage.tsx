import React, { useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Typography, CircularProgress, TextField, Chip,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Grid, Divider, Tooltip,
} from '@mui/material';
import { Visibility, Sms, PictureAsPdf } from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { useInvoices, useResendSMS } from '../../hooks/useInvoices';
import { Invoice, Customer } from '../../types';
import jsPDF from 'jspdf';

export const InvoicePage: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useInvoices({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    paymentMethod: paymentMethod || undefined,
  });
  const resendSMS = useResendSMS();

  const getCustomer = (inv: Invoice): Customer | null => {
    return typeof inv.customerId === 'object' ? inv.customerId as Customer : null;
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const customer = getCustomer(inv);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Water Collection Invoice', 20, 25);
    doc.setFontSize(12);
    doc.text(`Invoice: ${inv.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 20, 50);
    doc.text(`Room: ${customer?.roomNumber || 'N/A'}`, 20, 65);
    doc.text(`Customer: ${customer?.nameEnglish || 'N/A'}`, 20, 75);
    doc.text(`Mobile: ${customer?.mobile || 'N/A'}`, 20, 85);
    doc.text(`Period: ${inv.paidFromMonth} to ${inv.paidToMonth}`, 20, 100);
    doc.text(`Months: ${inv.monthsCovered}`, 20, 110);
    doc.text(`Amount Paid: Rs. ${inv.amountPaid}`, 20, 125);
    doc.text(`Payment Method: ${inv.paymentMethod}`, 20, 135);
    doc.text(`Pending: Rs. ${inv.pendingAmount} (${inv.pendingMonths} months)`, 20, 150);

    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  return (
    <Box>
      <PageHeader title="Invoices" subtitle="View and manage all invoices" />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={fromDate} onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={toDate} onChange={(e) => setToDate(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Method</InputLabel>
          <Select value={paymentMethod} label="Method" onChange={(e) => setPaymentMethod(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Online">Online</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : !invoices?.length ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No invoices found</Typography></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>SMS</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => {
                const customer = getCustomer(inv);
                return (
                  <TableRow key={inv._id}>
                    <TableCell><Typography fontWeight={500}>{inv.invoiceNumber}</Typography></TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{customer?.roomNumber || '-'}</TableCell>
                    <TableCell>{customer?.nameEnglish || '-'}</TableCell>
                    <TableCell>{inv.paidFromMonth} to {inv.paidToMonth}</TableCell>
                    <TableCell>Rs. {inv.amountPaid}</TableCell>
                    <TableCell>
                      <Chip label={inv.paymentMethod} size="small" color={inv.paymentMethod === 'Cash' ? 'success' : 'primary'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.smsSent ? 'Sent' : 'Failed'} size="small" color={inv.smsSent ? 'success' : 'error'} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View"><IconButton size="small" onClick={() => setViewInvoice(inv)}><Visibility fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Resend SMS"><IconButton size="small" onClick={() => resendSMS.mutate(inv._id)} disabled={resendSMS.isPending}><Sms fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Download PDF"><IconButton size="small" onClick={() => handleDownloadPDF(inv)}><PictureAsPdf fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={!!viewInvoice} onClose={() => setViewInvoice(null)} maxWidth="sm" fullWidth>
        {viewInvoice && (
          <>
            <DialogTitle>Invoice {viewInvoice.invoiceNumber}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}><Typography color="text.secondary">Date</Typography><Typography>{new Date(viewInvoice.createdAt).toLocaleString()}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Room</Typography><Typography>{getCustomer(viewInvoice)?.roomNumber}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Customer</Typography><Typography>{getCustomer(viewInvoice)?.nameEnglish}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Mobile</Typography><Typography>{getCustomer(viewInvoice)?.mobile}</Typography></Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Period</Typography><Typography>{viewInvoice.paidFromMonth} to {viewInvoice.paidToMonth}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Months</Typography><Typography>{viewInvoice.monthsCovered}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Amount Paid</Typography><Typography fontWeight={600} color="primary">Rs. {viewInvoice.amountPaid}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Method</Typography><Chip label={viewInvoice.paymentMethod} size="small" /></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Pending Amount</Typography><Typography color="error">Rs. {viewInvoice.pendingAmount}</Typography></Grid>
                <Grid item xs={6}><Typography color="text.secondary">Pending Months</Typography><Typography>{viewInvoice.pendingMonths}</Typography></Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewInvoice(null)}>Close</Button>
              <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={() => handleDownloadPDF(viewInvoice)}>Download PDF</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
