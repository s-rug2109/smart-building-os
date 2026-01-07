// 仮想BIMデータ - 実際のオフィスビルの2階フロアプラン
export interface BimRoom {
  id: string;
  name: string;
  type: 'office' | 'meeting' | 'corridor' | 'restroom' | 'storage' | 'server';
  floor: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  walls: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
    hasWindow?: boolean;
    hasDoor?: boolean;
  }>;
  equipment: Array<{
    id: string;
    type: 'sensor' | 'lighting' | 'hvac' | 'camera' | 'access_control';
    position: { x: number; y: number; z: number };
    model: string;
  }>;
}

export interface BimBuilding {
  id: string;
  name: string;
  floors: BimRoom[][];
  metadata: {
    totalFloors: number;
    floorHeight: number;
    buildingWidth: number;
    buildingDepth: number;
  };
}

// 2階フロアプラン（実際のオフィスビルをモデル化）
export const mockBimData: BimBuilding = {
  id: 'smart-building-001',
  name: 'スマートオフィスビル',
  floors: [
    [], // 1階（未定義）
    [ // 2階
      {
        id: 'room_201',
        name: '会議室201',
        type: 'meeting',
        floor: 2,
        coordinates: { x: 0, y: 0, width: 6, height: 4 },
        walls: [
          { start: { x: 0, y: 0 }, end: { x: 6, y: 0 }, thickness: 0.2 },
          { start: { x: 6, y: 0 }, end: { x: 6, y: 4 }, thickness: 0.2 },
          { start: { x: 6, y: 4 }, end: { x: 0, y: 4 }, thickness: 0.2, hasWindow: true },
          { start: { x: 0, y: 4 }, end: { x: 0, y: 0 }, thickness: 0.2, hasDoor: true }
        ],
        equipment: [
          { id: 'sensor_201_01', type: 'sensor', position: { x: 3, y: 2, z: 2.5 }, model: 'ENV_MULTI_01' },
          { id: 'light_201_01', type: 'lighting', position: { x: 2, y: 1.5, z: 2.8 }, model: 'LED_PNL_40W' },
          { id: 'light_201_02', type: 'lighting', position: { x: 4, y: 2.5, z: 2.8 }, model: 'LED_PNL_40W' },
          { id: 'hvac_201_01', type: 'hvac', position: { x: 5.5, y: 0.5, z: 2.8 }, model: 'PAC_28GV' }
        ]
      },
      {
        id: 'room_202',
        name: '事務室202',
        type: 'office',
        floor: 2,
        coordinates: { x: 6, y: 0, width: 8, height: 6 },
        walls: [
          { start: { x: 6, y: 0 }, end: { x: 14, y: 0 }, thickness: 0.2 },
          { start: { x: 14, y: 0 }, end: { x: 14, y: 6 }, thickness: 0.2, hasWindow: true },
          { start: { x: 14, y: 6 }, end: { x: 6, y: 6 }, thickness: 0.2 },
          { start: { x: 6, y: 6 }, end: { x: 6, y: 0 }, thickness: 0.2, hasDoor: true }
        ],
        equipment: [
          { id: 'sensor_202_01', type: 'sensor', position: { x: 10, y: 3, z: 2.5 }, model: 'ENV_MULTI_01' },
          { id: 'sensor_202_02', type: 'sensor', position: { x: 8, y: 5, z: 2.5 }, model: 'TEMP_ONLY_01' },
          { id: 'light_202_01', type: 'lighting', position: { x: 8, y: 2, z: 2.8 }, model: 'LED_DL_20W' },
          { id: 'light_202_02', type: 'lighting', position: { x: 10, y: 2, z: 2.8 }, model: 'LED_DL_20W' },
          { id: 'light_202_03', type: 'lighting', position: { x: 12, y: 4, z: 2.8 }, model: 'LED_PNL_60W' },
          { id: 'hvac_202_01', type: 'hvac', position: { x: 13, y: 1, z: 2.8 }, model: 'PAC_56GV' }
        ]
      },
      {
        id: 'room_203',
        name: '会議室203',
        type: 'meeting',
        floor: 2,
        coordinates: { x: 0, y: 4, width: 6, height: 4 },
        walls: [
          { start: { x: 0, y: 4 }, end: { x: 6, y: 4 }, thickness: 0.2 },
          { start: { x: 6, y: 4 }, end: { x: 6, y: 8 }, thickness: 0.2 },
          { start: { x: 6, y: 8 }, end: { x: 0, y: 8 }, thickness: 0.2, hasWindow: true },
          { start: { x: 0, y: 8 }, end: { x: 0, y: 4 }, thickness: 0.2, hasDoor: true }
        ],
        equipment: [
          { id: 'sensor_203_01', type: 'sensor', position: { x: 3, y: 6, z: 2.5 }, model: 'ENV_MULTI_01' },
          { id: 'light_203_01', type: 'lighting', position: { x: 2, y: 5.5, z: 2.8 }, model: 'LED_PNL_40W' },
          { id: 'light_203_02', type: 'lighting', position: { x: 4, y: 6.5, z: 2.8 }, model: 'LED_PNL_40W' },
          { id: 'hvac_203_01', type: 'hvac', position: { x: 5.5, y: 4.5, z: 2.8 }, model: 'PAC_28GV' }
        ]
      },
      {
        id: 'corridor_200',
        name: '廊下',
        type: 'corridor',
        floor: 2,
        coordinates: { x: 6, y: 6, width: 8, height: 2 },
        walls: [
          { start: { x: 6, y: 6 }, end: { x: 14, y: 6 }, thickness: 0.2 },
          { start: { x: 14, y: 6 }, end: { x: 14, y: 8 }, thickness: 0.2 },
          { start: { x: 14, y: 8 }, end: { x: 6, y: 8 }, thickness: 0.2 },
          { start: { x: 6, y: 8 }, end: { x: 6, y: 6 }, thickness: 0.2 }
        ],
        equipment: [
          { id: 'light_corridor_01', type: 'lighting', position: { x: 8, y: 7, z: 2.8 }, model: 'LED_DL_20W' },
          { id: 'light_corridor_02', type: 'lighting', position: { x: 12, y: 7, z: 2.8 }, model: 'LED_DL_20W' },
          { id: 'camera_corridor_01', type: 'camera', position: { x: 10, y: 8, z: 2.8 }, model: 'SECURITY_CAM' }
        ]
      }
    ],
    [ // 3階（追加）
      {
        id: 'room_301',
        name: '会議室301',
        type: 'meeting',
        floor: 3,
        coordinates: { x: 16, y: 0, width: 6, height: 4 },
        walls: [
          { start: { x: 16, y: 0 }, end: { x: 22, y: 0 }, thickness: 0.2 },
          { start: { x: 22, y: 0 }, end: { x: 22, y: 4 }, thickness: 0.2 },
          { start: { x: 22, y: 4 }, end: { x: 16, y: 4 }, thickness: 0.2, hasWindow: true },
          { start: { x: 16, y: 4 }, end: { x: 16, y: 0 }, thickness: 0.2, hasDoor: true }
        ],
        equipment: [
          { id: 'sensor_301_01', type: 'sensor', position: { x: 19, y: 2, z: 2.5 }, model: 'ENV_MULTI_01' },
          { id: 'light_301_01', type: 'lighting', position: { x: 18, y: 1.5, z: 2.8 }, model: 'LED_PNL_40W' }
        ]
      },
      {
        id: 'room_302',
        name: '事務室302',
        type: 'office',
        floor: 3,
        coordinates: { x: 16, y: 4, width: 6, height: 4 },
        walls: [
          { start: { x: 16, y: 4 }, end: { x: 22, y: 4 }, thickness: 0.2 },
          { start: { x: 22, y: 4 }, end: { x: 22, y: 8 }, thickness: 0.2 },
          { start: { x: 22, y: 8 }, end: { x: 16, y: 8 }, thickness: 0.2, hasWindow: true },
          { start: { x: 16, y: 8 }, end: { x: 16, y: 4 }, thickness: 0.2, hasDoor: true }
        ],
        equipment: [
          { id: 'sensor_302_01', type: 'sensor', position: { x: 19, y: 6, z: 2.5 }, model: 'TEMP_ONLY_01' },
          { id: 'light_302_01', type: 'lighting', position: { x: 18, y: 5.5, z: 2.8 }, model: 'LED_DL_20W' }
        ]
      }
    ]
  ],
  metadata: {
    totalFloors: 3,
    floorHeight: 3.0,
    buildingWidth: 22,
    buildingDepth: 8
  }
};

// AWS TwinMakerデータとBIMデータのマッピング（全部屋対応）
export const mapTwinMakerToBim = (topology: any[]) => {
  const mapping: { [key: string]: string } = {};
  
  // 実際のTwinMakerエンティティIDと仮想BIMルームIDをマッピング
  const rooms = topology.filter(t => t.component_type_id === 'Space');
  const allBimRooms = mockBimData.floors.flat();
  
  rooms.forEach((room, index) => {
    if (index < allBimRooms.length) {
      mapping[room.point_id] = allBimRooms[index].id;
    }
  });
  
  return mapping;
};