import React, { useState } from 'react';
import {
  Box, TextField, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress, Typography,
  FormControl, InputLabel, Select, MenuItem, Chip, Alert,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import { useGuntas } from '../../hooks/useGuntas';
import { Customer, Gunta } from '../../types';

const createSchema = yup.object({
  nameEnglish: yup.string().required('Name (English) is required'),
  nameHindi: yup.string(),
  mobile: yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required').required('Mobile is required'),
  address: yup.string(),
  guntaId: yup.string().required('Gunta is required'),
  roomNumber: yup.string().required('Room number is required'),
  monthlyCharge: yup.number().min(1, 'Must be greater than 0').required('Monthly charge is required'),
  status: yup.string().oneOf(['Rented', 'Vacant', 'Closed', 'Unsold']).required(),
  notes: yup.string(),
});

const updateSchema = yup.object({
  nameEnglish: yup.string().required('Name (English) is required'),
  nameHindi: yup.string(),
  mobile: yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required').required('Mobile is required'),
  address: yup.string(),
  guntaId: yup.string().required('Gunta is required'),
  roomNumber: yup.string().required('Room number is required'),
  monthlyCharge: yup.number().min(1, 'Must be greater than 0').required('Monthly charge is required'),
  status: yup.string().oneOf(['Rented', 'Vacant', 'Closed', 'Unsold']).required(),
  password: yup.string().min(4, 'Min 4 characters'),
  notes: yup.string(),
});

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Rented: 'success',
  Vacant: 'warning',
  Closed: 'error',
  Unsold: 'default',
};

const createEmptyForm = {
  nameEnglish: '', nameHindi: '', mobile: '', address: '',
  guntaId: '', roomNumber: '', monthlyCharge: 0,
  status: 'Rented', notes: '',
};

const editEmptyForm = {
  ...createEmptyForm,
  password: '',
};

export const CustomerManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterGunta, setFilterGunta] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null);

  const { data: customers, isLoading } = useCustomers({
    search: search || undefined,
    guntaId: filterGunta || undefined,
    status: filterStatus || undefined,
  });
  const { data: guntas } = useGuntas();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const formik = useFormik({
    initialValues: editEmptyForm as any,
    validationSchema: editCustomer ? updateSchema : createSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      if (editCustomer) {
        const { password, ...data } = values;
        const updateData = password ? { ...data, password } : data;
        await updateMutation.mutateAsync({ id: editCustomer._id, data: updateData });
        resetForm();
        setDialogOpen(false);
        setEditCustomer(null);
      } else {
        const { password, ...createData } = values;
        const result = await createMutation.mutateAsync(createData as any);
        resetForm();
        setDialogOpen(false);
        setEditCustomer(null);
        // Show generated credentials
        setCreatedCreds({
          username: (result as any).generatedUsername,
          password: (result as any).generatedPassword,
        });
      }
    },
  });

  const openCreate = () => {
    setEditCustomer(null);
    formik.resetForm({ values: createEmptyForm });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    const guntaId = typeof customer.guntaId === 'string' ? customer.guntaId : (customer.guntaId as Gunta)._id;
    formik.resetForm({
      values: {
        nameEnglish: customer.nameEnglish,
        nameHindi: customer.nameHindi || '',
        mobile: customer.mobile,
        address: customer.address || '',
        guntaId,
        roomNumber: customer.roomNumber,
        monthlyCharge: customer.monthlyCharge,
        status: customer.status,
        password: '',
        notes: customer.notes || '',
      },
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  const getGuntaName = (customer: Customer) => {
    if (typeof customer.guntaId === 'object' && customer.guntaId) return (customer.guntaId as Gunta).name;
    return '';
  };

  return (
    <Box>
      <PageHeader title="Customer Management" subtitle="Manage customers and room assignments" actionLabel="Add Customer" onAction={openCreate} />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, mobile, room..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Gunta</InputLabel>
          <Select value={filterGunta} label="Gunta" onChange={(e) => setFilterGunta(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {guntas?.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Rented">Rented</MenuItem>
            <MenuItem value="Vacant">Vacant</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
            <MenuItem value="Unsold">Unsold</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : !customers?.length ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No customers found</Typography></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name (English)</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Gunta</TableCell>
                <TableCell>Monthly Charge</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell><Typography fontWeight={500}>{customer.nameEnglish}</Typography></TableCell>
                  <TableCell>{customer.roomNumber}</TableCell>
                  <TableCell>{getGuntaName(customer)}</TableCell>
                  <TableCell>Rs. {customer.monthlyCharge}</TableCell>
                  <TableCell>
                    <Chip label={customer.status} size="small" color={statusColors[customer.status] || 'default'} />
                  </TableCell>
                  <TableCell>{customer.mobile}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(customer)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(customer)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>{editCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth margin="normal" label="Name (English)" name="nameEnglish"
              value={formik.values.nameEnglish} onChange={formik.handleChange}
              error={formik.touched.nameEnglish && Boolean(formik.errors.nameEnglish)}
              helperText={formik.touched.nameEnglish && formik.errors.nameEnglish}
            />
            <TextField
              fullWidth margin="normal" label="Name (Hindi)" name="nameHindi"
              value={formik.values.nameHindi} onChange={formik.handleChange}
            />
            <TextField
              fullWidth margin="normal" label="Mobile" name="mobile"
              value={formik.values.mobile} onChange={formik.handleChange}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
            />
            <FormControl fullWidth margin="normal" error={formik.touched.guntaId && Boolean(formik.errors.guntaId)}>
              <InputLabel>Gunta</InputLabel>
              <Select name="guntaId" value={formik.values.guntaId} label="Gunta" onChange={formik.handleChange}>
                {guntas?.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth margin="normal" label="Room Number" name="roomNumber"
              value={formik.values.roomNumber} onChange={formik.handleChange}
              error={formik.touched.roomNumber && Boolean(formik.errors.roomNumber)}
              helperText={formik.touched.roomNumber && formik.errors.roomNumber}
            />
            <TextField
              fullWidth margin="normal" label="Monthly Charge (Rs.)" name="monthlyCharge" type="number"
              value={formik.values.monthlyCharge} onChange={formik.handleChange}
              error={formik.touched.monthlyCharge && Boolean(formik.errors.monthlyCharge)}
              helperText={formik.touched.monthlyCharge && formik.errors.monthlyCharge}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={formik.values.status} label="Status" onChange={formik.handleChange}>
                <MenuItem value="Rented">Rented</MenuItem>
                <MenuItem value="Vacant">Vacant</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
                <MenuItem value="Unsold">Unsold</MenuItem>
              </Select>
            </FormControl>
            {editCustomer && (
              <TextField
                fullWidth margin="normal" label="Password (leave blank to keep current)"
                name="password" type="password"
                value={formik.values.password} onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            )}
            <TextField
              fullWidth margin="normal" label="Address" name="address" multiline rows={2}
              value={formik.values.address} onChange={formik.handleChange}
            />
            <TextField
              fullWidth margin="normal" label="Notes" name="notes" multiline rows={2}
              value={formik.values.notes} onChange={formik.handleChange}
            />
            {!editCustomer && formik.values.guntaId && formik.values.roomNumber && (() => {
              const guntaName = guntas?.find(g => g._id === formik.values.guntaId)?.name || '';
              const shortName = guntaName.replace(/^Gunta\s*/i, '').replace(/\s+/g, '');
              return (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Login credentials will be auto-generated:
                  <br />
                  <strong>Username:</strong> Gunta{shortName}Room{formik.values.roomNumber}
                  <br />
                  <strong>Password:</strong> {formik.values.roomNumber}{shortName}
                </Alert>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Created Credentials Dialog */}
      <Dialog open={!!createdCreds} onClose={() => setCreatedCreds(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Customer Created</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Customer portal login credentials:
          </Alert>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Username:</strong> {createdCreds?.username}
          </Typography>
          <Typography variant="body1">
            <strong>Password:</strong> {createdCreds?.password}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Share these credentials with the customer so they can log in at /customer-login
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCreatedCreds(null)}>OK</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleteTarget?.nameEnglish}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};
