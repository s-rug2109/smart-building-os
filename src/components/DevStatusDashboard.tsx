import { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Chip, List, ListItem, 
  ListItemText, Accordion, AccordionSummary, AccordionDetails, Button
} from '@mui/material';
import { ExpandMore, Cloud, Code, Timeline } from '@mui/icons-material';

interface ProjectStatus {
  lastUpdated: string;
  version: string;
  features: {
    name: string;
    status: 'completed' | 'in-progress' | 'planned';
    description: string;
  }[];
  awsServices: {
    name: string;
    configured: boolean;
    details: string;
  }[];
  techStack: string[];
  nextSteps: string[];
}

export default function DevStatusDashboard() {
  const [status] = useState<ProjectStatus>({
    lastUpdated: new Date().toISOString(),
    version: '1.2.0',
    features: [
      { name: 'Real-time Dashboard', status: 'completed', description: 'MUI v6 + WebSocket monitoring' },
      { name: 'Time Series Charts', status: 'completed', description: 'Recharts integration with 24h data' },
      { name: 'Alert System', status: 'completed', description: 'Threshold-based alerts with notifications' },
      { name: 'Digital Twin 3D', status: 'in-progress', description: 'AWS TwinMaker integration' },
      { name: 'Mobile Responsive', status: 'planned', description: 'Tablet/mobile optimization' },
      { name: 'User Authentication', status: 'planned', description: 'AWS Cognito integration' }
    ],
    awsServices: [
      { name: 'IoT TwinMaker', configured: true, details: 'Workspace: smart-building-data-model-auto-generat-twinmaker' },
      { name: 'DynamoDB', configured: true, details: 'Tables: bop-metadata-cache, bop-present-value' },
      { name: 'API Gateway', configured: true, details: 'REST + WebSocket endpoints' },
      { name: 'Lambda', configured: true, details: 'Data processing functions' },
      { name: 'S3', configured: true, details: '3D models storage bucket' },
      { name: 'CloudFront', configured: false, details: 'CDN for 3D assets (planned)' }
    ],
    techStack: [
      'React 19.2.0', 'TypeScript', 'Vite', 'MUI v6', 'Zustand', 
      'Recharts', 'Three.js (planned)', 'AWS SDK', 'WebSocket'
    ],
    nextSteps: [
      '3D Scene creation in TwinMaker',
      'Three.js integration for 3D visualization',
      'Mobile responsive design',
      'Performance optimization',
      'User authentication system'
    ]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'planned': return 'default';
      default: return 'default';
    }
  };

  const exportStatus = () => {
    const dataStr = JSON.stringify(status, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-status-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ 
          background: 'linear-gradient(45deg, #00E676 30%, #42A5F5 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700
        }}>
          Smart Building OS - Development Status
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Code />}
          onClick={exportStatus}
          sx={{ color: '#00E676', borderColor: '#00E676' }}
        >
          Export Status
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Project Overview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="h5" sx={{ color: '#00E676', mb: 2 }}>
                Project Overview
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Version: <Chip label={status.version} color="primary" size="small" />
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Last Updated: {new Date(status.lastUpdated).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.8)' }}>
                Real-time IoT monitoring dashboard with digital twin capabilities for smart building management.
              </Typography>
            </CardContent>
          </Card>

        {/* Tech Stack */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="h5" sx={{ color: '#42A5F5', mb: 2 }}>
                Technology Stack
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {status.techStack.map((tech, index) => (
                  <Chip 
                    key={index}
                    label={tech} 
                    variant="outlined"
                    size="small"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Features Status */}
          <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h5" sx={{ color: '#FFD54F' }}>
                Feature Development Status
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {status.features.map((feature, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            {feature.name}
                          </Typography>
                          <Chip 
                            label={feature.status.replace('-', ' ')} 
                            color={getStatusColor(feature.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {feature.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

        {/* AWS Services */}
          <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h5" sx={{ color: '#ff9800' }}>
                AWS Services Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {status.awsServices.map((service, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Cloud sx={{ color: service.configured ? '#00E676' : '#f44336' }} />
                          <Typography variant="h6" sx={{ color: 'white' }}>
                            {service.name}
                          </Typography>
                          <Chip 
                            label={service.configured ? 'Configured' : 'Pending'} 
                            color={service.configured ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {service.details}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

        {/* Next Steps */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="h5" sx={{ color: '#9C27B0', mb: 2 }}>
                <Timeline sx={{ mr: 1 }} />
                Next Development Steps
              </Typography>
              <List>
                {status.nextSteps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          {index + 1}. {step}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
      </Box>
    </Box>
  );
}