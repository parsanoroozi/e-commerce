import {
  Alert,
  Box,
  Button,
  Chip,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../utils/toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ page: 0, totalPages: 0 });
  const [error, setError] = useState('');

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
    if (!window.confirm(`Delete ${target.email}? This removes the user and their related account data.`)) return;
    try {
      await adminApi.deleteUser(target.id);
      showSuccess('User deleted');
      await load();
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.firstName} {item.lastName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.mobileNumber || '-'}</TableCell>
                <TableCell><Chip label={item.role} size="small" /></TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    disabled={item.id === user?.id}
                    onClick={() => deleteUser(item)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
