import { Box, Typography, LinearProgress } from '@mui/material';

const STEP_NAMES = ['Search Customer', 'Select Period', 'Confirm Payment', 'Done'];

interface PaymentProgressProps {
  step: number; // 0-indexed, 0–3
}

export const PaymentProgress: React.FC<PaymentProgressProps> = ({ step }) => {
  const pct = ((step + 1) / 4) * 100;
  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography
          variant="caption"
          fontWeight={700}
          color="primary"
          aria-live="polite"
          aria-label={`Step ${step + 1} of 4: ${STEP_NAMES[step]}`}
        >
          Step {step + 1} of 4
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {STEP_NAMES[step]}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={4}
        sx={{ height: 4, borderRadius: 2 }}
      />
    </Box>
  );
};
