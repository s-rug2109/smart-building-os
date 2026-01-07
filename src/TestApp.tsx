import { Typography, Box } from '@mui/material';

function TestApp() {
  return (
    <Box sx={{ p: 4, bgcolor: '#1a1a2e', color: 'white', minHeight: '100vh' }}>
      <Typography variant="h2" gutterBottom>
        Test App Working!
      </Typography>
      <Typography variant="h4">
        Smart Building OS - Debug Mode
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        If you can see this, the deployment is working.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: '#00E676' }}>
        Environment: {import.meta.env.MODE}
      </Typography>
      <Typography variant="body2" sx={{ color: '#42A5F5' }}>
        API URL: {import.meta.env.VITE_API_REST_URL || 'Not set'}
      </Typography>
    </Box>
  );
}

export default TestApp;