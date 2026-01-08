import { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { ViewInAr } from '@mui/icons-material';
import * as THREE from 'three';
import { useStore } from '../store';

interface Simple3DViewerProps {
  selectedRoomId: string | null;
}

export default function Simple3DViewer({ selectedRoomId }: Simple3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { topology, values } = useStore();

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('=== 3D Viewer Debug Info ===');
    console.log('Topology length:', topology.length);
    console.log('Full topology:', topology);
    
    // Extract rooms first
    const rooms = topology.filter(t => t.component_type_id === 'Space');
    console.log('Filtered rooms:', rooms.length);
    console.log('Room details:', rooms.map(r => ({ name: r.entity_name, id: r.point_id })));
    
    if (rooms.length === 0) {
      console.log('No rooms found - using fallback data');
      // Fallback: create mock rooms if no data
      const mockRooms = [
        { point_id: 'room-101', entity_id: 'room-101', entity_name: 'Room 101', component_type_id: 'Space', parent_id: undefined },
        { point_id: 'room-102', entity_id: 'room-102', entity_name: 'Room 102', component_type_id: 'Space', parent_id: undefined },
        { point_id: 'room-201', entity_id: 'room-201', entity_name: 'Room 201', component_type_id: 'Space', parent_id: undefined },
        { point_id: 'room-202', entity_id: 'room-202', entity_name: 'Room 202', component_type_id: 'Space', parent_id: undefined }
      ];
      rooms.push(...mockRooms);
      console.log('Using mock rooms:', rooms.length);
    }
    
    console.log('Room data with properties:', rooms.map(r => ({ 
      name: r.entity_name, 
      id: r.point_id, 
      properties: r.properties,
      level: r.properties?.level || r.level,
      fullData: r 
    })));

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    
    // Clear previous content
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Additional lights for better visibility
    const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
    light2.position.set(-10, 10, -10);
    scene.add(light2);
    
    const light3 = new THREE.PointLight(0xffffff, 0.5, 50);
    light3.position.set(0, 10, 0);
    scene.add(light3);

    // Ground (larger for building)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // Create multi-floor building structure
    const roomPositions = new Map<string, THREE.Vector3>();
    
    // Building frame
    const frameGeometry = new THREE.BoxGeometry(10, 8, 8);
    const frameMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x444444, 
      transparent: true, 
      opacity: 0.1,
      wireframe: true
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 4;
    scene.add(frame);
    
    // Create floors (1F, 2F, 3F)
    for (let floor = 0; floor < 3; floor++) {
      const floorY = floor * 2.5;
      
      // Floor plane
      const floorGeometry = new THREE.PlaneGeometry(9, 7);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x555555, 
        transparent: true, 
        opacity: 0.3
      });
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = floorY;
      scene.add(floorMesh);
      
      // Floor label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 32;
      context.fillStyle = '#ffffff';
      context.font = 'bold 12px Arial';
      context.textAlign = 'center';
      context.fillText(`${floor + 1}F`, 64, 20);
      
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: texture });
      const label = new THREE.Sprite(labelMaterial);
      label.position.set(-5, floorY + 0.5, -4);
      label.scale.set(1, 0.3, 1);
      scene.add(label);
    }
    
    // Position rooms based on room number (not level property)
    rooms.forEach((room) => {
      // Extract floor from room name (101-106=1F, 201-205=2F, 301-304=3F)
      const roomNumber = room.entity_name.match(/\d{3}/);
      let floor = 1; // Default to 2F (index 1)
      
      if (roomNumber) {
        const num = parseInt(roomNumber[0]);
        if (num >= 101 && num <= 106) floor = 0; // 1F
        else if (num >= 201 && num <= 205) floor = 1; // 2F  
        else if (num >= 301 && num <= 304) floor = 2; // 3F
      }
      
      const floorY = floor * 2.5;
      const isSelected = selectedRoomId === room.point_id;
      
      console.log(`Room: ${room.entity_name}, Number: ${roomNumber?.[0]}, Floor: ${floor + 1}F, Y: ${floorY}`);
      
      // Room cube with enhanced materials
      const geometry = new THREE.BoxGeometry(3.5, 2, 2.5);
      const material = new THREE.MeshLambertMaterial({ 
        color: isSelected ? 0x00e676 : 0x4a90e2,
        transparent: true,
        opacity: 0.7,
        emissive: isSelected ? 0x002211 : 0x001122,
        emissiveIntensity: 0.1
      });
      const cube = new THREE.Mesh(geometry, material);
      
      // Position rooms on each floor horizontally
      const roomsOnFloor = rooms.filter(r => {
        const rNum = r.entity_name.match(/\d{3}/);
        if (!rNum) return false;
        const rFloor = Math.floor(parseInt(rNum[0]) / 100) - 1;
        return rFloor === floor;
      });
      const roomIndexOnFloor = roomsOnFloor.findIndex(r => r.point_id === room.point_id);
      
      // Arrange rooms in a grid on each floor (3x2 grid)
      const x = (roomIndexOnFloor % 3) * 3 - 3; // -3, 0, 3
      const z = Math.floor(roomIndexOnFloor / 3) * 3 - 1.5; // -1.5, 1.5
      
      cube.position.set(x, floorY + 1, z);
      scene.add(cube);
      
      // Store room position for camera focusing
      roomPositions.set(room.point_id, new THREE.Vector3(x, floorY + 1, z));
      
      // Room walls
      const wallMaterial = new THREE.MeshLambertMaterial({ 
        color: isSelected ? 0x00a050 : 0x666666,
        transparent: true,
        opacity: 0.8
      });
      
      // Create 4 walls
      const wallThickness = 0.1;
      const wallHeight = 2;
      
      // Front and back walls
      const frontWallGeometry = new THREE.BoxGeometry(3.5, wallHeight, wallThickness);
      const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
      frontWall.position.set(x, floorY + 1, z + 1.25);
      scene.add(frontWall);
      
      const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
      backWall.position.set(x, floorY + 1, z - 1.25);
      scene.add(backWall);
      
      // Left and right walls
      const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2.5);
      const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
      leftWall.position.set(x - 1.75, floorY + 1, z);
      scene.add(leftWall);
      
      const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
      rightWall.position.set(x + 1.75, floorY + 1, z);
      scene.add(rightWall);
      
      // Room label
      const roomCanvas = document.createElement('canvas');
      const roomContext = roomCanvas.getContext('2d')!;
      roomCanvas.width = 256;
      roomCanvas.height = 64;
      roomContext.fillStyle = isSelected ? '#00e676' : '#ffffff';
      roomContext.font = 'bold 14px Arial';
      roomContext.textAlign = 'center';
      roomContext.fillText(room.entity_name, 128, 40);
      
      const roomTexture = new THREE.CanvasTexture(roomCanvas);
      const roomLabelMaterial = new THREE.SpriteMaterial({ map: roomTexture });
      const roomLabel = new THREE.Sprite(roomLabelMaterial);
      roomLabel.position.set(x, floorY + 2.8, z);
      roomLabel.scale.set(2.5, 0.6, 1);
      scene.add(roomLabel);
      
      // Add equipment for this room
      const equipment = topology.filter(t => t.parent_id === room.point_id);
      equipment.forEach((eq, eqIndex) => {
        let eqGeometry: THREE.BufferGeometry;
        let eqColor = 0x888888;
        
        if (eq.component_type_id.includes('Sensor')) {
          eqGeometry = new THREE.SphereGeometry(0.08, 8, 8);
          eqColor = 0x00e676;
        } else if (eq.component_type_id.includes('Lighting')) {
          eqGeometry = new THREE.CylinderGeometry(0.04, 0.08, 0.15, 6);
          eqColor = 0xffd54f;
        } else {
          eqGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.15);
          eqColor = 0x42a5f5;
        }
        
        const eqMaterial = new THREE.MeshLambertMaterial({ color: eqColor });
        const eqMesh = new THREE.Mesh(eqGeometry, eqMaterial);
        
        // Position equipment inside room
        const eqX = x + (eqIndex % 2 === 0 ? -0.8 : 0.8);
        const eqZ = z + (Math.floor(eqIndex / 2) % 2 === 0 ? -0.6 : 0.6);
        eqMesh.position.set(eqX, floorY + 2.2, eqZ);
        scene.add(eqMesh);
        
        // Equipment status indicator
        const data = values[eq.point_id];
        if (data) {
          const indicatorGeometry = new THREE.RingGeometry(0.1, 0.12, 8);
          const indicatorMaterial = new THREE.MeshBasicMaterial({ 
            color: Number(data.value) > 25 ? 0xff4444 : 0x44ff44,
            transparent: true,
            opacity: 0.8
          });
          const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
          indicator.position.set(eqX, floorY + 2.4, eqZ);
          indicator.lookAt(camera.position);
          scene.add(indicator);
        }
      });
    });

    // Mouse controls with pan (right-click) and rotate (left-click)
    let mouseDown = false;
    let rightMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    const target = new THREE.Vector3(0, 2.5, 0);

    // Function to animate camera to target position
    const animateCamera = (targetPos: THREE.Vector3, lookAtPos: THREE.Vector3, duration = 1000) => {
      const startPos = camera.position.clone();
      const startTarget = target.clone();
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        target.lerpVectors(startTarget, lookAtPos, easeProgress);
        camera.lookAt(target);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        mouseDown = true;
      } else if (event.button === 2) {
        rightMouseDown = true;
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
      rightMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown && !rightMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      if (mouseDown) {
        // Rotate around target
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(target));
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
      } else if (rightMouseDown) {
        // Pan camera
        const panSpeed = 0.02;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        
        camera.getWorldDirection(right);
        right.cross(up).normalize();
        
        const panVector = right.multiplyScalar(-deltaX * panSpeed)
          .add(up.multiplyScalar(deltaY * panSpeed));
        
        camera.position.add(panVector);
        target.add(panVector);
        camera.lookAt(target);
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.2; // Increased from 0.1 to 0.2
      const direction = event.deltaY > 0 ? 1 : -1;
      
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position.clone().sub(target));
      spherical.radius += direction * zoomSpeed * spherical.radius * 0.15; // Increased from 0.1 to 0.15
      spherical.radius = Math.max(3, Math.min(50, spherical.radius));
      
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Focus on selected room
    if (selectedRoomId && roomPositions.has(selectedRoomId)) {
      const roomPos = roomPositions.get(selectedRoomId)!;
      
      // 部屋の位置に基づいて最適なカメラアングルを計算
      const roomX = roomPos.x;
      const roomZ = roomPos.z;
      
      let cameraOffset: THREE.Vector3;
      
      // 奥側（Z > 0）の部屋の場合は前方から、手前側（Z < 0）の部屋の場合は後方から撮影
      if (roomZ > 0) {
        // 奥側の部屋：後方斜めから撮影（より近く）
        cameraOffset = new THREE.Vector3(3, 3, 4);
      } else {
        // 手前側の部屋：前方斜めから撮影（より近く）
        cameraOffset = new THREE.Vector3(-3, 3, -4);
      }
      
      // 左右の部屋の場合も調整（より近く）
      if (Math.abs(roomX) > 2) {
        cameraOffset.x = roomX > 0 ? -4 : 4;
      }
      
      const optimalCameraPos = roomPos.clone().add(cameraOffset);
      animateCamera(optimalCameraPos, roomPos);
    }

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
    };
  }, [topology, selectedRoomId]);

  return (
    <Card sx={{ 
      height: 500, 
      width: '100%',
      bgcolor: 'rgba(255,255,255,0.05)', 
      border: '1px solid rgba(255,255,255,0.1)' 
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ViewInAr sx={{ color: '#00E676' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Building Digital Twin
          </Typography>
        </Box>
        
        <Box 
          ref={mountRef} 
          sx={{ 
            width: '100%', 
            height: 420,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }} 
        />
      </CardContent>
    </Card>
  );
}