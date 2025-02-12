// Shifted to UserUpdates.js

import React, { useState, useEffect } from "react";
import {
	getFirestore,
	collection,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import useUserRole from "../hooks/useUserRole";

const db = getFirestore();

const AdminUpdates = () => {
	const [updates, setUpdates] = useState([]);
	const role = useUserRole();

	useEffect(() => {
		const fetchUpdates = async () => {
			try {
				const updatesQuery = query(
					collection(db, "updates"),
					where("category", "==", "admin")
				);
				const updatesSnapshot = await getDocs(updatesQuery);
				const updatesData = updatesSnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				setUpdates(updatesData);
				console.log("Fetched admin updates:", updatesData); // Debugging log
			} catch (error) {
				console.error("❌ Error fetching admin updates:", error);
			}
		};

		fetchUpdates();
	}, []);

	if (role !== "admin") {
		return <div>Access Denied</div>;
	}

	return (
		<div>
			<h2>Admin Updates</h2>
			<ul>
				{updates.length === 0 ? (
					<li>No admin updates found.</li>
				) : (
					updates.map((update) => (
						<li key={update.id}>
							[{update.category}] {update.details} (Updated by:{" "}
							{update.updatedBy} on{" "}
							{new Date(update.timestamp.toDate()).toLocaleString()})
						</li>
					))
				)}
			</ul>
		</div>
	);
};

export default AdminUpdates;
