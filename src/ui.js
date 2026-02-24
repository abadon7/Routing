import { onAuthChange, loginUser, logoutUser } from "./auth";
import { getCongregations, addCongregation, deleteCongregation, updateCongregation, getLastVisit, getLastTwoVisits, getLastTwoVisitsBefore, getActivitiesForMonth, searchActivities, addActivity, updateActivity, deleteActivity, getAssemblies, addAssembly, deleteAssembly, updateAssembly, getAssembly, getSpeakers, addSpeaker, deleteSpeaker, updateSpeaker, getTalks, addTalk, updateTalk, deleteTalk } from "./db";
import { addDays, format, parseISO, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from 'date-fns';

// State
let currentUser = null;
let currentView = 'calendar'; // 'calendar' or 'congregations'
let currentMonth = new Date(); // tracks which month is displayed
let activeAssemblyId = null; // Track current assembly for details view

const setView = (v) => {
    currentView = v;
    document.getElementById('search-input').value = ''; // Clear search on nav
    renderApp();
};

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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 font-sans transition-colors duration-300">
      <div class="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-100 dark:border-slate-700 transform transition-all hover:scale-[1.01]">
        <div class="mb-8 flex justify-center">
            <div class="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
        </div>
        <h1 class="text-3xl font-bold mb-2 text-slate-800 dark:text-white tracking-tight">Service Scheduler</h1>
        <p class="text-slate-500 dark:text-slate-400 mb-8 text-sm">Organize your ministry efficiently.</p>
        
        <button id="google-login-btn" class="group flex items-center justify-center w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl shadow-sm hover:shadow-md px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
            <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
        </button>
        <p class="mt-8 text-xs text-slate-400 dark:text-slate-500">© 2026 Circuit Overseer Tools</p>
      </div>
    </div>
  `;
    document.getElementById('google-login-btn').addEventListener('click', async () => {
        try { await loginUser(); } catch (e) { alert("Login failed: " + e.message); }
    });
};

// ─── APP SHELL ───────────────────────────────────────────
// ─── THEME LOGIC ─────────────────────────────────────────
const initTheme = () => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

const toggleTheme = () => {
    console.log('Toggling theme...');
    if (document.documentElement.classList.contains('dark')) {
        console.log('Switching to LIGHT');
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        console.log('Switching to DARK');
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
    console.log('Current theme in localStorage:', localStorage.theme);
};

// ─── APP SHELL ───────────────────────────────────────────
const renderApp = () => {
    initTheme(); // Initialize theme on render

    const appContainer = document.querySelector('#app');
    appContainer.innerHTML = `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-300">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex z-20 transition-colors duration-300">
        <div class="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h1 class="text-lg font-bold text-slate-800 dark:text-white tracking-tight">ServiceSync</h1>
            </div>
        </div>
        
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            <p class="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">Main</p>
            <button id="nav-calendar" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'calendar' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                Dashboard
            </button>
            <button id="nav-congregations" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'congregations' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                Congregations
            </button>
            <p class="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">Assembly Manager</p>
            <button id="nav-assemblies" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'assemblies' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                Assemblies
            </button>
            <button id="nav-speakers" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'speakers' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Speakers
            </button>
            <button id="nav-reports" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === 'reports' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Reports
            </button>
        </nav>

        <div class="p-4 border-t border-slate-100 dark:border-slate-700">
             <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" id="user-profile">
                <div class="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs font-bold">
                    ${(currentUser.displayName || currentUser.email).charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">${currentUser.displayName || 'User'}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 truncate">${currentUser.email}</p>
                </div>
                <button id="logout-btn" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
             </div>
        </div>
      </aside>

      <!-- Mobile Header -->
       <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-30 transition-colors duration-300">
            <div class="flex items-center gap-2">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span class="font-bold text-slate-800 dark:text-white">ServiceSync</span>
            </div>
            <button id="mobile-menu-btn" class="text-slate-500 dark:text-slate-400 p-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
            </button>
       </div>
       
       <!-- Mobile Menu Overlay -->
       <div id="mobile-menu" class="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-40 hidden" style="display:none">
          <div class="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 shadow-xl flex flex-col p-4 animate-fade-in-down transition-colors duration-300">
              <div class="flex justify-end mb-4">
                  <button id="close-mobile-menu" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
              </div>
              <button id="mob-nav-calendar" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'calendar' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Dashboard</button>
              <button id="mob-nav-congregations" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'congregations' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Congregations</button>
              <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p class="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Assembly Manager</p>
                  <button id="mob-nav-assemblies" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'assemblies' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Assemblies</button>
                  <button id="mob-nav-speakers" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'speakers' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Speakers</button>
                  <button id="mob-nav-reports" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium mb-1 ${currentView === 'reports' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Reports</button>
              </div>
              <div class="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                <button id="mob-theme-toggle" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                    <span class="dark:hidden">Dark Mode</span>
                    <span class="hidden dark:inline">Light Mode</span>
                </button>
              </div>
              <div class="mt-auto border-t border-slate-100 dark:border-slate-700 pt-4">
                  <button id="mob-logout-btn" class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Logout</button>
              </div>
          </div>
       </div>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-colors duration-300">
         <!-- Top Bar -->
         <header class="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-8 transition-colors duration-300">
             <!-- Search -->
             <div class="flex-1 max-w-lg">
                 <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                     </div>
                     <input type="text" id="search-input" class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="Search appointments or events...">
                 </div>
             </div>
             <!-- Right Actions -->
             <div class="flex items-center gap-4 ml-4">
                 <button id="theme-toggle" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Toggle Theme">
                    <!-- Sun Icon (for Dark Mode) -->
                    <svg class="w-6 h-6 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <!-- Moon Icon (for Light Mode) -->
                    <svg class="w-6 h-6 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                 </button>
                 <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
                     <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                     <span class="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                 </button>
                 <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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

    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const mobThemeToggle = document.getElementById('mob-theme-toggle');

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Desktop theme toggle clicked');
            toggleTheme();
        });
    }

    if (mobThemeToggle) {
        mobThemeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Mobile theme toggle clicked');
            toggleTheme();
        });
    }

    // Navigation logic
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
const renderCongregationsView = async (container) => {
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
        <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-8 border border-slate-200 dark:border-slate-700">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Add Congregation</h2>
            <form id="add-cong-form" class="flex flex-col sm:flex-row gap-4">
                <input type="text" name="name" placeholder="Congregation Name" class="flex-grow shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" required>
                    <input type="text" name="circuit" placeholder="Circuit (Optional)" class="sm:w-1/3 shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400">
                        <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">Add Congregation</button>
                    </form>
                </div>
                <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                        <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200">Congregations Directory</h2>
                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">All Locations</span>
                    </div>
                    <ul id="cong-list" class="divide-y divide-slate-100 dark:divide-slate-700">
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

        // Fetch last two visits for all congregations in parallel
        const visitData = await Promise.all(congs.map(c => getLastTwoVisits(c.id)));
        const today = new Date();

        list.innerHTML = congs.map((c, i) => {
            const { last, previous } = visitData[i];

            let visitHtml = '<span class="text-slate-300 dark:text-slate-600 italic text-xs">Never visited</span>';

            if (last) {
                const daysSinceLast = (today - last.date) / (1000 * 60 * 60 * 24);
                const moSinceLast = (daysSinceLast / 30.44).toFixed(1);
                const lastDateStr = last.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                let comparisonHtml = '';
                if (previous) {
                    const prevIntervalDays = (last.date - previous.date) / (1000 * 60 * 60 * 24);
                    const prevIntervalMo = (prevIntervalDays / 30.44).toFixed(1);
                    const prevDateStr = previous.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    // Compare current gap vs previous interval — overdue if longer
                    const isOverdue = daysSinceLast > prevIntervalDays;
                    const diffMo = Math.abs((daysSinceLast - prevIntervalDays) / 30.44).toFixed(1);
                    const trendColor = isOverdue ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400';
                    const trendArrow = isOverdue ? '↑' : '↓';
                    const trendLabel = isOverdue ? `${diffMo} mo overdue` : `${diffMo} mo ahead`;

                    comparisonHtml = `
                        <span class="flex items-center gap-1 text-xs ${trendColor} font-semibold mt-0.5">
                            <span>${trendArrow}</span>
                            <span>${trendLabel}</span>
                            <span class="text-slate-400 dark:text-slate-500 font-normal">(prev: ${prevDateStr}, ${prevIntervalMo} mo gap)</span>
                        </span>`;
                } else {
                    comparisonHtml = `<span class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No previous visit to compare</span>`;
                }

                visitHtml = `
                    <div class="flex flex-col items-end gap-0.5">
                        <span class="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            Next: ${lastDateStr}
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">${moSinceLast} mo ago</span>
                        ${comparisonHtml}
                    </div>`;
            }

            return `
            <li class="px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex justify-between items-start transition-colors group">
                <div class="flex-1">
                    <span class="block text-slate-800 dark:text-slate-200 font-bold text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">${c.name}</span>
                    <span class="block text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        ${c.circuit || 'No Circuit'}
                    </span>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        ${visitHtml}
                    </div>
                    <button class="edit-cong-btn text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-id="${c.id}" data-name="${c.name}" data-circuit="${c.circuit || ''}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button class="delete-cong-btn text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" data-id="${c.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </li>`;
        }).join('');

        // Wire up buttons
        list.querySelectorAll('.delete-cong-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this congregation?')) {
                    try {
                        await deleteCongregation(btn.dataset.id);
                        loadCongregations();
                    } catch (err) { alert("Error deleting: " + err.message); }
                }
            });
        });

        list.querySelectorAll('.edit-cong-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const form = document.getElementById('add-cong-form');
                form.name.value = btn.dataset.name;
                form.circuit.value = btn.dataset.circuit;

                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.textContent = "Update Congregation";
                submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
                submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

                form.dataset.mode = "edit";
                form.dataset.editId = btn.dataset.id;

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
            <!--Header Section-->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 class="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">${format(currentMonth, 'MMMM yyyy')}</h2>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Weekly facility maintenance and service overview</p>
                </div>
                <!-- Month Nav -->
                <div class="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                     <button id="prev-month" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-l-lg transition-colors border-r border-slate-100 dark:border-slate-700 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        Prev
                    </button>
                    <button id="next-month" class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-r-lg transition-colors flex items-center gap-2">
                        Next
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>

            <!--List Table-->
            <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <!-- Table Header -->
                <div class="hidden sm:grid sm:grid-cols-12 gap-0 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <div class="col-span-3 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Week</div>
                    <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</div>
                    <div class="col-span-5 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</div>
                    <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</div>
                </div>
                
                <!-- Table Rows -->
                <div id="weeks-list" class="divide-y divide-slate-100 dark:divide-slate-700">
                    ${weeks.map((tuesday, index) => {
        const sunday = addDays(tuesday, 5);
        const weekKey = format(tuesday, 'yyyy-MM-dd');
        return `
                        <div class="group sm:grid sm:grid-cols-12 gap-0 items-center p-6 sm:p-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors" data-week="${weekKey}">
                             <!-- Mobile Label -->
                            <div class="sm:hidden text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Week ${index + 1}</div>
                            
                            <div class="col-span-3 sm:px-6 sm:py-6">
                                <span class="block text-lg font-bold text-slate-800 dark:text-slate-200">${format(tuesday, 'MMM d')} – ${format(sunday, 'd')}</span>
                                <span class="block text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Week ${format(tuesday, 'w')}</span>
                            </div>
                            
                            <div class="col-span-2 sm:px-6 sm:py-6 mb-4 sm:mb-0" id="type-${weekKey}">
                                <span class="text-slate-300 dark:text-slate-600 text-sm">—</span>
                            </div>
                            
                            <div class="col-span-5 sm:px-6 sm:py-6 mb-4 sm:mb-0 flex flex-col justify-center min-h-[3rem]" id="details-${weekKey}">
                                <span class="text-slate-400 dark:text-slate-500 text-base italic">No service scheduled</span>
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
            
            <!--Summary Stats Cards-->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-500 dark:text-orange-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white">Scheduled Tasks</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400" id="stat-scheduled">Loading...</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500 dark:text-red-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white">Unassigned Weeks</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400" id="stat-unassigned">Loading...</p>
            </div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow cursor-pointer hover:border-orange-200 dark:hover:border-orange-900">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-500 dark:text-blue-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <div>
                <h4 class="text-lg font-bold text-slate-800 dark:text-white">Export Overview</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400">Download the ${format(currentMonth, 'MMMM yyyy')} schedule.</p>
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
    'Congregation Visit': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-transparent' },
    'Assembly': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-transparent' },
    'School': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-transparent' },
    'Group Visit': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-transparent' },
    'Pioneer Week': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-transparent' },
    'Miscellaneous': { bg: 'bg-gray-100 dark:bg-slate-700/50', text: 'text-gray-800 dark:text-slate-300', border: 'border-transparent' },
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

            if (activity && typeEl && detailsEl && actionEl) {
                const style = TYPE_STYLES[activity.type] || TYPE_STYLES['Congregation Visit'];
                // New Pill Style
                typeEl.innerHTML = `<span class="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}">${activity.type}</span>`;

                let detailHtml = '';
                if (activity.type === 'Congregation Visit' && activity.congregationName) {
                    detailHtml = `<span class="block text-base font-bold text-slate-800 dark:text-slate-200">${activity.congregationName}</span>`;
                } else {
                    detailHtml = `<span class="block text-base font-bold text-slate-800 dark:text-slate-200">${activity.type}</span>`;
                }

                if (activity.notes) {
                    detailHtml += `<span class="block text-sm text-slate-500 dark:text-slate-400 mt-1">${activity.notes}</span>`;
                }
                // Add assigned info visual
                /* detailHtml += `<span class="block text-xs text-slate-400 dark:text-slate-500 mt-1">Assigned to: You</span>`; */

                detailsEl.innerHTML = detailHtml;

                // Fetch and show last-visited info for congregation visits
                // Use getLastTwoVisitsBefore(tuesday) so the current scheduled week
                // is excluded — we only compare visits that already happened.
                if (activity.type === 'Congregation Visit' && activity.congregation_id) {
                    getLastTwoVisitsBefore(activity.congregation_id, tuesday).then(({ last, previous }) => {
                        if (!last || !detailsEl) return;

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
                            const trendLabel = isOverdue ? `${diffMo} mo overdue` : `${diffMo} mo ahead`;
                            comparisonHtml = `<span class="font-semibold ${trendColor}">${trendArrow} ${trendLabel}</span> <span class="text-slate-400">(prev: ${prevIntervalMo} mo gap)</span>`;
                        }

                        const note = document.createElement('span');
                        note.className = 'block text-xs text-orange-500 font-medium mt-1';
                        note.innerHTML = `Last: ${lastDateStr} · ${moSinceLast} mo ago${comparisonHtml ? ' · ' + comparisonHtml : ''}`;
                        detailsEl.appendChild(note);
                    }).catch(() => { });
                }

                // Serialize activity for edit button (strip Firestore Timestamp)
                const actSerial = JSON.stringify({ id: activity.id, type: activity.type, congregation_id: activity.congregation_id || null, congregationName: activity.congregationName || null, notes: activity.notes || '' });
                actionEl.innerHTML = `
                    <div class="flex gap-3 justify-end items-center">
                        <button class="edit-btn flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500 px-4 py-2 rounded-lg transition-all shadow-sm" data-week="${weekKey}" data-activity='${actSerial.replace(/'/g, "&#39;")}'>
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                           Edit
                        </button>
                        <button class="delete-btn flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 px-4 py-2 rounded-lg transition-all shadow-sm" data-id="${activity.id}" data-type="calendar">
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
    const weekLabel = `${format(tuesday, 'MMMM d')} – ${format(sunday, 'MMMM d, yyyy')} `;
    const isEdit = !!existingActivity;

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
                    <div class="relative">
                         <select name="congregation" id="congregation-select" class="block w-full rounded-xl border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 appearance-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
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
// ─── ASSEMBLIES VIEW ──────────────────────────────────────
const renderAssembliesView = async (container) => {
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Assemblies</h2>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Manage and track speaker assignments for upcoming circuits.</p>
            </div>
            <button id="create-assembly-btn" class="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Create New Assembly</span>
            </button>
        </div>

        <!-- Assemblies Table -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assembly Theme / Title</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location/Circuit</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700" id="assemblies-list">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-500 italic">Loading assemblies...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    try {
        const assemblies = await getAssemblies();
        const list = document.getElementById('assemblies-list');

        if (assemblies.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center justify-center">
                            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                            </div>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">No assemblies found</h3>
                            <p class="text-slate-500 dark:text-slate-400 mt-1">Get started by creating a new assembly.</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            list.innerHTML = assemblies.map(a => {
                const dateStr = a.date ? format(a.date, 'MMM d, yyyy') : 'TBD';
                const statusColors = {
                    'Upcoming': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                    'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                    'Draft': 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                };
                const statusClass = statusColors[a.status] || statusColors['Draft'];

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-900 dark:text-white">${a.theme || 'Untitled Assembly'}</div>
                        <div class="text-xs text-slate-500 mt-0.5">ID: #${a.id.slice(0, 6)}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${dateStr}</td>
                    <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${a.location || 'TBD'}</td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">${a.status || 'Draft'}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="view-assembly-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" data-id="${a.id}" title="View Details">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                            <button class="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="Edit">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
        }
    } catch (err) {
        document.getElementById('assemblies-list').innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading assemblies: ${err.message}</td></tr>`;
    }

    // Wire up Create button
    document.getElementById('create-assembly-btn')?.addEventListener('click', () => renderAddAssemblyModal(container));

    // Wire up View buttons
    document.querySelectorAll('.view-assembly-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            activeAssemblyId = id;
            setView('assembly-details');
        });
    });
};

const renderSpeakersView = async (container) => {
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Speaker Management</h2>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Efficiently manage and track speakers across the circuit.</p>
            </div>
            <button id="add-speaker-btn" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Add New Speaker</span>
            </button>
        </div>

        <!-- Filters (Simplified) -->
        <div class="flex items-center gap-3">
             <div class="relative flex-1 max-w-sm">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input type="text" id="speaker-search" class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Search speakers...">
             </div>
        </div>

        <!-- Speakers Table -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Congregation</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone / Contact</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700" id="speakers-list">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-500 italic">Loading speakers...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    try {
        const speakers = await getSpeakers();
        const list = document.getElementById('speakers-list');

        const renderList = (items) => {
            if (items.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                     <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                </div>
                                <h3 class="text-lg font-bold text-slate-900 dark:text-white">No speakers found</h3>
                                <p class="text-slate-500 dark:text-slate-400 mt-1">Add your first speaker to get started.</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                list.innerHTML = items.map(s => {
                    const initials = s.name ? s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                    const statusClass = s.status === 'Unavailable'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                    const statusDot = s.status === 'Unavailable' ? 'bg-amber-500' : 'bg-green-600';

                    return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm border border-blue-200 dark:border-blue-800">
                                    ${initials}
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-slate-900 dark:text-white">${s.name}</p>
                                    ${s.email ? `<p class="text-xs text-slate-500 dark:text-slate-400">${s.email}</p>` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <p class="text-sm text-slate-700 dark:text-slate-300">${s.congregation || 'Unknown'}</p>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <p class="text-sm text-slate-700 dark:text-slate-300 font-mono tracking-tight">${s.phone || '-'}</p>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}">
                                <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                                ${s.status || 'Active'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button class="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="Edit">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                </button>
                                <button class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" title="Delete">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        };

        renderList(speakers);

        // Search Filter
        const searchInput = document.getElementById('speaker-search');
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = speakers.filter(s =>
                s.name.toLowerCase().includes(term) ||
                (s.congregation && s.congregation.toLowerCase().includes(term))
            );
            renderList(filtered);
        });

        // Add Speaker Button
        document.getElementById('add-speaker-btn')?.addEventListener('click', () => renderAddSpeakerModal(container));

    } catch (err) {
        document.getElementById('speakers-list').innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading speakers: ${err.message}</td></tr>`;
    }
};

// ─── ASSEMBLY DETAILS VIEW ──────────────────────────────
const renderAssemblyDetailsView = async (container) => {
    if (!activeAssemblyId) {
        setView('assemblies');
        return;
    }

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
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-6">
                    <button id="back-to-assemblies" class="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">analytics</span>
                            <h2 id="asm-detail-theme" class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Loading...</h2>
                        </div>
                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                            <span class="material-symbols-outlined text-sm">event</span>
                            <span id="asm-detail-date" class="text-sm font-medium">---</span>
                            <span class="mx-2">•</span>
                            <span class="material-symbols-outlined text-sm">location_on</span>
                            <span id="asm-detail-location" class="text-sm font-medium">---</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                        <span class="material-symbols-outlined text-sm">description</span>
                        Generate Report
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Total Talks -->
                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Talks</p>
                        <h3 id="stat-total-talks" class="text-3xl font-black text-slate-900 dark:text-white">0</h3>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined">record_voice_over</span>
                    </div>
                </div>
                <!-- Confirmed Speakers -->
                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirmed Speakers</p>
                        <h3 id="stat-confirmed-speakers" class="text-3xl font-black text-slate-900 dark:text-white">0</h3>
                    </div>
                    <div class="w-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center h-12">
                        <span class="material-symbols-outlined">person_check</span>
                    </div>
                </div>
                <!-- Pending Assignments -->
                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                    <div>
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Assignments</p>
                        <h3 id="stat-pending-assignments" class="text-3xl font-black text-slate-900 dark:text-white">0</h3>
                    </div>
                    <div class="w-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center h-12">
                        <span class="material-symbols-outlined">assignment_late</span>
                    </div>
                </div>
            </div>

            <!-- Schedule Management Table -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div class="flex flex-col">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Schedule Management</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Manage talks, speakers, and status</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="add-talk-btn" class="px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                            <span class="material-symbols-outlined text-sm">add</span> Add New Talk
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th class="px-6 py-4">No.</th>
                                <th class="px-6 py-4">Start Time</th>
                                <th class="px-6 py-4">Talk Title</th>
                                <th class="px-6 py-4">Type</th>
                                <th class="px-6 py-4">Duration</th>
                                <th class="px-6 py-4">Speaker</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4 text-right">Actions</th>
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
        document.getElementById('asm-detail-theme').textContent = assembly.theme || 'Untitled Assembly';
        document.getElementById('asm-detail-date').textContent = assembly.date ? format(assembly.date, 'MMMM d, yyyy') : 'TBD';
        document.getElementById('asm-detail-location').textContent = assembly.location || 'TBD';

        // Populate Stats
        document.getElementById('stat-total-talks').textContent = talks.length;
        const confirmed = talks.filter(t => t.status === 'Confirmed').length;
        document.getElementById('stat-confirmed-speakers').textContent = confirmed;
        document.getElementById('stat-pending-assignments').textContent = talks.length - confirmed;

        // Populate Table
        const list = document.getElementById('talks-list');
        if (talks.length === 0) {
            list.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-slate-500 italic">No talks scheduled yet. Click "Add New Talk" to get started.</td></tr>`;
        } else {
            list.innerHTML = talks.map((t, index) => {
                const statusColors = {
                    'Confirmed': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                    'Pending': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                    'Cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                };
                const statusClass = statusColors[t.status] || statusColors['Pending'];
                const statusDot = t.status === 'Confirmed' ? 'bg-emerald-500' : (t.status === 'Cancelled' ? 'bg-red-500' : 'bg-amber-500');

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td class="px-6 py-5 text-sm font-medium text-slate-500">${index + 1}</td>
                    <td class="px-6 py-5 text-sm font-semibold text-slate-900 dark:text-white">${t.startTime}</td>
                    <td class="px-6 py-5">
                        <p class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${t.title}</p>
                    </td>
                    <td class="px-6 py-5">
                        <span class="inline-flex items-center justify-center h-6 px-2 rounded bg-slate-100 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">${t.type || 'TK'}</span>
                    </td>
                    <td class="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">${t.duration} min</td>
                    <td class="px-6 py-5">
                        ${t.speakerName ? `
                        <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">${t.speakerName.substring(0, 2).toUpperCase()}</div>
                             <span class="text-sm font-semibold text-slate-900 dark:text-white">${t.speakerName}</span>
                             <button class="text-slate-300 hover:text-blue-500 transition-colors"><span class="material-symbols-outlined text-xs">edit</span></button>
                        </div>
                        ` : `
                        <button class="text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">person_add</span> Assign
                        </button>
                        `}
                    </td>
                    <td class="px-6 py-5">
                         <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}">
                            <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                            ${t.status || 'Pending'}
                        </span>
                    </td>
                    <td class="px-6 py-5 text-right">
                        <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><span class="material-symbols-outlined">more_horiz</span></button>
                    </td>
                </tr>
                `;
            }).join('');
        }

        // Show content
        document.getElementById('loading-details').classList.add('hidden');
        document.getElementById('details-content').classList.remove('hidden');

        // Wire events
        document.getElementById('back-to-assemblies').addEventListener('click', () => setView('assemblies'));
        document.getElementById('add-talk-btn').addEventListener('click', () => {
            renderAddTalkModal(container, activeAssemblyId);
        });

    } catch (err) {
        container.innerHTML = `<div class="p-8 text-center text-red-500">Error loading details: ${err.message} <br> <button class="mt-4 px-4 py-2 bg-slate-200 rounded" onclick="window.location.reload()">Reload</button></div>`;
    }
};

const renderReportsView = async (container) => {
    container.innerHTML = `
    <div class="space-y-6 animate-fade-in-down">
        <h2 class="text-3xl font-bold text-slate-900 dark:text-white">Reports</h2>
        <div class="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <p class="text-slate-500 dark:text-slate-400">Reports dashboard coming soon...</p>
        </div>
    </div>`;
};

// ─── MODALS ──────────────────────────────────────────────
const renderAddSpeakerModal = async (container) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Add New Speaker</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input id="spk-name" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" type="text"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                    <input id="spk-email" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" type="email"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                    <input id="spk-phone" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 234 567 890" type="tel"/>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Congregation</label>
                    <input id="spk-congregation" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Congregation Name" type="text"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select id="spk-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="Active">Active</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-speaker-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                <span>Add Speaker</span>
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
            await addSpeaker({
                name,
                email: document.getElementById('spk-email').value,
                phone: document.getElementById('spk-phone').value,
                congregation: document.getElementById('spk-congregation').value,
                status: document.getElementById('spk-status').value
            });
            closeModal();
            renderSpeakersView(container); // Refresh
        } catch (e) {
            alert('Error saving: ' + e.message);
            btn.textContent = 'Add Speaker';
            btn.disabled = false;
        }
    });
};

const renderAddAssemblyModal = async (container) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Create New Assembly</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme / Title</label>
                <input id="asm-theme" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Circuit Assembly 2026" type="text"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                    <input id="asm-date" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" type="date"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
                    <input id="asm-location" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Assembly Hall" type="text"/>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select id="asm-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="Upcoming">Upcoming</option>
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-assembly-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20 transition-all flex items-center gap-2">
                <span>Create Assembly</span>
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

    document.getElementById('save-assembly-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-assembly-btn');
        const theme = document.getElementById('asm-theme').value;
        const dateVal = document.getElementById('asm-date').value;
        if (!theme || !dateVal) return alert('Theme and Date are required');

        try {
            btn.textContent = 'Saving...';
            btn.disabled = true;
            await addAssembly({
                theme,
                date: new Date(dateVal),
                location: document.getElementById('asm-location').value,
                status: document.getElementById('asm-status').value,
                progress: 0 // Default 0 progress
            });
            closeModal();
            renderAssembliesView(container); // Refresh
        } catch (e) {
            alert('Error saving: ' + e.message);
            btn.textContent = 'Create Assembly';
            btn.disabled = false;
        }
    });
};

const renderAddTalkModal = async (container, assemblyId) => {
    const speakers = await getSpeakers();
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[620px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Add New Talk</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="grid grid-cols-3 gap-4">
                <div class="col-span-1 space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                    <input id="talk-time" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="time" value="09:30"/>
                </div>
                <div class="col-span-2 space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Talk Title / Theme</label>
                    <input id="talk-title" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Opening Song" type="text"/>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                    <select id="talk-type" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="SC">Symposium (SC)</option>
                        <option value="AC">Address (AC)</option>
                        <option value="OS">Song/Prayer (OS)</option>
                        <option value="TK">Talk (TK)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration (min)</label>
                    <input id="talk-duration" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="number" value="10"/>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign Speaker (Optional)</label>
                <select id="talk-speaker" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- No Speaker Assigned --</option>
                    ${speakers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="space-y-1.5">
                 <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                 <select id="talk-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                 </select>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-talk-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                <span>Save Talk</span>
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

    document.getElementById('save-talk-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-talk-btn');
        const title = document.getElementById('talk-title').value;
        if (!title) return alert('Title is required');

        try {
            btn.textContent = 'Saving...';
            btn.disabled = true;

            const speakerSelect = document.getElementById('talk-speaker');
            const speakerId = speakerSelect.value;
            const speakerName = speakerId ? speakerSelect.options[speakerSelect.selectedIndex].text : null;

            await addTalk(assemblyId, {
                title,
                startTime: document.getElementById('talk-time').value, // store as string HH:mm for simplicity or construct Date
                type: document.getElementById('talk-type').value,
                duration: parseInt(document.getElementById('talk-duration').value),
                speakerId,
                speakerName,
                status: document.getElementById('talk-status').value
            });
            closeModal();
            renderAssemblyDetailsView(container); // Refresh details view
        } catch (e) {
            alert('Error saving: ' + e.message);
            btn.textContent = 'Save Talk';
            btn.disabled = false;
        }
    });
};
