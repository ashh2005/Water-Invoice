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
