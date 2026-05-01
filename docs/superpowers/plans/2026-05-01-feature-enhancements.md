# Feature Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add name-wise invoice filtering, monthly summary + per-gunta detail reports, gunta-to-staff allocation, and WhatsApp payment reminders on the defaulters list.

**Architecture:** Backend changes follow the existing service → controller → route pattern. Frontend changes use the existing React Query hook pattern. No new DB collections — gunta-staff is a field on the existing Gunta model.

**Tech Stack:** Node.js + TypeScript + Express + Mongoose (backend), React + TypeScript + MUI + React Query (frontend), jsPDF + xlsx (report exports).

---

## File Map

| File | Change |
|---|---|
| `backend/src/services/invoiceService.ts` | Add `customerName` filter to `getInvoices` |
| `backend/src/controllers/invoiceController.ts` | Pass `customerName` query param |
| `backend/src/models/Gunta.ts` | Add optional `assignedStaff` field |
| `backend/src/services/guntaService.ts` | Populate `assignedStaff`, accept in create/update |
| `backend/src/controllers/userController.ts` | New — `getStaffUsers` handler |
| `backend/src/routes/userRoutes.ts` | New — `GET /api/users/staff` |
| `backend/src/server.ts` | Register userRoutes |
| `backend/src/services/reportService.ts` | Add `getGuntaDetail` |
| `backend/src/controllers/reportController.ts` | Add `getGuntaDetail` handler |
| `backend/src/routes/reportRoutes.ts` | Add gunta-detail route |
| `frontend/src/types/index.ts` | Add `StaffUser`, `GuntaDetailReport`; update `Gunta` |
| `frontend/src/services/invoiceService.ts` | Add `customerName` param |
| `frontend/src/hooks/useInvoices.ts` | Add `customerName` param |
| `frontend/src/pages/invoices/InvoicePage.tsx` | Add debounced name filter field |
| `frontend/src/services/userService.ts` | New — `getStaffUsers` |
| `frontend/src/services/guntaService.ts` | Pass `assignedStaff` in create/update payloads |
| `frontend/src/services/reportService.ts` | Add `getGuntaDetail` service call |
| `frontend/src/hooks/useDashboard.ts` | Add `useGuntaDetail` hook |
| `frontend/src/pages/guntas/GuntaManagementPage.tsx` | Add staff column + dropdown in dialog |
| `frontend/src/pages/reports/ReportsPage.tsx` | Add 3 new tabs + WhatsApp reminders |

---

## Task 1: Name-wise invoice filter — backend

**Files:**
- Modify: `backend/src/services/invoiceService.ts`
- Modify: `backend/src/controllers/invoiceController.ts`

- [ ] **Step 1: Add `customerName` to `getInvoices` in invoiceService.ts**

Replace the `getInvoices` function signature and query block (lines 136–159):

```typescript
export const getInvoices = async (filters: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
  customerName?: string;
}) => {
  const query: any = {};
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate + 'T23:59:59.999Z');
  }
  if (filters.customerName) {
    const matchingCustomers = await Customer.find(
      { nameEnglish: { $regex: filters.customerName, $options: 'i' } },
      '_id'
    );
    query.customerId = { $in: matchingCustomers.map((c) => c._id) };
  }

  return Invoice.find(query)
    .populate({
      path: 'customerId',
      select: 'nameEnglish nameHindi mobile roomNumber guntaId monthlyCharge',
      populate: { path: 'guntaId', select: 'name' },
    })
    .populate('whatsappSentBy', 'username role')
    .sort({ createdAt: -1 });
};
```

- [ ] **Step 2: Pass `customerName` in invoiceController.ts `getAll`**

Replace the `getAll` handler (lines 8–17):

```typescript
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, fromDate, toDate, paymentMethod, customerName } = req.query;
  const invoices = await invoiceService.getInvoices({
    customerId: customerId as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
    paymentMethod: paymentMethod as string,
    customerName: customerName as string,
  });
  sendSuccess(res, invoices);
});
```

- [ ] **Step 3: Manually test the endpoint**

Start the backend (`cd backend && npm run dev`) and run:

```bash
curl "http://localhost:5000/api/invoices?customerName=Ram" \
  -H "Authorization: Bearer <your_token>"
```

Expected: returns only invoices where customer `nameEnglish` contains "Ram" (case-insensitive).

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/invoiceService.ts backend/src/controllers/invoiceController.ts
git commit -m "feat: add customerName filter to invoice list endpoint"
```

---

## Task 2: Name-wise invoice filter — frontend

**Files:**
- Modify: `frontend/src/services/invoiceService.ts`
- Modify: `frontend/src/hooks/useInvoices.ts`
- Modify: `frontend/src/pages/invoices/InvoicePage.tsx`

- [ ] **Step 1: Add `customerName` param to `getInvoices` in invoiceService.ts**

Replace the function (lines 4–12):

```typescript
export const getInvoices = async (filters?: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
  customerName?: string;
}): Promise<Invoice[]> => {
  const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params: filters });
  return data.data;
};
```

- [ ] **Step 2: Add `customerName` param to `useInvoices` hook in useInvoices.ts**

Replace the hook (lines 5–10):

```typescript
export const useInvoices = (filters?: {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
  customerName?: string;
}) => useQuery({ queryKey: ['invoices', filters], queryFn: () => invoiceService.getInvoices(filters) });
```

- [ ] **Step 3: Add debounced customer name field to InvoicePage.tsx**

At the top of the file, add the `useEffect` and `useState` imports if not present (they're already imported via React). Add a `customerName` state and a debounced value:

```typescript
// Add after existing useState declarations (after line 19):
const [customerName, setCustomerName] = useState('');
const [debouncedName, setDebouncedName] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedName(customerName), 300);
  return () => clearTimeout(timer);
}, [customerName]);
```

Update the `useInvoices` call (replace line 21–25):

```typescript
const { data: invoices, isLoading } = useInvoices({
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
  paymentMethod: paymentMethod || undefined,
  customerName: debouncedName || undefined,
});
```

Add `useEffect` to imports at the top of the file:

```typescript
import React, { useState, useEffect } from 'react';
```

Add the name filter field inside the filter `Box` (after the `FormControl` for Method, before the closing `</Box>`):

```tsx
<TextField
  label="Customer Name" size="small" placeholder="Search by name..."
  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
  sx={{ minWidth: 200 }}
/>
```

- [ ] **Step 4: Test in browser**

Start frontend (`cd frontend && npm run dev`). Navigate to Invoices page. Type a customer name in the new field — the table should filter after 300ms. Clear the field — all invoices return.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/invoiceService.ts frontend/src/hooks/useInvoices.ts frontend/src/pages/invoices/InvoicePage.tsx
git commit -m "feat: add customer name filter to invoice list"
```

---

## Task 3: Gunta-to-staff allocation — backend

**Files:**
- Modify: `backend/src/models/Gunta.ts`
- Modify: `backend/src/services/guntaService.ts`
- Create: `backend/src/controllers/userController.ts`
- Create: `backend/src/routes/userRoutes.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Add `assignedStaff` field to Gunta model**

Replace the full content of `backend/src/models/Gunta.ts`:

```typescript
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGunta extends Document {
  name: string;
  description?: string;
  assignedStaff?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const guntaSchema = new Schema<IGunta>(
  {
    name: {
      type: String,
      required: [true, 'Gunta name is required'],
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const Gunta = mongoose.model<IGunta>('Gunta', guntaSchema);
```

- [ ] **Step 2: Update guntaService.ts to populate assignedStaff and accept it in create/update**

Replace the full content of `backend/src/services/guntaService.ts`:

```typescript
import { Gunta } from '../models/Gunta';
import { Customer } from '../models/Customer';
import { AppError } from '../utils/AppError';

export const createGunta = async (data: { name: string; description?: string; assignedStaff?: string }) => {
  return Gunta.create(data);
};

export const getGuntas = async (search?: string) => {
  const filter: any = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  return Gunta.find(filter)
    .populate('assignedStaff', 'username role')
    .sort({ name: 1 });
};

export const getGuntaById = async (id: string) => {
  const gunta = await Gunta.findById(id).populate('assignedStaff', 'username role');
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};

export const updateGunta = async (id: string, data: { name?: string; description?: string; assignedStaff?: string | null }) => {
  const gunta = await Gunta.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('assignedStaff', 'username role');
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};

export const deleteGunta = async (id: string) => {
  const customerCount = await Customer.countDocuments({ guntaId: id });
  if (customerCount > 0) {
    throw new AppError('Cannot delete gunta with existing customers. Delete customers first.', 400);
  }
  const gunta = await Gunta.findByIdAndDelete(id);
  if (!gunta) throw new AppError('Gunta not found', 404);
  return gunta;
};
```

- [ ] **Step 3: Create userController.ts**

Create `backend/src/controllers/userController.ts`:

```typescript
import { Response } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';

export const getStaffUsers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const staff = await User.find({ role: 'staff', isActive: true }, 'username role _id');
  sendSuccess(res, staff);
});
```

- [ ] **Step 4: Create userRoutes.ts**

Create `backend/src/routes/userRoutes.ts`:

```typescript
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getStaffUsers } from '../controllers/userController';

const router = Router();

router.use(protect);
router.get('/staff', getStaffUsers);

export default router;
```

- [ ] **Step 5: Register userRoutes in server.ts**

Add after the last import in `backend/src/server.ts`:

```typescript
import userRoutes from './routes/userRoutes';
```

Add after the last `app.use('/api/...')` line:

```typescript
app.use('/api/users', userRoutes);
```

- [ ] **Step 6: Manually test**

```bash
curl "http://localhost:5000/api/users/staff" \
  -H "Authorization: Bearer <admin_token>"
```

Expected: JSON array of staff users with `_id`, `username`, `role`.

```bash
curl -X PUT "http://localhost:5000/api/guntas/<gunta_id>" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"assignedStaff": "<staff_user_id>"}'
```

Expected: gunta returned with `assignedStaff: { username: "...", role: "staff" }`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/Gunta.ts backend/src/services/guntaService.ts \
  backend/src/controllers/userController.ts backend/src/routes/userRoutes.ts \
  backend/src/server.ts
git commit -m "feat: add assignedStaff to gunta model and staff users endpoint"
```

---

## Task 4: Gunta-to-staff allocation — frontend

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/services/userService.ts`
- Modify: `frontend/src/services/guntaService.ts`
- Modify: `frontend/src/pages/guntas/GuntaManagementPage.tsx`

- [ ] **Step 1: Update types in index.ts**

Add `StaffUser` interface and update the `Gunta` interface. Insert after the existing `User` interface (after line 7):

```typescript
export interface StaffUser {
  _id: string;
  username: string;
  role: 'admin' | 'staff';
}
```

Replace the `Gunta` interface (lines 13–19):

```typescript
export interface Gunta {
  _id: string;
  name: string;
  description?: string;
  assignedStaff?: StaffUser | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Create userService.ts**

Create `frontend/src/services/userService.ts`:

```typescript
import api from './api';
import { StaffUser, ApiResponse } from '../types';

export const getStaffUsers = async (): Promise<StaffUser[]> => {
  const { data } = await api.get<ApiResponse<StaffUser[]>>('/users/staff');
  return data.data;
};
```

- [ ] **Step 3: Update guntaService.ts to pass assignedStaff**

Replace `createGunta` and `updateGunta` functions:

```typescript
export const createGunta = async (guntaData: {
  name: string;
  description?: string;
  assignedStaff?: string | null;
}): Promise<Gunta> => {
  const { data } = await api.post<ApiResponse<Gunta>>('/guntas', guntaData);
  return data.data;
};

export const updateGunta = async (
  id: string,
  guntaData: { name?: string; description?: string; assignedStaff?: string | null }
): Promise<Gunta> => {
  const { data } = await api.put<ApiResponse<Gunta>>(`/guntas/${id}`, guntaData);
  return data.data;
};
```

- [ ] **Step 4: Update GuntaManagementPage.tsx**

Replace the full file content:

```tsx
import React, { useState } from 'react';
import {
  Box, TextField, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress, Typography,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useGuntas, useCreateGunta, useUpdateGunta, useDeleteGunta } from '../../hooks/useGuntas';
import { getStaffUsers } from '../../services/userService';
import { Gunta } from '../../types';

const schema = yup.object({
  name: yup.string().required('Gunta name is required'),
  description: yup.string(),
  assignedStaff: yup.string().nullable(),
});

export const GuntaManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGunta, setEditGunta] = useState<Gunta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gunta | null>(null);

  const { data: guntas, isLoading } = useGuntas(search || undefined);
  const { data: staffUsers = [] } = useQuery({ queryKey: ['staff-users'], queryFn: getStaffUsers });
  const createMutation = useCreateGunta();
  const updateMutation = useUpdateGunta();
  const deleteMutation = useDeleteGunta();

  const formik = useFormik({
    initialValues: { name: '', description: '', assignedStaff: '' },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        name: values.name,
        description: values.description,
        assignedStaff: values.assignedStaff || null,
      };
      if (editGunta) {
        await updateMutation.mutateAsync({ id: editGunta._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      resetForm();
      setDialogOpen(false);
      setEditGunta(null);
    },
  });

  const openCreate = () => {
    setEditGunta(null);
    formik.resetForm({ values: { name: '', description: '', assignedStaff: '' } });
    setDialogOpen(true);
  };

  const openEdit = (gunta: Gunta) => {
    setEditGunta(gunta);
    const staffId = gunta.assignedStaff ? (typeof gunta.assignedStaff === 'object' ? gunta.assignedStaff._id : gunta.assignedStaff) : '';
    formik.resetForm({ values: { name: gunta.name, description: gunta.description || '', assignedStaff: staffId } });
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
                <TableCell>Assigned Staff</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guntas.map((gunta) => (
                <TableRow key={gunta._id}>
                  <TableCell><Typography fontWeight={500}>{gunta.name}</Typography></TableCell>
                  <TableCell>{gunta.description || '-'}</TableCell>
                  <TableCell>
                    {gunta.assignedStaff
                      ? (typeof gunta.assignedStaff === 'object' ? gunta.assignedStaff.username : gunta.assignedStaff)
                      : <Typography color="text.secondary" variant="body2">Unassigned</Typography>}
                  </TableCell>
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
            <FormControl fullWidth margin="normal">
              <InputLabel>Assigned Staff</InputLabel>
              <Select
                name="assignedStaff"
                value={formik.values.assignedStaff}
                label="Assigned Staff"
                onChange={formik.handleChange}
              >
                <MenuItem value=""><em>Unassigned</em></MenuItem>
                {staffUsers.map((u) => (
                  <MenuItem key={u._id} value={u._id}>{u.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
```

- [ ] **Step 5: Test in browser**

Navigate to Gunta Management. Verify the "Assigned Staff" column appears. Open the create/edit dialog — confirm the staff dropdown appears and lists active staff users. Assign a staff member, save, verify it shows in the table.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/services/userService.ts \
  frontend/src/services/guntaService.ts frontend/src/pages/guntas/GuntaManagementPage.tsx
git commit -m "feat: gunta-to-staff allocation UI"
```

---

## Task 5: Gunta detail report — backend

**Files:**
- Modify: `backend/src/services/reportService.ts`
- Modify: `backend/src/controllers/reportController.ts`
- Modify: `backend/src/routes/reportRoutes.ts`

- [ ] **Step 1: Add `getGuntaDetail` to reportService.ts**

Append to the end of `backend/src/services/reportService.ts`:

```typescript
export const getGuntaDetail = async (guntaId: string, fromMonth: string, toMonth: string) => {
  const customers = await Customer.find({ guntaId, status: 'Rented' });

  const paid: any[] = [];
  const unpaid: any[] = [];

  for (const customer of customers) {
    const invoice = await Invoice.findOne({
      customerId: customer._id,
      paidFromMonth: { $lte: toMonth },
      paidToMonth: { $gte: fromMonth },
    }).sort({ createdAt: -1 });

    if (invoice) {
      paid.push({
        customer: {
          _id: customer._id,
          nameEnglish: customer.nameEnglish,
          nameHindi: customer.nameHindi,
          mobile: customer.mobile,
          roomNumber: customer.roomNumber,
          monthlyCharge: customer.monthlyCharge,
        },
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: invoice.amountPaid,
          paymentMethod: invoice.paymentMethod,
          paidFromMonth: invoice.paidFromMonth,
          paidToMonth: invoice.paidToMonth,
          createdAt: invoice.createdAt,
        },
      });
    } else {
      const [fy, fm] = fromMonth.split('-').map(Number);
      const [ty, tm] = toMonth.split('-').map(Number);
      const pendingMonths = (ty - fy) * 12 + (tm - fm) + 1;
      unpaid.push({
        customer: {
          _id: customer._id,
          nameEnglish: customer.nameEnglish,
          nameHindi: customer.nameHindi,
          mobile: customer.mobile,
          roomNumber: customer.roomNumber,
          monthlyCharge: customer.monthlyCharge,
        },
        pendingMonths,
        pendingAmount: pendingMonths * customer.monthlyCharge,
      });
    }
  }

  const paidTotal = paid.reduce((sum, p) => sum + p.invoice.amountPaid, 0);
  const unpaidTotal = unpaid.reduce((sum, u) => sum + u.pendingAmount, 0);

  return { paid, unpaid, paidTotal, unpaidTotal };
};
```

- [ ] **Step 2: Add `getGuntaDetail` handler to reportController.ts**

Append to the end of `backend/src/controllers/reportController.ts`:

```typescript
export const getGuntaDetail = asyncHandler(async (req: Request, res: Response) => {
  const { guntaId, fromMonth, toMonth } = req.query;
  if (!guntaId || !fromMonth || !toMonth) {
    return sendSuccess(res, null, 'guntaId, fromMonth, and toMonth query params are required');
  }
  const data = await reportService.getGuntaDetail(
    guntaId as string,
    fromMonth as string,
    toMonth as string
  );
  sendSuccess(res, data);
});
```

- [ ] **Step 3: Add route in reportRoutes.ts**

Append before `export default router;`:

```typescript
router.get('/gunta-detail', reportController.getGuntaDetail);
```

- [ ] **Step 4: Test the endpoint**

```bash
curl "http://localhost:5000/api/reports/gunta-detail?guntaId=<gunta_id>&fromMonth=2025-01&toMonth=2025-04" \
  -H "Authorization: Bearer <token>"
```

Expected: `{ paid: [...], unpaid: [...], paidTotal: N, unpaidTotal: N }`

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/reportService.ts backend/src/controllers/reportController.ts \
  backend/src/routes/reportRoutes.ts
git commit -m "feat: add gunta detail report endpoint"
```

---

## Task 6: Monthly summary report tab — frontend

**Files:**
- Modify: `frontend/src/pages/reports/ReportsPage.tsx`

This task adds a new "Monthly Summary" tab. It reuses the existing `useCollectionSummary` hook — no new service calls needed.

- [ ] **Step 1: Add month state and tab to ReportsPage.tsx**

At the top of the component (after existing state declarations), add:

```typescript
const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const monthStart = selectedMonth ? `${selectedMonth}-01` : '';
const monthEnd = selectedMonth
  ? (() => {
      const [y, m] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return `${selectedMonth}-${lastDay}`;
    })()
  : '';

const { data: monthlyData, isLoading: monthlyLoading } = useCollectionSummary(monthStart, monthEnd);
```

- [ ] **Step 2: Add the Monthly Summary tab label**

In the `<Tabs>` component (currently has 3 tabs), add a fourth tab after "Payment Breakdown":

```tsx
<Tab label="Monthly Summary" />
```

- [ ] **Step 3: Add the Monthly Summary tab content**

Add after the closing `}` of the `tab === 2` block (before the closing `</Box>`):

```tsx
{tab === 3 && (
  <Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
      <TextField
        label="Month" type="month" size="small" InputLabelProps={{ shrink: true }}
        value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
      />
      {monthlyData && (
        <Button variant="outlined" startIcon={<Download />} onClick={() => {
          const rows = Object.entries(monthlyData.byGunta).map(([gunta, d]) => ({
            Gunta: gunta, Cash: d.cash, Online: d.online, Total: d.total, Invoices: d.count,
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Monthly');
          XLSX.writeFile(wb, `monthly-summary-${selectedMonth}.xlsx`);
        }}>Export Excel</Button>
      )}
    </Box>

    {monthlyLoading ? (
      <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
    ) : monthlyData ? (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="text.secondary">Total Collected</Typography>
            <Typography variant="h4" fontWeight={600} color="primary">Rs. {monthlyData.grandTotal.toLocaleString()}</Typography>
            <Typography variant="body2">{monthlyData.invoiceCount} invoices</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="text.secondary">Cash</Typography>
            <Typography variant="h4" fontWeight={600} color="success.main">Rs. {monthlyData.cashTotal.toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography color="text.secondary">Online</Typography>
            <Typography variant="h4" fontWeight={600} color="info.main">Rs. {monthlyData.onlineTotal.toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>By Gunta</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Gunta</TableCell>
                  <TableCell>Cash</TableCell>
                  <TableCell>Online</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Invoices</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(monthlyData.byGunta).map(([gunta, d]) => (
                  <TableRow key={gunta}>
                    <TableCell><Typography fontWeight={500}>{gunta}</Typography></TableCell>
                    <TableCell>Rs. {d.cash.toLocaleString()}</TableCell>
                    <TableCell>Rs. {d.online.toLocaleString()}</TableCell>
                    <TableCell><Typography fontWeight={600}>Rs. {d.total.toLocaleString()}</Typography></TableCell>
                    <TableCell>{d.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    ) : (
      <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No data for selected month</Typography></Paper>
    )}
  </Box>
)}
```

- [ ] **Step 4: Test in browser**

Navigate to Reports → Monthly Summary tab. Confirm it defaults to the current month, shows collection cards and gunta breakdown. Change the month picker and confirm data updates. Click Export Excel and verify the file downloads.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/reports/ReportsPage.tsx
git commit -m "feat: add monthly summary report tab"
```

---

## Task 7: Per-gunta detail report — frontend

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/reportService.ts`
- Modify: `frontend/src/hooks/useDashboard.ts`
- Modify: `frontend/src/pages/reports/ReportsPage.tsx`

- [ ] **Step 1: Add `GuntaDetailReport` type to types/index.ts**

Append before the last `export interface ApiResponse` line:

```typescript
export interface GuntaDetailCustomer {
  _id: string;
  nameEnglish: string;
  nameHindi?: string;
  mobile: string;
  roomNumber: string;
  monthlyCharge: number;
}

export interface GuntaDetailPaidEntry {
  customer: GuntaDetailCustomer;
  invoice: {
    invoiceNumber: string;
    amountPaid: number;
    paymentMethod: 'Cash' | 'Online';
    paidFromMonth: string;
    paidToMonth: string;
    createdAt: string;
  };
}

export interface GuntaDetailUnpaidEntry {
  customer: GuntaDetailCustomer;
  pendingMonths: number;
  pendingAmount: number;
}

export interface GuntaDetailReport {
  paid: GuntaDetailPaidEntry[];
  unpaid: GuntaDetailUnpaidEntry[];
  paidTotal: number;
  unpaidTotal: number;
}
```

- [ ] **Step 2: Add `getGuntaDetail` to reportService.ts**

Append to the end of `frontend/src/services/reportService.ts`:

```typescript
import { GuntaDetailReport } from '../types';

export const getGuntaDetail = async (guntaId: string, fromMonth: string, toMonth: string): Promise<GuntaDetailReport> => {
  const { data } = await api.get<ApiResponse<GuntaDetailReport>>('/reports/gunta-detail', {
    params: { guntaId, fromMonth, toMonth },
  });
  return data.data;
};
```

Note: move the `GuntaDetailReport` import to the top of the file with the other type imports.

- [ ] **Step 3: Add `useGuntaDetail` hook to useDashboard.ts**

Append to the end of `frontend/src/hooks/useDashboard.ts`:

```typescript
export const useGuntaDetail = (guntaId: string, fromMonth: string, toMonth: string) =>
  useQuery({
    queryKey: ['gunta-detail', guntaId, fromMonth, toMonth],
    queryFn: () => reportService.getGuntaDetail(guntaId, fromMonth, toMonth),
    enabled: !!guntaId && !!fromMonth && !!toMonth,
  });
```

- [ ] **Step 4: Add Gunta Detail tab state and hook to ReportsPage.tsx**

Add these imports at the top:

```typescript
import { useGuntas } from '../../hooks/useGuntas';
import { useGuntaDetail } from '../../hooks/useDashboard';
import { GuntaDetailPaidEntry, GuntaDetailUnpaidEntry } from '../../types';
```

Add state after existing state declarations:

```typescript
const [selectedGuntaId, setSelectedGuntaId] = useState('');
const [guntaFromMonth, setGuntaFromMonth] = useState('');
const [guntaToMonth, setGuntaToMonth] = useState('');

const { data: guntas } = useGuntas();
const { data: guntaDetail, isLoading: guntaDetailLoading } = useGuntaDetail(selectedGuntaId, guntaFromMonth, guntaToMonth);
```

- [ ] **Step 5: Add the Gunta Detail tab label**

In the `<Tabs>` component, add a fifth tab after "Monthly Summary":

```tsx
<Tab label="Gunta Detail" />
```

- [ ] **Step 6: Add export helpers for gunta detail**

Add these two helper functions inside the `ReportsPage` component (before the return statement):

```typescript
const exportGuntaDetailExcel = () => {
  if (!guntaDetail) return;
  const paidRows = guntaDetail.paid.map((p: GuntaDetailPaidEntry) => ({
    Status: 'Paid', Room: p.customer.roomNumber, Customer: p.customer.nameEnglish,
    'Invoice #': p.invoice.invoiceNumber, Amount: p.invoice.amountPaid,
    Method: p.invoice.paymentMethod, Period: `${p.invoice.paidFromMonth} to ${p.invoice.paidToMonth}`,
    Date: new Date(p.invoice.createdAt).toLocaleDateString(),
  }));
  const unpaidRows = guntaDetail.unpaid.map((u: GuntaDetailUnpaidEntry) => ({
    Status: 'Unpaid', Room: u.customer.roomNumber, Customer: u.customer.nameEnglish,
    'Invoice #': '-', Amount: u.pendingAmount,
    Method: '-', Period: `${guntaFromMonth} to ${guntaToMonth}`,
    Date: '-',
  }));
  const ws = XLSX.utils.json_to_sheet([...paidRows, ...unpaidRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gunta Detail');
  XLSX.writeFile(wb, `gunta-detail-${selectedGuntaId}-${guntaFromMonth}-${guntaToMonth}.xlsx`);
};

const exportGuntaDetailPDF = () => {
  if (!guntaDetail) return;
  const doc = new jsPDF();
  const guntaName = guntas?.find(g => g._id === selectedGuntaId)?.name || selectedGuntaId;
  doc.setFontSize(16);
  doc.text(`Gunta Detail: ${guntaName}`, 20, 20);
  doc.setFontSize(11);
  doc.text(`Period: ${guntaFromMonth} to ${guntaToMonth}`, 20, 30);
  doc.text(`Paid Total: Rs. ${guntaDetail.paidTotal} | Unpaid Total: Rs. ${guntaDetail.unpaidTotal}`, 20, 40);

  let y = 55;
  doc.setFontSize(12);
  doc.text('PAID', 20, y); y += 8;
  doc.setFontSize(9);
  guntaDetail.paid.forEach((p: GuntaDetailPaidEntry) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`Room ${p.customer.roomNumber} - ${p.customer.nameEnglish} | Rs.${p.invoice.amountPaid} | ${p.invoice.paymentMethod} | ${p.invoice.invoiceNumber}`, 20, y);
    y += 7;
  });

  y += 5;
  doc.setFontSize(12);
  doc.text('UNPAID', 20, y); y += 8;
  doc.setFontSize(9);
  guntaDetail.unpaid.forEach((u: GuntaDetailUnpaidEntry) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`Room ${u.customer.roomNumber} - ${u.customer.nameEnglish} | Pending: Rs.${u.pendingAmount} (${u.pendingMonths} months)`, 20, y);
    y += 7;
  });

  doc.save(`gunta-detail-${guntaName}-${guntaFromMonth}.pdf`);
};
```

- [ ] **Step 7: Add Gunta Detail tab content**

Add after the closing `}` of the `tab === 3` block (before the closing `</Box>`):

```tsx
{tab === 4 && (
  <Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Gunta</InputLabel>
        <Select value={selectedGuntaId} label="Gunta" onChange={(e) => setSelectedGuntaId(e.target.value)}>
          <MenuItem value=""><em>Select Gunta</em></MenuItem>
          {guntas?.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField label="From Month" type="month" size="small" InputLabelProps={{ shrink: true }}
        value={guntaFromMonth} onChange={(e) => setGuntaFromMonth(e.target.value)} />
      <TextField label="To Month" type="month" size="small" InputLabelProps={{ shrink: true }}
        value={guntaToMonth} onChange={(e) => setGuntaToMonth(e.target.value)} />
      {guntaDetail && (
        <>
          <Button variant="outlined" startIcon={<Download />} onClick={exportGuntaDetailExcel}>Export Excel</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportGuntaDetailPDF}>Export PDF</Button>
        </>
      )}
    </Box>

    {guntaDetailLoading ? (
      <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
    ) : guntaDetail ? (
      <Box>
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Card sx={{ flex: 1 }}><CardContent>
            <Typography color="text.secondary">Paid</Typography>
            <Typography variant="h5" fontWeight={600} color="success.main">Rs. {guntaDetail.paidTotal.toLocaleString()}</Typography>
            <Typography variant="body2">{guntaDetail.paid.length} customers</Typography>
          </CardContent></Card>
          <Card sx={{ flex: 1 }}><CardContent>
            <Typography color="text.secondary">Unpaid</Typography>
            <Typography variant="h5" fontWeight={600} color="error.main">Rs. {guntaDetail.unpaidTotal.toLocaleString()}</Typography>
            <Typography variant="body2">{guntaDetail.unpaid.length} customers</Typography>
          </CardContent></Card>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: '4px 4px 0 0' }}>
            <Typography fontWeight={600} color="success.dark">Paid Customers</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Room</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guntaDetail.paid.map((p: GuntaDetailPaidEntry) => (
                <TableRow key={p.customer._id}>
                  <TableCell><Typography fontWeight={500}>{p.customer.roomNumber}</Typography></TableCell>
                  <TableCell>{p.customer.nameEnglish}</TableCell>
                  <TableCell>{p.invoice.invoiceNumber}</TableCell>
                  <TableCell>Rs. {p.invoice.amountPaid}</TableCell>
                  <TableCell><Chip label={p.invoice.paymentMethod} size="small" color={p.invoice.paymentMethod === 'Cash' ? 'success' : 'primary'} /></TableCell>
                  <TableCell>{p.invoice.paidFromMonth} to {p.invoice.paidToMonth}</TableCell>
                  <TableCell>{new Date(p.invoice.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper>
          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: '4px 4px 0 0' }}>
            <Typography fontWeight={600} color="error.dark">Unpaid Customers</Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Room</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Monthly Charge</TableCell>
                <TableCell>Pending Months</TableCell>
                <TableCell>Pending Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guntaDetail.unpaid.map((u: GuntaDetailUnpaidEntry) => (
                <TableRow key={u.customer._id}>
                  <TableCell><Typography fontWeight={500}>{u.customer.roomNumber}</Typography></TableCell>
                  <TableCell>{u.customer.nameEnglish}</TableCell>
                  <TableCell>Rs. {u.customer.monthlyCharge}</TableCell>
                  <TableCell><Chip label={u.pendingMonths} color="error" size="small" /></TableCell>
                  <TableCell><Typography color="error" fontWeight={600}>Rs. {u.pendingAmount}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    ) : (
      <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Select a gunta and month range to view the report</Typography></Paper>
    )}
  </Box>
)}
```

- [ ] **Step 8: Ensure `FormControl`, `InputLabel`, `Select`, `MenuItem` are imported in ReportsPage.tsx**

Add to the MUI imports at the top if not already present:

```typescript
import { ..., FormControl, InputLabel, Select, MenuItem } from '@mui/material';
```

- [ ] **Step 9: Test in browser**

Navigate to Reports → Gunta Detail tab. Select a gunta and month range. Verify the paid/unpaid tables populate correctly. Test Excel and PDF export.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/services/reportService.ts \
  frontend/src/hooks/useDashboard.ts frontend/src/pages/reports/ReportsPage.tsx
git commit -m "feat: add per-gunta detail report tab"
```

---

## Task 8: WhatsApp payment reminders on defaulters list

**Files:**
- Modify: `frontend/src/pages/reports/ReportsPage.tsx`

- [ ] **Step 1: Add reminder sent tracking state**

In ReportsPage.tsx, add state to track which customers have had a reminder sent this session. Add after existing state declarations:

```typescript
const [remindedCustomerIds, setRemindedCustomerIds] = useState<Set<string>>(new Set());
```

- [ ] **Step 2: Add `handleSendReminder` function**

Add inside the component (before the return statement):

```typescript
const handleSendReminder = (d: Defaulter) => {
  const name = d.customer.nameEnglish;
  const amount = d.pendingAmount;
  const months = d.pendingMonths;
  const since = d.pendingFrom;
  const message = `Dear ${name}, your water bill of Rs.${amount} is pending for ${months} month(s) since ${since}. Please pay at the earliest. Thank you.`;
  const phone = d.customer.mobile.startsWith('+') ? d.customer.mobile.slice(1) : `91${d.customer.mobile}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  setRemindedCustomerIds((prev) => new Set(prev).add(d.customer._id));
};
```

- [ ] **Step 3: Add WhatsApp icon import**

At the top of the file, add:

```typescript
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Tooltip } from '@mui/material';
```

(Add `Tooltip` to the existing MUI import if not already present.)

- [ ] **Step 4: Add WhatsApp button column to defaulters table**

In the defaulters table, add a new `<TableCell>Actions</TableCell>` header after "Last Payment":

```tsx
<TableCell>Actions</TableCell>
```

In each row, add the action cell after the last payment cell:

```tsx
<TableCell>
  <Tooltip title={remindedCustomerIds.has(d.customer._id) ? 'Reminder sent' : 'Send WhatsApp reminder'}>
    <IconButton
      size="small"
      color={remindedCustomerIds.has(d.customer._id) ? 'success' : 'default'}
      onClick={() => handleSendReminder(d)}
    >
      <WhatsAppIcon fontSize="small" />
    </IconButton>
  </Tooltip>
</TableCell>
```

- [ ] **Step 5: Ensure `IconButton` is imported**

Add `IconButton` to the MUI imports at the top if not already present.

- [ ] **Step 6: Test in browser**

Navigate to Reports → Defaulters List. Verify each row has a WhatsApp icon button. Click one — confirm WhatsApp web opens with the pre-filled reminder message and the correct phone number. Verify the icon turns green after clicking.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/reports/ReportsPage.tsx
git commit -m "feat: add WhatsApp payment reminder button to defaulters list"
```

---

## Final Verification

- [ ] Start both backend and frontend, walk through all 4 features end-to-end
- [ ] Invoice page: search by name filters table correctly
- [ ] Gunta page: staff dropdown shows active staff, assignment saves and displays in table
- [ ] Reports → Monthly Summary: month picker works, export downloads
- [ ] Reports → Gunta Detail: selects gunta + range, shows paid/unpaid tables, exports work
- [ ] Reports → Defaulters: WhatsApp button opens correct wa.me link with reminder message
- [ ] No TypeScript compile errors: `cd frontend && npm run build` and `cd backend && npm run build`
