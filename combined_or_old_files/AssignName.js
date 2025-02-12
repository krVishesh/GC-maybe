// Shifted to Auth.js

import React, { useState } from "react";
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const db = getFirestore();

const AssignName = ({ setUserName }) => {
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleAssignName = async () => {
		if (!name) {
			setError("Name is required");
			return;
		}

		setLoading(true);
		try {
			const userDocRef = doc(db, "users", auth.currentUser.uid);
			const fullName = `---${name}---`;
			await updateDoc(userDocRef, { name: fullName });
			setUserName(fullName);
			navigate("/management");
		} catch (error) {
			console.error("❌ Error assigning name:", error);
			setError("Failed to assign name");
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async () => {
		setLoading(true);
		try {
			const userDocRef = doc(db, "users", auth.currentUser.uid);
			await deleteDoc(userDocRef);
			await auth.signOut();
			navigate("/");
		} catch (error) {
			console.error("❌ Error deleting user:", error);
			setError("Failed to delete user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<h2>Assign Your Name</h2>
			<input
				type="text"
				placeholder="Enter your name"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<button onClick={handleAssignName} disabled={loading}>
				{loading ? "Assigning..." : "Assign Name"}
			</button>
			<button onClick={handleCancel} disabled={loading}>
				{loading ? "Cancelling..." : "Cancel"}
			</button>
			{error && <p style={{ color: "red" }}>{error}</p>}
		</div>
	);
};

export default AssignName;
