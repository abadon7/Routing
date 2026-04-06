import { addDays, addMonths, endOfMonth, format, getDay, startOfMonth } from "date-fns";

export const getServiceWeeks = (monthDate, rangeMonths = 1) => {
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(addMonths(monthDate, rangeMonths - 1));
    const weeks = [];

    let cursor = new Date(mStart);
    const dayOfWeek = getDay(cursor);
    const offsetToTuesday = dayOfWeek < 2 ? -(dayOfWeek + 5) : -(dayOfWeek - 2);
    cursor = addDays(cursor, offsetToTuesday);

    while (cursor <= mEnd) {
        const weekEnd = addDays(cursor, 5);
        if (weekEnd >= mStart && cursor <= mEnd) {
            weeks.push(new Date(cursor));
        }
        cursor = addDays(cursor, 7);
    }

    return weeks;
};

export const getWeekKey = (date) => format(date, 'yyyy-MM-dd');

export const getWeekKeyUtc = (date) => {
    if (!date) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getStableServiceWeekDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
};

export const getWeekRange = (weekStart) => ({
    week_start: getWeekKey(weekStart),
    week_end: getWeekKey(addDays(weekStart, 5))
});

export const normalizeActivityRecord = (activity) => {
    const weekStart = activity?.week_start?.toDate?.() || activity?.week_start || null;
    if (!weekStart) {
        return {
            id: activity?.id || null,
            week_start: null,
            type: activity?.type || '',
            congregationName: activity?.congregationName || '',
            notes: activity?.notes || ''
        };
    }

    return {
        id: activity.id,
        week_start: getWeekKeyUtc(weekStart),
        type: activity.type || '',
        congregationName: activity.congregationName || '',
        notes: activity.notes || ''
    };
};

export const mapActivitiesByWeek = (activities) => {
    const map = {};
    activities.forEach((activity) => {
        const normalized = normalizeActivityRecord(activity);
        if (normalized.week_start) {
            map[normalized.week_start] = normalized;
        }
    });
    return map;
};

export const buildCalendarWeekRecords = ({ monthDate, rangeMonths = 1, activities = [], today = new Date() }) => {
    const weeks = getServiceWeeks(monthDate, rangeMonths);
    const activityMap = mapActivitiesByWeek(activities);
    const todayKey = getWeekKey(today);

    return weeks.map((weekStart) => {
        const weekKey = getWeekKey(weekStart);
        const weekEnd = addDays(weekStart, 5);
        const weekEndKey = getWeekKey(weekEnd);
        const activity = activityMap[weekKey] || null;
        const isCurrentWeek = todayKey >= weekKey && todayKey <= weekEndKey;

        return {
            week_start: weekKey,
            week_end: weekEndKey,
            week_label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd')}`,
            is_current_week: isCurrentWeek,
            status: activity ? 'scheduled' : 'open',
            activity
        };
    });
};

export const summarizeCalendarWeeks = (records) => ({
    total_weeks: records.length,
    scheduled_weeks: records.filter((record) => record.status === 'scheduled').length,
    open_weeks: records.filter((record) => record.status === 'open').length,
    current_week: records.find((record) => record.is_current_week) || null
});
