import React, { useRef, useState } from "react";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import Clock from "./Clock";

interface PlanetProps {
	radius: number;
	orbitRadius: number;
	speed: number;
	color: string;
	name: string;
	details: string;
	planets: PlanetInfo[]; // qo'shildi
	onPlanetClick: (planetInfo: PlanetInfo) => void;
	style: {};
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

interface PlanetInfo {
	name: string;
	radius: number;
	orbitRadius: number;
	speed: number;
	color: string;
	details: string;
	description: string;
	facts: string[];
	composition: string[];
	satellites: number;
	dayLength: string;
	yearLength: string;
}

interface PlanetDetailsProps {
	planet: PlanetInfo | null;
	onClose: () => void;
}

interface CameraFollowPlanetProps {
	selectedPlanet: PlanetInfo | null;
	controlsRef: any;
}

interface BackgroundPlaneProps {
	handleClick: (event: ThreeEvent<MouseEvent>) => void;
}

const PlanetDetailsPanel: React.FC<PlanetDetailsProps> = ({
	planet,
	onClose,
}) => {
	if (!planet) return null;

	console.log("Rendering panel for planet:", planet.name); // panelni render qilishni tekshirish

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, x: 100 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: 100 }}
				transition={{ type: "spring", damping: 20, stiffness: 100 }}
				className="fixed top-4 right-4 w-80 bg-gray-900/90 backdrop-blur-lg rounded-lg p-4 text-white z-50"
				style={{ padding: "12px" }}
			>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold">{planet.name}</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white"
					>
						✕
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<h3 className="text-sm text-gray-400 mb-1">Ta'rifi</h3>
						<p className="text-sm">{planet.description}</p>
					</div>

					<div>
						<h3 className="text-sm text-gray-400 mb-1">Faktlar</h3>
						<ul className="text-sm space-y-1">
							{planet.facts.map((fact, i) => (
								<li key={i}>• {fact}</li>
							))}
						</ul>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div>
							<h3 className="text-sm text-gray-400">Yo'ldoshlar</h3>
							<p className="text-sm font-medium">{planet.satellites}</p>
						</div>
						<div>
							<h3 className="text-sm text-gray-400">Sutka</h3>
							<p className="text-sm font-medium">{planet.dayLength}</p>
						</div>
						<div>
							<h3 className="text-sm text-gray-400">Yil</h3>
							<p className="text-sm font-medium">{planet.yearLength}</p>
						</div>
					</div>

					<div>
						<h3 className="text-sm text-gray-400 mb-1">Tarkibi</h3>
						<div className="flex flex-wrap gap-2">
							{planet.composition.map((element, i) => (
								<span
									key={i}
									className="text-sm px-2 py-1 bg-gray-800 rounded"
								>
									{element}
								</span>
							))}
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

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
	planets, // props dan olish
	onPlanetClick, // yangi prop qo'shish
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
				onClick={(e: ThreeEvent<MouseEvent>) => {
					console.log("Planet clicked:", name); // Click bo'layotganini tekshirish
					e.stopPropagation();
					console.log("Available planets:", planets); // planets array borligini tekshirish
					const currentPlanet = planets.find((p: PlanetInfo) => {
						console.log("Checking planet:", p.name, "against:", name); // qidiruv to'g'ri ishlatayotganini tekshirish
						return p.name === name;
					});
					console.log("Found planet:", currentPlanet); // topilgan planetni tekshirish
					if (currentPlanet) {
						onPlanetClick(currentPlanet);
					}
				}}
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

const CameraFollowPlanet: React.FC<CameraFollowPlanetProps> = ({
	selectedPlanet,
	controlsRef,
}) => {
	useFrame(({ clock }) => {
		if (selectedPlanet && controlsRef.current) {
			const time = clock.getElapsedTime() * selectedPlanet.speed;
			const distance = selectedPlanet.radius * 20;

			const pos = new THREE.Vector3(
				Math.cos(time) * selectedPlanet.orbitRadius,
				distance * 0.5,
				Math.sin(time) * selectedPlanet.orbitRadius
			);

			controlsRef.current.target.set(pos.x, 0, pos.z);
			controlsRef.current.object.position.set(
				pos.x + distance,
				distance * 0.5,
				pos.z + distance
			);
			controlsRef.current.update();
		}
	});

	return null;
};

const BackgroundPlane: React.FC<BackgroundPlaneProps> = ({ handleClick }) => {
	return (
		<mesh
			position={[0, 0, -100]}
			onClick={(e: ThreeEvent<MouseEvent>) => {
				e.stopPropagation();
				handleClick(e);
			}}
		>
			<planeGeometry args={[1000, 1000]} />
			<meshBasicMaterial visible={false} />
		</mesh>
	);
};

const SolarSystem: React.FC = () => {
	const controlsRef = useRef<any>(null);
	const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
	const defaultCameraPosition = [250, 100, 0]; // default kamera pozitsiyasi

	console.log("Current selected planet:", selectedPlanet); // state o'zgarishini kuzatish

	const handlePlanetClick = (planetInfo: PlanetInfo) => {
		console.log("Moving camera to:", planetInfo.name);
		console.log("Setting new planet:", planetInfo);

		// Avval state'ni yangilaymiz
		setSelectedPlanet(planetInfo);

		if (controlsRef.current) {
			const distance = planetInfo.radius * 20;
			const pos = new THREE.Vector3(
				Math.cos(planetInfo.speed) * planetInfo.orbitRadius,
				distance * 0.5,
				Math.sin(planetInfo.speed) * planetInfo.orbitRadius
			);

			// Kamera target animatsiyasi
			gsap.to(controlsRef.current.target, {
				duration: 2,
				x: pos.x,
				y: 0,
				z: pos.z,
				ease: "power2.inOut",
				onUpdate: () => controlsRef.current.update(),
			});

			// Kamera position animatsiyasi
			gsap.to(controlsRef.current.object.position, {
				duration: 2,
				x: pos.x + distance,
				y: distance * 0.5,
				z: pos.z + distance,
				ease: "power2.inOut",
			});
		}
	};

	const handleCanvasClick = (event: ThreeEvent<MouseEvent>) => {
		event.stopPropagation();
		if (selectedPlanet) {
			setSelectedPlanet(null);
			// Kamerani default holatga qaytarish
			gsap.to(controlsRef.current.target, {
				duration: 2,
				x: 0,
				y: 0,
				z: 0,
				ease: "power2.inOut",
				onUpdate: () => controlsRef.current.update(),
			});

			gsap.to(controlsRef.current.object.position, {
				duration: 2,
				x: defaultCameraPosition[0],
				y: defaultCameraPosition[1],
				z: defaultCameraPosition[2],
				ease: "power2.inOut",
			});
		}
	};

	const planetsData: PlanetInfo[] = [
		{
			name: "Merkuriy",
			radius: 1.5,
			orbitRadius: 28,
			speed: 0.8,
			color: "#A0522D",
			details: "Eng kichik va tez sayyora",
			description:
				"Quyosh sistemasidagi eng kichik va Quyoshga eng yaqin sayyora",
			facts: [
				"Quyosh sistemasidagi eng kichik sayyora",
				"Atmosferasi deyarli yo'q",
				"Kunduzi harorat 430°C gacha ko'tariladi",
				"Kechasi -180°C gacha tushadi",
			],
			composition: ["Temir", "Nikel", "Kremniy"],
			satellites: 0,
			dayLength: "59 Yer kuni",
			yearLength: "88 Yer kuni",
		},
		{
			name: "Venera",
			radius: 2.8,
			orbitRadius: 44,
			speed: 0.6,
			color: "#DEB887",
			details: "Yerning egizagi, ammo juda issiq",
			description:
				"Quyosh sistemasidagi ikkinchi sayyora, qalin atmosferaga ega",
			facts: [
				"Quyosh sistemasidagi eng issiq sayyora",
				"Atmosferasi asosan karbonat angidrid gazidan iborat",
				"Yomg'irlari oltingugurt kislotasidan iborat",
				"O'z o'qi atrofida teskari yo'nalishda aylanadi",
			],
			composition: ["Karbonat angidrid", "Azot", "Olovli tog' jinslari"],
			satellites: 0,
			dayLength: "243 Yer kuni",
			yearLength: "225 Yer kuni",
		},
		{
			name: "Yer",
			radius: 3,
			orbitRadius: 62,
			speed: 0.4,
			color: "#4169E1",
			details: "Hayot mavjud yagona sayyora",
			description: "Quyosh sistemasidagi yagona hayot bilan to'lgan sayyora",
			facts: [
				"Suvning suyuq holda mavjud bo'lishi bilan ajralib turadi",
				"O'z atmosferasi kislorod va azotdan iborat",
				"Magnit maydoni Yerni Quyosh nurlaridan himoya qiladi",
			],
			composition: ["Temir", "Kislorod", "Kremniy", "Aluminiy"],
			satellites: 1,
			dayLength: "24 soat",
			yearLength: "365.25 Yer kuni",
		},
		{
			name: "Mars",
			radius: 2.2,
			orbitRadius: 78,
			speed: 0.3,
			color: "#CD5C5C",
			details: "Qizil sayyora",
			description:
				"Yuzasi temir oksidi bilan qoplangan bo'lib, qizg'ish rangda ko'rinadi",
			facts: [
				"Ikki tabiiy yo'ldoshi bor: Fobos va Deymos",
				"Yerga o'xshash fasllar mavjud",
				"Suv izlari topilgan",
				"Kelajakda insonlar ko'chib o'tishi mumkin",
			],
			composition: ["Temir oksid", "Kremniy", "Karbonat angidrid"],
			satellites: 2,
			dayLength: "24.6 soat",
			yearLength: "687 Yer kuni",
		},
		{
			name: "Yupiter",
			radius: 8,
			orbitRadius: 100,
			speed: 0.2,
			color: "#DAA520",
			details: "Eng katta sayyora",
			description: "Quyosh sistemasidagi eng katta gaz giganti",
			facts: [
				"Eng katta sayyora va 79 ta tabiiy yo'ldoshi bor",
				"Buyuk Qizil Dog' degan ulkan bo'roni mavjud",
				"Asosan vodorod va geliy gazidan tashkil topgan",
			],
			composition: ["Vodorod", "Geliy", "Amoniy", "Metan"],
			satellites: 79,
			dayLength: "9.9 soat",
			yearLength: "11.86 Yer yili",
		},
		{
			name: "Saturn",
			radius: 7,
			orbitRadius: 138,
			speed: 0.18,
			color: "#F4A460",
			details: "Halqali gaz giganti",
			description: "Eng go'zal halqalarga ega bo'lgan gaz giganti",
			facts: [
				"Eng keng halqali sayyora",
				"Asosan vodorod va geliy gazidan iborat",
				"Titan – Quyosh sistemasidagi eng katta yo'ldoshlardan biri",
			],
			composition: ["Vodorod", "Geliy", "Amoniy", "Metan"],
			satellites: 83,
			dayLength: "10.7 soat",
			yearLength: "29.5 Yer yili",
		},
		{
			name: "Uran",
			radius: 5,
			orbitRadius: 176,
			speed: 0.14,
			color: "#87CEEB",
			details: "Muzli gigant",
			description:
				"O'z o'qi bo'ylab deyarli yonboshlagan holatda harakatlanadi",
			facts: [
				"Eng sovuq sayyora, harorati -224°C gacha tushadi",
				"O'z o'qi bo'ylab yonboshlagan holatda aylanadi",
				"Asosan metan gazidan iborat bo'lib, shuning uchun ko'k rangda ko'rinadi",
			],
			composition: ["Vodorod", "Geliy", "Metan"],
			satellites: 27,
			dayLength: "17.2 soat",
			yearLength: "84 Yer yili",
		},
		{
			name: "Neptun",
			radius: 4.8,
			orbitRadius: 200,
			speed: 0.12,
			color: "#1E90FF",
			details: "Eng uzoq sayyora",
			description: "Quyosh sistemasidagi eng uzoq gaz giganti",
			facts: [
				"Eng kuchli shamollar bu sayyorada qayd etilgan",
				"Triton degan yirik tabiiy yo'ldoshi bor",
				"Metan gazidan iborat bo'lib, ko'k rangga ega",
			],
			composition: ["Vodorod", "Geliy", "Metan"],
			satellites: 14,
			dayLength: "16.1 soat",
			yearLength: "165 Yer yili",
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
			<div className="absolute top-4 left-4 z-10  p-4 rounded-lg text-white opacity-60">
				<p>
					Quyosh Quyosh sistemasining markazida joylashgan ulkan yulduz bo‘lib,
					asosan vodorod (74%) va geliy (24%) gazlaridan tashkil topgan.
				</p>
				<ul>
					<li>
						Quyosh massasi Quyosh sistemasidagi barcha jismlarning{" "}
						<strong>99,8%</strong> qismini tashkil etadi.
					</li>
					<li>
						Yadrosidagi harorat: <strong>15 million °C</strong>
					</li>
					<li>
						<Clock />
					</li>
				</ul>
			</div>

			<div className="absolute bottom-4 right-4 z-10  p-4 rounded-lg text-white opacity-60">
				<p className="text-2xl ">
					Sayyoralar haqida ma'lumotlarni ko'rish uchun sichqonchani chap
					tugmasini sayyora ustiga bosing
				</p>
			</div>

			<div className="absolute bottom-4 left-4 z-10  p-4 rounded-lg text-white opacity-60">
				<h2 className="text-[24px]">Qiziqarli faktlar</h2>
				<ul>
					<li>
						<strong>Eng katta sayyora:</strong> Yupiter
					</li>
					<li>
						<strong>Eng kichik sayyora:</strong> Merkuriy
					</li>
					<li>
						<strong>Eng issiq sayyora:</strong> Venera
					</li>
					<li>
						<strong>Eng sovuq sayyora:</strong> Uran
					</li>
					<li>
						<strong>Eng ko‘p yo‘ldoshi bor sayyora:</strong> Saturn
					</li>
				</ul>
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
				onClick={(e: React.MouseEvent<HTMLDivElement>) => {
					e.stopPropagation();
					const nativeEvent = e.nativeEvent as MouseEvent; // React-ning oddiy MouseEvent tipi
					console.log(
						"Planet clicked:",
						name,
						nativeEvent.clientX,
						nativeEvent.clientY
					);
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

				{planetsData.map((planet, index) => (
					<Planet
						key={index}
						{...planet}
						style={{ cursor: "pointer" }}
						planets={planetsData} // planetsData ni planets nomi bilan uzatamiz
						onPlanetClick={handlePlanetClick}
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
				<CameraFollowPlanet
					selectedPlanet={selectedPlanet}
					controlsRef={controlsRef}
				/>
				<OrbitControls
					ref={controlsRef}
					enablePan
					enableZoom
					minDistance={50}
					maxDistance={500}
					rotateSpeed={0.5}
					zoomSpeed={1.2}
				/>
				<BackgroundPlane handleClick={handleCanvasClick} />
			</Canvas>
			{selectedPlanet && (
				<PlanetDetailsPanel
					planet={selectedPlanet}
					onClose={() => setSelectedPlanet(null)}
				/>
			)}
		</main>
	);
};

export default SolarSystem;
