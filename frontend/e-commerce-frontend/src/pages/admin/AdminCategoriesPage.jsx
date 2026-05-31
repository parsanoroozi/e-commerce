import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { useEffect, useState } from 'react';
import { categoriesApi } from '../../api/categories';
import { useConfirm } from '../../context/ConfirmDialogContext';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const confirm = useConfirm();

  const load = () => categoriesApi.list().then(setCategories);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = { name, description };
      if (editingId) await categoriesApi.update(editingId, data);
      else await categoriesApi.create(data);
      setName('');
      setDescription('');
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || '');
  };

  const remove = async (id) => {
    if (!(await confirm({
      title: 'Delete category?',
      description: 'Products in this category may be affected by this change.',
      confirmText: 'Delete',
    }))) return;
    try {
      await categoriesApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Manage categories</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap">
            <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1, minWidth: 160 }} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ flex: 2, minWidth: 200 }} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button type="submit" variant="contained">{editingId ? 'Update' : 'Create'}</Button>
              {editingId && (
                <Button type="button" variant="outlined" onClick={() => { setEditingId(null); setName(''); setDescription(''); }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => startEdit(c)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
