import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Chip } from '@mui/material';
import { ViewInAr, Fullscreen } from '@mui/icons-material';
import * as THREE from 'three';
import { useStore } from '../store';
import { mockBimData, mapTwinMakerToBim } from '../data/mockBimData';

interface BimRoom {
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

interface BimDigitalTwinProps {
  selectedRoomId: string | null;
  selectedEquipmentId: string | null;
}

export default function BimDigitalTwin({ selectedRoomId, selectedEquipmentId }: BimDigitalTwinProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 25, y: 35, z: 25 });
  
  const { topology } = useStore();

  useEffect(() => {
    if (!mountRef.current || topology.length === 0) return;

    // Clear existing scene
    if (sceneRef.current) {
      sceneRef.current.clear();
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup with saved position
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(11, 5, 4);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    if (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Create BIM-based building
    createBimBuilding(scene);

    // Mouse controls with zoom
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(11, 5, 4);
      
      // Save camera position
      setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.radius += direction * zoomSpeed * spherical.radius * 0.1;
      spherical.radius = Math.max(5, Math.min(100, spherical.radius));
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(11, 5, 4);
      
      // Save camera position
      setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      scene.traverse((object) => {
        if ((object as THREE.Mesh).material) {
          const material = (object as THREE.Mesh).material;
          if (Array.isArray(material)) {
            material.forEach(m => m.dispose());
          } else {
            material.dispose();
          }
        }
        if ((object as THREE.Mesh).geometry) {
          (object as THREE.Mesh).geometry.dispose();
        }
      });
      
      renderer.dispose();
    };
  }, [topology, selectedRoomId, cameraPosition]);

  // Separate effect for equipment selection only
  useEffect(() => {
    if (!sceneRef.current || !selectedEquipmentId) return;
    
    // Update only equipment highlighting
    sceneRef.current.traverse((object) => {
      if (object.userData.type === 'equipment') {
        const mesh = object as THREE.Mesh;
        const material = mesh.material as THREE.MeshLambertMaterial;
        
        // Check if this equipment should be highlighted
        const shouldHighlight = topology.some(t => 
          t.point_id === selectedEquipmentId && 
          object.userData.roomId && 
          mapTwinMakerToBim(topology)[t.parent_id || ''] === object.userData.roomId
        );
        
        // Update color based on equipment type and selection
        let newColor = 0x888888;
        switch (object.userData.equipmentType) {
          case 'sensor':
            newColor = shouldHighlight ? 0xffff00 : 0x00e676;
            break;
          case 'lighting':
            newColor = shouldHighlight ? 0xffff00 : 0xffd54f;
            break;
          case 'hvac':
            newColor = shouldHighlight ? 0xffff00 : 0x42a5f5;
            break;
          case 'camera':
            newColor = shouldHighlight ? 0xffff00 : 0xff6b6b;
            break;
          default:
            newColor = shouldHighlight ? 0xffff00 : 0x888888;
        }
        
        material.color.setHex(newColor);
      }
    });
  }, [selectedEquipmentId, topology]);

  const createBimBuilding = (scene: THREE.Scene) => {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create mapping between TwinMaker and BIM data
    const mapping = mapTwinMakerToBim(topology);
    
    // Create all rooms from all floors
    mockBimData.floors.forEach((floor, floorIndex) => {
      const floorHeight = floorIndex * mockBimData.metadata.floorHeight;
      floor.forEach(room => {
        createBimRoom(scene, room, mapping, floorHeight);
      });
    });
  };

  const createBimRoom = (scene: THREE.Scene, room: BimRoom, mapping: { [key: string]: string }, floorHeight: number = 0) => {
    // Find corresponding TwinMaker room
    const twinMakerRoomId = Object.keys(mapping).find(key => mapping[key] === room.id);
    const isSelected = selectedRoomId === twinMakerRoomId;
    
    // Room floor
    const floorGeometry = new THREE.PlaneGeometry(room.coordinates.width, room.coordinates.height);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: isSelected ? 0x00e676 : getRoomColor(room.type),
      transparent: true,
      opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      room.coordinates.x + room.coordinates.width / 2,
      floorHeight + 0.01,
      room.coordinates.y + room.coordinates.height / 2
    );
    floor.receiveShadow = true;
    scene.add(floor);

    // Room walls
    room.walls.forEach(wall => {
      createWall(scene, wall, room, isSelected, floorHeight);
    });

    // Room label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = isSelected ? '#00e676' : '#ffffff';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText(room.name, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(
      room.coordinates.x + room.coordinates.width / 2,
      floorHeight + 3.5,
      room.coordinates.y + room.coordinates.height / 2
    );
    label.scale.set(3, 0.75, 1);
    scene.add(label);

    // Equipment from BIM data
    room.equipment.forEach(equipment => {
      createBimEquipment(scene, equipment, room, floorHeight);
    });
  };

  const createWall = (scene: THREE.Scene, wall: any, room: BimRoom, isSelected: boolean, floorHeight: number = 0) => {
    const length = Math.sqrt(
      Math.pow(wall.end.x - wall.start.x, 2) + 
      Math.pow(wall.end.y - wall.start.y, 2)
    );
    
    const wallGeometry = new THREE.BoxGeometry(length, 3, wall.thickness);
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: isSelected ? 0x00a050 : 0x666666 
    });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    
    const centerX = room.coordinates.x + (wall.start.x + wall.end.x) / 2;
    const centerY = room.coordinates.y + (wall.start.y + wall.end.y) / 2;
    
    wallMesh.position.set(centerX, floorHeight + 1.5, centerY);
    
    // Rotate wall based on direction
    const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
    wallMesh.rotation.y = angle;
    
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    // Add window if specified
    if (wall.hasWindow) {
      const windowGeometry = new THREE.PlaneGeometry(1.5, 1.2);
      const windowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x87ceeb, 
        transparent: true, 
        opacity: 0.6 
      });
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.copy(wallMesh.position);
      windowMesh.position.y = floorHeight + 2;
      windowMesh.rotation.copy(wallMesh.rotation);
      scene.add(windowMesh);
    }

    // Add door if specified
    if (wall.hasDoor) {
      const doorGeometry = new THREE.PlaneGeometry(0.9, 2.1);
      const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
      doorMesh.position.copy(wallMesh.position);
      doorMesh.position.y = floorHeight + 1.05;
      doorMesh.rotation.copy(wallMesh.rotation);
      scene.add(doorMesh);
    }
  };

  const createBimEquipment = (scene: THREE.Scene, equipment: any, room: BimRoom, floorHeight: number = 0) => {
    let geometry: THREE.BufferGeometry;
    let color = 0x888888;
    
    const isSelected = selectedEquipmentId && topology.some(t => 
      t.point_id === selectedEquipmentId && t.parent_id === Object.keys(mapTwinMakerToBim(topology)).find(key => 
        mapTwinMakerToBim(topology)[key] === room.id
      )
    );
    
    // Equipment type and geometry
    switch (equipment.type) {
      case 'sensor':
        geometry = new THREE.SphereGeometry(0.1, 12, 12);
        color = isSelected ? 0xffff00 : 0x00e676;
        break;
      case 'lighting':
        geometry = new THREE.CylinderGeometry(0.05, 0.1, 0.2, 8);
        color = isSelected ? 0xffff00 : 0xffd54f;
        break;
      case 'hvac':
        geometry = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        color = isSelected ? 0xffff00 : 0x42a5f5;
        break;
      case 'camera':
        geometry = new THREE.ConeGeometry(0.08, 0.15, 8);
        color = isSelected ? 0xffff00 : 0xff6b6b;
        break;
      default:
        geometry = new THREE.OctahedronGeometry(0.08);
        color = isSelected ? 0xffff00 : 0x888888;
    }
    
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { type: 'equipment', equipmentType: equipment.type, roomId: room.id };
    
    mesh.position.set(
      room.coordinates.x + equipment.position.x,
      floorHeight + equipment.position.z,
      room.coordinates.y + equipment.position.y
    );
    
    mesh.castShadow = true;
    scene.add(mesh);
    
    // Add glow effect for selected equipment
    if (isSelected) {
      const glowGeometry = geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.3 
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.setScalar(1.5);
      glowMesh.position.copy(mesh.position);
      scene.add(glowMesh);
    }
  };

  const getRoomColor = (type: string) => {
    switch (type) {
      case 'office': return 0x4a90e2;
      case 'meeting': return 0x9b59b6;
      case 'corridor': return 0x95a5a6;
      case 'restroom': return 0x3498db;
      case 'storage': return 0xe67e22;
      case 'server': return 0xe74c3c;
      default: return 0x7f8c8d;
    }
  };

  return (
    <Card sx={{ 
      height: isFullscreen ? '100vh' : 500, 
      width: '100%',
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 9999 : 'auto',
      bgcolor: 'rgba(255,255,255,0.05)', 
      border: '1px solid rgba(255,255,255,0.1)' 
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewInAr sx={{ color: '#00E676' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              BIM Digital Twin
            </Typography>
            <Chip 
              label="All Floors" 
              size="small" 
              sx={{ bgcolor: '#00e676', color: 'black', fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
          <IconButton onClick={() => setIsFullscreen(!isFullscreen)} sx={{ color: 'white' }}>
            <Fullscreen />
          </IconButton>
        </Box>
        
        <Box 
          ref={mountRef} 
          sx={{ 
            width: '100%', 
            height: isFullscreen ? 'calc(100vh - 80px)' : 420,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' }
          }} 
        />
        
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label="🏢 Office" sx={{ bgcolor: 'rgba(74,144,226,0.2)', color: '#4A90E2', fontSize: '0.7rem' }} />
          <Chip size="small" label="🤝 Meeting" sx={{ bgcolor: 'rgba(155,89,182,0.2)', color: '#9B59B6', fontSize: '0.7rem' }} />
          <Chip size="small" label="🚶 Corridor" sx={{ bgcolor: 'rgba(149,165,166,0.2)', color: '#95A5A6', fontSize: '0.7rem' }} />
          <Chip size="small" label="🖱️ Drag to rotate" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
          <Chip size="small" label="🔍 Scroll to zoom" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
        </Box>
      </CardContent>
    </Card>
  );
}