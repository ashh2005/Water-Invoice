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
