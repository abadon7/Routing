import { addDays, format } from "date-fns";
import {
    getAssembly,
    getTalks,
    getSpeakers,
    addAssembly,
    updateAssembly,
    addTalk,
    updateTalk,
    deleteTalk,
    clearAssemblyTalks,
} from "../db.js";

export const renderAssemblyDetailsView = async (
    container,
    currentDay = 1,
    options,
) => {
    const activeAssemblyId = options.getActiveAssemblyId();
    if (!activeAssemblyId) {
        options.setView("assemblies");
        return;
    }
    const assembly = await getAssembly(activeAssemblyId);
    if (!assembly) throw new Error("Assembly not found");
    const currentDayChairmen =
        (assembly.chairmenByDay || {})[String(currentDay)] || {};
    const morningChairman = currentDayChairmen.morning || {};
    const afternoonChairman = currentDayChairmen.afternoon || {};
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
        <!-- Loading State -->
        <div id="loading-details" class="text-center py-12">
            <svg class="w-12 h-12 text-blue-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-slate-500 mt-4">Loading assembly details...</p>
        </div>

        <!-- Content (Hidden initially) -->
        <div id="details-content" class="hidden space-y-8">
            <!-- Header -->
            <div class="relative overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-sm">
                <div class="absolute -top-16 right-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10"></div>
                <div class="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-300/5"></div>
                <div class="relative px-6 py-6 md:px-8 md:py-7">
                    <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-start gap-3">
                                <button id="back-to-assemblies" class="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/80 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm shrink-0">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                                </button>
                                <div class="min-w-0 space-y-4">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="inline-flex items-center rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${assembly.eventType === "Regional Convention (3 Days)" ? "Regional Convention" : "Circuit Assembly"}</span>
                                        <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${assembly.status === "Completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : assembly.status === "Draft" ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}">${assembly.status || "Upcoming"}</span>
                                        ${assembly.liveSession && ["running", "paused"].includes(assembly.liveSession.status) && Number(assembly.liveSession.day || 1) === currentDay ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"><span class="h-2 w-2 rounded-full ${assembly.liveSession.status === "running" ? "bg-blue-500 animate-pulse" : "bg-amber-400"}"></span>${assembly.liveSession.status === "running" ? "Live Session" : "Session Paused"}</span>` : ""}
                                    </div>
                                    <div>
                                        <h2 id="asm-detail-theme" class="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Loading...</h2>
                                        <p class="mt-2 max-w-3xl text-sm md:text-base text-slate-500 dark:text-slate-400">Manage the schedule, launch the live assembly session, and keep speaker follow-up in one place.</p>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <div id="asm-detail-date-container" class="flex flex-wrap items-center gap-2.5">
                                            <span id="asm-detail-date" class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 px-3 py-2 shadow-sm">
                                                <span class="material-symbols-outlined text-[16px] text-blue-500 dark:text-blue-400">calendar_today</span>
                                                <span>---</span>
                                            </span>
                                        </div>
                                        <span id="asm-detail-location" class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 px-3 py-2 shadow-sm">
                                            <span class="material-symbols-outlined text-[16px] text-orange-500 dark:text-orange-400">location_on</span>
                                            <span>---</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="xl:max-w-[320px] w-full xl:w-auto shrink-0">
                            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 p-3 shadow-sm backdrop-blur-sm">
                                <p class="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Quick Actions</p>
                                <div class="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2">
                                    <button id="start-assembly-btn" class="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                                        <span class="material-symbols-outlined text-[18px]">play_circle</span>
                                        ${assembly.liveSession && ["running", "paused"].includes(assembly.liveSession.status) && Number(assembly.liveSession.day || 1) === currentDay ? "Resume Assembly" : "Start Assembly"}
                                    </button>
                                    <button id="generate-report-btn" class="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white/90 dark:bg-slate-900/80">
                                        <span class="material-symbols-outlined text-[18px]">description</span>
                                        Generate Report
                                    </button>
                                    <button id="clear-talks-btn" class="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors bg-white/90 dark:bg-slate-900/80">
                                        <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                                        Clear Talks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="space-y-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Trackers</p>
                        <p id="stats-scope-label" class="text-sm text-slate-500 dark:text-slate-400">Showing totals for ${assembly.eventType === "Regional Convention (3 Days)" ? `Day ${currentDay}` : "this assembly"}.</p>
                    </div>
                    ${
                        assembly.eventType === "Regional Convention (3 Days)"
                            ? `
                    <div class="inline-flex items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-1 shadow-sm">
                        <button type="button" class="stats-scope-btn inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold transition-colors bg-blue-600 text-white shadow-sm" data-scope="day">This Day</button>
                        <button type="button" class="stats-scope-btn inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" data-scope="all">All Days</button>
                    </div>
                    `
                            : ""
                    }
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <!-- Total Talks -->
                <div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 px-6 py-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div class="relative flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Total Talks</p>
                            <div class="flex items-baseline gap-2">
                                <h3 id="stat-total-talks" class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">0</h3>
                                <span class="text-sm font-medium text-slate-400 hidden group-hover:inline-block transition-opacity opacity-0 group-hover:opacity-100 animate-slide-in-right">Scheduled</span>
                            </div>
                        </div>
                        <div class="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-blue-500 dark:text-blue-400 transform group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <span class="material-symbols-outlined text-[28px]">record_voice_over</span>
                        </div>
                    </div>
                </div>

                <!-- Confirmed Speakers -->
                <div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 px-6 py-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div class="relative flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Confirmed</p>
                            <div class="flex items-baseline gap-2">
                                <h3 id="stat-confirmed-speakers" class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">0</h3>
                                <span class="text-sm font-medium text-slate-400 hidden group-hover:inline-block transition-opacity opacity-0 group-hover:opacity-100 animate-slide-in-right">Speakers</span>
                            </div>
                        </div>
                        <div class="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-emerald-500 dark:text-emerald-400 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                            <span class="material-symbols-outlined text-[28px]">person_check</span>
                        </div>
                    </div>
                </div>

                <!-- Pending Assignments -->
                <div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 px-6 py-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div class="relative flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Pending</p>
                            <div class="flex items-baseline gap-2">
                                <h3 id="stat-pending-assignments" class="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">0</h3>
                                <span class="text-sm font-medium text-slate-400 hidden group-hover:inline-block transition-opacity opacity-0 group-hover:opacity-100 animate-slide-in-right">Assignments</span>
                            </div>
                        </div>
                        <div class="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 text-amber-500 dark:text-amber-400 transform group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-[28px]">assignment_late</span>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <!-- Program Chairmen -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div class="px-4 py-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    <div>
                        <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white">Program Chairmen</h3>
                        <p id="chairmen-subtitle" class="text-xs md:text-sm text-slate-500 dark:text-slate-400">Assign the morning and afternoon chairmen for ${assembly.eventType === "Regional Convention (3 Days)" ? `Day ${currentDay}` : "this assembly"}.</p>
                    </div>
                    <button id="edit-chairmen-btn" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white/90 dark:bg-slate-900/80">
                        <span class="material-symbols-outlined text-[18px]">edit_square</span>
                        Edit Chairmen
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/60">
                    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/40 p-5 shadow-sm">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[22px]">wb_sunny</span>
                            </div>
                            <div>
                                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Morning</p>
                                <h4 class="text-lg font-bold text-slate-900 dark:text-white">Chairman</h4>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p id="morning-chairman-name" class="text-base font-bold text-slate-900 dark:text-white">${morningChairman.speakerName || morningChairman.manualName || "Not assigned yet"}</p>
                            <p id="morning-chairman-helper" class="text-sm text-slate-500 dark:text-slate-400 ${morningChairman.manualName || morningChairman.speakerName ? "hidden" : ""}">Choose a speaker or enter a manual name.</p>
                        </div>
                    </div>
                    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/40 p-5 shadow-sm">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[22px]">nights_stay</span>
                            </div>
                            <div>
                                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Afternoon</p>
                                <h4 class="text-lg font-bold text-slate-900 dark:text-white">Chairman</h4>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p id="afternoon-chairman-name" class="text-base font-bold text-slate-900 dark:text-white">${afternoonChairman.speakerName || afternoonChairman.manualName || "Not assigned yet"}</p>
                            <p id="afternoon-chairman-helper" class="text-sm text-slate-500 dark:text-slate-400 ${afternoonChairman.manualName || afternoonChairman.speakerName ? "hidden" : ""}">Choose a speaker or enter a manual name.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Schedule Management Table -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div class="px-3 py-3 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div class="flex flex-col">
                        <h3 class="text-base md:text-lg font-bold text-slate-900 dark:text-white">Schedule</h3>
                        <p class="text-[10px] md:text-sm text-slate-500 dark:text-slate-400">Manage talks and speakers</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="bulk-import-talks-btn" class="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-600 shadow-sm">
                            <span class="material-symbols-outlined text-sm">upload_file</span> <span class="hidden sm:inline">Bulk Import</span><span class="sm:hidden">Import</span>
                        </button>
                        <button id="add-talk-btn" class="px-3 py-1.5 md:px-4 md:py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-md">
                            <span class="material-symbols-outlined text-sm">add</span> <span class="hidden sm:inline">Add Talk</span><span class="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>
                <!-- Day Tabs (Only for 3-Day Conventions) -->
                ${
                    assembly.eventType === "Regional Convention (3 Days)"
                        ? `
                <div class="px-3 py-2 md:px-6 bg-slate-50 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                    ${[1, 2, 3]
                        .map(
                            (dayNum) => `
                    <button class="day-tab-btn px-4 py-2 rounded-t-lg font-bold text-sm transition-colors border-b-2 ${currentDay === dayNum ? "text-blue-600 dark:text-blue-400 border-blue-600 font-bold bg-white dark:bg-slate-900" : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"}" data-day="${dayNum}">
                        Day ${dayNum}
                    </button>
                    `,
                        )
                        .join("")}
                </div>
                `
                        : ""
                }
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="day">Day <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="day"></span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="startTime">Time <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="startTime"></span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white transition-colors" data-sort-key="outline">Outline <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="outline">▲</span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="theme">Theme <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="theme"></span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="speakerName">Speaker <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="speakerName"></span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="duration">Dur. <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="duration"></span></button></th>
                                 <th class="px-3 py-3"><button type="button" class="schedule-sort-btn inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" data-sort-key="status">Status <span class="schedule-sort-indicator text-[11px]" data-sort-indicator="status"></span></button></th>
                                 <th class="px-3 py-3 text-right"></th>
                             </tr>
                        </thead>
                        <tbody id="talks-list" class="divide-y divide-slate-100 dark:divide-slate-800">
                            <!-- Talks dynamically loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;

    try {
        const assembly = await getAssembly(activeAssemblyId);
        if (!assembly) throw new Error("Assembly not found");

        const talks = await getTalks(activeAssemblyId);

        // Populate Header
        document.getElementById("asm-detail-theme").textContent =
            assembly.theme || "Untitled Assembly";
        document.getElementById("asm-detail-location").textContent =
            assembly.location || "TBD";

        // Date display — for Regional Convention show Day 1 / Day 2 / Day 3 with actual dates
        const dateContainer = document.getElementById(
            "asm-detail-date-container",
        );
        if (
            assembly.eventType === "Regional Convention (3 Days)" &&
            assembly.date
        ) {
            const dayLabels = ["Fri", "Sat", "Sun"];
            dateContainer.innerHTML = [0, 1, 2]
                .map((offset) => {
                    const dayDate = addDays(assembly.date, offset);
                    const isActive = offset + 1 === currentDay;
                    return [
                        offset > 0
                            ? '<span class="text-slate-300 dark:text-slate-700 select-none hidden sm:inline">·</span>'
                            : "",
                        `<span class="flex items-center gap-1 ${isActive ? "text-slate-800 dark:text-white font-semibold" : ""}">
                        <span class="material-symbols-outlined text-[15px]">calendar_today</span>
                        <span class="font-medium">Day ${offset + 1}</span>
                        <span>${format(dayDate, "MMM d")}</span>
                    </span>`,
                    ].join("");
                })
                .join("");
        } else {
            const dateSpan = document.getElementById("asm-detail-date");
            if (dateSpan)
                dateSpan.querySelector("span:last-child").textContent =
                    assembly.date
                        ? format(assembly.date, "MMMM d, yyyy")
                        : "TBD";
        }

        let activeDay = currentDay;
        let scheduleSort = { key: "outline", direction: "asc" };
        let statsScope = "day";
        const list = document.getElementById("talks-list");
        const colSpan = 8;
        const compareScheduleValues = (a, b, key) => {
            const getValue = (talk) => {
                if (key === "theme") return talk.theme || talk.title || "";
                if (key === "duration") return Number(talk.duration || 0);
                if (key === "day") return Number(talk.day || 1);
                return talk[key] || "";
            };
            const left = getValue(a);
            const right = getValue(b);

            if (typeof left === "number" || typeof right === "number") {
                return Number(left || 0) - Number(right || 0);
            }
            return String(left).localeCompare(String(right), undefined, {
                numeric: true,
                sensitivity: "base",
            });
        };

        const updateScheduleSortButtons = () => {
            document.querySelectorAll(".schedule-sort-btn").forEach((button) => {
                const key = button.dataset.sortKey;
                const isActive = key === scheduleSort.key;
                button.classList.toggle("text-slate-800", isActive);
                button.classList.toggle("dark:text-slate-100", isActive);
                button.classList.toggle("text-slate-500", !isActive);
                button.classList.toggle("dark:text-slate-400", !isActive);
                const indicator = document.querySelector(
                    `[data-sort-indicator="${key}"]`,
                );
                if (indicator) {
                    indicator.textContent = isActive
                        ? scheduleSort.direction === "asc"
                            ? "▲"
                            : "▼"
                        : "";
                }
            });
        };

        const getDisplayedTalks = (selectedDay = activeDay) => {
            const dayTalks =
                assembly.eventType === "Regional Convention (3 Days)"
                    ? talks.filter((t) => (t.day || 1) === selectedDay)
                    : talks;

            return [...dayTalks].sort((a, b) => {
                const primary = compareScheduleValues(a, b, scheduleSort.key);
                if (primary !== 0) {
                    return scheduleSort.direction === "asc" ? primary : -primary;
                }

                const fallbackTime = compareScheduleValues(a, b, "startTime");
                if (fallbackTime !== 0) {
                    return fallbackTime;
                }

                return compareScheduleValues(a, b, "outline");
            });
        };

        const renderProgramChairmen = (selectedDay = activeDay) => {
            const chairmenByDay = assembly.chairmenByDay || {};
            const currentChairmen = chairmenByDay[String(selectedDay)] || {};
            const morning = currentChairmen.morning || {};
            const afternoon = currentChairmen.afternoon || {};
            const subtitle = document.getElementById("chairmen-subtitle");
            const morningName = document.getElementById("morning-chairman-name");
            const morningHelper = document.getElementById("morning-chairman-helper");
            const afternoonName = document.getElementById("afternoon-chairman-name");
            const afternoonHelper = document.getElementById("afternoon-chairman-helper");
            const hasMorning = Boolean(morning.speakerName || morning.manualName);
            const hasAfternoon = Boolean(afternoon.speakerName || afternoon.manualName);

            if (subtitle) {
                subtitle.textContent = `Assign the morning and afternoon chairmen for ${assembly.eventType === "Regional Convention (3 Days)" ? `Day ${selectedDay}` : "this assembly"}.`;
            }
            if (morningName) {
                morningName.textContent =
                    morning.speakerName || morning.manualName || "Not assigned yet";
            }
            if (morningHelper) {
                morningHelper.classList.toggle("hidden", hasMorning);
            }
            if (afternoonName) {
                afternoonName.textContent =
                    afternoon.speakerName || afternoon.manualName || "Not assigned yet";
            }
            if (afternoonHelper) {
                afternoonHelper.classList.toggle("hidden", hasAfternoon);
            }
        };

        const getStatsTalks = (selectedDay = activeDay) =>
            statsScope === "all" ? talks : getDisplayedTalks(selectedDay);

        const updateStatsScopeButtons = () => {
            document.querySelectorAll(".stats-scope-btn").forEach((button) => {
                const isActive = button.dataset.scope === statsScope;
                button.className = `stats-scope-btn inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold transition-colors ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`;
            });
        };

        const renderStats = (selectedDay = activeDay) => {
            const statsTalks = getStatsTalks(selectedDay);
            const confirmed = statsTalks.filter(
                (t) => t.status === "Confirmed",
            ).length;
            const scopeLabel = document.getElementById("stats-scope-label");
            if (scopeLabel) {
                const labelTarget =
                    statsScope === "all"
                        ? "all days"
                        : assembly.eventType === "Regional Convention (3 Days)"
                          ? `Day ${selectedDay}`
                          : "this assembly";
                scopeLabel.textContent = `Showing totals for ${labelTarget}.`;
            }
            document.getElementById("stat-total-talks").textContent =
                statsTalks.length;
            document.getElementById("stat-confirmed-speakers").textContent =
                confirmed;
            document.getElementById("stat-pending-assignments").textContent =
                statsTalks.length - confirmed;
            updateStatsScopeButtons();
        };
        const renderDaySchedule = (selectedDay = activeDay) => {
            const displayedTalks = getDisplayedTalks(selectedDay);

            if (displayedTalks.length === 0) {
                list.innerHTML = `<tr><td colspan="${colSpan}" class="px-6 py-8 text-center text-slate-500 italic">No talks scheduled yet for ${assembly.eventType === "Regional Convention (3 Days)" ? `Day ${selectedDay}` : "this assembly"}. Click "Add New Talk" to get started.</td></tr>`;
            } else {
                list.innerHTML = displayedTalks
                    .map((t) => {
                        const isLinked = !!t.speakerId;
                        const speakerInitials = t.speakerName
                            ? t.speakerName
                                  .trim()
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()
                            : "?";

                        const statusColors = {
                            Confirmed:
                                "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
                            Pending:
                                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                            Cancelled:
                                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                        };
                        const statusClass =
                            statusColors[t.status] || statusColors["Pending"];
                        const statusDot =
                            t.status === "Confirmed"
                                ? "bg-emerald-500"
                                : t.status === "Cancelled"
                                  ? "bg-red-500"
                                  : "bg-amber-500";

                        return `
                <tr class="talk-row hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60" data-id="${t.id}">
                    <td class="px-3 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">${assembly.eventType === "Regional Convention (3 Days)" ? `Day ${t.day || 1}` : "—"}</td>
                    <td class="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap">${t.startTime || "—"}</td>
                    <td class="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">${t.outline || "—"}</td>
                    <td class="px-3 py-3 min-w-[160px]">
                        <p class="text-xs font-semibold text-slate-900 dark:text-white leading-tight line-clamp-2">${t.theme || t.title || "—"}</p>
                        <span class="text-[10px] text-slate-400 font-mono">${t.type || ""}</span>
                    </td>
                    <td class="px-3 py-3">
                        ${
                            t.speakerName
                                ? `
                        <div class="flex items-center gap-1.5">
                            <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isLinked ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}">${speakerInitials}</div>
                            <span class="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[90px]">${t.speakerName}</span>
                            ${isLinked ? '<span class="material-symbols-outlined text-[11px] text-blue-400" title="Linked to database">link</span>' : ""}
                        </div>`
                                : `<span class="text-xs text-slate-400 italic">Unassigned</span>`
                        }</td>
                    <td class="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">${t.duration ? t.duration + " min" : "—"}</td>
                    <td class="px-3 py-3">
                        <button type="button" class="status-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass} hover:opacity-90 transition-opacity" data-id="${t.id}" data-status="${t.status || "Pending"}" title="Change status">
                            <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                            ${t.status || "Pending"}
                        </button>
                    </td>
                    <td class="px-3 py-3 text-right whitespace-nowrap">
                        <button class="edit-talk-btn p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded" data-id="${t.id}" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                    </td>
                </tr>
                `;
                    })
                    .join("");
            }
        };

        renderProgramChairmen(activeDay);
        updateScheduleSortButtons();
        renderStats(activeDay);
        renderDaySchedule(activeDay);

        // Show content
        document.getElementById("loading-details").classList.add("hidden");
        document.getElementById("details-content").classList.remove("hidden");

        // Wire events
        document
            .getElementById("back-to-assemblies")
            .addEventListener("click", () => options.setView("assemblies"));
        document
            .getElementById("generate-report-btn")
            ?.addEventListener("click", () =>
                renderAssemblySessionReportModal(assembly, talks, activeDay),
            );
        document
            .getElementById("start-assembly-btn")
            ?.addEventListener("click", () =>
                renderAssemblySessionModal(
                    container,
                    assembly,
                    talks,
                    activeDay,
                    options,
                ),
            );
        document
            .getElementById("edit-chairmen-btn")
            ?.addEventListener("click", () =>
                renderChairmenModal(container, assembly, activeDay, options),
            );
        document
            .getElementById("clear-talks-btn")
            ?.addEventListener("click", async () => {
                if (talks.length === 0) {
                    alert("This assembly has no talks to clear.");
                    return;
                }
                const confirmed = confirm(
                    `Clear all ${talks.length} talks from this assembly? This cannot be undone.`,
                );
                if (!confirmed) return;

                const clearButton = document.getElementById("clear-talks-btn");
                clearButton.disabled = true;
                clearButton.innerHTML =
                    '<span class="material-symbols-outlined text-[16px]">hourglass_top</span> Clearing...';

                try {
                    await clearAssemblyTalks(activeAssemblyId);
                    await updateAssembly(activeAssemblyId, {
                        liveSession: null,
                    });
                    renderAssemblyDetailsView(container, activeDay, options);
                } catch (error) {
                    clearButton.disabled = false;
                    clearButton.innerHTML =
                        '<span class="material-symbols-outlined text-[16px]">delete_sweep</span> Clear Talks';
                    alert("Error clearing talks: " + error.message);
                }
            });

        // Day tabs event listeners
        if (assembly.eventType === "Regional Convention (3 Days)") {
            document.querySelectorAll(".day-tab-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const selectedDay = parseInt(btn.dataset.day);
                    if (selectedDay !== activeDay) {
                        activeDay = selectedDay;
                        document.querySelectorAll(".day-tab-btn").forEach((tab) => {
                            const isActive = Number(tab.dataset.day) === activeDay;
                            tab.className = `day-tab-btn px-4 py-2 rounded-t-lg font-bold text-sm transition-colors border-b-2 ${isActive ? "text-blue-600 dark:text-blue-400 border-blue-600 font-bold bg-white dark:bg-slate-900" : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`;
                        });
                        renderProgramChairmen(activeDay);
                        renderStats(activeDay);
                        renderDaySchedule(activeDay);
                    }
                });
            });
        }

        document.querySelectorAll(".schedule-sort-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const nextKey = button.dataset.sortKey || "outline";
                if (scheduleSort.key === nextKey) {
                    scheduleSort.direction =
                        scheduleSort.direction === "asc" ? "desc" : "asc";
                } else {
                    scheduleSort = { key: nextKey, direction: "asc" };
                }
                updateScheduleSortButtons();
                renderDaySchedule(activeDay);
            });
        });

        document.querySelectorAll(".stats-scope-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const nextScope = button.dataset.scope || "day";
                if (nextScope === statsScope) return;
                statsScope = nextScope;
                renderStats(activeDay);
            });
        });

        // Add/Edit talk modals
        document
            .getElementById("add-talk-btn")
            .addEventListener("click", () =>
                renderAddTalkModal(
                    container,
                    activeAssemblyId,
                    null,
                    activeDay,
                    options,
                ),
            );
        document
            .getElementById("bulk-import-talks-btn")
            ?.addEventListener("click", () =>
                renderBulkImportTalksModal(
                    container,
                    activeAssemblyId,
                    activeDay,
                    options,
                ),
            );

        const statusClassMap = {
            Confirmed: [
                "bg-emerald-100",
                "dark:bg-emerald-900/30",
                "text-emerald-700",
                "dark:text-emerald-400",
            ],
            Pending: [
                "bg-amber-100",
                "dark:bg-amber-900/30",
                "text-amber-700",
                "dark:text-amber-400",
            ],
            Cancelled: [
                "bg-red-100",
                "dark:bg-red-900/30",
                "text-red-700",
                "dark:text-red-400",
            ],
        };
        const statusDotMap = {
            Confirmed: "bg-emerald-500",
            Pending: "bg-amber-500",
            Cancelled: "bg-red-500",
        };
        const allStatusClasses = Object.values(statusClassMap).flat();
        const allStatusDots = Object.values(statusDotMap);
        const syncStatusSummary = () => {
            renderStats(activeDay);
        };

        // Event delegation for table buttons
        list.addEventListener("click", async (e) => {
            const statusBtn = e.target.closest(".status-badge");
            if (statusBtn) {
                e.stopPropagation();
                const talk = talks.find((t) => t.id === statusBtn.dataset.id);
                if (!talk) return;

                const statusOrder = ["Pending", "Confirmed", "Cancelled"];
                const currentStatus = talk.status || "Pending";
                const nextStatus =
                    statusOrder[
                        (statusOrder.indexOf(currentStatus) + 1) %
                            statusOrder.length
                    ];
                statusBtn.disabled = true;

                try {
                    await updateTalk(activeAssemblyId, talk.id, {
                        status: nextStatus,
                    });
                    talk.status = nextStatus;
                    statusBtn.dataset.status = nextStatus;
                    statusBtn.classList.remove(...allStatusClasses);
                    statusBtn.classList.add(...statusClassMap[nextStatus]);
                    const dot = statusBtn.querySelector("span");
                    if (dot) {
                        dot.classList.remove(...allStatusDots);
                        dot.classList.add(statusDotMap[nextStatus]);
                    }
                    const labelNode =
                        statusBtn.childNodes[statusBtn.childNodes.length - 1];
                    if (labelNode) {
                        labelNode.textContent = ` ${nextStatus}`;
                    }
                    syncStatusSummary();
                    statusBtn.disabled = false;
                } catch (error) {
                    statusBtn.disabled = false;
                    alert("Error updating status: " + error.message);
                }
                return;
            }

            // Edit
            const editBtn = e.target.closest(".edit-talk-btn");
            if (editBtn) {
                e.stopPropagation();
                const talk = talks.find((t) => t.id === editBtn.dataset.id);
                if (talk)
                    renderAddTalkModal(
                        container,
                        activeAssemblyId,
                        talk,
                        activeDay,
                        options,
                    );
                return;
            }

            // Row click → detail dialog
            const row = e.target.closest(".talk-row");
            if (row) {
                const talk = talks.find((t) => t.id === row.dataset.id);
                if (talk) {
                    const speakers = await getSpeakers();
                    const linkedSpeaker = talk.speakerId
                        ? speakers.find((s) => s.id === talk.speakerId)
                        : null;
                    renderTalkDetailDialog(talk, linkedSpeaker, assembly);
                }
            }
        });
    } catch (err) {
        container.innerHTML = `<div class="p-8 text-center text-red-500">Error loading details: ${err.message} <br> <button class="mt-4 px-4 py-2 bg-slate-200 rounded" onclick="window.location.reload()">Reload</button></div>`;
    }
};

const renderTalkDetailDialog = (talk, linkedSpeaker, assembly) => {
    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4";

    const spk = linkedSpeaker || {};
    const name = talk.speakerName || "—";
    const congregation = spk.congregation || talk.congregation || "—";
    const circuit = spk.circuit || talk.circuit || "—";
    const mobile = spk.phone || talk.mobilePhone || "—";
    const homePhone = talk.homePhone || "—";
    const email = spk.email || talk.email || "—";
    const address = spk.address || talk.address || "—";

    const dayLabels = ["", "Friday", "Saturday", "Sunday"];
    let dayDate = "";
    if (assembly.date && talk.day) {
        dayDate = format(
            addDays(assembly.date, (talk.day || 1) - 1),
            "MMMM d, yyyy",
        );
    }

    const badge = (label, active) =>
        active
            ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${label}</span>`
            : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400"><span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>${label}</span>`;

    const field = (label, value) =>
        value && value !== "—"
            ? `<div class="flex flex-col gap-0.5"><span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${label}</span><span class="text-sm font-medium text-slate-800 dark:text-slate-200">${value}</span></div>`
            : "";

    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in">
        <div class="bg-slate-50 dark:bg-slate-800/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
            <div class="min-w-0">
                ${assembly.eventType === "Regional Convention (3 Days)" ? `<p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Day ${talk.day || 1} — ${dayLabels[talk.day || 1]}${dayDate ? ` · ${dayDate}` : ""}</p>` : ""}
                <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">${talk.theme || talk.title || "Unnamed Talk"}</h3>
                <div class="flex flex-wrap items-center gap-2 mt-1.5">
                    ${talk.outline ? `<span class="text-xs font-mono font-bold text-slate-500">#${talk.outline}</span>` : ""}
                    ${talk.source ? `<span class="text-xs text-slate-400">${talk.source}</span>` : ""}
                    <span class="text-xs text-slate-400">${talk.startTime || ""}</span>
                    <span class="text-xs text-slate-400">${talk.type || ""}</span>
                    ${talk.dateAssigned ? `<span class="text-xs text-slate-400">Assigned: ${talk.dateAssigned}</span>` : ""}
                </div>
            </div>
            <button id="close-talk-detail" class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors mt-0.5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="px-6 py-5">
            ${
                talk.speakerName
                    ? `
            <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${linkedSpeaker ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}">
                    ${name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                </div>
                <div>
                    <p class="text-base font-bold text-slate-900 dark:text-white">${name}</p>
                    ${linkedSpeaker ? `<span class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">Linked to Speakers database</span>` : `<span class="text-xs text-slate-400">Not in Speakers database</span>`}
                </div>
                <div class="ml-auto flex gap-1.5">${badge("Visitor", talk.isVisitor)}${badge("Bethelite", talk.isBethelite)}</div>
            </div>
            <div class="grid grid-cols-2 gap-x-6 gap-y-4">
                ${field("Congregation", congregation)}
                ${field("Circuit", circuit)}
                ${field("Mobile", mobile)}
                ${field("Home Phone", homePhone)}
                ${field("Email", email)}
                ${field("Address", address)}
            </div>
            `
                    : `
            <div class="text-center py-6 text-slate-400">
                <p class="text-sm">No speaker assigned to this talk.</p>
            </div>
            `
            }
        </div>
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button id="close-talk-detail-btn" class="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Close</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
    const close = () => modal.remove();
    document
        .getElementById("close-talk-detail")
        .addEventListener("click", close);
    document
        .getElementById("close-talk-detail-btn")
        .addEventListener("click", close);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
    });
};

const getSessionTalksForDay = (assembly, talks, currentDay) => {
    const sessionTalks =
        assembly.eventType === "Regional Convention (3 Days)"
            ? talks.filter((t) => (t.day || 1) === currentDay)
            : talks;

    return [...sessionTalks].sort((a, b) =>
        (a.startTime || "00:00").localeCompare(b.startTime || "00:00"),
    );
};

const formatElapsedTime = (totalSeconds = 0) => {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
        ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatSessionStamp = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getTalkElapsedSeconds = (talk, now = Date.now()) => {
    const stored = Number(talk.actualDurationSeconds || 0);
    if (talk.sessionState !== "running" || !talk.activeSegmentStartedAtMs) {
        return stored;
    }
    return (
        stored +
        Math.max(0, Math.floor((now - talk.activeSegmentStartedAtMs) / 1000))
    );
};

const renderAssemblySessionReportModal = (assembly, talks, currentDay) => {
    const sessionTalks = getSessionTalksForDay(assembly, talks, currentDay);
    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4";

    const completedTalks = sessionTalks.filter(
        (t) =>
            t.sessionState === "completed" ||
            Number(t.actualDurationSeconds || 0) > 0 ||
            (t.performanceNotes || "").trim(),
    );
    const totalPlannedMinutes = sessionTalks.reduce(
        (sum, talk) => sum + Number(talk.duration || 0),
        0,
    );
    const totalActualSeconds = sessionTalks.reduce(
        (sum, talk) => sum + getTalkElapsedSeconds(talk),
        0,
    );
    const totalActualMinutes = Math.round((totalActualSeconds / 60) * 10) / 10;
    const varianceMinutes =
        Math.round((totalActualMinutes - totalPlannedMinutes) * 10) / 10;

    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
            <div>
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Assembly Session Report</p>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-1">${assembly.theme || "Untitled Assembly"}${assembly.eventType === "Regional Convention (3 Days)" ? ` · Day ${currentDay}` : ""}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Review actual timing and speaker performance notes.</p>
            </div>
            <button id="close-session-report" class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Talks</p>
                    <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">${sessionTalks.length}</p>
                </div>
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
                    <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">${completedTalks.length}</p>
                </div>
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Planned / Actual</p>
                    <p class="text-lg font-black text-slate-900 dark:text-white mt-2">${totalPlannedMinutes}m / ${totalActualMinutes}m</p>
                </div>
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Variance</p>
                    <p class="text-3xl font-black ${varianceMinutes > 0 ? "text-orange-500" : varianceMinutes < 0 ? "text-emerald-500" : "text-slate-900 dark:text-white"} mt-2">${varianceMinutes > 0 ? "+" : ""}${varianceMinutes}m</p>
                </div>
            </div>
            ${
                sessionTalks.length === 0
                    ? `
                <div class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No talks found for this assembly day.
                </div>
            `
                    : `
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <tr>
                                <th class="px-4 py-3">Time</th>
                                <th class="px-4 py-3">Talk</th>
                                <th class="px-4 py-3">Speaker</th>
                                <th class="px-4 py-3">Planned</th>
                                <th class="px-4 py-3">Actual</th>
                                <th class="px-4 py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            ${sessionTalks
                                .map((talk) => {
                                    const actualSeconds =
                                        getTalkElapsedSeconds(talk);
                                    const actualMinutes = actualSeconds
                                        ? Math.round(
                                              (actualSeconds / 60) * 10,
                                          ) / 10
                                        : 0;
                                    return `
                                <tr>
                                    <td class="px-4 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">${talk.startTime || "—"}</td>
                                    <td class="px-4 py-4">
                                        <p class="font-semibold text-slate-900 dark:text-white">${talk.theme || talk.title || "—"}</p>
                                        <p class="text-xs text-slate-400 mt-1">${talk.outline ? `#${talk.outline} · ` : ""}${talk.sessionState || "not_started"}</p>
                                    </td>
                                    <td class="px-4 py-4 text-slate-600 dark:text-slate-300">${talk.speakerName || "—"}</td>
                                    <td class="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">${talk.duration || 0}m</td>
                                    <td class="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                        <div>${actualSeconds ? `${actualMinutes}m` : "—"}</div>
                                        <div class="text-xs text-slate-400">${formatSessionStamp(talk.actualStartTimeMs)}${talk.actualEndTimeMs ? ` - ${formatSessionStamp(talk.actualEndTimeMs)}` : ""}</div>
                                    </td>
                                    <td class="px-4 py-4 text-slate-600 dark:text-slate-300 max-w-xs">${(talk.performanceNotes || "").trim() || '<span class="text-slate-400">No notes</span>'}</td>
                                </tr>`;
                                })
                                .join("")}
                        </tbody>
                    </table>
                </div>
            `
            }
        </div>
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
            <button id="close-session-report-btn" class="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Close</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
    const close = () => modal.remove();
    document
        .getElementById("close-session-report")
        .addEventListener("click", close);
    document
        .getElementById("close-session-report-btn")
        .addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
};

const renderAssemblySessionModal = (
    container,
    assembly,
    talks,
    currentDay,
    options,
) => {
    const sessionTalks = getSessionTalksForDay(assembly, talks, currentDay);
    if (sessionTalks.length === 0) {
        alert(
            "Add at least one talk for this day before starting the assembly.",
        );
        return;
    }

    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-[2px] animate-fade-in p-4";

    let liveSession =
        assembly.liveSession &&
        Number(assembly.liveSession.day || 1) === currentDay
            ? { ...assembly.liveSession }
            : {
                  day: currentDay,
                  status: "idle",
                  startedAtMs: null,
                  endedAtMs: null,
                  activeTalkId: null,
                  lastUpdatedAtMs: null,
              };

    let activeIndex = Math.max(
        0,
        sessionTalks.findIndex((talk) => talk.id === liveSession.activeTalkId),
    );
    if (activeIndex < 0 || !sessionTalks[activeIndex]) {
        activeIndex = Math.max(
            0,
            sessionTalks.findIndex(
                (talk) => (talk.sessionState || "not_started") !== "completed",
            ),
        );
        if (activeIndex < 0) activeIndex = 0;
    }

    let timerHandle = null;
    let isClosing = false;

    const persistAssemblySession = async (status, extra = {}) => {
        liveSession = {
            ...liveSession,
            day: currentDay,
            status,
            activeTalkId: sessionTalks[activeIndex]?.id || null,
            lastUpdatedAtMs: Date.now(),
            ...extra,
        };
        assembly.liveSession = liveSession;
        await updateAssembly(assembly.id, { liveSession });
    };

    const updateTimerLabel = () => {
        const currentTalk = sessionTalks[activeIndex];
        const label = modal.querySelector("#session-elapsed");
        if (!label || !currentTalk) return;
        label.textContent = formatElapsedTime(
            getTalkElapsedSeconds(currentTalk),
        );
    };

    const startTicker = () => {
        clearInterval(timerHandle);
        timerHandle = setInterval(updateTimerLabel, 1000);
    };

    const stopTicker = () => {
        clearInterval(timerHandle);
        timerHandle = null;
    };

    const saveCurrentNotes = async () => {
        const currentTalk = sessionTalks[activeIndex];
        const notesField = modal.querySelector("#session-notes");
        if (!currentTalk || !notesField) return;
        const nextNotes = notesField.value.trim();
        if ((currentTalk.performanceNotes || "").trim() === nextNotes) return;
        currentTalk.performanceNotes = nextNotes;
        await updateTalk(assembly.id, currentTalk.id, {
            performanceNotes: nextNotes,
            sessionUpdatedAtMs: Date.now(),
        });
    };

    const render = () => {
        const currentTalk = sessionTalks[activeIndex];
        const running = currentTalk?.sessionState === "running";
        const paused = currentTalk?.sessionState === "paused";
        const completed = currentTalk?.sessionState === "completed";
        const canMove = !running;

        modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in max-h-[94vh] flex flex-col">
            <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Live Assembly Session</p>
                    <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">${assembly.theme || "Untitled Assembly"}${assembly.eventType === "Regional Convention (3 Days)" ? ` · Day ${currentDay}` : ""}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Track actual time, save comments, and move through the schedule manually.</p>
                </div>
                <button id="close-session-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] min-h-0 flex-1">
                <div class="border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/20">
                    <div class="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Session Status</p>
                                <p class="text-sm font-semibold text-slate-900 dark:text-white mt-1">${liveSession.status || "idle"}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Current Talk</p>
                                <p class="text-sm font-semibold text-slate-900 dark:text-white mt-1">${activeIndex + 1} / ${sessionTalks.length}</p>
                            </div>
                        </div>
                    </div>
                    <div class="divide-y divide-slate-200 dark:divide-slate-800">
                        ${sessionTalks
                            .map((talk, index) => {
                                const isActive = index === activeIndex;
                                const talkState =
                                    talk.sessionState || "not_started";
                                return `
                            <button type="button" class="session-talk-row w-full text-left px-4 py-4 ${isActive ? "bg-white dark:bg-slate-900" : "hover:bg-white/70 dark:hover:bg-slate-900/60"} transition-colors" data-index="${index}">
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <p class="text-xs font-bold uppercase tracking-widest ${isActive ? "text-blue-500" : "text-slate-400"}">${talk.startTime || "—"}</p>
                                        <p class="text-sm font-semibold text-slate-900 dark:text-white mt-1">${talk.theme || talk.title || "Untitled Talk"}</p>
                                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${talk.speakerName || "Unassigned"}${talk.duration ? ` · ${talk.duration}m` : ""}</p>
                                    </div>
                                    <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${talkState === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : talkState === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : talkState === "paused" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}">${talkState.replace("_", " ")}</span>
                                </div>
                            </button>`;
                            })
                            .join("")}
                    </div>
                </div>
                <div class="overflow-y-auto p-6 space-y-6">
                    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
                        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
                            <div class="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Now Tracking</p>
                                    <h4 class="text-2xl font-bold text-slate-900 dark:text-white mt-1">${currentTalk.theme || currentTalk.title || "Untitled Talk"}</h4>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">${currentTalk.speakerName || "No speaker assigned"}${currentTalk.outline ? ` · Outline ${currentTalk.outline}` : ""}</p>
                                </div>
                                <div class="rounded-2xl bg-slate-900 dark:bg-slate-950 text-white px-5 py-4 min-w-[160px] text-center shadow-lg">
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Elapsed</p>
                                    <p id="session-elapsed" class="text-3xl font-black tracking-tight mt-2">${formatElapsedTime(getTalkElapsedSeconds(currentTalk))}</p>
                                    <p class="text-xs text-slate-400 mt-2">Planned ${currentTalk.duration || 0} min</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Scheduled</p>
                                    <p class="text-lg font-bold text-slate-900 dark:text-white mt-2">${currentTalk.startTime || "—"}</p>
                                </div>
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Started</p>
                                    <p class="text-lg font-bold text-slate-900 dark:text-white mt-2">${formatSessionStamp(currentTalk.actualStartTimeMs)}</p>
                                </div>
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-4">
                                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Ended</p>
                                    <p class="text-lg font-bold text-slate-900 dark:text-white mt-2">${formatSessionStamp(currentTalk.actualEndTimeMs)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/60 shadow-sm space-y-3">
                            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Controls</p>
                            <button id="session-start-talk" class="w-full px-4 py-2.5 rounded-lg text-sm font-bold ${running ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"} transition-colors" ${running ? "disabled" : ""}>${paused ? "Resume Talk" : currentTalk.actualStartTimeMs ? "Restart Talk" : "Start Talk"}</button>
                            <button id="session-pause-talk" class="w-full px-4 py-2.5 rounded-lg text-sm font-bold ${running ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-200 text-slate-500 cursor-not-allowed"} transition-colors" ${running ? "" : "disabled"}>Pause</button>
                            <button id="session-stop-talk" class="w-full px-4 py-2.5 rounded-lg text-sm font-bold ${running || paused ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500 cursor-not-allowed"} transition-colors" ${running || paused ? "" : "disabled"}>Stop Talk</button>
                            <div class="grid grid-cols-2 gap-3 pt-2">
                                <button id="session-prev-talk" class="px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 ${activeIndex === 0 || !canMove ? "text-slate-400 cursor-not-allowed" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}" ${activeIndex === 0 || !canMove ? "disabled" : ""}>Previous</button>
                                <button id="session-next-talk" class="px-4 py-2.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 ${activeIndex === sessionTalks.length - 1 || !canMove ? "text-slate-400 cursor-not-allowed" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}" ${activeIndex === sessionTalks.length - 1 || !canMove ? "disabled" : ""}>Next</button>
                            </div>
                            <button id="session-finish" class="w-full px-4 py-2.5 rounded-lg text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors">Finish Session</button>
                        </div>
                    </div>
                    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
                        <div class="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Performance Notes</p>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Comments about delivery, timing, counsel, or anything worth remembering.</p>
                            </div>
                            <button id="session-save-notes" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Save Notes</button>
                        </div>
                        <textarea id="session-notes" rows="8" class="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y" placeholder="Add observations about the speaker's timing, delivery, counsel, or anything else relevant...">${currentTalk.performanceNotes || ""}</textarea>
                    </div>
                </div>
            </div>
        </div>`;

        const closeBtn = modal.querySelector("#close-session-modal");
        closeBtn?.addEventListener("click", async () => {
            if (isClosing) return;
            isClosing = true;
            stopTicker();
            try {
                await saveCurrentNotes();
            } finally {
                modal.remove();
                renderAssemblyDetailsView(container, currentDay, options);
            }
        });

        modal.onclick = async (event) => {
            if (event.target !== modal || isClosing) return;
            isClosing = true;
            stopTicker();
            try {
                await saveCurrentNotes();
            } finally {
                modal.remove();
                renderAssemblyDetailsView(container, currentDay, options);
            }
        };

        modal.querySelectorAll(".session-talk-row").forEach((button) => {
            button.addEventListener("click", async () => {
                if (sessionTalks[activeIndex]?.sessionState === "running")
                    return;
                await saveCurrentNotes();
                activeIndex = Number(button.dataset.index);
                await persistAssemblySession(liveSession.status || "idle", {
                    activeTalkId: sessionTalks[activeIndex]?.id || null,
                });
                render();
            });
        });

        modal
            .querySelector("#session-save-notes")
            ?.addEventListener("click", async () => {
                const button = modal.querySelector("#session-save-notes");
                button.disabled = true;
                button.textContent = "Saving...";
                try {
                    await saveCurrentNotes();
                    button.textContent = "Saved";
                    setTimeout(() => {
                        const activeButton = modal.querySelector(
                            "#session-save-notes",
                        );
                        if (activeButton) {
                            activeButton.disabled = false;
                            activeButton.textContent = "Save Notes";
                        }
                    }, 800);
                } catch (error) {
                    button.disabled = false;
                    button.textContent = "Save Notes";
                    alert("Error saving notes: " + error.message);
                }
            });

        modal
            .querySelector("#session-notes")
            ?.addEventListener("blur", async () => {
                try {
                    await saveCurrentNotes();
                } catch (error) {
                    console.error("Error auto-saving notes", error);
                }
            });

        modal
            .querySelector("#session-start-talk")
            ?.addEventListener("click", async () => {
                const currentTalk = sessionTalks[activeIndex];
                const now = Date.now();
                const nextData = {
                    sessionState: "running",
                    actualStartTimeMs: currentTalk.actualStartTimeMs || now,
                    activeSegmentStartedAtMs: now,
                    actualEndTimeMs: null,
                    sessionUpdatedAtMs: now,
                };
                await updateTalk(assembly.id, currentTalk.id, nextData);
                Object.assign(currentTalk, nextData);
                await persistAssemblySession("running", {
                    startedAtMs: liveSession.startedAtMs || now,
                    endedAtMs: null,
                    activeTalkId: currentTalk.id,
                });
                render();
            });

        modal
            .querySelector("#session-pause-talk")
            ?.addEventListener("click", async () => {
                const currentTalk = sessionTalks[activeIndex];
                const now = Date.now();
                const nextData = {
                    sessionState: "paused",
                    actualDurationSeconds: getTalkElapsedSeconds(
                        currentTalk,
                        now,
                    ),
                    activeSegmentStartedAtMs: null,
                    sessionUpdatedAtMs: now,
                };
                await updateTalk(assembly.id, currentTalk.id, nextData);
                Object.assign(currentTalk, nextData);
                await persistAssemblySession("paused", {
                    activeTalkId: currentTalk.id,
                });
                render();
            });

        modal
            .querySelector("#session-stop-talk")
            ?.addEventListener("click", async () => {
                const currentTalk = sessionTalks[activeIndex];
                const now = Date.now();
                const nextData = {
                    sessionState: "completed",
                    actualDurationSeconds: getTalkElapsedSeconds(
                        currentTalk,
                        now,
                    ),
                    activeSegmentStartedAtMs: null,
                    actualEndTimeMs: now,
                    sessionUpdatedAtMs: now,
                };
                await saveCurrentNotes();
                await updateTalk(assembly.id, currentTalk.id, nextData);
                Object.assign(currentTalk, nextData);
                await persistAssemblySession("paused", {
                    activeTalkId: currentTalk.id,
                });
                render();
            });

        modal
            .querySelector("#session-prev-talk")
            ?.addEventListener("click", async () => {
                if (
                    activeIndex === 0 ||
                    sessionTalks[activeIndex]?.sessionState === "running"
                )
                    return;
                await saveCurrentNotes();
                activeIndex -= 1;
                await persistAssemblySession(liveSession.status || "idle", {
                    activeTalkId: sessionTalks[activeIndex]?.id || null,
                });
                render();
            });

        modal
            .querySelector("#session-next-talk")
            ?.addEventListener("click", async () => {
                if (
                    activeIndex >= sessionTalks.length - 1 ||
                    sessionTalks[activeIndex]?.sessionState === "running"
                )
                    return;
                await saveCurrentNotes();
                activeIndex += 1;
                await persistAssemblySession(liveSession.status || "idle", {
                    activeTalkId: sessionTalks[activeIndex]?.id || null,
                });
                render();
            });

        modal
            .querySelector("#session-finish")
            ?.addEventListener("click", async () => {
                if (sessionTalks[activeIndex]?.sessionState === "running") {
                    alert(
                        "Stop or pause the current talk before finishing the session.",
                    );
                    return;
                }
                await saveCurrentNotes();
                await persistAssemblySession("completed", {
                    endedAtMs: Date.now(),
                    activeTalkId: null,
                });
                stopTicker();
                modal.remove();
                renderAssemblyDetailsView(container, currentDay, options);
            });

        updateTimerLabel();
        if (currentTalk.sessionState === "running") {
            startTicker();
        } else {
            stopTicker();
        }
    };

    document.body.appendChild(modal);
    render();
};
const renderChairmenModal = async (
    container,
    assembly,
    currentDay,
    options,
) => {
    const speakers = await getSpeakers();
    const chairmenByDay = assembly.chairmenByDay || {};
    const dayKey = String(currentDay);
    const dayChairmen = chairmenByDay[dayKey] || {};
    const morning = dayChairmen.morning || {};
    const afternoon = dayChairmen.afternoon || {};

    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
            <div>
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400">Program Chairmen</p>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-1">${assembly.theme || "Untitled Assembly"}${assembly.eventType === "Regional Convention (3 Days)" ? ` · Day ${currentDay}` : ""}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Assign the morning and afternoon chairmen for this program.</p>
            </div>
            <button id="close-chairmen-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/70 dark:bg-slate-950/20 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px]">wb_sunny</span>
                        </div>
                        <div>
                            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Morning</p>
                            <h4 class="text-lg font-bold text-slate-900 dark:text-white">Chairman</h4>
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Speaker from database</label>
                        <select id="chairman-morning-speaker" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Select speaker --</option>
                            ${speakers.map((speaker) => `<option value="${speaker.id}" ${morning.speakerId === speaker.id ? "selected" : ""}>${speaker.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Manual name override</label>
                        <input id="chairman-morning-name" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" placeholder="Enter name if not linked to a speaker" value="${morning.manualName || (!morning.speakerId ? morning.speakerName || "" : "")}" />
                    </div>
                </section>
                <section class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/70 dark:bg-slate-950/20 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px]">nights_stay</span>
                        </div>
                        <div>
                            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Afternoon</p>
                            <h4 class="text-lg font-bold text-slate-900 dark:text-white">Chairman</h4>
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Speaker from database</label>
                        <select id="chairman-afternoon-speaker" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Select speaker --</option>
                            ${speakers.map((speaker) => `<option value="${speaker.id}" ${afternoon.speakerId === speaker.id ? "selected" : ""}>${speaker.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Manual name override</label>
                        <input id="chairman-afternoon-name" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" placeholder="Enter name if not linked to a speaker" value="${afternoon.manualName || (!afternoon.speakerId ? afternoon.speakerName || "" : "")}" />
                    </div>
                </section>
            </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
            <button id="cancel-chairmen-modal" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-chairmen-modal" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">Save Chairmen</button>
        </div>
    </div>`;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document
        .getElementById("close-chairmen-modal")
        .addEventListener("click", closeModal);
    document
        .getElementById("cancel-chairmen-modal")
        .addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    const buildChairman = (slot) => {
        const select = document.getElementById(`chairman-${slot}-speaker`);
        const manualName = document
            .getElementById(`chairman-${slot}-name`)
            .value.trim();
        const speakerId = select.value;
        const selectedSpeaker = speakers.find(
            (speaker) => speaker.id === speakerId,
        );

        if (!speakerId && !manualName) {
            return null;
        }

        return {
            speakerId: speakerId || "",
            speakerName: selectedSpeaker?.name || manualName,
            manualName: selectedSpeaker ? "" : manualName,
            congregation: selectedSpeaker?.congregation || "",
            circuit: selectedSpeaker?.circuit || "",
            phone: selectedSpeaker?.phone || "",
            email: selectedSpeaker?.email || "",
        };
    };

    document
        .getElementById("save-chairmen-modal")
        .addEventListener("click", async () => {
            const saveButton = document.getElementById("save-chairmen-modal");
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            try {
                const nextChairmenByDay = {
                    ...(assembly.chairmenByDay || {}),
                    [dayKey]: {
                        morning: buildChairman("morning"),
                        afternoon: buildChairman("afternoon"),
                    },
                };

                await updateAssembly(assembly.id, {
                    chairmenByDay: nextChairmenByDay,
                });
                closeModal();
                renderAssemblyDetailsView(container, currentDay, options);
            } catch (error) {
                saveButton.disabled = false;
                saveButton.textContent = "Save Chairmen";
                alert("Error saving chairmen: " + error.message);
            }
        });
};
// ─── MODALS ──────────────────────────────────────────────
export const renderAssemblyModal = async (
    container,
    assemblyToEdit = null,
    options,
) => {
    const isEdit = !!assemblyToEdit;
    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";

    // Format date for input field
    let dateStr = "";
    if (isEdit && assemblyToEdit.date) {
        const d =
            assemblyToEdit.date instanceof Date
                ? assemblyToEdit.date
                : assemblyToEdit.date.toDate?.() ||
                  new Date(assemblyToEdit.date);
        dateStr = d.toISOString().split("T")[0];
    }

    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${isEdit ? "Edit Assembly" : "Create New Assembly"}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme / Title</label>
                <input id="asm-theme" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Circuit Assembly 2026" type="text" value="${isEdit ? assemblyToEdit.theme || "" : ""}"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                    <input id="asm-date" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" type="date" value="${dateStr}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
                    <input id="asm-location" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Assembly Hall" type="text" value="${isEdit ? assemblyToEdit.location || "" : ""}"/>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Event Type</label>
                    <select id="asm-event-type" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                        <option value="Circuit Assembly" ${!isEdit || assemblyToEdit.eventType === "Circuit Assembly" || !assemblyToEdit.eventType ? "selected" : ""}>Circuit Assembly</option>
                        <option value="Regional Convention (3 Days)" ${isEdit && assemblyToEdit.eventType === "Regional Convention (3 Days)" ? "selected" : ""}>Regional Convention (3 Days)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select id="asm-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                        <option value="Draft" ${isEdit && assemblyToEdit.status === "Draft" ? "selected" : ""}>Draft</option>
                        <option value="Upcoming" ${!isEdit || assemblyToEdit.status === "Upcoming" ? "selected" : ""}>Upcoming</option>
                        <option value="Completed" ${isEdit && assemblyToEdit.status === "Completed" ? "selected" : ""}>Completed</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-assembly-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20 transition-all flex items-center gap-2">
                <span>${isEdit ? "Save Changes" : "Create Assembly"}</span>
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document
        .getElementById("close-modal-btn")
        .addEventListener("click", closeModal);
    document
        .getElementById("cancel-modal-btn")
        .addEventListener("click", closeModal);

    document
        .getElementById("save-assembly-btn")
        .addEventListener("click", async () => {
            const btn = document.getElementById("save-assembly-btn");
            const theme = document.getElementById("asm-theme").value;
            const dateVal = document.getElementById("asm-date").value;
            if (!theme || !dateVal) return alert("Theme and Date are required");

            try {
                btn.textContent = "Saving...";
                btn.disabled = true;

                const assemblyData = {
                    theme,
                    date: new Date(dateVal),
                    location: document.getElementById("asm-location").value,
                    eventType: document.getElementById("asm-event-type").value,
                    status: document.getElementById("asm-status").value,
                };

                if (isEdit) {
                    await updateAssembly(assemblyToEdit.id, assemblyData);
                } else {
                    await addAssembly({
                        ...assemblyData,
                        progress: 0,
                    });
                }

                closeModal();
                options.renderAssembliesView(container); // Refresh
            } catch (e) {
                console.error("Error saving assembly:", e);
                alert("Error saving assembly: " + e.message);
                btn.textContent = isEdit ? "Save Changes" : "Create Assembly";
                btn.disabled = false;
            }
        });
};

const renderAddTalkModal = async (
    container,
    assemblyId,
    existingTalk = null,
    currentDay = 1,
    options = {},
) => {
    const isEdit = !!existingTalk;
    const speakers = await getSpeakers();
    const selectedDay = isEdit ? existingTalk.day || currentDay : currentDay;
    const talkTheme = isEdit
        ? existingTalk.theme || existingTalk.title || ""
        : "";
    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${isEdit ? "Edit Talk" : "Add New Talk"}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5 overflow-y-auto">
            <div class="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700 dark:border-blue-900/50 dark:bg-slate-800/80 dark:text-slate-200">
                <p class="font-semibold text-slate-900 dark:text-white">Assembly Talk Fields</p>
                <p class="mt-1">This form now matches the assemblies bulk import fields, with the original type, duration, speaker link, and status controls preserved.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Day</label>
                    <input id="talk-day" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="number" min="1" value="${selectedDay}" />
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                    <input id="talk-time" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="time" value="${isEdit ? existingTalk.startTime || "09:30" : "09:30"}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Outline</label>
                    <input id="talk-outline" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 12" type="text" value="${isEdit ? existingTalk.outline || "" : ""}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Date Assigned</label>
                    <input id="talk-date-assigned" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2026-03-21" type="text" value="${isEdit ? existingTalk.dateAssigned || "" : ""}"/>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2 space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme</label>
                    <input id="talk-theme" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Keep Following Jehovah" type="text" value="${talkTheme}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Source</label>
                    <input id="talk-source" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Psalm 25:4" type="text" value="${isEdit ? existingTalk.source || "" : ""}"/>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                    <select id="talk-type" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="SC" ${isEdit && existingTalk.type === "SC" ? "selected" : ""}>Symposium (SC)</option>
                        <option value="AC" ${isEdit && existingTalk.type === "AC" ? "selected" : ""}>Address (AC)</option>
                        <option value="OS" ${isEdit && existingTalk.type === "OS" ? "selected" : ""}>Song/Prayer (OS)</option>
                        <option value="TK" ${(isEdit && existingTalk.type === "TK") || !isEdit ? "selected" : ""}>Talk (TK)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration (min)</label>
                    <input id="talk-duration" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="number" min="0" value="${isEdit ? existingTalk.duration || 10 : 10}"/>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign Speaker (Optional)</label>
                <select id="talk-speaker" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- No Speaker Assigned --</option>
                    ${speakers.map((s) => `<option value="${s.id}" ${isEdit && existingTalk.speakerId === s.id ? "selected" : ""}>${s.name}</option>`).join("")}
                </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Speaker Name</label>
                    <input id="talk-speaker-name" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" type="text" value="${isEdit ? existingTalk.speakerName || "" : ""}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Circuit</label>
                    <input id="talk-circuit" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" value="${isEdit ? existingTalk.circuit || "" : ""}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Congregation</label>
                    <input id="talk-congregation" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" value="${isEdit ? existingTalk.congregation || "" : ""}"/>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Phone</label>
                    <input id="talk-mobile-phone" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" value="${isEdit ? existingTalk.mobilePhone || "" : ""}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Home Phone</label>
                    <input id="talk-home-phone" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" value="${isEdit ? existingTalk.homePhone || "" : ""}"/>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                    <input id="talk-email" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="email" value="${isEdit ? existingTalk.email || "" : ""}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                    <input id="talk-address" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="text" value="${isEdit ? existingTalk.address || "" : ""}"/>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select id="talk-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="Pending" ${isEdit && existingTalk.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="Confirmed" ${isEdit && existingTalk.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
                        <option value="Cancelled" ${isEdit && existingTalk.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                    </select>
                </div>
                <label class="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <input id="talk-is-visitor" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" ${isEdit && existingTalk.isVisitor ? "checked" : ""} />
                    Visitor
                </label>
                <label class="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <input id="talk-is-bethelite" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" ${isEdit && existingTalk.isBethelite ? "checked" : ""} />
                    Bethelite
                </label>
            </div>
        </div>
        <div class="flex items-center justify-between px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            ${isEdit ? `<button id="delete-talk-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Talk</button>` : "<div></div>"}
            <div class="flex items-center gap-3">
                <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button id="save-talk-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                    <span>${isEdit ? "Save Changes" : "Save Talk"}</span>
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document
        .getElementById("close-modal-btn")
        .addEventListener("click", closeModal);
    document
        .getElementById("cancel-modal-btn")
        .addEventListener("click", closeModal);

    if (isEdit) {
        document
            .getElementById("delete-talk-btn")
            .addEventListener("click", async () => {
                if (!confirm("Are you sure you want to delete this talk?"))
                    return;
                try {
                    await deleteTalk(assemblyId, existingTalk.id);
                    closeModal();
                    renderAssemblyDetailsView(container, activeDay, options);
                } catch (e) {
                    alert("Error deleting: " + e.message);
                }
            });
    }

    document
        .getElementById("save-talk-btn")
        .addEventListener("click", async () => {
            const btn = document.getElementById("save-talk-btn");
            const theme = document.getElementById("talk-theme").value.trim();
            if (!theme) return alert("Theme is required");

            try {
                btn.textContent = "Saving...";
                btn.disabled = true;

                const speakerSelect = document.getElementById("talk-speaker");
                const speakerId = speakerSelect.value;
                const selectedSpeaker = speakers.find(
                    (s) => s.id === speakerId,
                );
                const enteredSpeakerName = document
                    .getElementById("talk-speaker-name")
                    .value.trim();
                const speakerName = speakerId
                    ? selectedSpeaker?.name || enteredSpeakerName || null
                    : enteredSpeakerName || null;

                const talkData = {
                    day:
                        parseInt(
                            document.getElementById("talk-day").value,
                            10,
                        ) || currentDay,
                    startTime: document.getElementById("talk-time").value,
                    outline: document
                        .getElementById("talk-outline")
                        .value.trim(),
                    theme,
                    title: theme,
                    source: document.getElementById("talk-source").value.trim(),
                    dateAssigned: document
                        .getElementById("talk-date-assigned")
                        .value.trim(),
                    type: document.getElementById("talk-type").value,
                    duration:
                        parseInt(
                            document.getElementById("talk-duration").value,
                            10,
                        ) || 0,
                    speakerId,
                    speakerName,
                    circuit:
                        document.getElementById("talk-circuit").value.trim() ||
                        selectedSpeaker?.circuit ||
                        "",
                    congregation:
                        document
                            .getElementById("talk-congregation")
                            .value.trim() ||
                        selectedSpeaker?.congregation ||
                        "",
                    mobilePhone:
                        document
                            .getElementById("talk-mobile-phone")
                            .value.trim() ||
                        selectedSpeaker?.phone ||
                        "",
                    homePhone: document
                        .getElementById("talk-home-phone")
                        .value.trim(),
                    email:
                        document.getElementById("talk-email").value.trim() ||
                        selectedSpeaker?.email ||
                        "",
                    address:
                        document.getElementById("talk-address").value.trim() ||
                        selectedSpeaker?.address ||
                        "",
                    isVisitor:
                        document.getElementById("talk-is-visitor").checked,
                    isBethelite:
                        document.getElementById("talk-is-bethelite").checked,
                    status: document.getElementById("talk-status").value,
                };

                if (isEdit) {
                    await updateTalk(assemblyId, existingTalk.id, talkData);
                } else {
                    await addTalk(assemblyId, talkData);
                }
                closeModal();
                renderAssemblyDetailsView(container, talkData.day, options);
            } catch (e) {
                alert("Error saving: " + e.message);
                btn.textContent = isEdit ? "Save Changes" : "Save Talk";
                btn.disabled = false;
            }
        });
};
const renderBulkImportTalksModal = async (
    container,
    assemblyId,
    currentDay = 1,
    options = {},
) => {
    const modal = document.createElement("div");
    modal.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Bulk Import Talks</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Paste one talk per line using tabs or commas as separators</p>
            </div>
            <button id="close-bulk-talks-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto">
            <div class="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700 dark:border-blue-900/50 dark:bg-slate-800/80 dark:text-slate-200">
                <p class="font-semibold text-slate-900 dark:text-white">Column Order</p>
                <p class="mt-1">1. Day  2. Time  3. Outline  4. Duration  5. Theme  6. Source  7. Date Assigned  8. Speaker Name  9. Circuit  10. Congregation  11. Mobile Phone  12. Home Phone  13. Email  14. Address  15. Visitor (Y/N)  16. Bethelite (Y/N)  17. Status or Confirmed (Y/N)</p>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Columns after Theme are optional. The Day column uses a number like 1/2/3 for RC, or any number you want for CA. If the last column is omitted, talks import as Pending.</p>
            </div>
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Paste data</label>
                <textarea id="bulk-talks-text" rows="10" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-y" placeholder="1	09:30	12	30	Keep Following Jehovah	Psalm 25:4	2026-03-21	John Doe	Circuit 5	Central Congregation	555-1111	555-2222	john@example.com	123 Main St	Y	N	Confirmed"></textarea>
            </div>
            <div id="bulk-talks-preview" class="hidden">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preview (<span id="bulk-talks-count">0</span> talks)</h4>
                <div class="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="bg-slate-50 dark:bg-slate-700/50"><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Day</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Time</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Outline</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Duration</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Theme</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Speaker</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Status</th></tr></thead>
                        <tbody id="bulk-talks-preview-body" class="divide-y divide-slate-100 dark:divide-slate-700"></tbody>
                    </table>
                </div>
            </div>
            <div id="bulk-talks-status" class="hidden text-sm font-medium"></div>
        </div>
        <div class="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="bulk-talks-preview-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">Preview</button>
            <div class="flex gap-3">
                <button id="cancel-bulk-talks-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button id="save-bulk-talks-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2" disabled>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Import All</span>
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    document
        .getElementById("close-bulk-talks-modal")
        .addEventListener("click", closeModal);
    document
        .getElementById("cancel-bulk-talks-btn")
        .addEventListener("click", closeModal);

    let parsedTalks = [];

    const isTruthyFlag = (value) => {
        const normalized = (value || "").trim().toLowerCase();
        return ["y", "yes", "true", "1"].includes(normalized);
    };

    const splitLine = (line) => {
        if (line.includes("\t")) {
            return line.split("\t").map((part) => part.trim());
        }
        return line.split(",").map((part) => part.trim());
    };

    const parseBulkStatus = (value) => {
        const normalized = (value || "").trim().toLowerCase();
        if (!normalized) return "Pending";
        if (["confirmed", "confirm", "yes", "y", "true", "1"].includes(normalized)) {
            return "Confirmed";
        }
        if (["cancelled", "canceled", "cancel", "no", "n", "false", "0"].includes(normalized)) {
            return "Cancelled";
        }
        if (normalized === "pending") {
            return "Pending";
        }
        return "Pending";
    };
    const parseBulkText = () => {
        const raw = document.getElementById("bulk-talks-text").value.trim();
        if (!raw) return [];

        return raw
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const parts = splitLine(line);
                const day = parseInt(parts[0], 10);
                const startTime = parts[1] || "00:00";
                const outline = parts[2] || "";
                const durationValue = parseInt(parts[3], 10);
                const theme = parts[4] || "";
                const source = parts[5] || "";
                const dateAssigned = parts[6] || "";
                const speakerName = parts[7] || null;
                const circuit = parts[8] || "";
                const congregation = parts[9] || "";
                const mobilePhone = parts[10] || "";
                const homePhone = parts[11] || "";
                const email = parts[12] || "";
                const address = parts[13] || "";
                const isVisitor = isTruthyFlag(parts[14]);
                const isBethelite = isTruthyFlag(parts[15]);
                const status = parseBulkStatus(parts[16]);

                if (!theme) {
                    return null;
                }

                const talkData = {
                    day: Number.isFinite(day) ? day : currentDay,
                    startTime,
                    outline,
                    theme,
                    title: theme,
                    source,
                    dateAssigned,
                    speakerId: "",
                    speakerName,
                    circuit,
                    congregation,
                    mobilePhone,
                    homePhone,
                    email,
                    address,
                    isVisitor,
                    isBethelite,
                    status,
                };

                if (Number.isFinite(durationValue)) {
                    talkData.duration = durationValue;
                }

                return talkData;
            })
            .filter(Boolean);
    };

    document
        .getElementById("bulk-talks-preview-btn")
        .addEventListener("click", () => {
            parsedTalks = parseBulkText();
            const preview = document.getElementById("bulk-talks-preview");
            const body = document.getElementById("bulk-talks-preview-body");
            const count = document.getElementById("bulk-talks-count");
            const saveBtn = document.getElementById("save-bulk-talks-btn");
            const statusEl = document.getElementById("bulk-talks-status");

            if (parsedTalks.length === 0) {
                preview.classList.add("hidden");
                saveBtn.disabled = true;
                statusEl.className = "text-sm font-medium text-red-500";
                statusEl.textContent =
                    "No valid talks found. Theme is required on each row.";
                statusEl.classList.remove("hidden");
                return;
            }

            statusEl.classList.add("hidden");
            count.textContent = parsedTalks.length;
            body.innerHTML = parsedTalks
                .map(
                    (talk) => `
            <tr>
                <td class="px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium">${talk.day ?? "—"}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${talk.startTime || "—"}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono">${talk.outline || "—"}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${talk.duration ?? "—"}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-bold">${talk.theme}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${talk.speakerName || "—"}</td>\n                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${talk.status || "Pending"}</td>
            </tr>
        `,
                )
                .join("");
            preview.classList.remove("hidden");
            saveBtn.disabled = false;
        });

    document
        .getElementById("save-bulk-talks-btn")
        .addEventListener("click", async () => {
            if (parsedTalks.length === 0) return;
            const btn = document.getElementById("save-bulk-talks-btn");
            const statusEl = document.getElementById("bulk-talks-status");
            btn.disabled = true;
            btn.innerHTML = "<span>Importing...</span>";
            statusEl.className = "text-sm font-medium text-blue-500";
            statusEl.classList.remove("hidden");

            let saved = 0;
            let errors = 0;
            for (const talk of parsedTalks) {
                try {
                    await addTalk(assemblyId, talk);
                    saved++;
                    statusEl.textContent = `Importing ${saved} of ${parsedTalks.length}...`;
                } catch (e) {
                    errors++;
                    console.error(
                        "Error importing talk:",
                        talk.theme || talk.title,
                        e,
                    );
                }
            }

            if (errors === 0) {
                statusEl.className = "text-sm font-medium text-green-600";
                statusEl.textContent = `Successfully imported ${saved} talks.`;
            } else {
                statusEl.className = "text-sm font-medium text-orange-500";
                statusEl.textContent = `Imported ${saved} talks, ${errors} failed.`;
            }

            setTimeout(() => {
                closeModal();
                renderAssemblyDetailsView(container, currentDay, options);
            }, 1200);
        });
};





