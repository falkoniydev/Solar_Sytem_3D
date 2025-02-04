import React, { useState, useEffect } from "react";

const Clock: React.FC = () => {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const formatTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		const seconds = date.getSeconds().toString().padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	};

	const formatDate = (date: Date) => {
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	};

	return (
		<div style={styles.container}>
			<div style={styles.date}>{formatDate(time)}</div>
			<div style={styles.time}>{formatTime(time)}</div>
		</div>
	);
};

// Inline CSS styles
const styles: { [key: string]: React.CSSProperties } = {
	container: {
		fontFamily: "Arial, sans-serif",
		fontSize: "10px",
		fontWeight: "bold",
		color: "#ffffff",
		width: "150px",
	},
	date: {
		fontSize: "16px",
		marginBottom: "5px",
	},
	time: {
		fontSize: "16px",
		marginBottom: "5px",
	},
};

export default Clock;
