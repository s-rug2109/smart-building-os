import { Box, Typography, Paper, Chip, IconButton, List, ListItem, ListItemText, Badge } from '@mui/material';
import { Warning, Error, Info, CheckCircle, Close } from '@mui/icons-material';
import type { Alert } from '../types';

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

export default function AlertPanel({ alerts, onAcknowledge, onDismiss }: AlertPanelProps) {
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return <Error sx={{ color: '#f44336' }} />;
      case 'high': return <Warning sx={{ color: '#ff9800' }} />;
      case 'medium': return <Warning sx={{ color: '#ffeb3b' }} />;
      case 'low': return <Info sx={{ color: '#2196f3' }} />;
      default: return <Info sx={{ color: '#2196f3' }} />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffeb3b';
      case 'low': return '#2196f3';
      default: return '#2196f3';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <Box sx={{ width: 350, height: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
          Alerts
        </Typography>
        <Badge badgeContent={activeAlerts.length} color="error">
          <Warning sx={{ color: '#ff9800' }} />
        </Badge>
      </Box>

      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {activeAlerts.length === 0 && acknowledgedAlerts.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0,230,118,0.1)', border: '1px solid #00E676' }}>
            <CheckCircle sx={{ color: '#00E676', fontSize: 48, mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#00E676' }}>
              All systems normal
            </Typography>
          </Paper>
        )}

        {activeAlerts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#f44336', mb: 1 }}>
              Active Alerts ({activeAlerts.length})
            </Typography>
            <List dense>
              {activeAlerts.map((alert) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    bgcolor: `${getSeverityColor(alert.severity)}20`,
                    border: `1px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: 1,
                    mb: 1,
                    p: 1
                  }}
                >
                  <Box sx={{ mr: 1 }}>
                    {getSeverityIcon(alert.severity)}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                        {alert.entity_name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {alert.message}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={alert.severity.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: getSeverityColor(alert.severity),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onAcknowledge(alert.id)}
                      sx={{ color: '#00E676' }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDismiss(alert.id)}
                      sx={{ color: '#f44336' }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {acknowledgedAlerts.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
              Acknowledged ({acknowledgedAlerts.length})
            </Typography>
            <List dense>
              {acknowledgedAlerts.slice(0, 3).map((alert) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 1,
                    mb: 1,
                    p: 1,
                    opacity: 0.7
                  }}
                >
                  <Box sx={{ mr: 1 }}>
                    <CheckCircle sx={{ color: '#00E676', fontSize: 16 }} />
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {alert.entity_name}: {alert.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
}