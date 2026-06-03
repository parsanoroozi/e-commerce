import { Box, Chip, Stack, Typography } from '@mui/material';

export default function LuxuryPageHeader({ eyebrow, title, subtitle, action, chips = [] }) {
  return (
    <Box
      className="luxury-scroll-card"
      sx={{
        position: 'relative',
        mb: { xs: 3, md: 4 },
        p: { xs: 2.5, md: 3.5 },
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            <Chip label={eyebrow} color="primary" />
            {chips.map((chip) => (
              <Chip key={chip} label={chip} variant="outlined" />
            ))}
          </Stack>
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontSize: { xs: 34, md: 46 }, lineHeight: 1.02 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 660, lineHeight: 1.8 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Box sx={{ position: 'relative', zIndex: 1, alignSelf: { md: 'center' } }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
