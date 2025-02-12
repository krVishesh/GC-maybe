import React, { useEffect, useState } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	Link,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import GuestManagement from "./components/GuestManagement";
import DormManagement from "./components/DormManagement";
import UserUpdates from "./components/UserUpdates";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "./App.css"; // Import the CSS file for styling

const db = getFirestore();

function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [role, setRole] = useState("");
	const [userName, setUserName] = useState("");

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);
			if (currentUser) {
				const userDoc = await getDoc(doc(db, "users", currentUser.uid));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					setRole(userData.role);
					setUserName(userData.name);
					console.log("User data:", userData); // Debugging log
				} else {
					console.log("User document does not exist");
				}
			} else {
				console.log("No current user");
			}
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			setUser(null);
			setRole("");
			setUserName("");
		} catch (error) {
			console.error("❌ Logout Error:", error);
		}
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<Router>
			<div className="app-container">
				{user && (
					<nav className="navbar">
						<Link to="/management">Dorm Management</Link>
						<Link to="/guest-management">Guest Management</Link>
						{role === "admin" && <Link to="/user-updates">User Updates</Link>}
						<button onClick={handleLogout}>
							<i className="fas fa-sign-out-alt"></i>
						</button>
					</nav>
				)}
				<Routes>
					<Route path="/" element={<Auth setUserName={setUserName} />} />
					<Route
						path="/assign-name"
						element={
							user ? <Auth setUserName={setUserName} /> : <Navigate to="/" />
						}
					/>
					<Route
						path="/management"
						element={
							user ? (
								userName ? (
									<DormManagement />
								) : (
									<Navigate to="/assign-name" />
								)
							) : (
								<Navigate to="/" />
							)
						}
					/>
					<Route
						path="/guest-management"
						element={
							user ? (
								userName ? (
									<GuestManagement />
								) : (
									<Navigate to="/assign-name" />
								)
							) : (
								<Navigate to="/" />
							)
						}
					/>
					<Route
						path="/user-updates"
						element={
							user ? (
								userName && role === "admin" ? (
									<UserUpdates />
								) : (
									<Navigate to="/assign-name" />
								)
							) : (
								<Navigate to="/" />
							)
						}
					/>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
