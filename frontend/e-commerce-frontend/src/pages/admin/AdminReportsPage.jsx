import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useMemo, useState } from 'react';
import { adminApi } from '../../api/admin';
import { showError, showSuccess } from '../../utils/toast';

const ORDER_STATUSES = ['ALL', 'AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const CUSTOMER_STATUSES = ['ALL', 'ACTIVE', 'BLOCKED'];
const PRODUCT_STATUSES = ['ALL', 'ACTIVE', 'INACTIVE', 'LOW_STOCK'];

function ReportCard({ title, description, filters, statusOptions, onFilterChange, onDownload, busy }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="From"
                type="datetime-local"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.from}
                onChange={(e) => onFilterChange({ ...filters, from: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="To"
                type="datetime-local"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.to}
                onChange={(e) => onFilterChange({ ...filters, to: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={onDownload}
              disabled={busy}
            >
              {busy ? 'Preparing...' : 'Export CSV'}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const initialFilters = { from: '', to: '', status: 'ALL' };

export default function AdminReportsPage() {
  const [ordersFilters, setOrdersFilters] = useState(initialFilters);
  const [customersFilters, setCustomersFilters] = useState(initialFilters);
  const [productsFilters, setProductsFilters] = useState(initialFilters);
  const [invoiceOrderId, setInvoiceOrderId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const invalidRange = useMemo(() => {
    const ranges = [ordersFilters, customersFilters, productsFilters];
    return ranges.some((filters) => filters.from && filters.to && new Date(filters.from) > new Date(filters.to));
  }, [ordersFilters, customersFilters, productsFilters]);

  const runDownload = async (key, action, successMessage) => {
    setError('');
    setBusy(key);
    try {
      await action();
      showSuccess(successMessage);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setBusy('');
    }
  };

  const downloadInvoice = async () => {
    const id = Number(invoiceOrderId);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid order ID.');
      return;
    }
    await runDownload('invoice', () => adminApi.downloadInvoicePdf(id), 'Invoice PDF downloaded');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Reports</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {invalidRange && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          One report has a From date later than its To date.
        </Alert>
      )}
      <Stack spacing={3}>
        <ReportCard
          title="Orders export"
          description="Download order totals, customer details, shipping data, and line-item summaries."
          filters={ordersFilters}
          statusOptions={ORDER_STATUSES}
          onFilterChange={setOrdersFilters}
          busy={busy === 'orders'}
          onDownload={() => runDownload('orders', () => adminApi.exportOrdersCsv(ordersFilters), 'Orders CSV downloaded')}
        />
        <ReportCard
          title="Customers export"
          description="Download customer contact fields, account status, segments, and lifetime order totals."
          filters={customersFilters}
          statusOptions={CUSTOMER_STATUSES}
          onFilterChange={setCustomersFilters}
          busy={busy === 'customers'}
          onDownload={() => runDownload('customers', () => adminApi.exportCustomersCsv(customersFilters), 'Customers CSV downloaded')}
        />
        <ReportCard
          title="Products and inventory export"
          description="Download product, variant, SKU, category, status, visibility, and stock quantities."
          filters={productsFilters}
          statusOptions={PRODUCT_STATUSES}
          onFilterChange={setProductsFilters}
          busy={busy === 'products'}
          onDownload={() => runDownload('products', () => adminApi.exportProductsCsv(productsFilters), 'Products CSV downloaded')}
        />
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Invoice / receipt PDF</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate a printable receipt for a specific order.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Order ID"
                  type="number"
                  size="small"
                  value={invoiceOrderId}
                  onChange={(e) => setInvoiceOrderId(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                  sx={{ maxWidth: { sm: 220 } }}
                />
                <Button
                  variant="contained"
                  startIcon={<ReceiptLongIcon />}
                  onClick={downloadInvoice}
                  disabled={busy === 'invoice'}
                >
                  {busy === 'invoice' ? 'Preparing...' : 'Download PDF'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
