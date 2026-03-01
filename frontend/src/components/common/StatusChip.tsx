import React from 'react';
import { Chip } from '@mui/material';
import { CustomerStatus } from '../../types';

const statusColors: Record<CustomerStatus, 'success' | 'warning' | 'error' | 'default'> = {
  Rented: 'success',
  Vacant: 'warning',
  Closed: 'error',
  Unsold: 'default',
};

export const StatusChip: React.FC<{ status: CustomerStatus }> = ({ status }) => (
  <Chip label={status} color={statusColors[status] || 'default'} size="small" />
);
