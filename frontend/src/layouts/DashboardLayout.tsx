import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Payment,
  Receipt,
  Assessment,
  AccountCircle,
  Logout,
  Landscape,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 240;
const TOPBAR_HEIGHT = 56;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', adminOnly: true },
  { text: 'Guntas', icon: <Landscape />, path: '/guntas', adminOnly: true },
  { text: 'Customers', icon: <People />, path: '/customers', adminOnly: true },
  { text: 'Payments', icon: <Payment />, path: '/payments' },
  { text: 'Invoices', icon: <Receipt />, path: '/invoices', adminOnly: true },
  { text: 'Reports', icon: <Assessment />, path: '/reports', adminOnly: true },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <Box>
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar - full width, fixed height */}
      <Box
        component="header"
        sx={{
          height: TOPBAR_HEIGHT,
          minHeight: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 1, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Invoice Management System
        </Typography>
        <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
          {user?.username} ({user?.role})
        </Typography>
        <IconButton size="large" edge="end" onClick={handleProfileMenuOpen} color="inherit">
          <Avatar sx={{ width: 32, height: 32 }}>
            <AccountCircle />
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>

      {/* Below the top bar: sidebar + content side by side */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, top: TOPBAR_HEIGHT },
            }}
          >
            {sidebar}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                position: 'relative',
                height: '100%',
              },
            }}
            open
          >
            {sidebar}
          </Drawer>
        </Box>

        {/* Main content - fills remaining space, scrolls independently */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            bgcolor: 'background.default',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
