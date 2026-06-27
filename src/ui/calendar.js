import { addDays, format, parseISO, addMonths, subMonths } from "date-fns";
import { getServiceWeeks, getStableServiceWeekDate, getWeekKeyUtc } from "../shared/calendar.js";
import { getActivitiesForMonth, updateActivity, deleteActivity, getLastTwoVisitsBefore } from "../db.js";

export const renderCalendarView = async (container, options) => {
    const currentMonth = options.getCurrentMonth();
    const calendarViewRange = options.getCalendarViewRange();
    const currentDesign = options.currentDesign;
    const currentUser = options.getCurrentUser();
    const weeks = getServiceWeeks(currentMonth, calendarViewRange);

    const isTactician = currentDesign === 'tactician';

    container.innerHTML = `
    <div class="space-y-6 animate-fade-in-down ${isTactician ? 'tactician-design' : ''}">
            <!--Header Section-->
            <div class="flex justify-between items-end sm:flex-row flex-col gap-4 mb-8">
                <div>
                    <h2 class="${isTactician ? 'editorial-header mb-2' : 'text-xl font-bold text-slate-800 dark:text-white tracking-tight'}">${format(currentMonth, 'MMMM yyyy')} ${calendarViewRange > 1 ? ` - ${format(addMonths(currentMonth, calendarViewRange - 1), 'MMMM yyyy')}` : ''}</h2>
                    ${isTactician ? '<p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Strategically manage and route upcoming circuit assignments.</p>' : ''}
                </div>
                <div class="flex items-center gap-3">
                    <select id="calendar-range-select" class="text-xs font-bold ${isTactician ? 'bg-[var(--tactician-surface-low)] border-none px-4 py-2 hover:bg-[var(--tactician-surface-high)]' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5'} rounded-xl focus:outline-none transition-all cursor-pointer shadow-sm">
                        <option value="1" ${calendarViewRange === 1 ? 'selected' : ''}>1 Month View</option>
                        <option value="3" ${calendarViewRange === 3 ? 'selected' : ''}>3 Months View</option>
                        <option value="6" ${calendarViewRange === 6 ? 'selected' : ''}>6 Months View</option>
                    </select>
                    <!-- Month Nav -->
                    <div class="flex ${isTactician ? 'bg-[var(--tactician-surface-low)]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'} rounded-xl overflow-hidden shadow-sm">
                         <button id="prev-month" class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors ${isTactician ? '' : 'border-r border-slate-100 dark:border-slate-700'} flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <button id="next-month" class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!--List Table-->
            <div class="${isTactician ? '' : 'bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden'} ${currentDesign === 'foundation' ? 'foundation-card' : ''}">
                <!-- Table Header -->
                <div class="hidden sm:grid sm:grid-cols-12 gap-0 ${isTactician ? 'mb-4 px-6' : 'bg-slate-50/80 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 backdrop-blur-sm'}">
                    <div class="col-span-3 px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ${isTactician ? 'display-font' : ''}">Service Week</div>
                    <div class="col-span-7 px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ${isTactician ? 'display-font' : ''}">Activity & Details</div>
                    <div class="col-span-2 px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ${isTactician ? 'display-font' : ''} text-right">Action</div>
                </div>
                
                <!-- Table Rows -->
                <div id="weeks-list" class="${isTactician ? '' : 'divide-y divide-slate-100 dark:divide-slate-700'}">
                    ${weeks.map((tuesday, index) => {
        const sunday = addDays(tuesday, 5);
        const weekKey = format(tuesday, 'yyyy-MM-dd');

        // Check if this is the current week (today falls between tuesday and sunday)
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const sunStr = format(sunday, 'yyyy-MM-dd');
        const isCurrentWeek = todayStr >= weekKey && todayStr <= sunStr;

        const rowBg = isCurrentWeek
            ? (isTactician ? "bg-orange-50/40 dark:bg-orange-900/10 border-l-4 border-orange-500 no-line-list-item" : "bg-blue-50/40 dark:bg-blue-900/10 border-l-4 border-blue-500")
            : (isTactician ? "no-line-list-item" : "border-l-4 border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/30");

        const textHighlight = isCurrentWeek
            ? (isTactician ? "text-orange-700 dark:text-orange-400" : "text-blue-600 dark:text-blue-400")
            : "text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400";

        return `
                        <div class="group sm:grid sm:grid-cols-12 gap-0 items-center p-2 sm:p-0 transition-all calendar-week-row dropzone flex-col ${rowBg}" data-week="${weekKey}">
                            <!-- Mobile Header: Date + Actions -->
                            <div class="sm:hidden flex justify-between items-start mb-2 px-2">
                                <span class="block text-sm font-bold ${textHighlight}">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')} ${isCurrentWeek ? `<span class="soft-pill ${isTactician ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ml-1 px-1.5 py-0.5 rounded-sm'}">Active</span>` : ''}</span>
                                <div id="action-mobile-${weekKey}" class="flex gap-1">
                                    <button class="assign-btn inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-orange-500 rounded-lg transition-colors" data-week="${weekKey}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="hidden sm:block col-span-3 sm:px-6 sm:py-4">
                                <div class="flex flex-col">
                                    <span class="block text-xs sm:text-lg font-bold transition-all ${textHighlight} ${isTactician ? 'display-font' : ''}">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')}</span>
                                    ${isCurrentWeek ? `<span class="${isTactician ? 'text-[9px] font-black uppercase text-orange-500 tracking-[0.2em] mt-0.5' : 'text-[10px] font-black uppercase text-blue-500 tracking-widest mt-0.5'}">Current Week</span>` : ''}
                                </div>
                            </div>
                            
                            <div class="col-span-7 px-2 sm:px-6 py-1 sm:py-4 mb-1 sm:mb-0 flex flex-col justify-center" id="activity-${weekKey}">
                                <span class="text-slate-300 dark:text-slate-600 text-sm italic font-medium tracking-tight">Empty week</span>
                            </div>
                            
                            <div class="hidden sm:block col-span-2 sm:px-6 sm:py-4 text-right" id="action-${weekKey}">
                                <button class="assign-btn inline-flex items-center justify-center ${isTactician ? 'tactile-button-primary scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100' : 'px-3 py-1.5 text-[11px] font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-orange-600 dark:hover:bg-orange-500 rounded-md shadow-sm'} transition-all ${currentDesign === 'foundation' ? 'foundation-button' : ''}" data-week="${weekKey}">
                                    ${isTactician ? '' : '<svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>'}
                                    Assign
                                </button>
                            </div>
                        </div>`;
    }).join('')}
                </div>
            </div>
            
            <!--Summary Stats Cards-->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        <div class="${isTactician ? 'tactile-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl'} p-6 flex items-center gap-5 shadow-sm ${currentDesign === 'foundation' ? 'foundation-card stats-card-blue' : ''}">
            <div class="p-3.5 ${isTactician ? 'bg-[var(--tactician-surface-low)] text-orange-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'} rounded-2xl shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1 ${isTactician ? 'display-font' : ''}">Tasks Scheduled</h4>
                <p class="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight" id="stat-scheduled">Loading...</p>
            </div>
        </div>
        <div class="${isTactician ? 'tactile-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl'} p-6 flex items-center gap-5 shadow-sm ${currentDesign === 'foundation' ? 'foundation-card stats-card-orange' : ''}">
            <div class="p-3.5 ${isTactician ? 'bg-[var(--tactician-surface-low)] text-red-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'} rounded-2xl shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1 ${isTactician ? 'display-font' : ''}">Weeks Open</h4>
                <p class="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight" id="stat-unassigned">Loading...</p>
            </div>
        </div>
        <div id="export-card" class="${isTactician ? 'tactile-card hover:bg-orange-50/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md'} p-6 flex items-center gap-5 shadow-sm cursor-pointer transition-all group ${currentDesign === 'foundation' ? 'foundation-card stats-card-green' : ''}">
            <div class="p-3.5 ${isTactician ? 'bg-[var(--tactician-surface-low)] text-blue-600 group-hover:bg-orange-100 group-hover:text-orange-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-orange-600 dark:group-hover:text-orange-400'} rounded-2xl shrink-0 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <div class="min-w-0">
                <h4 class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1 ${isTactician ? 'display-font' : ''}">Export Data</h4>
                <p class="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight group-hover:text-orange-600 transition-colors">CSV Report</p>
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

            // Order by date as per weeks and expand multi-week activities
            const activityMap = {};
            activities.forEach(a => {
                const startDate = a.week_start.toDate();
                const duration = a.duration_weeks || 1;
                for (let i = 0; i < duration; i++) {
                    const weekDate = addDays(startDate, i * 7);
                    const weekKey = format(weekDate, 'yyyy-MM-dd');
                    activityMap[weekKey] = {
                        ...a,
                        span_week_index: i
                    };
                }
            });

            weeks.forEach(tuesday => {
                const weekKey = format(tuesday, 'yyyy-MM-dd');
                const a = activityMap[weekKey];
                const dateStr = format(tuesday, 'yyyy-MM-dd');
                if (a) {
                    const labelSuffix = a.duration_weeks > 1 ? ` (Week ${a.span_week_index + 1}/${a.duration_weeks})` : '';
                    const typeLabel = `${a.type || ''}${labelSuffix}`;
                    const row = [
                        dateStr,
                        `"${typeLabel}"`,
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
                    await updateActivity(activityInfo.id, { week_start: getStableServiceWeekDate(targetDate) });
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

const TACTICIAN_BADGE = 'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] display-font';
const TACTICIAN_BADGE_STYLES = {
    'Congregation Visit': { bg: 'bg-[#bfe9ff] text-[#004e71]' },
    'Assembly': { bg: 'bg-[#ffdbcf] text-[#8e1c00]' },
    'School': { bg: 'bg-[#fff2cc] text-[#856404]' },
    'Group Visit': { bg: 'bg-[#d4edda] text-[#155724]' },
    'Pioneer Week': { bg: 'bg-[#e0e0ff] text-[#3f51b5]' },
    'Miscellaneous': { bg: 'bg-[#e9ecef] text-[#495057]' },
    'Default': { bg: 'bg-[var(--tactician-surface-high)] text-[var(--tactician-on-surface-variant)]' }
};

const loadMonthActivities = async (weeks, options) => {
    const isTactician = options.currentDesign === 'tactician';
    const currentUser = options.getCurrentUser();
    if (!currentUser || weeks.length === 0) return 0;
    const rangeStart = weeks[0];
    const rangeEnd = addDays(weeks[weeks.length - 1], 5);
    let count = 0;

    try {
        const activities = await getActivitiesForMonth(currentUser.uid, rangeStart, rangeEnd);

        // Map activities by week_start key and expand multi-week durations
        const activityMap = {};
        activities.forEach(a => {
            const startDate = a.week_start.toDate();
            const duration = a.duration_weeks || 1;
            for (let i = 0; i < duration; i++) {
                const weekDate = addDays(startDate, i * 7);
                const weekKey = format(weekDate, 'yyyy-MM-dd');
                activityMap[weekKey] = {
                    ...a,
                    span_week_index: i
                };
            }
        });

        weeks.forEach(tuesday => {
            const weekKey = format(tuesday, 'yyyy-MM-dd');
            const activity = activityMap[weekKey];
            const activityEl = document.getElementById(`activity-${weekKey}`);
            const actionEl = document.getElementById(`action-${weekKey}`);

            if (activity && activityEl && actionEl) {
                count++;
                const style = TYPE_STYLES[activity.type] || TYPE_STYLES['Congregation Visit'];
                const badgeStyle = isTactician 
                    ? (TACTICIAN_BADGE_STYLES[activity.type] || TACTICIAN_BADGE_STYLES['Default'])
                    : null;
                const isCompleted = new Date() > tuesday;

                let activityHtml = `
                    <div class="flex items-center gap-3">
                        <span class="${isTactician ? TACTICIAN_BADGE + ' ' + badgeStyle.bg + ' ' + badgeStyle.text : 'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + style.bg + ' ' + style.text + ' ' + style.border}">${activity.type}</span>
                        <span class="text-sm font-bold ${isTactician ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}">
                            ${activity.type === 'Congregation Visit' ? (activity.congregationName || 'Visit') : activity.type}
                            ${activity.duration_weeks > 1 ? `<span class="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1.5">(Week ${activity.span_week_index + 1}/${activity.duration_weeks})</span>` : ''}
                        </span>
                    </div>
                `;

                if (activity.notes) {
                    activityHtml += `<span class="block text-xs ${isTactician ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1 ml-1 pl-3 border-l ${isTactician ? 'border-orange-500/30' : 'border-slate-100 dark:border-slate-700/50'} font-medium">${activity.notes}</span>`;
                }

                const actSerial = JSON.stringify({
                    id: activity.id,
                    type: activity.type,
                    congregation_id: activity.congregation_id || null,
                    congregationName: activity.congregationName || null,
                    notes: activity.notes || '',
                    week_start: getWeekKeyUtc(activity.week_start.toDate()),
                    duration_weeks: activity.duration_weeks || 1
                });

                activityEl.innerHTML = `
                    <div class="draggable-activity cursor-move flex items-center gap-3 w-full p-2 -m-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-all" draggable="true" data-activity='${actSerial.replace(/'/g, "&apos;")}'>
                        <div class="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 px-1 shrink-0">
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

                        let targetLast = last;
                        let targetPrevious = previous;
                        if (last.id === activity.id) {
                            if (!previous) return; // No true previous visit
                            targetLast = previous;
                            targetPrevious = null; // Don't show trend comparison
                        }

                        const today = new Date(weekKey);
                        const daysSinceLast = (today - targetLast.date) / (1000 * 60 * 60 * 24);
                        const moSinceLast = (daysSinceLast / 30.44).toFixed(1);
                        const lastDateStr = format(targetLast.date, 'MMM d, yyyy');

                        let comparisonHtml = '';
                        if (targetPrevious) {
                            const prevIntervalDays = (targetLast.date - targetPrevious.date) / (1000 * 60 * 60 * 24);
                            const prevIntervalMo = (prevIntervalDays / 30.44).toFixed(1);
                            const isOverdue = daysSinceLast > prevIntervalDays;
                            const diffMo = Math.abs((daysSinceLast - prevIntervalDays) / 30.44).toFixed(1);
                            const trendColor = isOverdue ? 'text-red-500' : 'text-green-500';
                            const trendArrow = isOverdue ? '↑' : '↓';
                            const trendLabel = isOverdue ? `${diffMo}mo over` : `${diffMo}mo ago`;
                            comparisonHtml = `<span class="font-semibold ${trendColor}">${trendArrow} ${trendLabel}</span>`;
                        }

                        const note = document.createElement('span');
                        note.className = `block text-[10px] ${isTactician ? 'text-orange-600 font-bold display-font' : 'text-orange-500/90 font-semibold'} mt-1 ml-7`;
                        note.innerHTML = `<span class="opacity-70 uppercase text-[9px] tracking-widest mr-1">Previously:</span> ${lastDateStr} · ${moSinceLast}mo${comparisonHtml ? ' · ' + comparisonHtml : ''}`;
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
