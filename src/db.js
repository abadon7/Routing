import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

// Congregations
export const getCongregations = async () => {
    const q = query(collection(db, "congregations"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCongregation = async (name, circuit = "") => {
    return addDoc(collection(db, "congregations"), {
        name,
        circuit,
        last_visit_date: null
    });
};

export const deleteCongregation = async (id) => {
    return deleteDoc(doc(db, "congregations", id));
};

export const updateCongregation = async (id, data) => {
    return updateDoc(doc(db, "congregations", id), data);
};

// Activities — each activity represents a full Tue-Sun service week
export const getActivitiesForMonth = async (userId, monthStart, monthEnd) => {
    const startTimestamp = Timestamp.fromDate(monthStart);
    const endTimestamp = Timestamp.fromDate(monthEnd);

    const q = query(
        collection(db, "activities"),
        where("user_id", "==", userId),
        where("week_start", ">=", startTimestamp),
        where("week_start", "<=", endTimestamp),
        orderBy("week_start")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addActivity = async (activityData) => {
    // activityData: week_start (Date), type, congregation_id, congregationName, notes, user_id
    return addDoc(collection(db, "activities"), {
        ...activityData,
        week_start: Timestamp.fromDate(activityData.week_start)
    });
};

export const deleteActivity = async (activityId) => {
    return deleteDoc(doc(db, "activities", activityId));
};

export const updateActivity = async (activityId, data) => {
    const updateData = { ...data };
    if (updateData.week_start instanceof Date) {
        updateData.week_start = Timestamp.fromDate(updateData.week_start);
    }
    return updateDoc(doc(db, "activities", activityId), updateData);
};

export const getLastVisit = async (congregationId) => {
    const q = query(
        collection(db, "activities"),
        where("congregation_id", "==", congregationId),
        where("type", "==", "Congregation Visit"),
        orderBy("week_start", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
            date: data.week_start.toDate(),
            ...data
        };
    }
    return null;
};

export const searchActivities = async (userId, term) => {
    // Firestore doesn't support native full-text search easily without 3rd party (Algolia/Typesense)
    // For this size, we'll fetch all future/recent activities and filter client-side, 
    // or just fetch all logic. Let's fetch last 12 months + future.

    // For simplicity and speed in this demo, let's query all activities for the user
    // In a production app with huge data, we'd limit this range.
    const q = query(
        collection(db, "activities"),
        where("user_id", "==", userId),
        orderBy("week_start", "desc")
    );

    const querySnapshot = await getDocs(q);
    const lowerTerm = term.toLowerCase();

    return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => {
            const typeMatch = a.type?.toLowerCase().includes(lowerTerm);
            const noteMatch = a.notes?.toLowerCase().includes(lowerTerm);
            const congMatch = a.congregationName?.toLowerCase().includes(lowerTerm);
            return typeMatch || noteMatch || congMatch;
        });
};
