import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

interface PlanetProps {
	radius: number;
	orbitRadius: number;
	speed: number;
	color: string;
	name: string;
	details: string;
}

interface MoonProps {
	parentRadius: number;
	parentSpeed: number;
	size: number;
	orbitRadius: number;
	speed: number;
	color: string;
}

interface PlanetLabelProps {
	position: [number, number, number];
	name: string;
	details: string;
}

const SaturnRings: React.FC<{ orbitRadius: number }> = ({ orbitRadius }) => {
	const ringsRef = useRef<THREE.Mesh>(null);
	// Saturn halqasining qiyaligi taxminan 26.7 gradus
	const ringTilt = 26.7 * (Math.PI / 180); // gradusni radianga o'tkazish

	useFrame(({ clock }) => {
		if (ringsRef.current) {
			const time = clock.getElapsedTime() * 0.18;
			ringsRef.current.position.x = Math.cos(time) * orbitRadius;
			ringsRef.current.position.z = Math.sin(time) * orbitRadius;
		}
	});

	return (
		<mesh
			ref={ringsRef}
			// X o'qi bo'yicha qiyalik berish va Y o'qi bo'yicha biroz burish
			rotation={[ringTilt, 0, 0]}
			position={[orbitRadius, 0, 0]}
		>
			<torusGeometry args={[12, 3, 2, 100]} />
			<meshStandardMaterial
				color="#B8860B"
				transparent
				opacity={0.7}
				metalness={0.4}
				roughness={0.7}
			/>
		</mesh>
	);
};

const SunGlow: React.FC = () => {
	const glowRef1 =
		useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);
	const glowRef2 =
		useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);
	const glowRef3 =
		useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);

	const [emissiveIntensity, setEmissiveIntensity] = useState(0.5);

	useFrame(({ clock }) => {
		const time = clock.getElapsedTime();
		setEmissiveIntensity(Math.sin(time) * 0.5 + 0.5);

		// Har bir qatlam uchun murakkab tebranishlar
		const scale1 =
			1.2 + Math.sin(time * 0.5) * 0.05 + Math.cos(time * 0.3) * 0.03;
		const scale2 =
			1.3 + Math.sin(time * 0.3) * 0.07 + Math.cos(time * 0.5) * 0.04;
		const scale3 =
			1.4 + Math.sin(time * 0.2) * 0.1 + Math.cos(time * 0.4) * 0.05;

		// Ranglarni vaqt bilan o'zgartirish
		const color1 = new THREE.Color().setHSL(
			(Math.sin(time * 0.1) + 1) * 0.1,
			0.8,
			0.5
		);
		const color2 = new THREE.Color().setHSL(
			(Math.sin(time * 0.15) + 1) * 0.1,
			0.7,
			0.6
		);

		if (glowRef1.current) {
			glowRef1.current.scale.setScalar(scale1);
			glowRef1.current.material.color = color1;
		}
		if (glowRef2.current) {
			glowRef2.current.scale.setScalar(scale2);
			glowRef2.current.material.color = color2;
		}
		if (glowRef3.current) {
			glowRef3.current.scale.setScalar(scale3);
		}
	});

	return (
		<group>
			<mesh ref={glowRef1}>
				<sphereGeometry args={[14, 64, 64]} />
				<meshStandardMaterial
					color="#ff4400"
					transparent
					opacity={0.3}
					side={THREE.BackSide}
					emissive="#ff4400"
					emissiveIntensity={emissiveIntensity}
					metalness={0.5}
					roughness={0.2}
				/>
			</mesh>

			<mesh ref={glowRef2}>
				<sphereGeometry args={[16, 64, 64]} />
				<meshStandardMaterial
					color="#ff6600"
					transparent
					opacity={0.2}
					side={THREE.BackSide}
					emissive="#ff6600"
					emissiveIntensity={emissiveIntensity}
					metalness={0.5}
					roughness={0.2}
				/>
			</mesh>

			<mesh ref={glowRef3}>
				<sphereGeometry args={[20, 64, 64]} />
				<meshStandardMaterial
					color="#ff8800"
					transparent
					opacity={0.1}
					side={THREE.BackSide}
					emissive="#ff8800"
					emissiveIntensity={emissiveIntensity}
					metalness={0.5}
					roughness={0.2}
				/>
			</mesh>
		</group>
	);
};

const Moon: React.FC<MoonProps> = ({
	parentRadius,
	parentSpeed,
	size,
	orbitRadius,
	speed,
	color,
}) => {
	const moonRef = useRef<THREE.Mesh>(null);

	useFrame(({ clock }) => {
		if (moonRef.current) {
			const parentTime = clock.getElapsedTime() * parentSpeed;
			const moonTime = clock.getElapsedTime() * speed;

			const parentX = Math.cos(parentTime) * parentRadius;
			const parentZ = Math.sin(parentTime) * parentRadius;

			moonRef.current.position.x = parentX + Math.cos(moonTime) * orbitRadius;
			moonRef.current.position.z = parentZ + Math.sin(moonTime) * orbitRadius;
			moonRef.current.rotation.y += 0.02;
		}
	});

	return (
		<mesh ref={moonRef}>
			<sphereGeometry args={[size, 32, 32]} />
			<meshStandardMaterial
				color={color}
				metalness={0.4}
				roughness={0.7}
			/>
		</mesh>
	);
};

const AsteroidBelt: React.FC<{ radius: number; count?: number }> = ({
	radius,
	count = 100,
}) => {
	const asteroidsRef = useRef<THREE.Group>(null);
	const asteroids = React.useMemo(() => {
		return new Array(count).fill(null).map(() => ({
			radius: radius + (Math.random() - 0.5) * 20,
			speed: 0.1 + Math.random() * 0.2,
			size: 0.2 + Math.random() * 0.5,
			initialAngle: Math.random() * Math.PI * 2,
		}));
	}, [count, radius]);

	useFrame(() => {
		if (asteroidsRef.current) {
			asteroidsRef.current.rotation.y += 0.0005;
		}
	});

	return (
		<group ref={asteroidsRef}>
			{asteroids.map((asteroid, i) => (
				<mesh
					key={i}
					position={[
						Math.cos(asteroid.initialAngle) * asteroid.radius,
						(Math.random() - 0.5) * 5,
						Math.sin(asteroid.initialAngle) * asteroid.radius,
					]}
				>
					<sphereGeometry args={[asteroid.size, 8, 8]} />
					<meshStandardMaterial
						color="#8B7355"
						metalness={0.4}
						roughness={0.7}
					/>
				</mesh>
			))}
		</group>
	);
};

const OrbitRing: React.FC<{ radius: number }> = ({ radius }) => {
	return (
		<mesh rotation={[Math.PI / 2, 0, 0]}>
			<ringGeometry args={[radius - 0.1, radius + 0.1, 180]} />
			<meshBasicMaterial
				color="#ffffff"
				transparent={true}
				opacity={0.1}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
};

const PlanetLabel: React.FC<PlanetLabelProps> = ({
	position,
	name,
	details,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const labelRef = useRef<THREE.Group>(null);

	useFrame(() => {
		if (labelRef.current) {
			labelRef.current.position.copy(new THREE.Vector3(...position));
		}
	});

	return (
		<group ref={labelRef}>
			<Billboard>
				<Text
					position={[0, 12, 0] as [number, number, number]}
					fontSize={3}
					color="white"
					anchorX="center"
					anchorY="middle"
					onPointerOver={() => setIsVisible(true)}
					onPointerOut={() => setIsVisible(false)}
				>
					{name}
				</Text>
			</Billboard>
			{isVisible && (
				<Billboard>
					<Text
						position={[0, 15, 0] as [number, number, number]}
						fontSize={2}
						color="white"
						anchorX="center"
						anchorY="middle"
					>
						{details}
					</Text>
				</Billboard>
			)}
		</group>
	);
};

const Planet: React.FC<PlanetProps> = ({
	radius,
	orbitRadius,
	speed,
	color,
	name,
	details,
}) => {
	const meshRef =
		useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);
	const [emissiveIntensity, setEmissiveIntensity] = useState(0.5);
	const [position, setPosition] = useState<[number, number, number]>([
		orbitRadius,
		0,
		0,
	]);

	useFrame(({ clock }) => {
		if (meshRef.current) {
			const time = clock.getElapsedTime() * speed;
			const x = Math.cos(time) * orbitRadius;
			const z = Math.sin(time) * orbitRadius;

			const hover = Math.sin(clock.getElapsedTime() * 2) * 0.5;
			meshRef.current.rotation.y += 0.02;

			const scale = 1 + Math.sin(clock.getElapsedTime()) * 0.05;
			meshRef.current.scale.setScalar(scale);

			meshRef.current.position.set(x, hover, z);
			setPosition([x, hover, z]);

			// EmissiveIntensity ni useState orqali boshqarish
			setEmissiveIntensity(Math.sin(clock.getElapsedTime()) * 0.5 + 0.5);
		}
	});

	return (
		<group>
			<OrbitRing radius={orbitRadius} />
			<mesh
				ref={meshRef}
				position={[orbitRadius, 0, 0]}
			>
				<sphereGeometry args={[radius, 32, 32]} />
				<meshStandardMaterial
					color={color}
					metalness={0.4}
					roughness={0.7}
					emissiveIntensity={emissiveIntensity}
				/>
			</mesh>
			<PlanetLabel
				position={position}
				name={name}
				details={details}
			/>
		</group>
	);
};

const Sun: React.FC = () => {
	const sunRef = useRef<THREE.Mesh>(null);

	useFrame(() => {
		if (sunRef.current) {
			sunRef.current.rotation.y += 0.002;
		}
	});

	return (
		<group>
			<mesh ref={sunRef}>
				<sphereGeometry args={[12, 64, 64]} />
				<meshStandardMaterial
					color="#ffdd00"
					metalness={0}
					roughness={0.1}
					emissive="#ff8800"
					emissiveIntensity={2}
				/>
			</mesh>
			<SunGlow />
			<pointLight
				intensity={5}
				distance={1000}
				decay={1}
				color="#ffaa44"
			/>
			<pointLight
				intensity={3}
				distance={500}
				decay={1.5}
				color="#ff8855"
			/>
			<Billboard>
				<Text
					position={[0, 15, 0]}
					fontSize={3}
					color="white"
					anchorX="center"
					anchorY="middle"
				>
					Quyosh
				</Text>
			</Billboard>
		</group>
	);
};

const SolarSystem: React.FC = () => {
	const planets = [
		{
			name: "Merkuriy",
			radius: 1.5,
			orbitRadius: 28,
			speed: 0.8,
			color: "#A0522D",
			details: "Eng kichik va tez sayyora",
		},
		{
			name: "Venera",
			radius: 2.8,
			orbitRadius: 44,
			speed: 0.6,
			color: "#DEB887",
			details: "Eng issiq sayyora",
		},
		{
			name: "Yer",
			radius: 3,
			orbitRadius: 62,
			speed: 0.4,
			color: "#4169E1",
			details: "Hayot mavjud yagona sayyora",
		},
		{
			name: "Mars",
			radius: 2.2,
			orbitRadius: 78,
			speed: 0.3,
			color: "#CD5C5C",
			details: "Qizil sayyora",
		},
		{
			name: "Yupiter",
			radius: 8,
			orbitRadius: 100,
			speed: 0.2,
			color: "#DAA520",
			details: "Eng katta sayyora",
		},
		{
			name: "Saturn",
			radius: 7,
			orbitRadius: 138,
			speed: 0.18,
			color: "#F4A460",
			details: "Halqali sayyora",
		},
		{
			name: "Uran",
			radius: 5,
			orbitRadius: 176,
			speed: 0.14,
			color: "#87CEEB",
			details: "Muzli gigant",
		},
		{
			name: "Neptun",
			radius: 4.8,
			orbitRadius: 200,
			speed: 0.12,
			color: "#1E90FF",
			details: "Eng uzoq sayyora",
		},
	];

	return (
		<main
			style={{
				width: "100vw",
				height: "100vh",
				position: "fixed",
				top: 0,
				left: 0,
				background: "#000000",
				margin: 0,
				padding: 0,
				overflow: "hidden",
			}}
		>
			<div className="absolute top-4 left-4 z-10 bg-gray-800/50 backdrop-blur p-4 rounded-lg">
				<p className="text-sm text-white">
					Sayyoralar nomini ko'rish uchun sichqonchani ustiga olib boring
				</p>
			</div>

			<Canvas
				style={{
					width: "100%",
					height: "100%",
					background: "#000000",
				}}
				camera={{
					position: [250, 150, 250],
					fov: 45,
					near: 0.1,
					far: 1000,
				}}
				gl={{
					antialias: true,
					alpha: false,
					stencil: false,
					depth: true,
				}}
			>
				<color
					attach="background"
					args={["#000000"]}
				/>
				<fog
					attach="fog"
					args={["#000000", 100, 500]}
				/>

				<ambientLight intensity={0.1} />
				<Sun />

				{planets.map((planet, index) => (
					<Planet
						key={index}
						{...planet}
					/>
				))}

				<SaturnRings orbitRadius={138} />

				<Moon
					parentRadius={62}
					parentSpeed={0.4}
					size={1}
					orbitRadius={8}
					speed={2}
					color="#FFFFFF"
				/>

				<AsteroidBelt
					radius={90}
					count={200}
				/>

				<Stars
					radius={300}
					depth={50}
					count={5000}
					factor={4}
					fade
					saturation={0}
				/>

				<EffectComposer multisampling={8}>
					<Bloom
						intensity={3}
						luminanceThreshold={0.2}
						luminanceSmoothing={0.9}
						mipmapBlur
						radius={0.8}
					/>
				</EffectComposer>

				<OrbitControls
					enablePan
					enableZoom
					minDistance={50}
					maxDistance={500}
					rotateSpeed={0.5}
					zoomSpeed={1.2}
				/>
			</Canvas>
		</main>
	);
};

export default SolarSystem;
