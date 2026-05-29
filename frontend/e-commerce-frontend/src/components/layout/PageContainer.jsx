import { Container } from '@mui/material';

export default function PageContainer({ children, maxWidth = 'lg', sx, ...props }) {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 }, ...sx }}
      {...props}
    >
      {children}
    </Container>
  );
}
