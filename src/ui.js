import { onAuthChange, loginUser, logoutUser } from "./auth";
import { getCongregations, addCongregation, deleteCongregation, updateCongregation, getLastVisit, getActivitiesForMonth, searchActivities, addActivity, updateActivity, deleteActivity } from "./db";
import { addDays, format, parseISO, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from 'date-fns';

// State
let currentUser = null;
let currentView = 'calendar'; // 'calendar' or 'congregations'
let currentMonth = new Date(); // tracks which month is displayed

export const initApp = () => {
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
const renderLogin = () => {
    const appContainer = document.querySelector('#app');
    appContainer.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
      <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-100 transform transition-all hover:scale-[1.01]">
        <div class="mb-8 flex justify-center">
            <div class="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
        </div>
        <h1 class="text-3xl font-bold mb-2 text-slate-800 tracking-tight">Service Scheduler</h1>
        <p class="text-slate-500 mb-8 text-sm">Organize your ministry efficiently.</p>
        
        <button id="google-login-btn" class="group flex items-center justify-center w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl shadow-sm hover:shadow-md px-4 py-3 text-sm font-medium text-slate-700 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
            <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
        </button>
        <p class="mt-8 text-xs text-slate-400">© 2026 Circuit Overseer Tools</p>
      </div>
    </div>
  `;
    document.getElementById('google-login-btn').addEventListener('click', async () => {
        try { await loginUser(); } catch (e) { alert("Login failed: " + e.message); }
    });
};

// ─── APP SHELL ───────────────────────────────────────────
const renderApp = () => {
    const appContainer = document.querySelector('#app');
    appContainer.innerHTML = `
    <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-20">
        <div class="h-16 flex items-center px-6 border-b border-slate-100">
            <div class="flex items-center gap-3">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h1 class="text-lg font-bold text-slate-800 tracking-tight">ServiceSync</h1>
            </div>
        </div>
        
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            <p class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Main</p>
            <button id="nav-calendar" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'calendar' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                Dashboard
            </button>
            <button id="nav-congregations" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'congregations' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                Congregations
            </button>
        </nav>

        <div class="p-4 border-t border-slate-100">
             <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" id="user-profile">
                <div class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                    ${(currentUser.displayName || currentUser.email).charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700 truncate">${currentUser.displayName || 'User'}</p>
                    <p class="text-xs text-slate-400 truncate">${currentUser.email}</p>
                </div>
                <button id="logout-btn" class="text-slate-400 hover:text-red-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
             </div>
        </div>
      </aside>

      <!-- Mobile Header -->
       <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
            <div class="flex items-center gap-2">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span class="font-bold text-slate-800">ServiceSync</span>
            </div>
            <button id="mobile-menu-btn" class="text-slate-500 p-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
            </button>
       </div>
       
       <!-- Mobile Menu Overlay -->
       <div id="mobile-menu" class="md:hidden fixed inset-0 bg-slate-900/50 z-40 hidden" style="display:none">
          <div class="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col p-4 animate-fade-in-down">
              <div class="flex justify-end mb-4">
                  <button id="close-mobile-menu" class="text-slate-400 hover:text-slate-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
              </div>
              <button id="mob-nav-calendar" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'calendar' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}">Dashboard</button>
              <button id="mob-nav-congregations" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'congregations' ? 'bg-orange-50 text-orange-700' : 'text-slate-600'}">Congregations</button>
              <div class="mt-auto border-t pt-4">
                  <button id="mob-logout-btn" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600">Logout</button>
              </div>
          </div>
       </div>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         <!-- Top Bar -->
         <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8">
             <!-- Search -->
             <div class="flex-1 max-w-lg">
                 <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                     </div>
                     <input type="text" id="search-input" class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="Search appointments or events...">
                 </div>
             </div>
             <!-- Right Actions -->
             <div class="flex items-center gap-4 ml-4">
                 <button class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors relative">
                     <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                     <span class="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                 </button>
                 <button class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                     <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 </button>
             </div>
         </header>

         <!-- Content Area -->
         <div class="flex-1 overflow-y-auto p-6 md:p-8" id="main-content">
            <!-- Dynamic Content -->
         </div>
      </main>
    </div>
    <!-- Modal Container -->
    <div id="modal-container" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center transition-opacity" style="display:none"></div>
  `;

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    const mobLogoutBtn = document.getElementById('mob-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logoutUser());
    if (mobLogoutBtn) mobLogoutBtn.addEventListener('click', () => logoutUser());

    // Navigation logic
    const setView = (v) => {
        currentView = v;
        document.getElementById('search-input').value = ''; // Clear search on nav
        renderApp();
    };
    document.getElementById('nav-calendar').addEventListener('click', () => setView('calendar'));
    document.getElementById('nav-congregations').addEventListener('click', () => setView('congregations'));

    // Mobile menu logic
    const mobMenu = document.getElementById('mobile-menu');
    document.getElementById('mobile-menu-btn').addEventListener('click', () => mobMenu.style.display = 'block');
    document.getElementById('close-mobile-menu').addEventListener('click', () => mobMenu.style.display = 'none');

    document.getElementById('mob-nav-calendar').addEventListener('click', () => { setView('calendar'); });
    document.getElementById('mob-nav-congregations').addEventListener('click', () => { setView('congregations'); });

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
    } else {
        renderCongregationsView(mainContent);
    }
};

const renderSearchResults = async (container, term) => {
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in-down">
            <h2 class="text-2xl font-bold text-slate-800">Search Results</h2>
            <p class="text-slate-500">Showing matches for "<span class="font-semibold text-orange-600">${term}</span>"</p>
            
            <div class="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <div id="search-list" class="divide-y divide-slate-100">
                    <div class="p-8 text-center text-slate-400 italic">Searching...</div>
                </div>
            </div>
        </div>
    `;

    try {
        // Use the real searchActivities from db.js

        const TYPE_STYLES = {
            'Congregation Visit': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'Circuit Assembly': { bg: 'bg-purple-100', text: 'text-purple-800' },
            'Special Talk': { bg: 'bg-green-100', text: 'text-green-800' },
            'Other': { bg: 'bg-gray-100', text: 'text-gray-800' },
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
                <div class="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 group">
                    <div class="w-32 flex-shrink-0">
                        <span class="block text-sm font-bold text-slate-800">${dateStr}</span>
                        <span class="inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}">${activity.type}</span>
                    </div>
                    
                    <div class="flex-1">
                         ${activity.congregationName ? `<span class="block text-base font-bold text-slate-700">${activity.congregationName}</span>` : ''}
                         ${activity.notes ? `<span class="block text-sm text-slate-500 mt-1">${activity.notes}</span>` : ''}
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="edit-btn text-sm font-medium text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-all" data-week="${weekKey}" data-activity='${actSerial.replace(/'/g, "&#39;")}'>
                            Edit
                        </button>
                        <button class="remove-btn text-sm font-medium text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-300 px-4 py-2 rounded-lg transition-all" data-id="${activity.id}">
                            Remove
                        </button>
                    </div>
                </div>
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
const renderCongregationsView = async (container) => {
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
      <div class="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Add Congregation</h2>
        <form id="add-cong-form" class="flex flex-col sm:flex-row gap-4">
          <input type="text" name="name" placeholder="Congregation Name" class="flex-grow shadow-sm border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none" required>
          <input type="text" name="circuit" placeholder="Circuit (Optional)" class="sm:w-1/3 shadow-sm border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none">
          <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">Add Congregation</button>
        </form>
      </div>
      <div class="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
        <div class="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h2 class="text-lg font-bold text-slate-700">Congregations Directory</h2>
             <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">All Locations</span>
        </div>
        <ul id="cong-list" class="divide-y divide-slate-100">
           <li class="p-8 text-center text-slate-400 italic">Loading congregations...</li>
        </ul>
      </div>
    </div>`;

    document.getElementById('add-cong-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const circuit = e.target.circuit.value;
        const form = e.target;

        try {
            if (form.dataset.mode === "edit") {
                await updateCongregation(form.dataset.editId, { name, circuit });
                // Reset mode
                form.dataset.mode = "";
                form.dataset.editId = "";
                form.querySelector('button[type="submit"]').textContent = "Add Congregation";
                const btn = form.querySelector('button[type="submit"]');
                btn.classList.add('bg-orange-500', 'hover:bg-orange-600');
                btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            } else {
                await addCongregation(name, circuit);
            }
            e.target.reset();
            loadCongregations();
        } catch (err) { alert("Error: " + err.message); }
    });
    loadCongregations();
};

const loadCongregations = async () => {
    try {
        const congs = await getCongregations();
        const list = document.getElementById('cong-list');
        if (!list) return; // View was navigated away
        if (congs.length === 0) {
            list.innerHTML = '<li class="p-8 text-center text-slate-400">No congregations found. Add one above.</li>';
            return;
        }
        list.innerHTML = congs.map(c => `
            <li class="px-8 py-5 hover:bg-slate-50 flex justify-between items-center transition-colors group">
                <div class="flex-1">
                    <span class="block text-slate-800 font-bold text-lg group-hover:text-orange-600 transition-colors">${c.name}</span>
                    <span class="block text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        ${c.circuit || 'No Circuit'}
                    </span>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right text-sm text-slate-400 mr-2">
                        ${c.last_visit_date
                ? `<span class="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Last: ${new Date(c.last_visit_date.seconds * 1000).toLocaleDateString()}</span>`
                : '<span class="text-slate-300 italic">Never visited</span>'}
                    </div>
                    <button class="edit-cong-btn text-slate-400 hover:text-blue-600 transition-colors" data-id="${c.id}" data-name="${c.name}" data-circuit="${c.circuit || ''}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button class="delete-cong-btn text-slate-400 hover:text-red-600 transition-colors" data-id="${c.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </li>
        `).join('');

        // Wire up buttons
        list.querySelectorAll('.delete-cong-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this congregation?')) {
                    try {
                        // Assuming deleteCongregation is imported (need to add to import list)
                        await deleteCongregation(btn.dataset.id);
                        loadCongregations();
                    } catch (err) { alert("Error deleting: " + err.message); }
                }
            });
        });

        list.querySelectorAll('.edit-cong-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Populate the add form
                const form = document.getElementById('add-cong-form');
                form.name.value = btn.dataset.name;
                form.circuit.value = btn.dataset.circuit;

                // Change button text to "Update Congregation"
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.textContent = "Update Congregation";
                submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
                submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

                // Attach a one-time handler for update (complex to do cleanly with existing listener)
                // Cleaner way: Set a data attribute on the form
                form.dataset.mode = "edit";
                form.dataset.editId = btn.dataset.id;

                // Scroll to form
                form.scrollIntoView({ behavior: 'smooth' });
            });
        });

    } catch (err) {
        document.getElementById('cong-list').innerHTML = `<li class="p-6 text-center text-red-500">Error: ${err.message}</li>`;
    }
};

// ─── CALENDAR (MONTHLY WEEK-BLOCK VIEW) ──────────────────

/**
 * Compute all Tuesday-start service weeks that overlap with a given month.
 * Returns an array of Date objects, each being a Tuesday.
 */
const getServiceWeeksForMonth = (monthDate) => {
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);
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

const renderCalendarView = async (container) => {
    const weeks = getServiceWeeksForMonth(currentMonth);

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in-down">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 class="text-3xl font-bold text-slate-800 tracking-tight">${format(currentMonth, 'MMMM yyyy')}</h2>
                    <p class="text-slate-500 mt-1">Weekly facility maintenance and service overview</p>
                </div>
                <!-- Month Nav -->
                <div class="flex bg-white rounded-lg shadow-sm border border-slate-200">
                     <button id="prev-month" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-l-lg transition-colors border-r border-slate-100 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Prev
                    </button>
                    <button id="next-month" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-r-lg transition-colors flex items-center gap-2">
                        Next
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>

            <!-- List Table -->
            <div class="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <!-- Table Header -->
                <div class="hidden sm:grid sm:grid-cols-12 gap-0 bg-slate-50 border-b border-slate-200">
                    <div class="col-span-3 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Week</div>
                    <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</div>
                    <div class="col-span-5 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</div>
                    <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</div>
                </div>
                
                <!-- Table Rows -->
                <div id="weeks-list" class="divide-y divide-slate-100">
                    ${weeks.map((tuesday, index) => {
        const sunday = addDays(tuesday, 5);
        const weekKey = format(tuesday, 'yyyy-MM-dd');
        return `
                        <div class="group sm:grid sm:grid-cols-12 gap-0 items-center p-6 sm:p-0 hover:bg-slate-50/50 transition-colors" data-week="${weekKey}">
                             <!-- Mobile Label -->
                            <div class="sm:hidden text-xs font-bold text-slate-400 uppercase mb-2">Week ${index + 1}</div>
                            
                            <div class="col-span-3 sm:px-6 sm:py-6">
                                <span class="block text-lg font-bold text-slate-800">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')}</span>
                                <span class="block text-xs text-slate-400 font-medium mt-1">Week ${format(tuesday, 'w')}</span>
                            </div>
                            
                            <div class="col-span-2 sm:px-6 sm:py-6 mb-4 sm:mb-0" id="type-${weekKey}">
                                <span class="text-slate-300 text-sm">—</span>
                            </div>
                            
                            <div class="col-span-5 sm:px-6 sm:py-6 mb-4 sm:mb-0 flex flex-col justify-center min-h-[3rem]" id="details-${weekKey}">
                                <span class="text-slate-400 text-base italic">No service scheduled</span>
                            </div>
                            
                            <div class="col-span-2 sm:px-6 sm:py-6 text-right" id="action-${weekKey}">
                                <button class="assign-btn inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5" data-week="${weekKey}">
                                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                    Assign
                                </button>
                            </div>
                        </div>`;
    }).join('')}
                </div>
            </div>
            
            <!-- Summary Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                    <div class="p-3 bg-orange-50 rounded-full text-orange-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-slate-800">Scheduled Tasks</h4>
                        <p class="text-sm text-slate-500" id="stat-scheduled">Loading...</p>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                    <div class="p-3 bg-red-50 rounded-full text-red-500">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-slate-800">Unassigned Weeks</h4>
                        <p class="text-sm text-slate-500" id="stat-unassigned">Loading...</p>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow cursor-pointer hover:border-orange-200">
                    <div class="p-3 bg-blue-50 rounded-full text-blue-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-slate-800">Export Overview</h4>
                        <p class="text-sm text-slate-500">Download the ${format(currentMonth, 'MMMM yyyy')} schedule.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Month stats update
    const updateStats = (count) => {
        const total = weeks.length;
        document.getElementById('stat-scheduled').textContent = `${count} tasks planned for this month`;
        document.getElementById('stat-unassigned').textContent = `${total - count} weeks require assignment`;
    };

    // Month navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth = subMonths(currentMonth, 1);
        renderCalendarView(container);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth = addMonths(currentMonth, 1);
        renderCalendarView(container);
    });

    // Event delegation
    document.getElementById('weeks-list').addEventListener('click', (e) => {
        const assignBtn = e.target.closest('.assign-btn');
        if (assignBtn) {
            openAssignModal(assignBtn.dataset.week, container, null);
            return;
        }
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const actData = JSON.parse(editBtn.dataset.activity);
            openAssignModal(editBtn.dataset.week, container, actData);
            return;
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            if (confirm('Remove this activity?')) {
                deleteActivity(deleteBtn.dataset.id).then(() => {
                    renderCalendarView(container);
                });
            }
        }
    });

    // Load existing activities
    const count = await loadMonthActivities(weeks);
    updateStats(count);
};

const TYPE_STYLES = {
    'Congregation Visit': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-transparent' },
    'Assembly': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-transparent' },
    'School': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-transparent' },
    'Group Visit': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-transparent' },
    'Pioneer Week': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-transparent' },
    'Miscellaneous': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-transparent' },
};

const loadMonthActivities = async (weeks) => {
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
            const typeEl = document.getElementById(`type-${weekKey}`);
            const detailsEl = document.getElementById(`details-${weekKey}`);
            const actionEl = document.getElementById(`action-${weekKey}`);

            if (activity) {
                const style = TYPE_STYLES[activity.type] || TYPE_STYLES['Congregation Visit'];
                // New Pill Style
                typeEl.innerHTML = `<span class="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}">${activity.type}</span>`;

                let detailHtml = '';
                if (activity.type === 'Congregation Visit' && activity.congregationName) {
                    detailHtml = `<span class="block text-base font-bold text-slate-800">${activity.congregationName}</span>`;
                } else {
                    detailHtml = `<span class="block text-base font-bold text-slate-800">${activity.type}</span>`;
                }

                if (activity.notes) {
                    detailHtml += `<span class="block text-sm text-slate-500 mt-1">${activity.notes}</span>`;
                }
                // Add assigned info visual
                detailHtml += `<span class="block text-xs text-slate-400 mt-1">Assigned to: You</span>`;

                detailsEl.innerHTML = detailHtml;

                // Fetch and show last-visited info for congregation visits
                if (activity.type === 'Congregation Visit' && activity.congregation_id) {
                    getLastVisit(activity.congregation_id).then(lastVisit => {
                        if (lastVisit && detailsEl) {
                            const months = Math.floor((tuesday - lastVisit.date) / (1000 * 60 * 60 * 24 * 30.44));
                            // Append to details
                            const note = document.createElement('span');
                            note.className = "block text-xs text-orange-500 font-medium mt-1";
                            note.textContent = `Last visit: ${format(lastVisit.date, 'MMM d, yyyy')} (${months}m ago)`;
                            detailsEl.appendChild(note);
                        }
                    }).catch(() => { });
                }

                // Serialize activity for edit button (strip Firestore Timestamp)
                const actSerial = JSON.stringify({ id: activity.id, type: activity.type, congregation_id: activity.congregation_id || null, congregationName: activity.congregationName || null, notes: activity.notes || '' });
                actionEl.innerHTML = `
                    <div class="flex gap-3 justify-end items-center">
                        <button class="edit-btn flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-600 bg-white border border-slate-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-all shadow-sm" data-week="${weekKey}" data-activity='${actSerial.replace(/'/g, "&#39;")}'>
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                           Edit
                        </button>
                        <button class="delete-btn flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-white border border-slate-200 hover:border-red-300 px-4 py-2 rounded-lg transition-all shadow-sm" data-id="${activity.id}" data-type="calendar">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                           Remove
                        </button>
                    </div>`;
            }
        });
    } catch (err) {
        console.error("Error loading activities:", err);
    }
    return count;
};

// ─── ASSIGN MODAL ────────────────────────────────────────
const openAssignModal = async (weekKey, calendarContainer, existingActivity) => {
    const modal = document.getElementById('modal-container');
    const congregations = await getCongregations();
    const tuesday = parseISO(weekKey);
    const sunday = addDays(tuesday, 5);
    const weekLabel = `${format(tuesday, 'MMMM d')} – ${format(sunday, 'MMMM d, yyyy')}`;
    const isEdit = !!existingActivity;

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 m-4 relative animate-fade-in-down transform transition-all">
            <button id="close-modal" class="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-50">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="mb-6">
                <h3 class="text-2xl font-bold text-slate-800">${isEdit ? 'Edit Activity' : 'Assign Activity'}</h3>
                <p class="text-sm font-medium text-blue-600 mt-1 uppercase tracking-wide">${weekLabel}</p>
            </div>

            <form id="activity-form" class="space-y-6">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity Type</label>
                    <div class="relative">
                        <select name="type" id="activity-type" class="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 appearance-none bg-slate-50">
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
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Congregation</label>
                    <div class="relative">
                         <select name="congregation" id="congregation-select" class="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 appearance-none bg-slate-50">
                            <option value="">Select Congregation...</option>
                            ${congregations.map(c => `<option value="${c.id}" ${isEdit && existingActivity.congregation_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                    </div>
                    <div id="last-visit-info" class="mt-2 text-xs font-medium h-4 transition-all"></div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                    <textarea name="notes" rows="3" class="block w-full rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 resize-none" placeholder="Add any details here...">${isEdit ? existingActivity.notes : ''}</textarea>
                </div>

                <div class="flex justify-end pt-4 gap-3 border-t border-slate-100 mt-8">
                    <button type="button" id="cancel-btn" class="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" class="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all">${isEdit ? 'Save Changes' : 'Assign Activity'}</button>
                </div>
            </form>
        </div>
    `;
    modal.className = "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity active";
    modal.style.display = 'flex';

    const typeSelect = document.getElementById('activity-type');
    const congField = document.getElementById('congregation-field');
    const congSelect = document.getElementById('congregation-select');
    const lastVisitInfo = document.getElementById('last-visit-info');

    // Show/hide congregation based on type
    typeSelect.addEventListener('change', () => {
        congField.style.display = typeSelect.value === 'Congregation Visit' ? '' : 'none';
    });

    // Dynamic Last Visit Logic
    const fetchLastVisit = async (congId) => {
        if (!congId) { lastVisitInfo.textContent = ''; return; }
        lastVisitInfo.textContent = 'Checking history...';
        try {
            const lastVisit = await getLastVisit(congId);
            if (lastVisit) {
                const months = Math.floor((tuesday - lastVisit.date) / (1000 * 60 * 60 * 24 * 30.44));
                lastVisitInfo.innerHTML = `<span class="text-blue-600">Last visited: ${format(lastVisit.date, 'MMM d, yyyy')} (${months} months ago)</span>`;
            } else {
                lastVisitInfo.innerHTML = '<span class="text-slate-400">No previous visit recorded.</span>';
            }
        } catch (err) { lastVisitInfo.textContent = ''; console.error(err); }
    };
    congSelect.addEventListener('change', () => fetchLastVisit(congSelect.value));

    // If editing a congregation visit, fetch last visit info right away
    if (isEdit && existingActivity.type === 'Congregation Visit' && existingActivity.congregation_id) {
        fetchLastVisit(existingActivity.congregation_id);
    }

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
            congName = congSelect.options[congSelect.selectedIndex].text;
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
