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
        bgcolor: '#eff6ff',
        border: '1px solid',
        borderColor: '#bfdbfe',
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
