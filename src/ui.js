import { onAuthChange, loginUser, logoutUser } from "./auth";
import { getCongregations, addCongregation, deleteCongregation, updateCongregation, getLastVisit, getLastTwoVisits, getLastTwoVisitsBefore, getActivitiesForMonth, searchActivities, addActivity, updateActivity, deleteActivity, getAssemblies, addAssembly, deleteAssembly, updateAssembly, getAssembly, getSpeakers, getTalks, addTalk, updateTalk, deleteTalk } from "./db";
import { addDays, format, parseISO, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { renderLogin as renderLoginScreen } from "./ui/login.js";
import { getStoredDesign, initTheme, toggleTheme, applyDesign, getNextDesign } from "./ui/preferences.js";
import { getAppShellMarkup } from "./ui/app-shell.js";
import { renderSpeakersView } from "./ui/speakers.js";
import { renderReportsView } from "./ui/reports.js";
import { renderCongregationsView as renderCongregationsFeature } from "./ui/congregations.js";
import { renderAssembliesView as renderAssembliesFeature } from "./ui/assemblies.js";
import { renderCalendarView as renderCalendarFeature } from "./ui/calendar.js";
import { renderAssemblyDetailsView as renderAssemblyDetailsFeature, renderAssemblyModal as renderAssemblyModalFeature } from "./ui/assembly-details.js";

// State
let currentUser = null;
let currentView = 'calendar';
let currentMonth = new Date();
let calendarViewRange = 1;
let activeAssemblyId = null;
let congSortOrder = 'name-asc'; // 'name-asc' | 'name-desc' | 'visit-oldest' | 'visit-newest'
let currentDesign = getStoredDesign();
let sidebarCollapsed = localStorage.getItem('routing-sidebar-collapsed') === 'true';

const setView = (v) => {
    currentView = v;
    document.getElementById('search-input').value = ''; // Clear search on nav
    renderApp();
};

const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const initApp = () => {
    initDesign(); // Initialize design on app start
    onAuthChange((user) => {
        currentUser = user;
        if (user) {
            renderApp();
        } else {
            renderLogin();
        }
    });
};

// ─── LOGIN ───────────────────────────────────────────────
const renderLogin = () => renderLoginScreen({ onLogin: loginUser });

// ─── APP SHELL ───────────────────────────────────────────
// ─── THEME LOGIC ─────────────────────────────────────────
// ─── DESIGN LOGIC ─────────────────────────────────────────
const initDesign = () => {
    applyDesign(currentDesign);
};

const toggleDesign = () => {
    currentDesign = getNextDesign(currentDesign);
    renderApp();
};

// ─── APP SHELL ───────────────────────────────────────────
const renderApp = () => {
    initTheme(); // Initialize theme on render
    initDesign(); // Initialize design on render

    const appContainer = document.querySelector('#app');
    appContainer.innerHTML = getAppShellMarkup({ currentUser, currentView, currentDesign, sidebarCollapsed });

    document.getElementById('nav-calendar').addEventListener('click', () => setView('calendar'));
    document.getElementById('nav-congregations').addEventListener('click', () => setView('congregations'));
    document.getElementById('nav-assemblies').addEventListener('click', () => setView('assemblies'));
    document.getElementById('nav-speakers').addEventListener('click', () => setView('speakers'));
    document.getElementById('nav-reports').addEventListener('click', () => setView('reports'));

    // Mobile nav listeners
    document.getElementById('mob-nav-calendar').addEventListener('click', () => { setView('calendar'); mobMenu.style.display = 'none'; });
    document.getElementById('mob-nav-congregations').addEventListener('click', () => { setView('congregations'); mobMenu.style.display = 'none'; });
    document.getElementById('mob-nav-assemblies').addEventListener('click', () => { setView('assemblies'); mobMenu.style.display = 'none'; });
    document.getElementById('mob-nav-speakers').addEventListener('click', () => { setView('speakers'); mobMenu.style.display = 'none'; });
    document.getElementById('mob-nav-reports').addEventListener('click', () => { setView('reports'); mobMenu.style.display = 'none'; });

    // Mobile menu logic
    const mobMenu = document.getElementById('mobile-menu');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => mobMenu.style.display = 'block');
    document.getElementById('close-mobile-menu').addEventListener('click', () => mobMenu.style.display = 'none');

    document.getElementById('mob-nav-calendar').addEventListener('click', () => { setView('calendar'); });
    document.getElementById('mob-nav-congregations').addEventListener('click', () => { setView('congregations'); });

    const themeToggle = document.getElementById('theme-toggle');
    const mobThemeToggle = document.getElementById('mob-theme-toggle');
    const designToggle = document.getElementById('design-toggle');
    const mobDesignToggleHead = document.getElementById('mob-design-toggle-head');
    const mobDesignToggle = document.getElementById('mob-design-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const mobLogoutBtn = document.getElementById('mob-logout-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (themeToggle) themeToggle.addEventListener('click', () => { toggleTheme(); renderApp(); });
    if (mobThemeToggle) mobThemeToggle.addEventListener('click', () => { toggleTheme(); renderApp(); mobMenu.style.display = 'none'; });
    if (designToggle) designToggle.addEventListener('click', () => toggleDesign());
    if (mobDesignToggleHead) mobDesignToggleHead.addEventListener('click', () => toggleDesign());
    if (mobDesignToggle) mobDesignToggle.addEventListener('click', () => { toggleDesign(); mobMenu.style.display = 'none'; });
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
        sidebarCollapsed = !sidebarCollapsed;
        localStorage.setItem('routing-sidebar-collapsed', String(sidebarCollapsed));
        renderApp();
    });
    if (logoutBtn) logoutBtn.addEventListener('click', () => logoutUser());
    if (mobLogoutBtn) mobLogoutBtn.addEventListener('click', () => logoutUser());

    // Search Logic
    const searchInput = document.getElementById('search-input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            if (term.length > 2) {
                renderSearchResults(document.getElementById('main-content'), term);
            } else if (term.length === 0) {
                // Restore view
                if (currentView === 'calendar') renderCalendarView(document.getElementById('main-content'));
                else renderCongregationsView(document.getElementById('main-content'));
            }
        }, 300);
    });

    const mainContent = document.getElementById('main-content');
    if (currentView === 'calendar') {
        renderCalendarView(mainContent);
    } else if (currentView === 'congregations') {
        renderCongregationsView(mainContent);
    } else if (currentView === 'assemblies') {
        renderAssembliesView(mainContent);
    } else if (currentView === 'speakers') {
        renderSpeakersView(mainContent);
    } else if (currentView === 'reports') {
        renderReportsView(mainContent);
    } else if (currentView === 'assembly-details') {
        renderAssemblyDetailsView(mainContent);
    }
};

const renderSearchResults = async (container, term) => {
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in-down">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Search Results</h2>
            <p class="text-slate-500 dark:text-slate-400">Showing matches for "<span class="font-semibold text-orange-600 dark:text-orange-400">${term}</span>"</p>
            
            <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div id="search-list" class="divide-y divide-slate-100 dark:divide-slate-700">
                    <div class="p-8 text-center text-slate-400 italic">Searching...</div>
                </div>
            </div>
        </div>
    `;

    try {
        // Use the real searchActivities from db.js

        const TYPE_STYLES = {
            'Congregation Visit': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
            'Circuit Assembly': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
            'Special Talk': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
            'Other': { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-800 dark:text-slate-300' },
        };

        const results = await searchActivities(currentUser.uid, term);
        const list = document.getElementById('search-list');

        if (results.length === 0) {
            list.innerHTML = '<div class="p-8 text-center text-slate-400">No matching activities found.</div>';
            return;
        }

        list.innerHTML = results.map(activity => {
            const dateStr = format(activity.week_start.toDate(), 'MMM d, yyyy');
            const style = TYPE_STYLES[activity.type] || TYPE_STYLES['Other']; // Use 'Other' as fallback

            // Serialize for edit
            const actSerial = JSON.stringify({ id: activity.id, type: activity.type, congregation_id: activity.congregation_id || null, congregationName: activity.congregationName || null, notes: activity.notes || '' });
            const weekKey = format(activity.week_start.toDate(), 'yyyy-MM-dd');

            return `
                <div class="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group">
                    <div class="w-32 flex-shrink-0">
                        <span class="block text-sm font-bold text-slate-800 dark:text-slate-200">${dateStr}</span>
                        <span class="inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}">${activity.type}</span>
                    </div>
                    
                    <div class="flex-1">
                         ${activity.congregationName ? `<span class="block text-base font-bold text-slate-700 dark:text-slate-200">${activity.congregationName}</span>` : ''}
                         ${activity.notes ? `<span class="block text-sm text-slate-500 dark:text-slate-400 mt-1">${activity.notes}</span>` : ''}
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="edit-btn text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500 px-4 py-2 rounded-lg transition-all" data-week="${weekKey}" data-activity='${actSerial.replace(/'/g, "&#39;")}'>
                            Edit
                        </button>
                        <button class="remove-btn text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 px-4 py-2 rounded-lg transition-all" data-id="${activity.id}">
                            Remove
                        </button>
                    </div >
                </div >
    `;
        }).join('');

        // Wire up edit buttons
        list.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const actData = JSON.parse(btn.dataset.activity);
                // Assuming openAssignModal is defined elsewhere
                openAssignModal(btn.dataset.week, container, actData);
            });
        });

        // Wire up remove buttons
        list.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent potentially unrelated clicks if any
                if (confirm('Are you sure you want to remove this activity?')) {
                    try {
                        // Change button state to indicate loading
                        const originalText = btn.textContent;
                        btn.textContent = '...';
                        btn.disabled = true;

                        await deleteActivity(btn.dataset.id);

                        // Refresh search results
                        await renderSearchResults(container, term);
                    } catch (err) {
                        alert("Error removing activity: " + err.message);
                        btn.textContent = 'Remove'; // Restore text on error
                        btn.disabled = false;
                    }
                }
            });
        });

    } catch (err) {
        document.getElementById('search-list').innerHTML = `<div class="p-8 text-center text-red-500">Error searching: ${err.message}</div>`;
    }
};

// ─── CONGREGATIONS ───────────────────────────────────────
const renderCongregationsView = async (container) => renderCongregationsFeature(container, {
    currentDesign,
    getCongSortOrder: () => congSortOrder,
    setCongSortOrder: (value) => {
        congSortOrder = value;
    },
});

const renderAssembliesView = async (container) => renderAssembliesFeature(container, {
    onCreateAssembly: (targetContainer) => renderAssemblyModal(targetContainer),
    onEditAssembly: (targetContainer, assembly) => renderAssemblyModal(targetContainer, assembly),
    onOpenAssembly: (assemblyId) => {
        activeAssemblyId = assemblyId;
        setView('assembly-details');
    },
});

// ─── CALENDAR (MONTHLY WEEK-BLOCK VIEW) ──────────────────

const renderCalendarView = async (container) => renderCalendarFeature(container, {
    currentDesign,
    getCurrentMonth: () => currentMonth,
    setCurrentMonth: (value) => {
        currentMonth = value;
    },
    getCalendarViewRange: () => calendarViewRange,
    setCalendarViewRange: (value) => {
        calendarViewRange = value;
    },
    getCurrentUser: () => currentUser,
    openAssignModal,
    downloadCSV,
});

const renderAssemblyDetailsView = async (container, currentDay = 1) => renderAssemblyDetailsFeature(container, currentDay, {
    getActiveAssemblyId: () => activeAssemblyId,
    setView,
    renderAssembliesView,
});

const renderAssemblyModal = async (container, assemblyToEdit = null) => renderAssemblyModalFeature(container, assemblyToEdit, {
    renderAssembliesView,
});

// ─── ASSIGN MODAL ────────────────────────────────────────
const openAssignModal = async (weekKey, calendarContainer, existingActivity) => {
    const modal = document.getElementById('modal-container');
    const congregations = await getCongregations();
    const tuesday = parseISO(weekKey);
    const sunday = addDays(tuesday, 5);
    const weekLabel = `${format(tuesday, 'MMMM d')} – ${format(sunday, 'MMMM d, yyyy')} `;
    const isEdit = !!existingActivity;

    // Fetch last visits for custom dropdown
    const congsWithVisits = await Promise.all(congregations.map(async c => {
        const lastVisit = await getLastVisit(c.id);
        let visitText = 'No previous visits recorded';
        let months = null;
        if (lastVisit) {
            months = Math.floor((tuesday - lastVisit.date) / (1000 * 60 * 60 * 24 * 30.44));
            visitText = `Last Visit: ${format(lastVisit.date, 'MMMM d, yyyy')}`;
        }
        return { ...c, lastVisit, visitText, months };
    }));

    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 m-4 relative animate-fade-in-down transform transition-all border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <button id="close-modal" class="sticky top-2 float-right text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 z-10">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="mb-6">
                <h3 class="text-2xl font-bold text-slate-800 dark:text-white">${isEdit ? 'Edit Activity' : 'Assign Activity'}</h3>
                <p class="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wide">${weekLabel}</p>
            </div>

            <form id="activity-form" class="space-y-6">
                <div>
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Activity Type</label>
                    <div class="relative">
                        <select name="type" id="activity-type" class="block w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 appearance-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                            <option value="Congregation Visit" ${isEdit && existingActivity.type === 'Congregation Visit' ? 'selected' : ''}>Congregation Visit</option>
                            <option value="Assembly" ${isEdit && existingActivity.type === 'Assembly' ? 'selected' : ''}>Assembly</option>
                            <option value="School" ${isEdit && existingActivity.type === 'School' ? 'selected' : ''}>School</option>
                            <option value="Group Visit" ${isEdit && existingActivity.type === 'Group Visit' ? 'selected' : ''}>Group Visit</option>
                            <option value="Pioneer Week" ${isEdit && existingActivity.type === 'Pioneer Week' ? 'selected' : ''}>Pioneer Week</option>
                            <option value="Miscellaneous" ${isEdit && existingActivity.type === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                    </div>
                </div>

                <div id="congregation-field" style="${isEdit && existingActivity.type !== 'Congregation Visit' ? 'display:none' : ''}">
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Congregation</label>
                    <div class="relative" id="custom-cong-dropdown" tabindex="0">
                        <div id="custom-cong-trigger" class="flex items-center justify-between w-full rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer select-none border-b sm:border-b-0">
                            <span id="custom-cong-text" class="truncate">${isEdit && existingActivity.congregationName ? existingActivity.congregationName : 'Select Congregation...'}</span>
                            <svg class="h-4 w-4 text-slate-500 shrink-0 ml-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                        <input type="hidden" name="congregation" id="congregation-select" value="${isEdit && existingActivity.congregation_id ? existingActivity.congregation_id : ''}">
                        
                        <div id="custom-cong-menu" class="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] hidden max-h-[250px] overflow-y-auto isolate py-1 animate-fade-in-up">
                            ${congsWithVisits.map(c => `
                                <div class="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 cong-option transition-colors" data-id="${c.id}" data-name="${c.name}">
                                    <div class="font-bold text-sm text-slate-900 dark:text-white">${c.name}</div>
                                    ${c.lastVisit ? `
                                        <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-[0.05em]">Months Since Last Visit: ${c.months}</div>
                                        <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${c.visitText}</div>
                                    ` : `
                                        <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-[0.05em]">No previous visits recorded</div>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea name="notes" rows="3" class="block w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white resize-none placeholder-slate-400" placeholder="Add any details here...">${isEdit ? existingActivity.notes : ''}</textarea>
                </div>

                <div class="flex justify-end pt-4 gap-3 border-t border-slate-100 dark:border-slate-700 mt-8">
                    <button type="button" id="cancel-btn" class="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" class="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all">${isEdit ? 'Save Changes' : 'Assign Activity'}</button>
                </div>
            </form>
        </div >
    `;
    modal.className = "fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity active";
    modal.style.display = 'flex';

    const typeSelect = document.getElementById('activity-type');
    const congField = document.getElementById('congregation-field');
    const congSelect = document.getElementById('congregation-select');

    // Show/hide congregation based on type
    typeSelect.addEventListener('change', () => {
        congField.style.display = typeSelect.value === 'Congregation Visit' ? '' : 'none';
    });

    // Custom Dropdown Logic
    const dropdownMenu = document.getElementById('custom-cong-menu');
    const dropdownTrigger = document.getElementById('custom-cong-trigger');
    const dropdownText = document.getElementById('custom-cong-text');

    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    dropdownMenu.querySelectorAll('.cong-option').forEach(option => {
        option.addEventListener('click', () => {
            congSelect.value = option.dataset.id;
            dropdownText.textContent = option.dataset.name;
            dropdownMenu.classList.add('hidden');
        });
    });

    // Close handlers
    const closeModal = () => {
        modal.classList.remove('active');
        // small delay to allow animation if we added one, but for now just hide
        modal.style.display = 'none';
        modal.innerHTML = ''; // clear content
    };
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Submit handler
    document.getElementById('activity-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        let congId = null, congName = null;

        if (type === 'Congregation Visit') {
            congId = congSelect.value;
            // Get text from hidden input corresponding option or from the dataset mapping
            let option = document.querySelector(`.cong-option[data-id="${congId}"]`);
            congName = option ? option.dataset.name : '';
            if (!congId) { alert("Please select a congregation"); return; }
        }

        try {
            if (isEdit) {
                await updateActivity(existingActivity.id, {
                    type,
                    congregation_id: congId,
                    congregationName: congName,
                    notes: e.target.notes.value
                });
            } else {
                await addActivity({
                    week_start: tuesday,
                    type,
                    congregation_id: congId,
                    congregationName: congName,
                    notes: e.target.notes.value,
                    user_id: currentUser.uid
                });
            }
            closeModal();
            renderCalendarView(calendarContainer);
        } catch (err) { alert("Error: " + err.message); }
    });
};

// ─── MODALS ──────────────────────────────────────────────
const renderAddSpeakerModal = async (container, existingSpeaker = null) => {
    const isEdit = !!existingSpeaker;
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${isEdit ? 'Edit Speaker' : 'Add New Speaker'}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input id="spk-name" value="${isEdit ? (existingSpeaker.name || '') : ''}" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" type="text"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                    <input id="spk-email" value="${isEdit ? (existingSpeaker.email || '') : ''}" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" type="email"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                    <input id="spk-phone" value="${isEdit ? (existingSpeaker.phone || '') : ''}" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 234 567 890" type="tel"/>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Congregation</label>
                    <input id="spk-congregation" value="${isEdit ? (existingSpeaker.congregation || '') : ''}" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Congregation Name" type="text"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select id="spk-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="Active" ${isEdit && existingSpeaker.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Unavailable" ${isEdit && existingSpeaker.status === 'Unavailable' ? 'selected' : ''}>Unavailable</option>
                        <option value="Pending" ${isEdit && existingSpeaker.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-speaker-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                <span>${isEdit ? 'Save Changes' : 'Add Speaker'}</span>
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

    document.getElementById('save-speaker-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-speaker-btn');
        const name = document.getElementById('spk-name').value;
        if (!name) return alert('Name is required');

        try {
            btn.textContent = 'Saving...';
            btn.disabled = true;
            const data = {
                name,
                email: document.getElementById('spk-email').value,
                phone: document.getElementById('spk-phone').value,
                congregation: document.getElementById('spk-congregation').value,
                status: document.getElementById('spk-status').value
            };

            if (isEdit) {
                await updateSpeaker(existingSpeaker.id, data);
            } else {
                await addSpeaker(data);
            }
            closeModal();
            renderSpeakersView(container); // Refresh
        } catch (e) {
            alert('Error saving: ' + e.message);
            btn.textContent = isEdit ? 'Save Changes' : 'Add Speaker';
            btn.disabled = false;
        }
    });
};

const renderBulkImportSpeakersModal = async (container) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Bulk Import Speakers</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Paste plain text — one speaker per line</p>
            </div>
            <button id="close-bulk-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Format: <code class="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Name, Congregation, Phone, Email</code></label>
                <textarea id="bulk-text" rows="8" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-y" placeholder="John Doe, Central Cong, 555-1234, john@email.com\nJane Smith, East Cong\nBob Johnson"></textarea>
            </div>
            <div id="bulk-preview" class="hidden">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preview (<span id="bulk-count">0</span> speakers)</h4>
                <div class="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="bg-slate-50 dark:bg-slate-700/50"><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Name</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Congregation</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Phone</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Email</th></tr></thead>
                        <tbody id="bulk-preview-body" class="divide-y divide-slate-100 dark:divide-slate-700"></tbody>
                    </table>
                </div>
            </div>
            <div id="bulk-status" class="hidden text-sm font-medium"></div>
        </div>
        <div class="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="bulk-preview-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">Preview</button>
            <div class="flex gap-3">
                <button id="cancel-bulk-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button id="save-bulk-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2" disabled>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Import All</span>
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    document.getElementById('close-bulk-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-bulk-btn').addEventListener('click', closeModal);

    let parsedSpeakers = [];

    const parseBulkText = () => {
        const raw = document.getElementById('bulk-text').value.trim();
        if (!raw) return [];
        return raw.split('\n').filter(l => l.trim()).map(line => {
            const parts = line.split(/[,\t]/).map(p => p.trim());
            return {
                name: parts[0] || '',
                congregation: parts[1] || '',
                phone: parts[2] || '',
                email: parts[3] || '',
                status: 'Active'
            };
        }).filter(s => s.name);
    };

    document.getElementById('bulk-preview-btn').addEventListener('click', () => {
        parsedSpeakers = parseBulkText();
        const preview = document.getElementById('bulk-preview');
        const body = document.getElementById('bulk-preview-body');
        const count = document.getElementById('bulk-count');
        const saveBtn = document.getElementById('save-bulk-btn');

        if (parsedSpeakers.length === 0) {
            preview.classList.add('hidden');
            saveBtn.disabled = true;
            document.getElementById('bulk-status').className = 'text-sm font-medium text-red-500';
            document.getElementById('bulk-status').textContent = 'No valid speakers found. Check your format.';
            document.getElementById('bulk-status').classList.remove('hidden');
            return;
        }

        document.getElementById('bulk-status').classList.add('hidden');
        count.textContent = parsedSpeakers.length;
        body.innerHTML = parsedSpeakers.map(s => `
            <tr>
                <td class="px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium">${s.name}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${s.congregation || '—'}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${s.phone || '—'}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${s.email || '—'}</td>
            </tr>
        `).join('');
        preview.classList.remove('hidden');
        saveBtn.disabled = false;
    });

    document.getElementById('save-bulk-btn').addEventListener('click', async () => {
        if (parsedSpeakers.length === 0) return;
        const btn = document.getElementById('save-bulk-btn');
        const statusEl = document.getElementById('bulk-status');
        btn.disabled = true;
        btn.innerHTML = '<span>Importing...</span>';
        statusEl.className = 'text-sm font-medium text-blue-500';
        statusEl.classList.remove('hidden');

        let saved = 0;
        let errors = 0;
        for (const speaker of parsedSpeakers) {
            try {
                await addSpeaker(speaker);
                saved++;
                statusEl.textContent = `Importing ${saved} of ${parsedSpeakers.length}...`;
            } catch (e) {
                errors++;
                console.error('Error importing speaker:', speaker.name, e);
            }
        }

        if (errors === 0) {
            statusEl.className = 'text-sm font-medium text-green-600';
            statusEl.textContent = `✓ Successfully imported ${saved} speakers!`;
        } else {
            statusEl.className = 'text-sm font-medium text-orange-500';
            statusEl.textContent = `Imported ${saved} speakers, ${errors} failed.`;
        }

        setTimeout(() => {
            closeModal();
            renderSpeakersView(container);
        }, 1200);
    });
};


