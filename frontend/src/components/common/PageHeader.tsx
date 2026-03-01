import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actionLabel, onAction }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
      <Typography variant="h5" fontWeight={600}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
    {actionLabel && onAction && (
      <Button variant="contained" startIcon={<Add />} onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);
