import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const RoomManagementPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Room Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Room management functionality will be implemented in upcoming tasks...
        </Typography>
      </Paper>
    </Box>
  );
};