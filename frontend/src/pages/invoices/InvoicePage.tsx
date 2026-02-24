import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const InvoicePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Invoice Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Invoice management functionality will be implemented in upcoming tasks...
        </Typography>
      </Paper>
    </Box>
  );
};