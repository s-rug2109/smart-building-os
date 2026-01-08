// Static data (API response)
export interface TopologyItem {
  point_id: string;         // UUID (DynamoDB PK) - Required per API spec
  entity_id: string;        // TwinMaker ID
  entity_name: string;      // Display name
  component_type_id: string; // Equipment type (Space, Level, Equipment...)
  parent_id?: string;       // Parent UUID (for hierarchy)
  properties?: {            // TwinMaker properties
    level?: string | number; // Floor level information
    [key: string]: any;     // Other properties
  };
  level?: string | number;  // Direct level property (fallback)
}

// Dynamic data (API / WebSocket response)
export interface PointData {
  point_id: string;
  value: number | string;
  quality: string;
  timestamp: string;
  unit?: string;
}

// Time series data for charts
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  quality: string;
}

// Alert configuration
export interface AlertConfig {
  point_id: string;
  min_threshold?: number;
  max_threshold?: number;
  enabled: boolean;
}

// Alert instance
export interface Alert {
  id: string;
  point_id: string;
  entity_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

// WebSocket message
export interface WebSocketMessage {
  action: string;
  data: PointData[];
}