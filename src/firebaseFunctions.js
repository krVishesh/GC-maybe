import {
	getFirestore,
	collection,
	addDoc,
	updateDoc,
	doc,
	getDocs,
} from "firebase/firestore";

const db = getFirestore();

// Add a new guest
export const addGuest = async (guestData) => {
	try {
		await addDoc(collection(db, "guests"), {
			...guestData,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error("❌ Error adding guest:", error);
	}
};

// Update guest status
export const updateGuestStatus = async (guestId, status, updatedBy) => {
	try {
		const guestRef = doc(db, "guests", guestId);
		await updateDoc(guestRef, { status, updatedBy, timestamp: new Date() });
	} catch (error) {
		console.error("❌ Error updating guest:", error);
	}
};

// Update dorm status
export const updateDormStatus = async (dormId, status, updatedBy) => {
	try {
		const dormRef = doc(db, "dorms", dormId);
		await updateDoc(dormRef, { status, updatedBy, timestamp: new Date() });
	} catch (error) {
		console.error("❌ Error updating dorm:", error);
	}
};
