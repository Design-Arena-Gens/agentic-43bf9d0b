"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PointerLockControls,
  Sky,
  Stars,
  Float,
  Text
} from "@react-three/drei";
import { InstancedMesh, Matrix4, Vector3 } from "three";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useGameStore } from "./providers/GameStoreProvider";

import {
  ISLANDS,
  shardPalette,
  heightAt,
  generateTerrainInstances,
  heightOffset,
  composeTerrainMatrix
} from "../lib/world";

const dummyMatrix = new Matrix4();
const upVector = new Vector3(0, 1, 0);
const forward = new Vector3();
const side = new Vector3();

type FloatingShard = {
  position: [number, number, number];
  color: string;
  scale: number;
};

function useKeyboardMovement() {
  const movement = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    dash: false,
    glide: false
  });

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          movement.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          movement.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          movement.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          movement.current.right = true;
          break;
        case "Space":
          movement.current.jump = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          movement.current.dash = true;
          break;
        case "KeyF":
          movement.current.glide = true;
          break;
        default:
          break;
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          movement.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          movement.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          movement.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          movement.current.right = false;
          break;
        case "Space":
          movement.current.jump = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          movement.current.dash = false;
          break;
        case "KeyF":
          movement.current.glide = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  return movement;
}

function PlayerController({
  getHeight
}: {
  getHeight: (x: number, z: number) => number;
}) {
  const movement = useKeyboardMovement();
  const velocity = useRef(new Vector3());
  const { camera, gl } = useThree();
  const setLocked = useGameStore((state) => state.setLocked);
  const setControls = useGameStore((state) => state.setControls);
  const tickVitals = useGameStore((state) => state.tickVitals);
  const applyDamage = useGameStore((state) => state.applyDamage);
  const spendEnergy = useGameStore((state) => state.spendEnergy);
  const spendMana = useGameStore((state) => state.spendMana);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);

  const lastDamage = useRef(0);

  useEffect(() => {
    camera.position.set(0, 12, 24);
  }, [camera]);

  useFrame((state, delta) => {
    tickVitals(delta);
    const move = movement.current;

    const speed = move.dash ? 28 : 14;
    velocity.current.x -= velocity.current.x * 8 * delta;
    velocity.current.z -= velocity.current.z * 8 * delta;

    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    side.crossVectors(forward, upVector).normalize();

    let moveForward = 0;
    let moveSideways = 0;
    if (move.forward) moveForward += 1;
    if (move.backward) moveForward -= 1;
    if (move.left) moveSideways += 1;
    if (move.right) moveSideways -= 1;

    const boost = move.dash ? 1.75 : 1;
    velocity.current.addScaledVector(forward, moveForward * speed * delta * boost);
    velocity.current.addScaledVector(side, moveSideways * speed * delta * boost);

    camera.position.add(velocity.current);

    const terrainHeight =
      getHeight(camera.position.x, camera.position.z) + heightOffset + 3.4;

    if (camera.position.y < terrainHeight) {
      camera.position.y = terrainHeight;
      velocity.current.y = 0;
      if (move.jump) {
        velocity.current.y = move.glide ? 8 : 10;
        spendEnergy(move.glide ? 0.08 : 0.12);
      }
    } else {
      velocity.current.y -= 30 * delta;
      if (move.glide) {
        velocity.current.y = Math.max(velocity.current.y, -6);
        camera.position.y += Math.sin(state.clock.elapsedTime * 6) * 0.01;
        spendEnergy(0.06);
      }
    }

    camera.position.y += velocity.current.y * delta;

    if (camera.position.y < heightOffset - 30) {
      camera.position.set(0, 25, 0);
      velocity.current.set(0, 0, 0);
      applyDamage(0.2);
    }

    if (move.dash) {
      spendEnergy(0.002);
    }

    if (move.jump && move.glide) {
      spendMana(0.0005);
    }

    lastDamage.current += delta;
    if (lastDamage.current > 12) {
      applyDamage(0.05);
      lastDamage.current = 0;
    }

    setPlayerPosition([
      camera.position.x,
      camera.position.y,
      camera.position.z
    ]);
  });

  return (
    <PointerLockControls
      ref={(controls) => setControls(controls ?? null)}
      onLock={() => setLocked(true)}
      onUnlock={() => {
        setLocked(false);
      }}
      domElement={gl.domElement}
    />
  );
}

function Terrain() {
  const instances = useMemo(() => generateTerrainInstances(), []);
  const meshRef = useRef<InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    instances.forEach((instance, index) => {
      const matrix = composeTerrainMatrix(instance.position, instance.scale, dummyMatrix);
      meshRef.current!.setMatrixAt(index, matrix);
      meshRef.current!.setColorAt(index, instance.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, instances.length]}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.9} metalness={0.05} vertexColors />
    </instancedMesh>
  );
}

function ResonanceCrystals() {
  const shards = useMemo<FloatingShard[]>(() => {
    const cluster: FloatingShard[] = [];
    const crystalIsland = ISLANDS[0];
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const distance = 6 + Math.sin(i * 1.2) * 2.5;
      const height = 12 + Math.cos(i * 1.1) * 4;
      cluster.push({
        position: [
          crystalIsland.center.x + Math.cos(angle) * distance,
          heightOffset + height,
          crystalIsland.center.z + Math.sin(angle) * distance
        ],
        color: shardPalette[i % shardPalette.length],
        scale: 0.6 + Math.random() * 0.8
      });
    }
    return cluster;
  }, []);

  return (
    <group>
      {shards.map((shard, index) => (
        <Float
          key={`shard-${index}`}
          speed={2 + Math.sin(index)}
          rotationIntensity={0.6}
          floatIntensity={1.4}
        >
          <mesh position={shard.position}>
            <icosahedronGeometry args={[shard.scale, 1]} />
            <meshStandardMaterial
              color={shard.color}
              emissive={shard.color}
              emissiveIntensity={1.2}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function FloatingRings() {
  return (
    <group position={[0, heightOffset + 16, 0]}>
      {[0, 1, 2].map((i) => (
        <Float
          key={i}
          speed={1.5 + i * 0.4}
          rotationIntensity={0.25}
          floatIntensity={0.7}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[12 + i * 2.5, 0.45, 32, 160]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#5fd6ff" : "#c79bff"}
              emissive={i % 2 === 0 ? "#1e90ff" : "#9c4dff"}
              emissiveIntensity={0.6 + i * 0.2}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Waterfall() {
  return (
    <group>
      {[...Array(5)].map((_, idx) => (
        <mesh
          key={idx}
          position={[-12, heightOffset + 10 - idx * 4, 18 + idx * 3]}
          rotation={[-Math.PI / 2.7, 0.3, 0]}
        >
          <planeGeometry args={[6, 12, 8, 32]} />
          <meshStandardMaterial
            color="#4fbaff"
            transparent
            opacity={0.45}
            emissive="#8fd6ff"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function Waystone() {
  return (
    <group position={[10, heightOffset + 8, -6]}>
      <Float speed={2} floatIntensity={0.5}>
        <mesh>
          <cylinderGeometry args={[1.6, 1.6, 6, 32]} />
          <meshStandardMaterial
            color="#32536f"
            emissive="#72b9ff"
            emissiveIntensity={0.4}
            roughness={0.6}
          />
        </mesh>
      </Float>
      <Float speed={3} floatIntensity={1.4}>
        <mesh position={[0, 4, 0]}>
          <octahedronGeometry args={[2.1, 0]} />
          <meshStandardMaterial
            color="#88e6ff"
            emissive="#66aaff"
            emissiveIntensity={1.4}
            metalness={0.7}
            roughness={0.15}
          />
        </mesh>
      </Float>
      <Text
        position={[0, 6.5, 0]}
        fontSize={0.9}
        color="#c5e9ff"
        anchorX="center"
        anchorY="middle"
      >
        Skyreach Waystone
      </Text>
    </group>
  );
}

function Aurora() {
  return (
    <group position={[0, 45, -20]}>
      {[...Array(6)].map((_, idx) => (
        <mesh key={idx} position={[idx * 8 - 20, 0, -idx * 6]}>
          <planeGeometry args={[6, 18]} />
          <meshBasicMaterial
            color={idx % 2 === 0 ? "#82f3ff" : "#b48bff"}
            transparent
            opacity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function Atmosphere() {
  return (
    <>
      <Sky
        distance={6500}
        turbidity={12}
        rayleigh={2}
        mieCoefficient={0.01}
        mieDirectionalG={0.9}
        inclination={0.54}
        azimuth={0.2}
      />
      <Stars
        radius={120}
        depth={60}
        count={5000}
        factor={2.5}
        saturation={0.4}
        fade
      />
      <Aurora />
    </>
  );
}

function AmbientFx() {
  return (
    <group>
      <Float speed={0.6} floatIntensity={0.4}>
        <mesh position={[18, heightOffset + 24, -16]} rotation={[0, 0.6, 0]}>
          <planeGeometry args={[32, 18]} />
          <meshStandardMaterial
            color="#f2f4ff"
            transparent
            opacity={0.32}
            emissive="#d6e6ff"
            emissiveIntensity={0.12}
          />
        </mesh>
      </Float>
      <Float speed={0.45} floatIntensity={0.3}>
        <mesh position={[-22, heightOffset + 28, 14]} rotation={[0, -0.4, 0]}>
          <planeGeometry args={[28, 16]} />
          <meshStandardMaterial
            color="#d7e8ff"
            transparent
            opacity={0.28}
            emissive="#c6dcff"
            emissiveIntensity={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[22, 48, -18]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, heightOffset + 14, 0]} intensity={0.8} />
    </>
  );
}

function WaterPlane() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, heightOffset - 4.4, 0]}
    >
      <planeGeometry args={[240, 240, 32, 32]} />
      <meshStandardMaterial
        color="#264d7a"
        transparent
        opacity={0.72}
        roughness={0.35}
        metalness={0.4}
      />
    </mesh>
  );
}

function GameWorld() {
  const getHeight = useMemo(() => (x: number, z: number) => heightAt(x, z), []);
  return (
    <>
      <Suspense fallback={null}>
        <Atmosphere />
        <Lighting />
        <WaterPlane />
        <Terrain />
        <ResonanceCrystals />
        <FloatingRings />
        <Waystone />
        <Waterfall />
        <AmbientFx />
      </Suspense>
      <PlayerController getHeight={getHeight} />
    </>
  );
}

export default function GameCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 12, 24], fov: 70 }}
      gl={{ antialias: true }}
    >
      <GameWorld />
    </Canvas>
  );
}
