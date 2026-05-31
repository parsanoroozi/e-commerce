import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';

export default function PasswordField({ inputProps, slotProps, ...props }) {
  const [visible, setVisible] = useState(false);
  const adornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? 'Hide password' : 'Show password'}
        edge="end"
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      inputProps={inputProps}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input || {}),
          endAdornment: adornment,
        },
      }}
    />
  );
}
