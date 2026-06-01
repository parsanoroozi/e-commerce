import CloseIcon from '@mui/icons-material/Close';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, apiRequest } from '../api/client';

const DEFAULT_LOCATION = { latitude: 51.5074, longitude: -0.1278 };
const DEFAULT_ZOOM = 15;

export default function LocationPicker({ value, onChange, label = 'Map location' }) {
  const latitude = parseCoordinate(value?.latitude);
  const longitude = parseCoordinate(value?.longitude);
  const hasLocation = latitude != null && longitude != null;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(hasLocation ? { latitude, longitude } : DEFAULT_LOCATION);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const openDialog = () => {
    setDraft(hasLocation ? { latitude, longitude } : DEFAULT_LOCATION);
    setOpen(true);
  };

  const confirm = () => {
    onChange({
      ...(draft.address || {}),
      latitude: Number(draft.latitude.toFixed(6)),
      longitude: Number(draft.longitude.toFixed(6)),
    });
    setOpen(false);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {hasLocation ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'No map pin selected'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<LocationOnOutlinedIcon />} onClick={openDialog}>
          Pick location
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 6 }}>
          Pick location
          <IconButton
            aria-label="Close"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <LeafletLocationMap
            location={draft}
            onPick={setDraft}
            dialogOpen={open}
            onResolvingAddressChange={setResolvingAddress}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirm} disabled={resolvingAddress}>
            {resolvingAddress ? 'Reading address...' : 'Use this location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function LeafletLocationMap({ location, onPick, dialogOpen, onResolvingAddressChange }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selected, setSelected] = useState(location);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectCoordinates = useCallback(async (latitude, longitude) => {
    const next = {
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
    };
    setSelected(next);
    onPick(next);
    onResolvingAddressChange(true);
    try {
      const params = new URLSearchParams({ lat: next.latitude, lon: next.longitude });
      const data = await apiRequest(`/api/maps/reverse?${params}`, { cache: false });
      const enriched = { ...next, address: toAddress(data) };
      setSelected(enriched);
      onPick(enriched);
    } catch {
      // Coordinates are still useful if reverse geocoding is unavailable.
    } finally {
      onResolvingAddressChange(false);
    }
  }, [onPick, onResolvingAddressChange]);

  useEffect(() => {
    setSelected(location);
  }, [location]);

  useEffect(() => {
    if (!dialogOpen || !mapNode.current || mapRef.current) return undefined;

    const markerIcon = L.divIcon({
      className: 'shopverse-map-pin',
      html: '<span></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const map = L.map(mapNode.current, {
      center: [selected.latitude, selected.longitude],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer(`${API_BASE}/api/maps/tiles/{z}/{x}/{y}.png`, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([selected.latitude, selected.longitude], {
      draggable: true,
      icon: markerIcon,
    }).addTo(map);

    marker.on('dragend', () => {
      const next = marker.getLatLng();
      selectCoordinates(next.lat, next.lng);
    });

    map.on('click', (event) => {
      marker.setLatLng(event.latlng);
      map.panTo(event.latlng);
      selectCoordinates(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    window.setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [dialogOpen, selectCoordinates, selected.latitude, selected.longitude]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const latLng = [selected.latitude, selected.longitude];
    markerRef.current.setLatLng(latLng);
    mapRef.current.panTo(latLng);
  }, [selected.latitude, selected.longitude]);

  const searchLocation = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const params = new URLSearchParams({ q: normalizeSearchQuery(query) });
      const data = await apiRequest(`/api/maps/search?${params}`, { cache: false });
      if (!data.length) {
        setError('No matching location found.');
        return;
      }
      setResults(data);
    } catch {
      setError('Location search is unavailable. Check backend internet access.');
    } finally {
      setLoading(false);
    }
  };

  const selectResult = (result) => {
    const next = {
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      address: toAddress(result),
    };
    setSelected(next);
    onPick(next);
    setResults([]);
    if (mapRef.current) {
      mapRef.current.setView([next.latitude, next.longitude], 16);
    }
  };

  const useCurrentLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Your browser does not support current location.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        selectCoordinates(next.latitude, next.longitude);
        if (mapRef.current) mapRef.current.setView([next.latitude, next.longitude], 16);
        setLoading(false);
      },
      () => {
        setError('Current location is blocked. Use localhost/HTTPS and allow location access.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <Stack spacing={2}>
      <Box component="form" onSubmit={searchLocation}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search city, street, or place"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Search
          </Button>
          <Button variant="outlined" startIcon={<MyLocationOutlinedIcon />} onClick={useCurrentLocation} disabled={loading}>
            Current
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="warning">{error}</Alert>}
      {results.length > 0 && (
        <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 160, overflowY: 'auto' }}>
          {results.map((result) => (
            <ListItemButton key={`${result.latitude}-${result.longitude}`} onClick={() => selectResult(result)}>
              <ListItemText
                primary={result.displayName}
                secondary={[result.street, result.city, result.postalCode, result.country].filter(Boolean).join(', ')}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      <Box sx={{ position: 'relative' }}>
        <Box
          ref={mapNode}
          sx={{
            height: { xs: 320, sm: 440 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'action.hover',
            '& .leaflet-container': { fontFamily: 'inherit' },
            '& .shopverse-map-pin span': {
              display: 'block',
              width: 22,
              height: 22,
              borderRadius: '50% 50% 50% 0',
              bgcolor: 'error.main',
              transform: 'rotate(-45deg)',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            },
          }}
        />
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 500, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.35)' }}>
            <CircularProgress size={32} />
          </Box>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary">
        Selected: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
      </Typography>
      {selected.address?.displayName && (
        <Alert severity="success" variant="outlined">
          Address found: {selected.address.displayName}
        </Alert>
      )}
    </Stack>
  );
}

function toAddress(result) {
  const displayParts = String(result.displayName || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    street: result.street || displayParts[0] || '',
    city: result.city || inferCity(displayParts),
    zipCode: result.postalCode || '',
    country: result.country || displayParts[displayParts.length - 1] || '',
    displayName: result.displayName || '',
  };
}

function inferCity(displayParts) {
  if (displayParts.length < 3) return '';
  return displayParts[displayParts.length - 3] || displayParts[displayParts.length - 2] || '';
}

function normalizeSearchQuery(value) {
  return value
    .trim()
    .replace(/\u064a/g, '\u06cc')
    .replace(/\u0643/g, '\u06a9')
    .replace(/\s+/g, ' ');
}

function parseCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
