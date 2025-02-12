import React, { useState, useEffect } from "react";
import {
	getFirestore,
	collection,
	getDocs,
	query,
	where,
	orderBy,
} from "firebase/firestore";
import useUserRole from "../hooks/useUserRole";
import "./UserUpdates.css"; // Import the CSS file for styling

const db = getFirestore();

const UserUpdates = () => {
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState("");
	const [updates, setUpdates] = useState([]);
	const [updateType, setUpdateType] = useState("user");
	const role = useUserRole();

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "users"));
				const filteredUsers = querySnapshot.docs
					.map((doc) => doc.data())
					.filter((user) => user.role === "admin" || user.role === "staff")
					.map((user) => user.name);
				setUsers(filteredUsers);
			} catch (error) {
				console.error("❌ Error fetching users:", error);
			}
		};

		fetchUsers();
	}, []);

	const fetchUpdates = async () => {
		try {
			let updatesQuery;
			if (updateType === "user") {
				updatesQuery = query(
					collection(db, "updates"),
					where("updatedBy", "==", selectedUser)
				);
			} else if (updateType === "admin") {
				updatesQuery = query(
					collection(db, "updates"),
					orderBy("timestamp", "desc")
				);
			}

			const updatesSnapshot = await getDocs(updatesQuery);
			const updatesData = updatesSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			setUpdates(updatesData);
			console.log("Fetched updates:", updatesData); // Debugging log
		} catch (error) {
			console.error("❌ Error fetching updates:", error);
		}
	};

	if (role !== "admin") {
		return <div>Access Denied</div>;
	}

	return (
		<div>
			<h2>View Updates</h2>
			<select onChange={(e) => setUpdateType(e.target.value)}>
				<option value="user">User Updates</option>
				<option value="admin">Admin Updates</option>
			</select>
			{updateType === "user" && (
				<>
					<select onChange={(e) => setSelectedUser(e.target.value)}>
						<option value="">Select a user</option>
						{users.map((user) => (
							<option key={user} value={user}>
								{user}
							</option>
						))}
					</select>
					<button onClick={fetchUpdates}>View Updates</button>
				</>
			)}
			{updateType === "admin" && (
				<button onClick={fetchUpdates}>View Admin Updates</button>
			)}

			<h3>Update History</h3>
			<div className="update-list">
				{updates.length === 0 ? (
					<p>No updates found.</p>
				) : (
					updates.map((update) => (
						<div key={update.id} className="update-card">
							<p>
								<strong>Category:</strong> {update.category}
							</p>
							<p>
								<strong>Details:</strong> {update.details}
							</p>
							<p>
								<strong>Updated by:</strong> {update.updatedBy}
							</p>
							<p>
								<strong>Timestamp:</strong>{" "}
								{new Date(update.timestamp.toDate()).toLocaleString()}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default UserUpdates;
