import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const ReportsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Reports and analytics functionality will be implemented in upcoming tasks...
        </Typography>
      </Paper>
    </Box>
  );
};