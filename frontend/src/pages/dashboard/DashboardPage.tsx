import {
  Box, Grid, Card, CardContent, Typography, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Chip,
} from '@mui/material';
import { TrendingUp, People, Payment, Home, Warning, Receipt } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../../hooks/useDashboard';

const COLORS = ['#059669', '#d97706', '#dc2626', '#6b7280'];

const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ReactNode; color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" variant="body2">{title}</Typography>
          <Typography variant="h4" fontWeight={600}>{value}</Typography>
        </Box>
        <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!data) return null;

  const customerStatusData = [
    { name: 'Rented', value: data.rentedCustomers },
    { name: 'Vacant', value: data.vacantCustomers },
    { name: 'Closed', value: data.closedCustomers },
    { name: 'Other', value: data.totalCustomers - data.rentedCustomers - data.vacantCustomers - data.closedCustomers },
  ].filter(d => d.value > 0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Customers" value={data.totalCustomers} icon={<People />} color="#2563eb" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Rented" value={data.rentedCustomers} icon={<Home />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="This Month" value={`Rs. ${data.monthlyCollection.toLocaleString()}`} icon={<Payment />} color="#d97706" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Defaulters" value={data.defaulterCount} icon={<Warning />} color="#dc2626" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Collection" value={`Rs. ${data.totalCollection.toLocaleString()}`} icon={<TrendingUp />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Invoices This Month" value={data.monthlyInvoiceCount} icon={<Receipt />} color="#2563eb" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Vacant" value={data.vacantCustomers} icon={<Home />} color="#d97706" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Closed" value={data.closedCustomers} icon={<Home />} color="#dc2626" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>Customer Status</Typography>
            {customerStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={customerStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {customerStatusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No customer data</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Invoices</Typography>
            {!data.recentInvoices?.length ? (
              <Typography color="text.secondary">No recent invoices</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentInvoices.map((inv: any) => (
                    <TableRow key={inv._id}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customerId?.nameEnglish || '-'}</TableCell>
                      <TableCell>{inv.customerId?.roomNumber || '-'}</TableCell>
                      <TableCell>Rs. {inv.amountPaid}</TableCell>
                      <TableCell><Chip label={inv.paymentMethod} size="small" color={inv.paymentMethod === 'Cash' ? 'success' : 'primary'} /></TableCell>
                      <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
