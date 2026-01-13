import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { ViewInAr } from '@mui/icons-material';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { useStore } from '../store';

interface TwinMakerDigitalTwinProps {
  selectedRoomId: string | null;
  selectedEquipmentId: string | null;
}

export default function TwinMakerDigitalTwin({ selectedRoomId, selectedEquipmentId }: TwinMakerDigitalTwinProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const roomMarkersRef = useRef<THREE.Group | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { topology } = useStore();

  // Room positions based on actual room names and floors
  const getRoomPosition = (roomId: string) => {
    const room = topology.find(r => r.point_id === roomId);
    if (!room) return { x: 0, y: 2, z: 0 };
    
    const roomName = room.entity_name;
    
    // より正確な部屋位置（建物内部）
    if (roomName.includes('101')) return { x: -2, y: 0.5, z: -2 }; // 1F left front
    if (roomName.includes('102')) return { x: 2, y: 0.5, z: -2 };  // 1F right front
    if (roomName.includes('103')) return { x: -2, y: 0.5, z: 2 };  // 1F left back
    if (roomName.includes('104')) return { x: 2, y: 0.5, z: 2 };   // 1F right back
    
    if (roomName.includes('201')) return { x: -2, y: 3.5, z: -2 }; // 2F left front
    if (roomName.includes('202')) return { x: 2, y: 3.5, z: -2 };  // 2F right front
    if (roomName.includes('203')) return { x: -2, y: 3.5, z: 2 };  // 2F left back
    if (roomName.includes('204')) return { x: 2, y: 3.5, z: 2 };   // 2F right back
    
    if (roomName.includes('301')) return { x: -2, y: 6.5, z: -2 }; // 3F left front
    if (roomName.includes('302')) return { x: 2, y: 6.5, z: -2 };  // 3F right front
    if (roomName.includes('303')) return { x: -2, y: 6.5, z: 2 };  // 3F left back
    if (roomName.includes('304')) return { x: 2, y: 6.5, z: 2 };   // 3F right back
    
    return { x: 0, y: 2, z: 0 };
  };

  // 部屋マーカーを作成
  const createRoomMarkers = () => {
    if (!sceneRef.current) return;
    
    if (roomMarkersRef.current) {
      sceneRef.current.remove(roomMarkersRef.current);
    }
    
    const markersGroup = new THREE.Group();
    roomMarkersRef.current = markersGroup;
    
    const rooms = topology.filter(t => t.component_type_id === 'Space');
    rooms.forEach((room) => {
      const roomPos = getRoomPosition(room.point_id);
      const isSelected = selectedRoomId === room.point_id;
      
      if (isSelected) {
        // 選択された部屋のハイライトボックス
        const highlightGeometry = new THREE.BoxGeometry(3, 2.5, 3);
        const highlightMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x00e676,
          transparent: true,
          opacity: 0.3,
          emissive: 0x003322,
          emissiveIntensity: 0.2
        });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(roomPos.x, roomPos.y + 1.25, roomPos.z);
        
        // パルスアニメーション
        let time = 0;
        const pulseAnimation = () => {
          time += 0.05;
          const opacity = 0.2 + Math.sin(time) * 0.1;
          highlightMaterial.opacity = opacity;
          if (selectedRoomId === room.point_id) {
            requestAnimationFrame(pulseAnimation);
          }
        };
        pulseAnimation();
        
        markersGroup.add(highlight);
      }
      
      // 部屋マーカー（小さな球体）
      const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const markerMaterial = new THREE.MeshLambertMaterial({ 
        color: isSelected ? 0x00e676 : 0x4a90e2,
        emissive: isSelected ? 0x002211 : 0x001122,
        emissiveIntensity: 0.3
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(roomPos.x, roomPos.y + 2, roomPos.z);
      
      markersGroup.add(marker);
    });
    
    sceneRef.current.add(markersGroup);
  };

  // Animate camera to room position
  const animateCameraToRoom = (roomId: string) => {
    if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
    
    const roomPos = getRoomPosition(roomId);
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const startPos = camera.position.clone();
    
    // より近い距離でかっこいい角度
    const targetPos = new THREE.Vector3(
      roomPos.x + (roomPos.x > 0 ? 4 : -4),
      roomPos.y + 2,
      roomPos.z + (roomPos.z > 0 ? 4 : -4)
    );
    
    let progress = 0;
    const animate = () => {
      progress += 0.02; // より滑らかなアニメーション
      if (progress >= 1) {
        camera.position.copy(targetPos);
        camera.lookAt(roomPos.x, roomPos.y, roomPos.z);
        return;
      }
      
      // イージング関数でより自然な動き
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPos, targetPos, easeProgress);
      camera.lookAt(roomPos.x, roomPos.y, roomPos.z);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  };

  // Reset camera to overview
  const resetCamera = () => {
    if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
    
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const startPos = camera.position.clone();
    const targetPos = new THREE.Vector3(15, 8, 15);
    
    let progress = 0;
    const animate = () => {
      progress += 0.05;
      if (progress >= 1) {
        camera.position.copy(targetPos);
        camera.lookAt(0, 3, 0);
        return;
      }
      
      camera.position.lerpVectors(startPos, targetPos, progress);
      camera.lookAt(0, 3, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  };

  // 部屋選択時にマーカーを更新
  useEffect(() => {
    if (modelLoaded) {
      createRoomMarkers();
    }
  }, [selectedRoomId, modelLoaded, topology]);

  // Handle room selection changes
  useEffect(() => {
    if (!modelLoaded) return;
    
    if (selectedRoomId) {
      animateCameraToRoom(selectedRoomId);
    } else {
      resetCamera();
    }
  }, [selectedRoomId, modelLoaded]);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    
    // Clear any existing content
    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Camera - 建物を斜め下から見上げる角度に設定
    const camera = new THREE.PerspectiveCamera(
      75, 
      mount.clientWidth / mount.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(15, 8, 15); // より低い位置から見上げる
    camera.lookAt(0, 3, 0); // 建物の中央やや上を見る
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // グラウンドを削除 - 建物の上層階を隠す原因

    // Load GLB model
    const loader = new GLTFLoader();
    setLoadingProgress(10);
    setModelLoaded(false);

    let model: THREE.Group;
    let animationId: number;

    // Mouse controls
    let mouseDown = false;
    let rightMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    const target = new THREE.Vector3(0, 3, 0);

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // 左クリック
        mouseDown = true;
      } else if (event.button === 2) { // 右クリック
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
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      if (mouseDown) {
        // 左クリック：回転
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(target));
        spherical.theta -= deltaX * 0.005;
        spherical.phi += deltaY * 0.005;
        spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi));
        
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
      } else if (rightMouseDown) {
        // 右クリック：パン
        const panSpeed = 0.01;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        
        camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(camera.matrix, 0);
        up.setFromMatrixColumn(camera.matrix, 1);
        
        const panOffset = new THREE.Vector3();
        panOffset.addScaledVector(right, -deltaX * panSpeed);
        panOffset.addScaledVector(up, deltaY * panSpeed);
        
        camera.position.add(panOffset);
        target.add(panOffset);
        camera.lookAt(target);
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
      
      renderer.render(scene, camera);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position.clone().sub(target));
      spherical.radius += direction * 2;
      spherical.radius = Math.max(3, Math.min(30, spherical.radius));
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
      
      renderer.render(scene, camera);
    };

    // 右クリックメニューを無効化
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    loader.load(
      '/bop-buildingA-3dmodel.glb',
      (gltf) => {
        model = gltf.scene;
        modelRef.current = model;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 15 / maxDim;
        
        model.scale.setScalar(scale);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        scene.add(model);
        setModelLoaded(true);
        setLoadingProgress(100);

        // 部屋マーカーを作成
        createRoomMarkers();

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();
      },
      (progress) => {
        const percentComplete = (progress.loaded / progress.total) * 100;
        setLoadingProgress(Math.max(10, percentComplete));
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        setLoadingProgress(0);
        
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x00e676 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();
      }
    );

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      scene.clear();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Card sx={{ 
      height: 550, 
      width: '100%',
      bgcolor: 'rgba(255,255,255,0.05)', 
      border: '1px solid rgba(255,255,255,0.1)' 
    }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewInAr sx={{ color: '#00E676' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              TwinMaker Digital Twin
            </Typography>
            <Chip 
              label={modelLoaded ? 'GLB Loaded' : `Loading ${Math.round(loadingProgress)}%`}
              size="small" 
              sx={{ 
                bgcolor: modelLoaded ? '#00e676' : '#ffa726', 
                color: 'black', 
                fontSize: '0.7rem', 
                fontWeight: 600 
              }}
            />
          </Box>
        </Box>
        
        <Box 
          ref={mountRef}
          sx={{ 
            width: '100%', 
            height: 450,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            bgcolor: '#222222',
            flexGrow: 1
          }} 
        />
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label="🏗️ GLB Model" sx={{ bgcolor: 'rgba(0,230,118,0.2)', color: '#00E676', fontSize: '0.7rem' }} />
          <Chip size="small" label="🖱️ Left: Rotate" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
          <Chip size="small" label="🖱️ Right: Pan" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
          <Chip size="small" label="🔍 Scroll: Zoom" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }} />
          {selectedRoomId && (
            <Chip size="small" label={`📍 Room Highlight`} sx={{ bgcolor: 'rgba(0,230,118,0.2)', color: '#00E676', fontSize: '0.7rem' }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}