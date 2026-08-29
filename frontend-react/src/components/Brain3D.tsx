'use client'

import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function BrainModel() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[2, 64, 64]} />
        <MeshDistortMaterial
          color="#8c9d79"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#e2c694"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </Float>
  )
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 100

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  const positions = useMemo(() => {
    const generatedPositions = new Float32Array(particleCount * 3)
    const stableUnit = (seed: number) => {
      const value = Math.sin(seed) * 43758.5453
      return value - Math.floor(value)
    }

    for (let i = 0; i < particleCount * 3; i += 3) {
      const seed = i / 3 + 1
      const radius = 3 + stableUnit(seed * 12.9898) * 2
      const theta = stableUnit(seed * 78.233) * Math.PI * 2
      const phi = stableUnit(seed * 39.425) * Math.PI

      generatedPositions[i] = radius * Math.sin(phi) * Math.cos(theta)
      generatedPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      generatedPositions[i + 2] = radius * Math.cos(phi)
    }

    return generatedPositions
  }, [])

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#755852"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

interface Brain3DProps {
  className?: string
  autoRotate?: boolean
}

export default function Brain3D({ className = '', autoRotate = true }: Brain3DProps) {
  return (
    <div className={`canvas-container ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#e2c694" />

        <BrainModel />
        <Particles />

        {autoRotate && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  )
}
