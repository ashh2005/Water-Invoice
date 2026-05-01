import { Box, Typography, Chip, Skeleton } from '@mui/material';
import { Invoice } from '../../types';
import { formatMonthRange } from '../../utils/formatMonth';

interface InvoiceCardListProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export const InvoiceCardList: React.FC<InvoiceCardListProps> = ({ invoices, isLoading }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
      Payment History
    </Typography>
    <Box sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {isLoading ? (
        [0, 1, 2].map((i) => (
          <Box key={i} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: i < 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Box>
              <Skeleton variant="text" width={80} height={14} animation="wave" sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={90} height={11} animation="wave" />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Skeleton variant="text" width={50} height={14} animation="wave" sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" width={36} height={20} animation="wave" />
            </Box>
          </Box>
        ))
      ) : invoices.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No payments yet</Typography>
        </Box>
      ) : (
        invoices.map((inv, i) => (
          <Box
            key={inv._id}
            sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < invoices.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
          >
            <Box>
              <Typography variant="body2" fontWeight={700}>{inv.invoiceNumber}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMonthRange(inv.paidFromMonth, inv.paidToMonth)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={700} color="success.main">
                ₹{(inv.amountPaid ?? 0).toLocaleString()}
              </Typography>
              <Chip
                label={inv.paymentMethod}
                size="small"
                color={inv.paymentMethod === 'Cash' ? 'success' : 'primary'}
                sx={{ height: 18, fontSize: 10 }}
              />
            </Box>
          </Box>
        ))
      )}
    </Box>
  </Box>
);
