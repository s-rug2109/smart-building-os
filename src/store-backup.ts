import { create } from 'zustand';
import axios from 'axios';
import type { TopologyItem, PointData, TimeSeriesData, Alert, AlertConfig } from './types';

// Environment variables
const REST_URL = import.meta.env.VITE_API_REST_URL;
const WS_URL = import.meta.env.VITE_API_WS_URL;

interface AppState {
  topology: TopologyItem[];
  values: Record<string, PointData>;
  timeSeriesData: Record<string, TimeSeriesData[]>;
  alerts: Alert[];
  alertConfigs: Record<string, AlertConfig>;
  ws: WebSocket | null;
  isConnected: boolean;

  fetchTopology: () => Promise<void>;
  connectWebSocket: () => void;
  subscribePoints: (pointIds: string[]) => void;
  unsubscribePoints: (pointIds: string[]) => void;
  generateMockTimeSeriesData: (pointId: string) => void;
  checkAlerts: (pointId: string, value: number, entityName: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  setAlertConfig: (pointId: string, config: AlertConfig) => void;
}

export const useStore = create<AppState>((set, get) => ({
  topology: [],
  values: {},
  timeSeriesData: {},
  alerts: [],
  alertConfigs: {
    '3': { point_id: '3', min_threshold: 18, max_threshold: 28, enabled: true },
    '4': { point_id: '4', min_threshold: 0, max_threshold: 100, enabled: true }
  },
  ws: null,
  isConnected: false,

  // 1. Fetch topology
  fetchTopology: async () => {
    try {
      console.log('Fetching topology...');
      console.log('REST_URL:', REST_URL);
      const res = await axios.post(`${REST_URL}/digital-twin/search`, {
        query_type: 'topology',
        depth: 'Equipment'
      });
      console.log('Topology Response:', res.data);
      console.log('Items count:', res.data.items?.length || 0);
      console.log('First item:', res.data.items?.[0]);
      console.log('Component types:', res.data.items?.map((item: any) => item.component_type_id).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i));
      set({ topology: res.data.items || [] });
    } catch (e: any) {
      console.error('Failed to fetch topology:', e);
      console.error('Error details:', e.response?.data);
      // Set mock data for demo purposes when API fails
      const mockData = [
        { point_id: '1', entity_id: 'room_101', entity_name: 'Demo Room 101', component_type_id: 'Space', parent_id: 'building_1' },
        { point_id: '2', entity_id: 'room_102', entity_name: 'Demo Room 102', component_type_id: 'Space', parent_id: 'building_1' },
        { point_id: '3', entity_id: 'sensor_001', entity_name: 'Temperature Sensor', component_type_id: 'dtmi_sbco_equipment_EnvironmentalSensor_TEMP_ONLY_01_1', parent_id: '1' },
        { point_id: '4', entity_id: 'light_001', entity_name: 'LED Light', component_type_id: 'dtmi_sbco_equipment_LightingFixture_LED_PNL_40W_1', parent_id: '1' }
      ];
      set({ topology: mockData });
      console.log('Using mock data for demo');
    }
  },

  // 2. WebSocket connection
  connectWebSocket: () => {
    if (get().ws) return;
    
    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        console.log('WS Connected');
        set({ isConnected: true });
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('WS Message received:', payload);
          if (payload.action === 'point_update') {
            const newDataList: PointData[] = payload.data;
            console.log('Point updates:', newDataList);
            set((state) => {
              const newValues = { ...state.values };
              newDataList.forEach((d) => {
                newValues[d.point_id] = d;
              });
              return { values: newValues };
            });
          }
        } catch (e) {
          console.error('WS Message Parse Error:', e);
        }
      };

      socket.onclose = () => {
        console.log('WS Disconnected');
        set({ isConnected: false, ws: null });
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        set({ isConnected: false });
      };

      set({ ws: socket });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      set({ isConnected: false });
    }
  },

  // 3. Subscribe request
  subscribePoints: (pointIds: string[]) => {
    const { ws, isConnected } = get();
    if (ws && isConnected && pointIds.length > 0) {
      ws.send(JSON.stringify({
        action: 'subscribe_points',
        point_id: pointIds,
        subscription_id: 'dashboard_view'
      }));
    }
  },

  // 4. Unsubscribe request
  unsubscribePoints: (pointIds: string[]) => {
    const { ws, isConnected } = get();
    if (ws && isConnected && pointIds.length > 0) {
      ws.send(JSON.stringify({
        action: 'unsubscribe_points',
        point_id: pointIds,
        subscription_id: 'dashboard_view'
      }));
    }
  },

  // 5. Generate mock time series data
  generateMockTimeSeriesData: (pointId: string) => {
    const now = new Date();
    const data: TimeSeriesData[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseValue = pointId === '3' ? 22 : 50;
      const value = baseValue + Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 3;
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 10) / 10,
        quality: Math.random() > 0.1 ? 'GOOD' : 'UNCERTAIN'
      });
    }
    
    set(state => ({
      timeSeriesData: {
        ...state.timeSeriesData,
        [pointId]: data
      }
    }));
  },

  // 6. Check alerts based on thresholds
  checkAlerts: (pointId: string, value: number, entityName: string) => {
    const { alertConfigs } = get();
    const config = alertConfigs[pointId];
    
    if (!config || !config.enabled) return;
    
    let alertMessage = '';
    let severity: Alert['severity'] = 'low';
    
    if (config.max_threshold && value > config.max_threshold) {
      const diff = value - config.max_threshold;
      alertMessage = `High value detected: ${value} (threshold: ${config.max_threshold})`;
      severity = diff > 5 ? 'critical' : diff > 2 ? 'high' : 'medium';
    } else if (config.min_threshold && value < config.min_threshold) {
      const diff = config.min_threshold - value;
      alertMessage = `Low value detected: ${value} (threshold: ${config.min_threshold})`;
      severity = diff > 5 ? 'critical' : diff > 2 ? 'high' : 'medium';
    }
    
    if (alertMessage) {
      const newAlert: Alert = {
        id: `${pointId}-${Date.now()}`,
        point_id: pointId,
        entity_name: entityName,
        message: alertMessage,
        severity,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };
      
      set(state => ({
        alerts: [newAlert, ...state.alerts.slice(0, 49)]
      }));
    }
  },

  // 7. Acknowledge alert
  acknowledgeAlert: (alertId: string) => {
    set(state => ({
      alerts: state.alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  },

  // 8. Dismiss alert
  dismissAlert: (alertId: string) => {
    set(state => ({
      alerts: state.alerts.filter(alert => alert.id !== alertId)
    }));
  },

  // 9. Set alert configuration
  setAlertConfig: (pointId: string, config: AlertConfig) => {
    set(state => ({
      alertConfigs: {
        ...state.alertConfigs,
        [pointId]: config
      }
    }));
  }
}));