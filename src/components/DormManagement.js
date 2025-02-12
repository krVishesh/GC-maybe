import React, { useState, useEffect } from "react";
import {
	getFirestore,
	collection,
	getDocs,
	doc,
	updateDoc,
	getDoc,
	addDoc,
} from "firebase/firestore";
import { auth } from "../firebase";
import useUserRole from "../hooks/useUserRole";
import "./DormManagement.css"; // Import the CSS file for styling

const db = getFirestore();

const DormManagement = () => {
	const [dorms, setDorms] = useState([]);
	const [guests, setGuests] = useState([]);
	const [editingDorm, setEditingDorm] = useState(null);
	const [newDormName, setNewDormName] = useState("");
	const [newDormCapacity, setNewDormCapacity] = useState("");
	const [newCurrentGuests, setNewCurrentGuests] = useState("");
	const [editDormName, setEditDormName] = useState("");
	const [editDormCapacity, setEditDormCapacity] = useState("");
	const [editCurrentGuests, setEditCurrentGuests] = useState("");
	const [selectedGuests, setSelectedGuests] = useState({});
	const role = useUserRole();

	useEffect(() => {
		const fetchDorms = async () => {
			const querySnapshot = await getDocs(collection(db, "dorms"));
			const dormsData = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setDorms(dormsData);
			console.log("Fetched dorms:", dormsData); // Debugging log
		};

		const fetchGuests = async () => {
			const querySnapshot = await getDocs(collection(db, "guests"));
			const guestsData = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setGuests(guestsData);
			console.log("Fetched guests:", guestsData); // Debugging log
		};

		fetchDorms();
		fetchGuests();
	}, []);

	const recordUpdate = async (category, action, details, fromData, toData) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			await addDoc(collection(db, "updates"), {
				category,
				action,
				details,
				fromData,
				toData,
				timestamp: new Date(),
				updatedBy: userName,
			});
		} catch (error) {
			console.error("❌ Error recording update:", error);
		}
	};

	const handleEditDorm = (dorm) => {
		setEditingDorm(dorm.id);
		setEditDormName(dorm.roomNumber);
		setEditDormCapacity(dorm.capacity);
		setEditCurrentGuests(dorm.currentGuests);
	};

	const handleSaveDorm = async (dormId) => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			const dormRef = doc(db, "dorms", dormId);
			const dormDoc = await getDoc(dormRef);
			const dormData = dormDoc.data();

			const updateData = {
				capacity: parseInt(editDormCapacity, 10),
				currentGuests: parseInt(editCurrentGuests, 10),
				updatedBy: userName,
				timestamp: new Date(),
			};

			if (role === "admin") {
				updateData.roomNumber = editDormName;
			}

			await updateDoc(dormRef, updateData);
			await recordUpdate(
				"dorm",
				"update",
				`Updated dorm ${editDormName}`,
				dormData,
				updateData
			);
			setEditingDorm(null);
			window.location.reload();
		} catch (error) {
			console.error("❌ Error saving dorm:", error);
		}
	};

	const handleCancelEdit = () => {
		setEditingDorm(null);
		setEditDormName("");
		setEditDormCapacity("");
		setEditCurrentGuests("");
	};

	const handleAddDorm = async () => {
		try {
			const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
			const userName = userDoc.exists() ? userDoc.data().name : "Unknown User";

			await addDoc(collection(db, "dorms"), {
				roomNumber: newDormName,
				capacity: parseInt(newDormCapacity, 10),
				currentGuests: parseInt(newCurrentGuests, 10),
				occupiedGuests: [],
				updatedBy: userName,
				timestamp: new Date(),
			});
			await recordUpdate("dorm", "add", `Added dorm ${newDormName}`);
			setNewDormName("");
			setNewDormCapacity("");
			setNewCurrentGuests("");
			window.location.reload();
		} catch (error) {
			console.error("❌ Error adding dorm:", error);
		}
	};

	const handleAssignGuest = async (dormId) => {
		try {
			const dormRef = doc(db, "dorms", dormId);
			const dormDoc = await getDoc(dormRef);
			if (dormDoc.exists()) {
				const dormData = dormDoc.data();
				const updatedGuests = [
					...dormData.occupiedGuests,
					selectedGuests[dormId],
				];
				await updateDoc(dormRef, {
					occupiedGuests: updatedGuests,
				});
				await recordUpdate(
					"dorm",
					"update",
					`Assigned guest ${selectedGuests[dormId]} to dorm ${dormData.roomNumber}`,
					dormData.occupiedGuests,
					updatedGuests
				);
				setSelectedGuests((prev) => ({ ...prev, [dormId]: "" }));
				window.location.reload();
			}
		} catch (error) {
			console.error("❌ Error assigning guest:", error);
		}
	};

	const handleRemoveGuest = async (dormId, guestName) => {
		try {
			const dormRef = doc(db, "dorms", dormId);
			const dormDoc = await getDoc(dormRef);
			if (dormDoc.exists()) {
				const dormData = dormDoc.data();
				const updatedGuests = dormData.occupiedGuests.filter(
					(name) => name !== guestName
				);
				await updateDoc(dormRef, {
					occupiedGuests: updatedGuests,
				});
				await recordUpdate(
					"dorm",
					"update",
					`Removed guest ${guestName} from dorm ${dormData.roomNumber}`,
					dormData.occupiedGuests,
					updatedGuests
				);
				window.location.reload();
			}
		} catch (error) {
			console.error("❌ Error removing guest:", error);
		}
	};

	const getGuestsForDorm = (dorm) => {
		if (!dorm.occupiedGuests) return [];
		return dorm.occupiedGuests
			.map((guestName) => guests.find((guest) => guest.name === guestName))
			.filter(Boolean); // Filter out any undefined guests
	};

	const getDormStatus = (dorm) => {
		const availableCapacity = dorm.capacity - dorm.currentGuests;
		if (availableCapacity > 0) {
			return "Available";
		} else if (availableCapacity === 0) {
			return "Full";
		} else {
			return "OverBooked";
		}
	};

	const overBookedDorms = dorms.filter(
		(dorm) => getDormStatus(dorm) === "OverBooked"
	);

	return (
		<div>
			<h2>Dorm Management</h2>
			{role === "admin" && (
				<>
					<input
						type="text"
						placeholder="Dorm Name"
						value={newDormName}
						onChange={(e) => setNewDormName(e.target.value)}
					/>
					<input
						type="number"
						placeholder="Capacity"
						value={newDormCapacity}
						onChange={(e) => setNewDormCapacity(e.target.value)}
					/>
					<button onClick={handleAddDorm}>Add Dorm</button>
				</>
			)}
			<h3>Available Dorms</h3>
			<div className="dorm-list">
				{dorms
					.filter((dorm) => getDormStatus(dorm) === "Available")
					.map((dorm) => (
						<div key={dorm.id} className="dorm-card">
							{editingDorm === dorm.id ? (
								<>
									{role === "admin" && (
										<input
											type="text"
											value={editDormName}
											onChange={(e) => setEditDormName(e.target.value)}
										/>
									)}
									<input
										type="number"
										value={editDormCapacity}
										onChange={(e) => setEditDormCapacity(e.target.value)}
									/>
									<input
										type="number"
										value={editCurrentGuests}
										onChange={(e) => setEditCurrentGuests(e.target.value)}
									/>
									{role !== "user" && (
										<>
											<button onClick={() => handleSaveDorm(dorm.id)}>
												Save
											</button>
											<button onClick={handleCancelEdit}>Cancel</button>
										</>
									)}
								</>
							) : (
								<>
									<h3>Dorm {dorm.roomNumber}</h3>
									<p>Status: {getDormStatus(dorm)}</p>
									<p>Capacity: {dorm.capacity}</p>
									<p>Current Guests: {dorm.currentGuests}</p>
									<p>Available: {dorm.capacity - dorm.currentGuests}</p>
									<p>Updated by: {dorm.updatedBy}</p>
									<p>
										Updated on:{" "}
										{new Date(dorm.timestamp.toDate()).toLocaleString()}
									</p>
									{role !== "user" && (
										<button onClick={() => handleEditDorm(dorm)}>Edit</button>
									)}
								</>
							)}
							<h3>Guests:</h3>
							<ul>
								{getGuestsForDorm(dorm).map((guest) => (
									<li key={guest.id}>
										{guest.name} - {guest.status} (Updated by: {guest.updatedBy}{" "}
										on {new Date(guest.timestamp.toDate()).toLocaleString()})
										{role !== "user" && (
											<button
												onClick={() => handleRemoveGuest(dorm.id, guest.name)}
											>
												Remove
											</button>
										)}
									</li>
								))}
							</ul>
							{role !== "user" && (
								<>
									<p>Companions:</p>
									<select
										value={selectedGuests[dorm.id] || ""}
										onChange={(e) =>
											setSelectedGuests((prev) => ({
												...prev,
												[dorm.id]: e.target.value,
											}))
										}
									>
										<option value="">Select Guest</option>
										{guests.map((guest) => (
											<option key={guest.id} value={guest.name}>
												{guest.name}
											</option>
										))}
									</select>
									<button onClick={() => handleAssignGuest(dorm.id)}>
										Assign Guest
									</button>
								</>
							)}
						</div>
					))}
			</div>
			<h3>Full Dorms</h3>
			<div className="dorm-list">
				{dorms
					.filter((dorm) => getDormStatus(dorm) === "Full")
					.map((dorm) => (
						<div key={dorm.id} className="dorm-card">
							{editingDorm === dorm.id ? (
								<>
									{role === "admin" && (
										<input
											type="text"
											value={editDormName}
											onChange={(e) => setEditDormName(e.target.value)}
										/>
									)}
									<input
										type="number"
										value={editDormCapacity}
										onChange={(e) => setEditDormCapacity(e.target.value)}
									/>
									<input
										type="number"
										value={editCurrentGuests}
										onChange={(e) => setEditCurrentGuests(e.target.value)}
									/>
									{role !== "user" && (
										<>
											<button onClick={() => handleSaveDorm(dorm.id)}>
												Save
											</button>
											<button onClick={handleCancelEdit}>Cancel</button>
										</>
									)}
								</>
							) : (
								<>
									<h3>Dorm {dorm.roomNumber}</h3>
									<p>Status: {getDormStatus(dorm)}</p>
									<p>Capacity: {dorm.capacity}</p>
									<p>Current Guests: {dorm.currentGuests}</p>
									<p>Available: {dorm.capacity - dorm.currentGuests}</p>
									<p>Updated by: {dorm.updatedBy}</p>
									<p>
										Updated on:{" "}
										{new Date(dorm.timestamp.toDate()).toLocaleString()}
									</p>
									{role !== "user" && (
										<button onClick={() => handleEditDorm(dorm)}>Edit</button>
									)}
								</>
							)}
							<h3>Guests:</h3>
							<ul>
								{getGuestsForDorm(dorm).map((guest) => (
									<li key={guest.id}>
										{guest.name} - {guest.status} (Updated by: {guest.updatedBy}{" "}
										on {new Date(guest.timestamp.toDate()).toLocaleString()})
										{role !== "user" && (
											<button
												onClick={() => handleRemoveGuest(dorm.id, guest.name)}
											>
												Remove
											</button>
										)}
									</li>
								))}
							</ul>
							{role !== "user" && (
								<>
									<p>Companions:</p>
									<select
										value={selectedGuests[dorm.id] || ""}
										onChange={(e) =>
											setSelectedGuests((prev) => ({
												...prev,
												[dorm.id]: e.target.value,
											}))
										}
									>
										<option value="">Select Guest</option>
										{guests.map((guest) => (
											<option key={guest.id} value={guest.name}>
												{guest.name}
											</option>
										))}
									</select>
									<button onClick={() => handleAssignGuest(dorm.id)}>
										Assign Guest
									</button>
								</>
							)}
						</div>
					))}
			</div>
			{overBookedDorms.length > 0 && (
				<>
					<h3>OverBooked Dorms</h3>
					<div className="dorm-list">
						{overBookedDorms.map((dorm) => (
							<div key={dorm.id} className="dorm-card">
								{editingDorm === dorm.id ? (
									<>
										{role === "admin" && (
											<input
												type="text"
												value={editDormName}
												onChange={(e) => setEditDormName(e.target.value)}
											/>
										)}
										<input
											type="number"
											value={editDormCapacity}
											onChange={(e) => setEditDormCapacity(e.target.value)}
										/>
										<input
											type="number"
											value={editCurrentGuests}
											onChange={(e) => setEditCurrentGuests(e.target.value)}
										/>
										{role !== "user" && (
											<>
												<button onClick={() => handleSaveDorm(dorm.id)}>
													Save
												</button>
												<button onClick={handleCancelEdit}>Cancel</button>
											</>
										)}
									</>
								) : (
									<>
										<h3>Dorm {dorm.roomNumber}</h3>
										<p>Status: {getDormStatus(dorm)}</p>
										<p>Capacity: {dorm.capacity}</p>
										<p>Current Guests: {dorm.currentGuests}</p>
										<p>Available: {dorm.capacity - dorm.currentGuests}</p>
										<p>Updated by: {dorm.updatedBy}</p>
										<p>
											Updated on:{" "}
											{new Date(dorm.timestamp.toDate()).toLocaleString()}
										</p>
										{role !== "user" && (
											<button onClick={() => handleEditDorm(dorm)}>Edit</button>
										)}
									</>
								)}
								<h3>Guests:</h3>
								<ul>
									{getGuestsForDorm(dorm).map((guest) => (
										<li key={guest.id}>
											{guest.name} - {guest.status} (Updated by:{" "}
											{guest.updatedBy} on{" "}
											{new Date(guest.timestamp.toDate()).toLocaleString()})
											{role !== "user" && (
												<button
													onClick={() => handleRemoveGuest(dorm.id, guest.name)}
												>
													Remove
												</button>
											)}
										</li>
									))}
								</ul>
								{role !== "user" && (
									<>
										<p>Companions:</p>
										<select
											value={selectedGuests[dorm.id] || ""}
											onChange={(e) =>
												setSelectedGuests((prev) => ({
													...prev,
													[dorm.id]: e.target.value,
												}))
											}
										>
											<option value="">Select Guest</option>
											{guests.map((guest) => (
												<option key={guest.id} value={guest.name}>
													{guest.name}
												</option>
											))}
										</select>
										<button onClick={() => handleAssignGuest(dorm.id)}>
											Assign Guest
										</button>
									</>
								)}
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default DormManagement;
