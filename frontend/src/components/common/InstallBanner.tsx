import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const InstallBanner: React.FC = () => {
  const { canInstall, prompt } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: '#eff6ff',
        borderTop: '1px solid #bfdbfe',
        px: 2, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        zIndex: 1200,
      }}
      role="banner"
      aria-label="Install app banner"
    >
      <Box sx={{ fontSize: 28 }}>💧</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary" lineHeight={1.2}>Add to Home Screen</Typography>
        <Typography variant="caption" color="text.secondary">Quick access, works offline</Typography>
      </Box>
      <Button size="small" variant="contained" onClick={prompt} sx={{ flexShrink: 0, fontWeight: 700 }}>
        Add
      </Button>
      <Button size="small" onClick={() => setDismissed(true)} sx={{ flexShrink: 0, color: 'text.disabled', minWidth: 'auto', px: 0.5 }}>
        ✕
      </Button>
    </Box>
  );
};
