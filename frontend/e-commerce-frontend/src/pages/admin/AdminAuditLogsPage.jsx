import {
  Box,
  Card,
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
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { showError } from '../../utils/toast';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ totalPages: 0 });

  useEffect(() => {
    adminApi.auditLogs(page)
      .then((data) => {
        setLogs(data.content || []);
        setPageData(data);
      })
      .catch((err) => showError(err.message));
  }, [page]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Audit logs</Typography>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.adminEmail}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entityType} {log.entityId ? `#${log.entityId}` : ''}</TableCell>
                <TableCell>{log.details || '-'}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No audit logs yet.
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
