import React, { useState, useEffect } from "react";
import {
	getFirestore,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	doc,
	getDoc,
} from "firebase/firestore";
import { auth } from "../firebase";
import useUserRole from "../hooks/useUserRole";
import "./GuestManagement.css"; // Import the CSS file for styling

const db = getFirestore();

const GuestManagement = () => {
	const [guests, setGuests] = useState([]);
	const [newGuest, setNewGuest] = useState({
		name: "",
		status: "Checked-in",
		companions: [],
	});
	const [companionInputs, setCompanionInputs] = useState({});
	const [editCompanionInputs, setEditCompanionInputs] = useState({});
	const [statusInputs, setStatusInputs] = useState({});
	const role = useUserRole();

	useEffect(() => {
		const fetchGuests = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "guests"));
				const guestsData = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				}));
				setGuests(guestsData);
				console.log("Fetched guests:", guestsData); // Debugging log
			} catch (error) {
				console.error("❌ Error fetching guests:", error);
			}
		};

		fetchGuests();
	}, []);

	const recordUpdate = async (category, action, details) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			await addDoc(collection(db, "updates"), {
				category,
				action,
				details,
				timestamp: new Date(),
				updatedBy: userName,
			});
		} catch (error) {
			console.error("❌ Error recording update:", error);
		}
	};

	const handleAddGuest = async () => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			await addDoc(collection(db, "guests"), {
				...newGuest,
				updatedBy: userName,
				timestamp: new Date(),
			});
			await recordUpdate("guest", "add", `Added guest ${newGuest.name}`);
			window.location.reload();
		} catch (error) {
			console.error("❌ Error adding guest:", error);
		}
	};

	const handleUpdateStatus = async (guestId) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			const guestRef = doc(db, "guests", guestId);
			await updateDoc(guestRef, {
				status: statusInputs[guestId] || "",
				updatedBy: userName,
				timestamp: new Date(),
			});
			const guest = guests.find((g) => g.id === guestId);
			await recordUpdate(
				"guest",
				"update",
				`Updated status of guest ${guest.name} to ${statusInputs[guestId]}`
			);
			window.location.reload();
		} catch (error) {
			console.error("❌ Error updating guest status:", error);
		}
	};

	const handleAddCompanion = async (guestId) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			const guestRef = doc(db, "guests", guestId);
			const guestDoc = await getDoc(guestRef);
			if (guestDoc.exists()) {
				const guestData = guestDoc.data();
				const updatedCompanions = [
					...guestData.companions,
					companionInputs[guestId] || "",
				];
				await updateDoc(guestRef, {
					companions: updatedCompanions,
					updatedBy: userName,
					timestamp: new Date(),
				});
				await recordUpdate(
					"guest",
					"update",
					`Added companion ${companionInputs[guestId]} to guest ${guestData.name}`
				);
				window.location.reload();
			} else {
				console.error("❌ Guest document does not exist!");
			}
		} catch (error) {
			console.error("❌ Error adding companion:", error);
		}
		setCompanionInputs((prev) => ({ ...prev, [guestId]: "" }));
	};

	const handleUpdateCompanion = async (guestId, companionIndex) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			const guestRef = doc(db, "guests", guestId);
			const guestDoc = await getDoc(guestRef);
			if (guestDoc.exists()) {
				const guestData = guestDoc.data();
				const updatedCompanions = [...guestData.companions];
				updatedCompanions[companionIndex] =
					editCompanionInputs[guestId][companionIndex] || "";
				await updateDoc(guestRef, {
					companions: updatedCompanions,
					updatedBy: userName,
					timestamp: new Date(),
				});
				await recordUpdate(
					"guest",
					"update",
					`Updated companion ${companionIndex + 1} of guest ${guestData.name}`
				);
				window.location.reload();
			} else {
				console.error("❌ Guest document does not exist!");
			}
		} catch (error) {
			console.error("❌ Error updating companion:", error);
		}
		setEditCompanionInputs((prev) => ({
			...prev,
			[guestId]: { ...prev[guestId], [companionIndex]: "" },
		}));
	};

	const handleRemoveCompanion = async (guestId, companionIndex) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			const guestRef = doc(db, "guests", guestId);
			const guestDoc = await getDoc(guestRef);
			if (guestDoc.exists()) {
				const guestData = guestDoc.data();
				const removedCompanion = guestData.companions[companionIndex];
				const updatedCompanions = guestData.companions.filter(
					(_, index) => index !== companionIndex
				);
				await updateDoc(guestRef, {
					companions: updatedCompanions,
					updatedBy: userName,
					timestamp: new Date(),
				});
				await recordUpdate(
					"guest",
					"update",
					`Removed companion ${removedCompanion} from guest ${guestData.name}`
				);
				window.location.reload();
			} else {
				console.error("❌ Guest document does not exist!");
			}
		} catch (error) {
			console.error("❌ Error removing companion:", error);
		}
	};

	const handleCompanionInputChange = (guestId, value) => {
		setCompanionInputs((prev) => ({ ...prev, [guestId]: value }));
	};

	const handleEditCompanionInputChange = (guestId, companionIndex, value) => {
		setEditCompanionInputs((prev) => ({
			...prev,
			[guestId]: { ...prev[guestId], [companionIndex]: value },
		}));
	};

	const handleStatusInputChange = (guestId, value) => {
		setStatusInputs((prev) => ({ ...prev, [guestId]: value }));
	};

	return (
		<div>
			<h2>Guest Management</h2>
			{role !== "user" && (
				<>
					<input
						type="text"
						placeholder="Guest Name"
						onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
					/>
					<button onClick={handleAddGuest}>Add Guest</button>
				</>
			)}

			<h3>Guest List</h3>
			<div className="guest-list">
				{guests.map((guest) => (
					<div key={guest.id} className="guest-card">
						<h3>{guest.name}</h3>
						<p>Status: {guest.status}</p>
						<p>Updated by: {guest.updatedBy}</p>
						<p>
							Updated on: {new Date(guest.timestamp.toDate()).toLocaleString()}
						</p>
						<h4>Companions:</h4>
						<ul>
							{guest.companions.map((companion, index) => (
								<li key={index}>
									{companion}
									{role !== "user" && (
										<>
											<input
												type="text"
												placeholder="Edit Companion"
												value={editCompanionInputs[guest.id]?.[index] || ""}
												onChange={(e) =>
													handleEditCompanionInputChange(
														guest.id,
														index,
														e.target.value
													)
												}
											/>
											<button
												onClick={() => handleUpdateCompanion(guest.id, index)}
											>
												Update
											</button>
											<button
												onClick={() => handleRemoveCompanion(guest.id, index)}
											>
												Remove
											</button>
										</>
									)}
								</li>
							))}
						</ul>
						{role !== "user" && (
							<>
								<input
									type="text"
									placeholder="Add Companion"
									value={companionInputs[guest.id] || ""}
									onChange={(e) =>
										handleCompanionInputChange(guest.id, e.target.value)
									}
								/>
								<button onClick={() => handleAddCompanion(guest.id)}>
									Add Companion
								</button>
								<input
									type="text"
									placeholder="Update Status"
									value={statusInputs[guest.id] || ""}
									onChange={(e) =>
										handleStatusInputChange(guest.id, e.target.value)
									}
								/>
								<button onClick={() => handleUpdateStatus(guest.id)}>
									Update Status
								</button>
							</>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default GuestManagement;
