import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Link,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { showError, showSuccess } from '../../utils/toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ blocked: false, customerSegment: '', customerNotes: '' });

  const load = useCallback(() => {
    setError('');
    return adminApi.users(page).then((data) => {
      setUsers(data.content);
      setPageData(data);
    }).catch((err) => setError(err.message));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteUser = async (target) => {
    if (!(await confirm({
      title: `Delete ${target.email}?`,
      description: 'This removes the user and their related account data.',
      confirmText: 'Delete user',
    }))) return;
    try {
      await adminApi.deleteUser(target.id);
      showSuccess('User deleted');
      await load();
    } catch (err) {
      showError(err.message);
    }
  };

  const selectUser = async (target) => {
    try {
      const detail = await adminApi.user(target.id);
      setSelected(detail);
      setForm({
        blocked: detail.customer.blocked,
        customerSegment: detail.customer.customerSegment || '',
        customerNotes: detail.customerNotes || '',
      });
    } catch (err) {
      showError(err.message);
    }
  };

  const saveCustomer = async () => {
    if (!selected) return;
    try {
      const detail = await adminApi.updateUser(selected.customer.id, {
        blocked: form.blocked,
        customerSegment: form.customerSegment,
        customerNotes: form.customerNotes,
      });
      setSelected(detail);
      showSuccess('Customer updated');
      await load();
    } catch (err) {
      showError(err.message);
    }
  };

  const sendPasswordReset = async () => {
    if (!selected) return;
    try {
      await adminApi.sendUserPasswordReset(selected.customer.id);
      showSuccess('Password reset email sent');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Users</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Segment</TableCell>
              <TableCell align="right">Lifetime</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.firstName} {item.lastName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.mobileNumber || '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <Chip label={item.role} size="small" />
                    {item.blocked && <Chip label="Blocked" size="small" color="error" />}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {item.customerSegment && <Chip label={item.customerSegment} size="small" variant="outlined" />}
                    {(item.computedSegments || []).map((segment) => (
                      <Chip key={segment} label={segment} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">${Number(item.lifetimeSpend || 0).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => selectUser(item)}>Manage</Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={item.id === user?.id}
                      onClick={() => deleteUser(item)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selected && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  {selected.customer.firstName} {selected.customer.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">{selected.customer.email}</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${selected.customer.orderCount} orders`} />
                <Chip label={`Lifetime $${Number(selected.customer.lifetimeSpend || 0).toFixed(2)}`} color="primary" />
                <Chip label={`AOV $${Number(selected.averageOrderValue || 0).toFixed(2)}`} />
              </Stack>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Checkbox checked={form.blocked} disabled={selected.customer.id === user?.id} onChange={(e) => setForm({ ...form, blocked: e.target.checked })} />}
                    label="Disable / block account"
                  />
                  <TextField
                    label="Customer segment"
                    size="small"
                    value={form.customerSegment}
                    onChange={(e) => setForm({ ...form, customerSegment: e.target.value })}
                    helperText="Examples: VIP, wholesale, at-risk, support-heavy"
                  />
                  <TextField
                    label="Customer notes"
                    multiline
                    minRows={5}
                    value={form.customerNotes}
                    onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={saveCustomer}>Save customer</Button>
                    <Button variant="outlined" onClick={sendPasswordReset}>Send password reset</Button>
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Order history</Typography>
                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selected.orders || []).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell><Link component={RouterLink} to={`/orders/${order.id}`}>#{order.id}</Link></TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                          <TableCell align="right">${Number(order.totalAmount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {(!selected.orders || selected.orders.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No orders yet.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      {pageData.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageData.totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}
    </Box>
  );
}
