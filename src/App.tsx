import { useEffect, useState } from 'react';
import { useStore } from './store';
import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, 
  Card, CardContent, Container, Chip, Paper, LinearProgress, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import { 
  Sensors, Lightbulb, AcUnit, Dashboard, TrendingUp, Timeline, Notifications, Close, Info
} from '@mui/icons-material';
import TimeSeriesChart from './components/TimeSeriesChart';
import AlertPanel from './components/AlertPanel';
import DevStatusDashboard from './components/DevStatusDashboard';
import TwinMakerDigitalTwin from './components/TwinMakerDigitalTwin';

function App() {
  const { 
    fetchTopology, connectWebSocket, 
    topology, values, timeSeriesData, alerts, isConnected, 
    subscribePoints, unsubscribePoints, generateMockTimeSeriesData,
    checkAlerts, acknowledgeAlert, dismissAlert
  } = useStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Initialize
  useEffect(() => {
    fetchTopology();
    connectWebSocket();
  }, []);

  // Sidebar: Extract 'Space' (rooms) only - with fallback for empty topology
  const rooms = topology.filter(t => t.component_type_id === 'Space');
  
  // Add fallback rooms if no topology data is available
  const displayRooms = rooms.length > 0 ? rooms : [
    { point_id: 'fallback-101', entity_id: 'fallback-101', entity_name: '事務室101', component_type_id: 'Space', parent_id: undefined },
    { point_id: 'fallback-102', entity_id: 'fallback-102', entity_name: '会議室102', component_type_id: 'Space', parent_id: undefined },
    { point_id: 'fallback-201', entity_id: 'fallback-201', entity_name: '事務室201', component_type_id: 'Space', parent_id: undefined },
    { point_id: 'fallback-202', entity_id: 'fallback-202', entity_name: '会議室202', component_type_id: 'Space', parent_id: undefined }
  ];

  // Main area: Extract entities that have the selected room as parent
  const equipmentsInRoom = topology.filter(t => t.parent_id === selectedRoomId);

  // Subscription handling when room is selected
  useEffect(() => {
    if (!selectedRoomId || !isConnected) return;

    const targetPointIds = equipmentsInRoom
      .map(eq => eq.point_id)
      .filter((id): id is string => !!id);

    if (targetPointIds.length > 0) {
      console.log('Subscribing to:', targetPointIds);
      subscribePoints(targetPointIds);
      
      // Generate mock time series data for each equipment
      targetPointIds.forEach(pointId => {
        generateMockTimeSeriesData(pointId);
      });
    }

    return () => {
      if (targetPointIds.length > 0) {
        unsubscribePoints(targetPointIds);
      }
    };
  }, [selectedRoomId, isConnected, equipmentsInRoom.length]);

  // Mock data updates and alert checking
  useEffect(() => {
    const interval = setInterval(() => {
      equipmentsInRoom.forEach(eq => {
        const mockValue = Math.floor(Math.random() * 30 + 20);
        checkAlerts(eq.point_id, mockValue, eq.entity_name);
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [equipmentsInRoom, checkAlerts]);

  const getEquipmentIcon = (componentType: string) => {
    if (componentType.includes('EnvironmentalSensor')) return <Sensors />;
    if (componentType.includes('LightingFixture')) return <Lightbulb />;
    if (componentType.includes('AirConditioner')) return <AcUnit />;
    return <Dashboard />;
  };

  const getEquipmentColor = (componentType: string) => {
    if (componentType.includes('EnvironmentalSensor')) return '#00E676';
    if (componentType.includes('LightingFixture')) return '#FFD54F';
    if (componentType.includes('AirConditioner')) return '#42A5F5';
    return '#9C27B0';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#ffffff'
    }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1300,
          background: 'linear-gradient(90deg, #0f3460 0%, #0e4b99 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar>
          <Dashboard sx={{ mr: 2, color: '#00E676' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Smart Building OS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              icon={<Info />}
              label="Dev Status"
              variant="outlined"
              onClick={() => setCurrentTab(currentTab === 0 ? 1 : 0)}
              sx={{ 
                borderColor: currentTab === 1 ? '#00E676' : 'rgba(255,255,255,0.3)',
                color: currentTab === 1 ? '#00E676' : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            />
            <Chip 
              icon={<Notifications />}
              label={`${alerts.filter(a => !a.acknowledged).length} Alerts`}
              color={alerts.filter(a => !a.acknowledged).length > 0 ? 'error' : 'default'}
              variant="outlined"
              onClick={() => setAlertPanelOpen(true)}
              sx={{ 
                borderColor: alerts.filter(a => !a.acknowledged).length > 0 ? '#f44336' : 'rgba(255,255,255,0.3)',
                color: alerts.filter(a => !a.acknowledged).length > 0 ? '#f44336' : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            />
            <Chip 
              icon={<TrendingUp />}
              label={`WebSocket: ${isConnected ? 'ONLINE' : 'OFFLINE'}`}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
              sx={{ 
                borderColor: isConnected ? '#00E676' : '#f44336',
                color: isConnected ? '#00E676' : '#f44336',
                fontWeight: 600
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{ 
          width: 280, 
          flexShrink: 0, 
          [`& .MuiDrawer-paper`]: { 
            width: 280, 
            boxSizing: 'border-box', 
            top: 64,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)'
          } 
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ color: '#00E676', fontWeight: 600, mb: 2 }}>
            Room Selection
          </Typography>
          <List sx={{ gap: 1 }}>
            {displayRooms.length === 0 && (
              <Paper sx={{ 
                p: 2, 
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Typography color="text.secondary">Loading rooms...</Typography>
                <LinearProgress sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Paper>
            )}
            {displayRooms.map((room) => (
              <ListItemButton 
                key={room.point_id} 
                selected={selectedRoomId === room.point_id}
                onClick={() => setSelectedRoomId(room.point_id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  background: selectedRoomId === room.point_id 
                    ? 'linear-gradient(90deg, rgba(0,230,118,0.2) 0%, rgba(0,230,118,0.1) 100%)'
                    : 'rgba(255,255,255,0.05)',
                  border: selectedRoomId === room.point_id 
                    ? '1px solid #00E676' 
                    : '1px solid rgba(255,255,255,0.1)',
                  '&:hover': {
                    background: 'rgba(0,230,118,0.1)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <ListItemText 
                  primary={room.entity_name} 
                  secondary={room.entity_id}
                  primaryTypographyProps={{ 
                    fontWeight: selectedRoomId === room.point_id ? 600 : 400,
                    color: selectedRoomId === room.point_id ? '#00E676' : '#ffffff'
                  }}
                  secondaryTypographyProps={{
                    color: 'rgba(255,255,255,0.6)'
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      {currentTab === 0 ? (
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #00E676 30%, #42A5F5 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {displayRooms.find(r => r.point_id === selectedRoomId)?.entity_name || 'Select a Room'}
            </Typography>
            {selectedRoomId && (
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {equipmentsInRoom.length} devices monitored
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 3D Digital Twin */}
            <TwinMakerDigitalTwin selectedRoomId={selectedRoomId} selectedEquipmentId={selectedEquipmentId} />
            
            {/* Equipment Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {equipmentsInRoom.map((eq) => {
              const data = values[eq.point_id];
              const mockValue = Math.floor(Math.random() * 30 + 20);
              const equipmentColor = getEquipmentColor(eq.component_type_id);
              
              return (
                <Card 
                  key={eq.point_id} 
                  onClick={() => setSelectedEquipmentId(selectedEquipmentId === eq.point_id ? null : eq.point_id)}
                  sx={{
                  background: selectedEquipmentId === eq.point_id 
                    ? `linear-gradient(135deg, ${equipmentColor}30, ${equipmentColor}10)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: selectedEquipmentId === eq.point_id 
                      ? `2px solid ${equipmentColor}` 
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px rgba(${equipmentColor.slice(1).match(/.{2}/g)?.map(x => parseInt(x, 16)).join(',')}, 0.3)`,
                      border: `1px solid ${equipmentColor}`
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          background: `linear-gradient(45deg, ${equipmentColor}20, ${equipmentColor}10)`,
                          border: `1px solid ${equipmentColor}40`,
                          mr: 2
                        }}>
                          {getEquipmentIcon(eq.component_type_id)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                            {eq.entity_name.split(' ').slice(-2).join(' ')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {eq.component_type_id.split('_').pop()?.replace(/\d+/g, '')}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEquipmentId(eq.point_id);
                            setChartDialogOpen(true);
                          }}
                          sx={{ color: equipmentColor }}
                        >
                          <Timeline />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography 
                          variant="h2" 
                          sx={{ 
                            fontWeight: 700,
                            color: equipmentColor,
                            textShadow: `0 0 20px ${equipmentColor}40`,
                            mb: 1
                          }}
                        >
                          {data ? data.value : mockValue}
                          <Typography component="span" variant="h5" sx={{ ml: 1, opacity: 0.7 }}>
                            {eq.component_type_id.includes('Sensor') ? '°C' : 
                             eq.component_type_id.includes('Lighting') ? '%' : 'kW'}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {data ? new Date(data.timestamp).toLocaleTimeString() : 'Live Data'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={((data ? Number(data.value) : mockValue) / 50) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${equipmentColor}, ${equipmentColor}80)`,
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
            })}
            </Box>
          </Box>
        </Container>
      </Box>
      ) : (
        <DevStatusDashboard />
      )}

      {/* Time Series Chart Dialog */}
      <Dialog 
        open={chartDialogOpen} 
        onClose={() => setChartDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            {selectedEquipmentId && equipmentsInRoom.find(eq => eq.point_id === selectedEquipmentId)?.entity_name} - Time Series
          </Box>
          <IconButton onClick={() => setChartDialogOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedEquipmentId && timeSeriesData[selectedEquipmentId] && (
            <TimeSeriesChart
              data={timeSeriesData[selectedEquipmentId]}
              title="24 Hour Trend"
              color={getEquipmentColor(equipmentsInRoom.find(eq => eq.point_id === selectedEquipmentId)?.component_type_id || '')}
              unit={equipmentsInRoom.find(eq => eq.point_id === selectedEquipmentId)?.component_type_id.includes('Sensor') ? '°C' : 
                    equipmentsInRoom.find(eq => eq.point_id === selectedEquipmentId)?.component_type_id.includes('Lighting') ? '%' : 'kW'}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Panel Dialog */}
      <Dialog 
        open={alertPanelOpen} 
        onClose={() => setAlertPanelOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>System Alerts</Box>
          <IconButton onClick={() => setAlertPanelOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AlertPanel
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onDismiss={dismissAlert}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default App;