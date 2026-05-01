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
