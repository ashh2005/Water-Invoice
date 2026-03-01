import React, { useState } from 'react';
import {
  Box, TextField, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress, Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useGuntas, useCreateGunta, useUpdateGunta, useDeleteGunta } from '../../hooks/useGuntas';
import { Gunta } from '../../types';

const schema = yup.object({
  name: yup.string().required('Gunta name is required'),
  description: yup.string(),
});

export const GuntaManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGunta, setEditGunta] = useState<Gunta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gunta | null>(null);

  const { data: guntas, isLoading } = useGuntas(search || undefined);
  const createMutation = useCreateGunta();
  const updateMutation = useUpdateGunta();
  const deleteMutation = useDeleteGunta();

  const formik = useFormik({
    initialValues: { name: '', description: '' },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      if (editGunta) {
        await updateMutation.mutateAsync({ id: editGunta._id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      resetForm();
      setDialogOpen(false);
      setEditGunta(null);
    },
  });

  const openCreate = () => {
    setEditGunta(null);
    formik.resetForm({ values: { name: '', description: '' } });
    setDialogOpen(true);
  };

  const openEdit = (gunta: Gunta) => {
    setEditGunta(gunta);
    formik.resetForm({ values: { name: gunta.name, description: gunta.description || '' } });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  return (
    <Box>
      <PageHeader title="Gunta Management" subtitle="Manage guntas for the water collection system" actionLabel="Add Gunta" onAction={openCreate} />

      <TextField
        placeholder="Search guntas..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 300 }}
      />

      <Paper>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : !guntas?.length ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No guntas found</Typography></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guntas.map((gunta) => (
                <TableRow key={gunta._id}>
                  <TableCell><Typography fontWeight={500}>{gunta.name}</Typography></TableCell>
                  <TableCell>{gunta.description || '-'}</TableCell>
                  <TableCell>{new Date(gunta.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(gunta)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(gunta)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>{editGunta ? 'Edit Gunta' : 'Create Gunta'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth margin="normal" label="Gunta Name" name="name"
              value={formik.values.name} onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth margin="normal" label="Description" name="description" multiline rows={3}
              value={formik.values.description} onChange={formik.handleChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editGunta ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Gunta"
        message={`Are you sure you want to delete gunta "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};
