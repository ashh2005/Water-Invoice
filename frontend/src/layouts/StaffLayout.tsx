import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { InstallBanner } from '../components/common/InstallBanner';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ minHeight: 52 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
            Record Payment
          </Typography>
          <Typography variant="caption" sx={{ mr: 1, opacity: 0.8 }}>
            {user?.username}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="Logout"
            size="small"
            sx={{ p: '10px' }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
              <Logout fontSize="small" />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <InstallBanner />
    </Box>
  );
};
