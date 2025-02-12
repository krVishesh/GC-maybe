import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";

const db = getFirestore();

const useUserRole = () => {
	const [role, setRole] = useState("");

	useEffect(() => {
		const fetchUserRole = async () => {
			if (auth.currentUser) {
				const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					setRole(userData.role);
				}
			}
		};

		fetchUserRole();
	}, []);

	return role;
};

export default useUserRole;
