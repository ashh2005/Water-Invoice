import { useState } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, TextField, Button, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Card, CardContent, Grid, Chip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { useDefaulters, useCollectionSummary } from '../../hooks/useDashboard';
import { Defaulter } from '../../types';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthStart = selectedMonth ? `${selectedMonth}-01` : '';
  const monthEnd = selectedMonth
    ? (() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      })()
    : '';

  const { data: defaulters, isLoading: defaultersLoading } = useDefaulters();
  const { data: collectionData, isLoading: collectionLoading } = useCollectionSummary(fromDate, toDate);
  const { data: monthlyData, isLoading: monthlyLoading } = useCollectionSummary(monthStart, monthEnd);

  const exportDefaultersExcel = () => {
    if (!defaulters) return;
    const rows = defaulters.map((d: Defaulter) => ({
      Room: d.customer.roomNumber,
      Customer: d.customer.nameEnglish || '',
      Mobile: d.customer.mobile || '',
      'Pending From': d.pendingFrom,
      'Pending Months': d.pendingMonths,
      'Pending Amount': d.pendingAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Defaulters');
    XLSX.writeFile(wb, 'defaulters.xlsx');
  };

  const exportCollectionExcel = () => {
    if (!collectionData) return;
    const rows = Object.entries(collectionData.byGunta).map(([gunta, data]) => ({
      Gunta: gunta,
      Cash: data.cash,
      Online: data.online,
      Total: data.total,
      Invoices: data.count,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Collection');
    XLSX.writeFile(wb, 'collection-summary.xlsx');
  };

  const exportDefaultersPDF = () => {
    if (!defaulters) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Defaulters Report', 20, 20);
    doc.setFontSize(10);
    let y = 35;
    defaulters.forEach((d: Defaulter, i: number) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. Room ${d.customer.roomNumber} - ${d.customer.nameEnglish || 'N/A'} | Pending: Rs.${d.pendingAmount} (${d.pendingMonths} months)`, 20, y);
      y += 8;
    });
    doc.save('defaulters.pdf');
  };

  return (
    <Box>
      <PageHeader title="Reports & Analytics" subtitle="View collection reports and defaulters" />

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Collection Summary" />
          <Tab label="Defaulters List" />
          <Tab label="Payment Breakdown" />
          <Tab label="Monthly Summary" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
            <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={toDate} onChange={(e) => setToDate(e.target.value)} />
            {collectionData && (
              <Button variant="outlined" startIcon={<Download />} onClick={exportCollectionExcel}>Export Excel</Button>
            )}
          </Box>

          {collectionLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : collectionData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Grand Total</Typography>
                  <Typography variant="h4" fontWeight={600} color="primary">Rs. {collectionData.grandTotal.toLocaleString()}</Typography>
                  <Typography variant="body2">{collectionData.invoiceCount} invoices</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Cash Collection</Typography>
                  <Typography variant="h4" fontWeight={600} color="success.main">Rs. {collectionData.cashTotal.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Online Collection</Typography>
                  <Typography variant="h4" fontWeight={600} color="info.main">Rs. {collectionData.onlineTotal.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>By Gunta</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Gunta</TableCell>
                        <TableCell>Cash</TableCell>
                        <TableCell>Online</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Invoices</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(collectionData.byGunta).map(([gunta, data]) => (
                        <TableRow key={gunta}>
                          <TableCell><Typography fontWeight={500}>{gunta}</Typography></TableCell>
                          <TableCell>Rs. {data.cash.toLocaleString()}</TableCell>
                          <TableCell>Rs. {data.online.toLocaleString()}</TableCell>
                          <TableCell><Typography fontWeight={600}>Rs. {data.total.toLocaleString()}</Typography></TableCell>
                          <TableCell>{data.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Select date range to view collection summary</Typography></Paper>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={exportDefaultersExcel} disabled={!defaulters?.length}>Export Excel</Button>
            <Button variant="outlined" startIcon={<Download />} onClick={exportDefaultersPDF} disabled={!defaulters?.length}>Export PDF</Button>
          </Box>

          <Paper>
            {defaultersLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
            ) : !defaulters?.length ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="success.main">No defaulters! All payments up to date.</Typography></Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Room</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Gunta</TableCell>
                    <TableCell>Pending From</TableCell>
                    <TableCell>Pending Months</TableCell>
                    <TableCell>Pending Amount</TableCell>
                    <TableCell>Last Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {defaulters.map((d: Defaulter, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Typography fontWeight={500}>{d.customer.roomNumber}</Typography></TableCell>
                      <TableCell>{d.customer.nameEnglish || '-'}</TableCell>
                      <TableCell>{d.customer.mobile || '-'}</TableCell>
                      <TableCell>{(d.customer.gunta as any)?.name || '-'}</TableCell>
                      <TableCell>{d.pendingFrom}</TableCell>
                      <TableCell><Chip label={d.pendingMonths} color="error" size="small" /></TableCell>
                      <TableCell><Typography color="error" fontWeight={600}>Rs. {d.pendingAmount}</Typography></TableCell>
                      <TableCell>{d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString() : 'Never'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </Box>

          {collectionLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : collectionData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" gutterBottom>Cash vs Online</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cash', value: collectionData.cashTotal },
                          { name: 'Online', value: collectionData.onlineTotal },
                        ]}
                        cx="50%" cy="50%" outerRadius={100} dataKey="value"
                        label={({ name, value }) => `${name}: Rs.${value}`}
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#2563eb" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 350 }}>
                  <Typography variant="h6" gutterBottom>Collection by Gunta</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={Object.entries(collectionData.byGunta).map(([name, d]) => ({ name, cash: d.cash, online: d.online }))}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cash" fill="#059669" name="Cash" />
                      <Bar dataKey="online" fill="#2563eb" name="Online" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Select date range to view payment breakdown</Typography></Paper>
          )}
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
            <TextField
              label="Month" type="month" size="small" InputLabelProps={{ shrink: true }}
              value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            />
            {monthlyData && (
              <Button variant="outlined" startIcon={<Download />} onClick={() => {
                const rows = Object.entries(monthlyData.byGunta).map(([gunta, d]) => ({
                  Gunta: gunta, Cash: d.cash, Online: d.online, Total: d.total, Invoices: d.count,
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Monthly');
                XLSX.writeFile(wb, `monthly-summary-${selectedMonth}.xlsx`);
              }}>Export Excel</Button>
            )}
          </Box>

          {monthlyLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : monthlyData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Total Collected</Typography>
                  <Typography variant="h4" fontWeight={600} color="primary">Rs. {monthlyData.grandTotal.toLocaleString()}</Typography>
                  <Typography variant="body2">{monthlyData.invoiceCount} invoices</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Cash</Typography>
                  <Typography variant="h4" fontWeight={600} color="success.main">Rs. {monthlyData.cashTotal.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography color="text.secondary">Online</Typography>
                  <Typography variant="h4" fontWeight={600} color="info.main">Rs. {monthlyData.onlineTotal.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>By Gunta</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Gunta</TableCell>
                        <TableCell>Cash</TableCell>
                        <TableCell>Online</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Invoices</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(monthlyData.byGunta).map(([gunta, d]) => (
                        <TableRow key={gunta}>
                          <TableCell><Typography fontWeight={500}>{gunta}</Typography></TableCell>
                          <TableCell>Rs. {d.cash.toLocaleString()}</TableCell>
                          <TableCell>Rs. {d.online.toLocaleString()}</TableCell>
                          <TableCell><Typography fontWeight={600}>Rs. {d.total.toLocaleString()}</Typography></TableCell>
                          <TableCell>{d.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No data for selected month</Typography></Paper>
          )}
        </Box>
      )}
    </Box>
  );
};
