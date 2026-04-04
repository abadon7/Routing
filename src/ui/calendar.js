import { addDays, format, parseISO, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from "date-fns";
import { getActivitiesForMonth, updateActivity, getLastTwoVisitsBefore } from "../db.js";

const getServiceWeeks = (monthDate, rangeMonths = 1) => {
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(addMonths(monthDate, rangeMonths - 1));
    const weeks = [];

    // Find the first Tuesday on or before the start of the month
    let cursor = new Date(mStart);
    const dayOfWeek = getDay(cursor); // 0=Sun … 6=Sat
    // We want Tuesday (2). Calculate offset to previous Tuesday.
    const offsetToTuesday = (dayOfWeek < 2) ? -(dayOfWeek + 5) : -(dayOfWeek - 2);
    cursor = addDays(cursor, offsetToTuesday);

    // Walk forward in 7-day increments, collecting weeks whose range overlaps the month
    while (cursor <= mEnd) {
        const weekEnd = addDays(cursor, 5); // Sunday
        // Include if the week overlaps the month at all
        if (weekEnd >= mStart && cursor <= mEnd) {
            weeks.push(new Date(cursor));
        }
        cursor = addDays(cursor, 7);
    }
    return weeks;
};

export const renderCalendarView = async (container, options) => {
    const currentMonth = options.getCurrentMonth();
    const calendarViewRange = options.getCalendarViewRange();
    const currentDesign = options.currentDesign;
    const currentUser = options.getCurrentUser();
    const weeks = getServiceWeeks(currentMonth, calendarViewRange);

    container.innerHTML = `
    <div class="space-y-3 animate-fade-in-down">
            <!--Header Section-->
            <div class="flex justify-between items-center sm:flex-row flex-col gap-3">
                <h2 class="text-xl font-bold text-slate-800 dark:text-white tracking-tight">${format(currentMonth, 'MMMM yyyy')} ${calendarViewRange > 1 ? ` - ${format(addMonths(currentMonth, calendarViewRange - 1), 'MMMM yyyy')}` : ''}</h2>
                <div class="flex items-center gap-3">
                    <select id="calendar-range-select" class="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm">
                        <option value="1" ${calendarViewRange === 1 ? 'selected' : ''}>1 Month</option>
                        <option value="3" ${calendarViewRange === 3 ? 'selected' : ''}>3 Months</option>
                        <option value="6" ${calendarViewRange === 6 ? 'selected' : ''}>6 Months</option>
                    </select>
                    <!-- Month Nav -->
                    <div class="flex bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                         <button id="prev-month" class="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-l-md transition-colors border-r border-slate-100 dark:border-slate-700 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                            Prev
                        </button>
                        <button id="next-month" class="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-r-md transition-colors flex items-center gap-1">
                            Next
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!--List Table-->
            <div class="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${currentDesign === 'foundation' ? 'foundation-card' : ''}">
                <!-- Table Header -->
                <div class="hidden sm:grid sm:grid-cols-12 gap-0 bg-slate-50/80 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
                    <div class="col-span-3 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Week</div>
                    <div class="col-span-7 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity & Details</div>
                    <div class="col-span-2 px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</div>
                </div>
                
                <!-- Table Rows -->
                <div id="weeks-list" class="divide-y divide-slate-100 dark:divide-slate-700">
                    ${weeks.map((tuesday, index) => {
        const sunday = addDays(tuesday, 5);
        const weekKey = format(tuesday, 'yyyy-MM-dd');

        // Check if this is the current week (today falls between tuesday and sunday)
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const sunStr = format(sunday, 'yyyy-MM-dd');
        const isCurrentWeek = todayStr >= weekKey && todayStr <= sunStr;

        const rowBg = isCurrentWeek
            ? "bg-blue-50/40 dark:bg-blue-900/10 border-l-4 border-blue-500"
            : "border-l-4 border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/30";

        const textHighlight = isCurrentWeek
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400";

        return `
                        <div class="group sm:grid sm:grid-cols-12 gap-0 items-center p-2 sm:p-0 transition-colors calendar-week-row dropzone flex-col ${rowBg}" data-week="${weekKey}">
                            <!-- Mobile Header: Date + Actions -->
                            <div class="sm:hidden flex justify-between items-start mb-2 ${isCurrentWeek ? 'pt-2 px-2' : ''}">
                                <span class="block text-sm font-bold ${textHighlight}">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')} ${isCurrentWeek ? '<span class="text-[10px] uppercase font-black tracking-wider ml-1 px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">This Week</span>' : ''}</span>
                                <div id="action-mobile-${weekKey}" class="flex gap-1">
                                    <!-- Simple Assign button if nothing scheduled -->
                                    <button class="assign-btn inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-orange-500 rounded-lg transition-colors" data-week="${weekKey}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="hidden sm:block col-span-3 sm:px-4 sm:py-4">
                                <div class="flex flex-col">
                                    <span class="block text-xs sm:text-lg font-bold transition-colors ${textHighlight}">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')}</span>
                                    ${isCurrentWeek ? '<span class="text-[10px] font-black uppercase text-blue-500 tracking-widest mt-0.5">Current Week</span>' : ''}
                                </div>
                            </div>
                            
                            <div class="col-span-7 px-0 sm:px-4 py-1 sm:py-4 mb-1 sm:mb-0 flex flex-col justify-center" id="activity-${weekKey}">
                                <span class="text-slate-300 dark:text-slate-600 text-sm italic font-medium">Empty week</span>
                            </div>
                            
                            <div class="hidden sm:block col-span-2 sm:px-4 sm:py-4 text-right" id="action-${weekKey}">
                                <button class="assign-btn inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-orange-600 dark:hover:bg-orange-500 rounded-md shadow-sm transition-all ${currentDesign === 'foundation' ? 'foundation-button' : ''}" data-week="${weekKey}">
                                    <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    Assign
                                </button>
                            </div>
                        </div>`;
    }).join('')}
                </div>
            </div>
            
            <!--Summary Stats Cards-->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm ${currentDesign === 'foundation' ? 'foundation-card stats-card-blue' : ''}">
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tasks Scheduled</h4>
                <p class="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight" id="stat-scheduled">Loading...</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm ${currentDesign === 'foundation' ? 'foundation-card stats-card-orange' : ''}">
            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Weeks Open</h4>
                <p class="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight" id="stat-unassigned">Loading...</p>
            </div>
        </div>
        <div id="export-card" class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all group ${currentDesign === 'foundation' ? 'foundation-card stats-card-green' : ''}">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Export Data</h4>
                <p class="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight group-hover:text-orange-600 transition-colors">CSV Report</p>
            </div>
        </div>
    </div>
    </div>
    `;

    // Month stats update
    const updateStats = (count) => {
        const total = weeks.length;
        document.getElementById('stat-scheduled').textContent = `${count}`;
        document.getElementById('stat-unassigned').textContent = `${total - count}`;
    };

    // Month navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        options.setCurrentMonth(subMonths(currentMonth, calendarViewRange));
        renderCalendarView(container, options);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        options.setCurrentMonth(addMonths(currentMonth, calendarViewRange));
        renderCalendarView(container, options);
    });
    document.getElementById('calendar-range-select').addEventListener('change', (e) => {
        options.setCalendarViewRange(parseInt(e.target.value, 10));
        renderCalendarView(container, options);
    });

    // Event delegation
    document.getElementById('weeks-list').addEventListener('click', (e) => {
        const assignBtn = e.target.closest('.assign-btn');
        if (assignBtn) {
            options.openAssignModal(assignBtn.dataset.week, container, null);
            return;
        }
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const actData = JSON.parse(editBtn.dataset.activity);
            options.openAssignModal(editBtn.dataset.week, container, actData);
            return;
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            if (confirm('Remove this activity?')) {
                deleteActivity(deleteBtn.dataset.id).then(() => {
                    renderCalendarView(container, options);
                });
            }
        }
    });

    // Export handler
    document.getElementById('export-card').addEventListener('click', async () => {
        const rangeStart = weeks[0];
        const rangeEnd = addDays(weeks[weeks.length - 1], 5);
        try {
            const activities = await getActivitiesForMonth(currentUser.uid, rangeStart, rangeEnd);
            const csvRows = [
                ['Date', 'Type', 'Congregation', 'Notes'].join(',')
            ];

            // Order by date as per weeks
            const activityMap = {};
            activities.forEach(a => {
                const key = format(a.week_start.toDate(), 'yyyy-MM-dd');
                activityMap[key] = a;
            });

            weeks.forEach(tuesday => {
                const weekKey = format(tuesday, 'yyyy-MM-dd');
                const a = activityMap[weekKey];
                const dateStr = format(tuesday, 'yyyy-MM-dd');
                if (a) {
                    const row = [
                        dateStr,
                        `"${a.type || ''}"`,
                        `"${a.congregationName || ''}"`,
                        `"${(a.notes || '').replace(/"/g, '""')}"`
                    ];
                    csvRows.push(row.join(','));
                } else {
                    csvRows.push([dateStr, 'Unassigned', '', ''].join(','));
                }
            });

            const csvContent = csvRows.join('\n');
            const fileName = `Schedule_${format(currentMonth, 'yyyy-MM')}.csv`;
            options.downloadCSV(fileName, csvContent);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed: " + err.message);
        }
    });

    // Drag and Drop Logic for Weeks
    const weeksList = document.getElementById('weeks-list');
    let draggedActivityData = null;

    weeksList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.draggable-activity');
        if (item) {
            draggedActivityData = item.dataset.activity;
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('opacity-50', 'scale-95');
        }
    });

    weeksList.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('draggable-activity')) {
            e.target.classList.remove('opacity-50', 'scale-95');
        }
    });

    weeksList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        const dropzone = e.target.closest('.calendar-week-row');
        if (dropzone && document.getElementById(`activity-${dropzone.dataset.week}`).textContent.includes('Empty week')) {
            dropzone.classList.add('bg-orange-50/50', 'dark:bg-slate-700');
        }
    });

    weeksList.addEventListener('dragleave', (e) => {
        const dropzone = e.target.closest('.calendar-week-row');
        if (dropzone) {
            dropzone.classList.remove('bg-orange-50/50', 'dark:bg-slate-700');
        }
    });

    weeksList.addEventListener('drop', async (e) => {
        e.preventDefault();
        const dropzone = e.target.closest('.calendar-week-row');
        if (dropzone && draggedActivityData) {
            dropzone.classList.remove('bg-orange-50/50', 'dark:bg-slate-700');
            const targetWeekKey = dropzone.dataset.week;
            const targetEmpty = document.getElementById(`activity-${targetWeekKey}`).textContent.includes('Empty week');

            if (targetEmpty) {
                const activityInfo = JSON.parse(draggedActivityData);
                const targetDate = parseISO(targetWeekKey);
                try {
                    await updateActivity(activityInfo.id, { week_start: targetDate });
                    renderCalendarView(container, options);
                } catch (err) {
                    console.error('Error updating activity date:', err);
                    alert('Failed to move activity.');
                }
            }
        }
        draggedActivityData = null;
    });

    // Load existing activities
    const count = await loadMonthActivities(weeks, options);
    updateStats(count);
};

const TYPE_STYLES = {
    'Congregation Visit': { bg: 'bg-blue-50/50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50 dark:border-blue-500/20' },
    'Assembly': { bg: 'bg-orange-50/50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/50 dark:border-orange-500/20' },
    'School': { bg: 'bg-yellow-50/50 dark:bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200/50 dark:border-yellow-500/20' },
    'Group Visit': { bg: 'bg-green-50/50 dark:bg-green-500/10', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-500/20' },
    'Pioneer Week': { bg: 'bg-indigo-50/50 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200/50 dark:border-indigo-500/20' },
    'Miscellaneous': { bg: 'bg-slate-50/50 dark:bg-slate-500/10', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200/50 dark:border-slate-500/20' },
};

const loadMonthActivities = async (weeks, options) => {
    const currentUser = options.getCurrentUser();
    if (!currentUser || weeks.length === 0) return 0;
    const rangeStart = weeks[0];
    const rangeEnd = addDays(weeks[weeks.length - 1], 5);
    let count = 0;

    try {
        const activities = await getActivitiesForMonth(currentUser.uid, rangeStart, rangeEnd);
        count = activities.length;

        // Map activities by week_start key
        const activityMap = {};
        activities.forEach(a => {
            const key = format(a.week_start.toDate(), 'yyyy-MM-dd');
            activityMap[key] = a;
        });

        weeks.forEach(tuesday => {
            const weekKey = format(tuesday, 'yyyy-MM-dd');
            const activity = activityMap[weekKey];
            const activityEl = document.getElementById(`activity-${weekKey}`);
            const actionEl = document.getElementById(`action-${weekKey}`);

            if (activity && activityEl && actionEl) {
                const style = TYPE_STYLES[activity.type] || TYPE_STYLES['Congregation Visit'];

                let activityHtml = `
                    <div class="flex items-center gap-3">
                        <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}">${activity.type}</span>
                        <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            ${activity.type === 'Congregation Visit' ? (activity.congregationName || 'Visit') : activity.type}
                        </span>
                    </div>
                `;

                if (activity.notes) {
                    activityHtml += `<span class="block text-xs text-slate-500 dark:text-slate-400 mt-1 ml-1 pl-2 border-l-2 border-slate-100 dark:border-slate-700/50 font-medium">${activity.notes}</span>`;
                }

                const actSerial = JSON.stringify({ id: activity.id, type: activity.type, congregation_id: activity.congregation_id || null, congregationName: activity.congregationName || null, notes: activity.notes || '' });

                activityEl.innerHTML = `
                    <div class="draggable-activity cursor-move flex items-center gap-3 w-full p-1 -m-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" draggable="true" data-activity='${actSerial.replace(/'/g, "&apos;")}'>
                        <div class="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-400 px-1 shrink-0">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
                        </div>
                        <div class="flex-1">
                            ${activityHtml}
                        </div>
                    </div>
                `;

                if (activity.type === 'Congregation Visit' && activity.congregation_id) {
                    getLastTwoVisitsBefore(activity.congregation_id, tuesday).then(({ last, previous }) => {
                        if (!last || !activityEl) return;

                        const today = new Date(weekKey);
                        const daysSinceLast = (today - last.date) / (1000 * 60 * 60 * 24);
                        const moSinceLast = (daysSinceLast / 30.44).toFixed(1);
                        const lastDateStr = format(last.date, 'MMM d, yyyy');

                        let comparisonHtml = '';
                        if (previous) {
                            const prevIntervalDays = (last.date - previous.date) / (1000 * 60 * 60 * 24);
                            const prevIntervalMo = (prevIntervalDays / 30.44).toFixed(1);
                            const isOverdue = daysSinceLast > prevIntervalDays;
                            const diffMo = Math.abs((daysSinceLast - prevIntervalDays) / 30.44).toFixed(1);
                            const trendColor = isOverdue ? 'text-red-500' : 'text-green-500';
                            const trendArrow = isOverdue ? '↑' : '↓';
                            const trendLabel = isOverdue ? `${diffMo}mo over` : `${diffMo}mo ago`;
                            comparisonHtml = `<span class="font-semibold ${trendColor}">${trendArrow} ${trendLabel}</span>`;
                        }

                        const note = document.createElement('span');
                        note.className = 'block text-[11px] text-orange-500/90 font-semibold mt-1 ml-7';
                        note.innerHTML = `<span class="opacity-70 uppercase text-[9px] tracking-widest mr-1">Last Visit:</span> ${lastDateStr} · ${moSinceLast}mo${comparisonHtml ? ' · ' + comparisonHtml : ''}`;
                        activityEl.querySelector('.draggable-activity > .flex-1').appendChild(note);
                    }).catch(() => { });
                }

                const actionButtons = `
                    <div class="flex items-center justify-end gap-1.5">
                        <button class="edit-btn p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all" title="Edit" data-week="${weekKey}" data-activity='${actSerial.replace(/'/g, "&apos;")}'>
                           <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button class="delete-btn p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all" title="Remove" data-id="${activity.id}" data-type="calendar">
                           <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>`;
                actionEl.innerHTML = actionButtons;
                // Also update the mobile action area
                const mobileActionEl = document.getElementById(`action-mobile-${weekKey}`);
                if (mobileActionEl) mobileActionEl.innerHTML = actionButtons;
            }
        });
    } catch (err) {
        console.error("Error loading activities:", err);
    }
    return count;
};
