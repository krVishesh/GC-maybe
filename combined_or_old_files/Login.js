// Shifted to Auth.js

import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import Auth from "./Auth";

const db = getFirestore();

const Login = () => {
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
			}

			// Redirect to management page
			navigate("/management");
		} catch (error) {
			console.error("❌ Login Error:", error);
		}
	};

	return (
		<div>
			<h2>Guest Management Login</h2>
			<button onClick={handleLogin}>Sign in with Google</button>
		</div>
	);
};

export default Login;
