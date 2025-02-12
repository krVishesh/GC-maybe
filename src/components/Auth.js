import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import {
	getFirestore,
	doc,
	setDoc,
	getDoc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore";
import "./Auth.css"; // Import the CSS file for styling

const db = getFirestore();

const Auth = ({ setUserName }) => {
	const [name, setName] = useState("");
	const [regNumber, setRegNumber] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
			const result = await signInWithPopup(auth, googleProvider);
			const user = result.user;

			// Check if user already exists in Firestore
			const userRef = doc(db, "users", user.uid);
			const userSnap = await getDoc(userRef);

			if (!userSnap.exists()) {
				await setDoc(userRef, {
					email: user.email,
					role: "user", // Default role set to "user"
				});
				setIsNewUser(true);
			} else {
				const userData = userSnap.data();
				if (!userData.name || !userData.regNumber) {
					setIsNewUser(true);
				} else {
					setUserName(userData.name);
					navigate("/management");
				}
			}

			setIsLoggedIn(true);
		} catch (error) {
			console.error("❌ Login Error:", error);
			setError("Failed to login");
		}
	};

	const handleAssignName = async () => {
		if (!name || !regNumber) {
			setError("Name and RegNo are required");
			return;
		}

		setLoading(true);
		try {
			const userDocRef = doc(db, "users", auth.currentUser.uid);
			const fullName = isNewUser ? `---${name}---` : name;
			await updateDoc(userDocRef, { name: fullName, regNumber });
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
			window.location.reload(); // Ensure the page is reloaded to reflect the sign-out
		} catch (error) {
			console.error("❌ Error deleting user:", error);
			setError("Failed to delete user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			{!isLoggedIn ? (
				<>
					<h2>Guest Management Login</h2>
					<button className="auth-button" onClick={handleLogin}>
						Sign in with Google
					</button>
				</>
			) : (
				<>
					<h2>Assign Your Name</h2>
					<input
						type="text"
						placeholder="Enter your name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						type="text"
						placeholder="Enter your RegNo"
						value={regNumber}
						onChange={(e) => setRegNumber(e.target.value)}
					/>
					<button
						className="auth-button"
						onClick={handleAssignName}
						disabled={loading}
					>
						{loading ? "Assigning..." : "Assign Name"}
					</button>
					<button
						className="auth-button cancel-button"
						onClick={handleCancel}
						disabled={loading}
					>
						{loading ? "Cancelling..." : "Cancel"}
					</button>
					{error && <p className="error-message">{error}</p>}
				</>
			)}
		</div>
	);
};

export default Auth;
