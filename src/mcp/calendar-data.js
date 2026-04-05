import fs from "node:fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { addDays, parseISO, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { buildCalendarWeekRecords, getWeekKey, getWeekRange, normalizeActivityRecord, summarizeCalendarWeeks } from "../shared/calendar.js";

let cachedDb = null;

const getServiceAccount = (adminConfig) => {
    if (adminConfig.mode === 'service_account_file') {
        return JSON.parse(fs.readFileSync(adminConfig.serviceAccountPath, 'utf8'));
    }
    return adminConfig.serviceAccount;
};

const getDb = (adminConfig) => {
    if (cachedDb) return cachedDb;
    const serviceAccount = getServiceAccount(adminConfig);
    const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
    cachedDb = getFirestore(app);
    return cachedDb;
};

export const getActivitiesForRange = async (adminConfig, userId, rangeStart, rangeEnd) => {
    const db = getDb(adminConfig);
    const snapshot = await db.collection('activities')
        .where('user_id', '==', userId)
        .where('week_start', '>=', Timestamp.fromDate(rangeStart))
        .where('week_start', '<=', Timestamp.fromDate(rangeEnd))
        .orderBy('week_start')
        .get();

    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getActivityForWeek = async (adminConfig, userId, weekStart) => {
    const db = getDb(adminConfig);
    const nextDay = addDays(weekStart, 1);
    const snapshot = await db.collection('activities')
        .where('user_id', '==', userId)
        .where('week_start', '>=', Timestamp.fromDate(weekStart))
        .where('week_start', '<', Timestamp.fromDate(nextDay))
        .orderBy('week_start')
        .get();

    if (snapshot.empty) return null;
    const match = snapshot.docs[0];
    return { id: match.id, ...match.data() };
};

export const searchActivitiesForUser = async (adminConfig, userId, queryText, monthDate = null, rangeMonths = 1) => {
    const db = getDb(adminConfig);
    const lowerTerm = queryText.toLowerCase();

    let ref = db.collection('activities').where('user_id', '==', userId);
    if (monthDate) {
        const rangeStart = startOfMonth(monthDate);
        const rangeEnd = endOfMonth(addMonths(monthDate, rangeMonths - 1));
        ref = ref
            .where('week_start', '>=', Timestamp.fromDate(rangeStart))
            .where('week_start', '<=', Timestamp.fromDate(rangeEnd));
    }

    const snapshot = await ref.orderBy('week_start', 'desc').get();
    return snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((activity) => {
            const typeMatch = activity.type?.toLowerCase().includes(lowerTerm);
            const noteMatch = activity.notes?.toLowerCase().includes(lowerTerm);
            const congregationMatch = activity.congregationName?.toLowerCase().includes(lowerTerm);
            return typeMatch || noteMatch || congregationMatch;
        })
        .map(normalizeActivityRecord);
};

export const listCalendarWeeks = async (adminConfig, userId, month, rangeMonths = 1) => {
    const monthDate = parseISO(`${month}-01`);
    const rangeStart = startOfMonth(monthDate);
    const rangeEnd = endOfMonth(addMonths(monthDate, rangeMonths - 1));
    const activities = await getActivitiesForRange(adminConfig, userId, rangeStart, rangeEnd);
    const records = buildCalendarWeekRecords({ monthDate, rangeMonths, activities });
    return {
        month,
        range_months: rangeMonths,
        weeks: records,
        summary: summarizeCalendarWeeks(records)
    };
};

export const getCalendarWeek = async (adminConfig, userId, weekStartValue) => {
    const weekStart = parseISO(weekStartValue);
    const activity = await getActivityForWeek(adminConfig, userId, weekStart);
    const normalizedActivity = activity ? normalizeActivityRecord(activity) : null;
    return {
        ...getWeekRange(weekStart),
        week_label: `${weekStartValue} to ${getWeekKey(addDays(weekStart, 5))}`,
        is_current_week: getWeekKey(new Date()) >= getWeekKey(weekStart) && getWeekKey(new Date()) <= getWeekKey(addDays(weekStart, 5)),
        status: normalizedActivity ? 'scheduled' : 'open',
        activity: normalizedActivity
    };
};

export const summarizeCalendarRange = async (adminConfig, userId, month, rangeMonths = 1) => {
    const data = await listCalendarWeeks(adminConfig, userId, month, rangeMonths);
    return data.summary;
};

