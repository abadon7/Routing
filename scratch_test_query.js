import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { startOfMonth, endOfMonth } from "date-fns";

const serviceAccount = JSON.parse(fs.readFileSync("./secrets/routing-service-account.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const userId = "Q7Xqw0Qs4yfhRluW7tIzIMh6Tvu2"; // from .env
const monthStart = startOfMonth(new Date("2026-06-01"));
const monthEnd = endOfMonth(new Date("2026-06-30"));

console.log("Querying for user:", userId);
console.log("Range:", monthStart.toISOString(), "to", monthEnd.toISOString());

try {
    // 1. Test query with 42-day buffer
    const bufferStart = new Date(monthStart.getTime() - 42 * 24 * 60 * 60 * 1000);
    console.log("Buffer Start:", bufferStart.toISOString());
    const startTimestamp = Timestamp.fromDate(bufferStart);
    const endTimestamp = Timestamp.fromDate(monthEnd);

    const snapshot = await db.collection("activities")
        .where("user_id", "==", userId)
        .where("week_start", ">=", startTimestamp)
        .where("week_start", "<=", endTimestamp)
        .orderBy("week_start")
        .get();

    console.log("Query succeeded! Total documents:", snapshot.size);
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Type: ${data.type}, Week Start: ${data.week_start.toDate().toISOString()}`);
    });

} catch (err) {
    console.error("Query failed with error:", err);
}
