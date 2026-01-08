import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Chip } from '@mui/material';
import { ViewInAr, Fullscreen } from '@mui/icons-material';
import * as THREE from 'three';
import { useStore } from '../store';

interface DigitalTwin3DProps {
  selectedRoomId: string | null;
}

export default function DigitalTwin3D({ selectedRoomId }: DigitalTwin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { topology, values } = useStore();

  useEffect(() => {
    if (!mountRef.current) return;

    // Wait for topology to load
    if (topology.length === 0) {
      console.log('Waiting for topology data...');
      return;
    }

    console.log('Initializing 3D scene with topology:', topology.length, 'items');

    // Clear existing scene
    if (sceneRef.current) {
      sceneRef.current.clear();
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    // Clear previous canvas if exists
    if (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create building structure
    createBuildingStructure(scene);

    // Basic camera controls (mouse rotation)
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
      camera.lookAt(0, 0, 0);
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
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
      
      // Dispose of textures and materials
      scene.traverse((object) => {
        if (object.userData.texture) {
          object.userData.texture.dispose();
        }
        if (object.userData.material) {
          object.userData.material.dispose();
        }
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
  }, [topology, selectedRoomId]);



  const createBuildingStructure = (scene: THREE.Scene) => {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Building outline
    const buildingGeometry = new THREE.BoxGeometry(12, 8, 12);
    const buildingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x666666, 
      transparent: true, 
      opacity: 0.3 
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 4;
    building.castShadow = true;
    scene.add(building);

    // Create rooms based on actual topology data
    const rooms = topology.filter(t => t.component_type_id === 'Space');
    rooms.forEach((room, index) => {
      createRoom(scene, room, index);
    });
  };

  const createRoom = (scene: THREE.Scene, room: any, index: number) => {
    // Room geometry
    const roomGeometry = new THREE.BoxGeometry(2.5, 3, 2.5);
    const isSelected = selectedRoomId === room.point_id;
    const roomMaterial = new THREE.MeshLambertMaterial({ 
      color: isSelected ? 0x00e676 : 0x4a90e2,
      transparent: true,
      opacity: 0.4
    });
    
    const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
    roomMesh.userData = { type: 'room', id: room.point_id };
    
    // Position rooms in a 4x4 grid
    const gridSize = 4;
    const spacing = 3.5;
    const x = (index % gridSize) * spacing - (gridSize * spacing) / 2 + spacing / 2;
    const z = Math.floor(index / gridSize) * spacing - (gridSize * spacing) / 2 + spacing / 2;
    roomMesh.position.set(x, 1.5, z);
    
    // Room border
    const edges = new THREE.EdgesGeometry(roomGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: isSelected ? 0x00e676 : 0xffffff,
      linewidth: 2
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.position.copy(roomMesh.position);
    wireframe.userData = { type: 'wireframe', roomId: room.point_id };
    
    scene.add(roomMesh);
    scene.add(wireframe);

    // Room label - create texture once and reuse
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = isSelected ? '#00e676' : '#ffffff';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    const roomName = room.entity_name.split(' ').slice(-2).join(' ');
    context.fillText(roomName, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(x, 4, z);
    label.scale.set(3, 0.75, 1);
    label.userData = { type: 'label', roomId: room.point_id, texture, material: labelMaterial };
    
    scene.add(label);

    // Add equipment for this room
    const roomEquipment = topology.filter(t => t.parent_id === room.point_id);
    roomEquipment.forEach((equipment, eqIndex) => {
      createEquipment(scene, equipment, x, z, eqIndex);
    });
  };

  const createEquipment = (scene: THREE.Scene, equipment: any, roomX: number, roomZ: number, index: number) => {
    let geometry: THREE.BufferGeometry;
    let color = 0x888888;
    const currentValue = values[equipment.point_id];
    
    // Equipment type and color
    if (equipment.component_type_id.includes('EnvironmentalSensor')) {
      geometry = new THREE.SphereGeometry(0.15, 12, 12);
      color = currentValue ? (Number(currentValue.value) > 25 ? 0xff4444 : 0x44ff44) : 0x00e676;
    } else if (equipment.component_type_id.includes('LightingFixture')) {
      geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
      color = 0xffd54f;
    } else if (equipment.component_type_id.includes('AirConditioner')) {
      geometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
      color = 0x42a5f5;
    } else {
      geometry = new THREE.OctahedronGeometry(0.1);
    }
    
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { type: 'equipment', id: equipment.point_id, name: equipment.entity_name };
    
    // Position equipment around room perimeter
    const angle = (index * Math.PI * 2) / Math.max(4, index + 1);
    const radius = 1.0;
    mesh.position.set(
      roomX + Math.cos(angle) * radius,
      2,
      roomZ + Math.sin(angle) * radius
    );
    
    mesh.castShadow = true;
    scene.add(mesh);

    // Equipment status indicator
    if (currentValue) {
      const indicatorGeometry = new THREE.RingGeometry(0.2, 0.25, 8);
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: Number(currentValue.value) > 25 ? 0xff0000 : 0x00ff00,
        transparent: true,
        opacity: 0.8
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.copy(mesh.position);
      indicator.position.y += 0.3;
      indicator.lookAt(cameraRef.current!.position);
      scene.add(indicator);
    }
  };



  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
              3D Digital Twin
            </Typography>
            <Chip 
              label="Live" 
              size="small" 
              sx={{ bgcolor: '#00e676', color: 'black', fontSize: '0.7rem', fontWeight: 600 }}
            />
          </Box>
          <Box>
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              <Fullscreen />
            </IconButton>
          </Box>
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
          <Chip 
            size="small" 
            label="🌡️ Temperature Sensors" 
            sx={{ bgcolor: 'rgba(0,230,118,0.2)', color: '#00E676', fontSize: '0.7rem' }}
          />
          <Chip 
            size="small" 
            label="💡 Lighting" 
            sx={{ bgcolor: 'rgba(255,213,79,0.2)', color: '#FFD54F', fontSize: '0.7rem' }}
          />
          <Chip 
            size="small" 
            label="❄️ HVAC" 
            sx={{ bgcolor: 'rgba(66,165,245,0.2)', color: '#42A5F5', fontSize: '0.7rem' }}
          />
          <Chip 
            size="small" 
            label="🖱️ Drag to rotate" 
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}