"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Button } from "./ui/button";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface CubeUserData {
  layerIndex: number;
  originalPosition: THREE.Vector3;
  explodedPosition: THREE.Vector3;
  plainPosition: THREE.Vector3;
  value: number;
}

interface VisualizerProps {
  matrixNumber: number[][][] | null;
  width: number;
  height: number;
  backgroundColor?: string;
  initialRotationSpeed?: number;
}

const generateColorFromValue = (value: number) =>
  `hsl(${(value * 2) % 360}, 70%, 50%)`;

const createCubeFaces = (value: number) => {
  const faces = [
    { position: [0, 0, 0.51], rotation: [0, 0, 0] },
    { position: [0, 0, -0.51], rotation: [0, Math.PI, 0] },
    { position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    { position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0] },
    { position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0] },
  ];

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return [];

  context.fillStyle = "white";
  context.font = "32px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(value.toString(), 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return faces.map(({ position, rotation }) => {
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
    label.position.set(...(position as [number, number, number]));
    label.rotation.set(...(rotation as [number, number, number]));
    return label;
  });
};

const Visualizer: React.FC<VisualizerProps> = ({
  matrixNumber,
  width,
  height,
  backgroundColor = "#ffffff",
  initialRotationSpeed = 0.01,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [isPlainMode, setIsPlainMode] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);

  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const cubesRef = useRef<THREE.Mesh[]>([]);
  const cubeGroupRef = useRef<THREE.Group>();
  const mouseDownRef = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const lastClickTime = useRef(0);
  const animationFrameRef = useRef<number>();
  const autoRotateRef = useRef(true);

  const updateLayerVisibility = useCallback((layerIndex: number) => {
    cubesRef.current.forEach((cube) => {
      const userData = cube.userData as CubeUserData;
      const material = cube.material as THREE.MeshPhongMaterial;
      const isActiveLayer =
        layerIndex === -1 || userData.layerIndex === layerIndex;

      material.opacity = isActiveLayer ? 0.8 : 0.2;
      cube.visible = true;
      cube.children.forEach((child) => {
        const labelMaterial = (child as THREE.Mesh)
          .material as THREE.MeshBasicMaterial;
        labelMaterial.opacity = isActiveLayer ? 0.9 : 0.1;
      });
    });
  }, []);

  const setupScene = useCallback(
    (mountNode?: HTMLDivElement | null) => {
      if (!mountNode) return null;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 10;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      mountNode.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = !isPlainMode && !isPaused;
      controls.autoRotateSpeed = initialRotationSpeed * 60;

      if (isPlainMode) {
        // Plain mode specific settings
        controls.enableRotate = false;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.minDistance = 5;
        controls.maxDistance = 20;
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.RIGHT,
        };

        // Set initial camera position for plain mode
        camera.position.set(0, 0, 15);
        camera.lookAt(0, 0, 0);

        // Lock the camera's up vector and restrict movement to horizontal plane
        controls.target.set(0, 0, 0);
        camera.up.set(0, 1, 0);

        // Limit vertical panning
        controls.minPolarAngle = Math.PI / 2; // 90 degrees
        controls.maxPolarAngle = Math.PI / 2; // 90 degrees

        // Disable auto-rotate in plain mode
        controls.autoRotate = false;
      } else {
        controls.enableRotate = true;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
      }

      controlsRef.current = controls;

      scene.add(new THREE.AmbientLight(0x404040));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      return renderer;
    },
    [
      width,
      height,
      backgroundColor,
      initialRotationSpeed,
      isPlainMode,
      isPaused,
    ]
  );

  const createCubes = useCallback(() => {
    if(!matrixNumber) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const spacing = 1.2;
    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    const cubes: THREE.Mesh[] = [];
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const offset = (matrixNumber.length - 1) * spacing * 0.5;
    const plainModeOffsetX =
      (matrixNumber[0][0].length * spacing * (matrixNumber.length - 1)) / 2;
    const plainModeOffsetY = (matrixNumber[0].length * spacing) / 2;

    matrixNumber.forEach((layer, z) => {
      layer.forEach((row, y) => {
        row.forEach((value, x) => {
          const cube = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial({
              color: generateColorFromValue(value),
              transparent: true,
              opacity: 0.8,
            })
          );

          const originalPosition = new THREE.Vector3(
            x * spacing - offset,
            y * spacing - offset,
            z * spacing - offset
          );

          const explodedPosition = originalPosition.clone().multiplyScalar(1.5);

          const plainPosition = new THREE.Vector3(
            x * spacing + z * (row.length * spacing) - plainModeOffsetX,
            y * spacing - plainModeOffsetY,
            0
          );

          cube.position.copy(isPlainMode ? plainPosition : originalPosition);
          cube.userData = {
            layerIndex: z,
            originalPosition,
            explodedPosition,
            plainPosition,
            value,
          };

          createCubeFaces(value).forEach((face) => cube.add(face));
          cubes.push(cube);
          cubeGroup.add(cube);
        });
      });
    });

    cubesRef.current = cubes;
    scene.add(cubeGroup);
  }, [matrixNumber, isPlainMode]);

  useEffect(() => {
    const mountNode = mountRef.current;
    const renderer = setupScene(mountNode);
    if (!renderer) return;

    createCubes();
    updateLayerVisibility(activeLayer);

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownRef.current = true;
      lastMousePosition.current = { x: event.clientX, y: event.clientY };

      if (!isPaused) {
        setTimeout(() => {
          if (mouseDownRef.current) {
            setIsPaused(true);
          }
        }, 200);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) return;

      mouseDownRef.current = false;
      const currentTime = Date.now();
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      const camera = cameraRef.current;
      if (!camera) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cubesRef.current, false);

      if (currentTime - lastClickTime.current < 300) {
        if (intersects.length > 0) {
          const clickedCube = intersects[0].object as THREE.Mesh;
          const userData = clickedCube.userData as CubeUserData;
          setActiveLayer(userData.layerIndex);
          updateLayerVisibility(userData.layerIndex);
        } else {
          setActiveLayer(-1);
          updateLayerVisibility(-1);
        }
      } else if (intersects.length === 0 && !isPlainMode) {
        autoRotateRef.current = !autoRotateRef.current;
        if (controlsRef.current) {
          controlsRef.current.autoRotate = autoRotateRef.current;
        }
      }

      lastClickTime.current = currentTime;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (mouseDownRef.current && cubeGroupRef.current && !isPlainMode) {
        const deltaX = event.clientX - lastMousePosition.current.x;
        const deltaY = event.clientY - lastMousePosition.current.y;

        cubeGroupRef.current.rotation.y += deltaX * 0.005;
        cubeGroupRef.current.rotation.x += deltaY * 0.005;

        lastMousePosition.current = { x: event.clientX, y: event.clientY };
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const camera = cameraRef.current;
      if (camera) {
        camera.position.z = Math.max(
          5,
          Math.min(20, camera.position.z + event.deltaY * 0.001)
        );
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("wheel", handleWheel);
    renderer.domElement.addEventListener("contextmenu", handleContextMenu);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const controls = controlsRef.current;

      if (controls && renderer && sceneRef.current && cameraRef.current) {
        cubesRef.current.forEach((cube) => {
          const userData = cube.userData as CubeUserData;
          const targetPosition = isPlainMode
            ? userData.plainPosition
            : isExploded
            ? userData.explodedPosition
            : userData.originalPosition;

          cube.position.lerp(targetPosition, 0.1);
          if (isPlainMode) {
            cube.rotation.set(0, 0, 0);
            if (cameraRef.current) {
              cameraRef.current.position.y = 0;
            }
            controls.target.y = 0;
          }
        });

        controls.update();
        renderer.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (camera && renderer) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("contextmenu", handleContextMenu);
      renderer.dispose();
      mountNode?.removeChild(renderer.domElement);
    };
  }, [
    setupScene,
    createCubes,
    updateLayerVisibility,
    isExploded,
    isPlainMode,
    activeLayer,
    isPaused,
    width,
    height,
  ]);

  const handleContextMenuAction = (action: string) => {
    switch (action) {
      case "explode":
        setIsExploded(!isExploded);
        break;
      case "plain":
        setIsPlainMode(!isPlainMode);
        break;
    }
  };

  return !matrixNumber ? null : (
    <div className="flex flex-col items-center p-4 relative">
      <div
        ref={mountRef}
        className="border border-gray-300 rounded-lg shadow-lg mb-4 relative overflow-hidden"
      >
        {/* Explode and Toggle */}
        <div className="p-3 flex flex-col gap-2 absolute top-2 left-3 z-10">
          {!isPlainMode && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenuAction("explode");
              }}
            >
              {isExploded ? "Collapse" : "Explode"}
            </Button>
          )}

          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuAction("plain");
            }}
          >
            {isPlainMode ? "Cube" : "Plain"}
          </Button>
        </div>

        <Button className="rounded-full top-6 right-6 absolute">
          <QuestionMarkCircledIcon />
        </Button>

        <HoverCard>
          <HoverCardTrigger asChild>
            <Button className="rounded-full top-6 right-6 absolute">
              <QuestionMarkCircledIcon />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent align="end">
            <div className="text-sm text-gray-600">
              <p>Double-click cube to isolate layer</p>
              <p>Double-click outside to show all layers</p>
              <p>Click and hold to pause and manually rotate</p>
              <p>Click outside cube to toggle auto-rotation</p>
              <p>Use mouse wheel to zoom in/out</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  );
};

export default Visualizer;
