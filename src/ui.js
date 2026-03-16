import { onAuthChange, loginUser, logoutUser } from "./auth";
import { getCongregations, addCongregation, deleteCongregation, updateCongregation, getLastVisit, getLastTwoVisits, getLastTwoVisitsBefore, getActivitiesForMonth, searchActivities, addActivity, updateActivity, deleteActivity, getAssemblies, addAssembly, deleteAssembly, updateAssembly, getAssembly, getSpeakers, addSpeaker, deleteSpeaker, updateSpeaker, getTalks, addTalk, updateTalk, deleteTalk } from "./db";
import { addDays, format, parseISO, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from 'date-fns';

// State
let currentUser = null;
let currentView = 'calendar';
let currentMonth = new Date();
let calendarViewRange = 1;
let activeAssemblyId = null;
let congSortOrder = 'name-asc'; // 'name-asc' | 'name-desc' | 'visit-oldest' | 'visit-newest'
let currentDesign = localStorage.design || 'default';

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

// ─── DESIGN LOGIC ─────────────────────────────────────────
const initDesign = () => {
    document.documentElement.classList.remove('foundation-design');
    if (currentDesign === 'foundation') {
        document.documentElement.classList.add('foundation-design');
    }
};

const toggleDesign = () => {
    console.log('Toggling design...');
    currentDesign = (currentDesign === 'default') ? 'foundation' : 'default';

    localStorage.design = currentDesign;
    console.log('Current design:', currentDesign);
    renderApp();
};

// ─── APP SHELL ───────────────────────────────────────────
const renderApp = () => {
    initTheme(); // Initialize theme on render
    initDesign(); // Initialize design on render

    const appContainer = document.querySelector('#app');
    appContainer.innerHTML = `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-300">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex z-20 transition-colors duration-300 ${currentDesign === 'foundation' ? 'foundation-sidebar' : ''}">
        <div class="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm text-white">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h1 class="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Routing</h1>
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
       <div class="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 z-30 transition-colors duration-300 ${currentDesign === 'foundation' ? 'foundation-header' : ''}">
            <div class="flex items-center gap-2">
                <div class="h-7 w-7 bg-orange-500 rounded-md flex items-center justify-center text-white shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span class="font-bold text-slate-800 dark:text-white text-base">Routing</span>
            </div>
            <div class="flex items-center gap-1">
                <button id="mob-design-toggle-head" class="p-1.5 text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-xl">palette</span>
                </button>
                <button id="mobile-menu-btn" class="text-slate-500 dark:text-slate-400 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
                </button>
            </div>
       </div>
       
       <!-- Mobile Menu Overlay -->
       <div id="mobile-menu" class="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-40 hidden" style="display:none">
          <div class="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 shadow-xl flex flex-col p-3 animate-fade-in-down transition-colors duration-300">
              <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                  <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Navigation</span>
                  <button id="close-mobile-menu" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
              </div>
              <button id="mob-nav-calendar" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${currentView === 'calendar' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Dashboard</button>
              <button id="mob-nav-congregations" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${currentView === 'congregations' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Congregations</button>
              <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <p class="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 mt-1">Assembly Manager</p>
                  <button id="mob-nav-assemblies" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${currentView === 'assemblies' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Assemblies</button>
                  <button id="mob-nav-speakers" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${currentView === 'speakers' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Speakers</button>
                  <button id="mob-nav-reports" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium mb-1 ${currentView === 'reports' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}">Reports</button>
              </div>
              <div class="mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                <button id="mob-theme-toggle" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                    <span class="dark:hidden">Dark Mode</span>
                    <span class="hidden dark:inline">Light Mode</span>
                </button>
                <button id="mob-design-toggle" class="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                    <span>Design: ${currentDesign.charAt(0).toUpperCase() + currentDesign.slice(1)}</span>
                </button>
              </div>
              <div class="mt-auto border-t border-slate-100 dark:border-slate-700 pt-2">
                  <button id="mob-logout-btn" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">Logout</button>
              </div>
          </div>
       </div>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-colors duration-300">
         <!-- Top Bar -->
         <header class="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-8 transition-colors duration-300 ${currentDesign === 'foundation' ? 'foundation-header' : ''}">
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
                 <button id="design-toggle" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Change Design">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
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

    const designToggle = document.getElementById('design-toggle');
    const mobDesignToggleHead = document.getElementById('mob-design-toggle-head');
    const mobDesignToggle = document.getElementById('mob-design-toggle');

    const handleDesignToggle = (e) => {
        e.preventDefault();
        toggleDesign();
    };

    if (designToggle) designToggle.addEventListener('click', handleDesignToggle);
    if (mobDesignToggleHead) mobDesignToggleHead.addEventListener('click', handleDesignToggle);
    if (mobDesignToggle) mobDesignToggle.addEventListener('click', handleDesignToggle);

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
        <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-8 border border-slate-200 dark:border-slate-700 ${currentDesign === 'foundation' ? 'foundation-card' : ''}">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Add Congregation</h2>
            <form id="add-cong-form" class="flex flex-col sm:flex-row gap-4">
                <input type="text" name="name" placeholder="Congregation Name" class="flex-grow shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" required>
                    <input type="text" name="circuit" placeholder="Circuit (Optional)" class="sm:w-1/3 shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400">
                        <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 ${currentDesign === 'foundation' ? 'foundation-button' : ''}">Add Congregation</button>
                    </form>
                </div>
                <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 ${currentDesign === 'foundation' ? 'foundation-card' : ''}">
                    <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                        <h2 class="text-lg font-bold text-slate-700 dark:text-slate-200">Congregations Directory</h2>
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                            <select id="cong-sort" class="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                                <option value="name-asc">Name A → Z</option>
                                <option value="name-desc">Name Z → A</option>
                                <option value="visit-oldest">Last visit — Oldest first</option>
                                <option value="visit-newest">Last visit — Newest first</option>
                            </select>
                        </div>
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

    // Restore and wire sort dropdown
    const sortSelect = document.getElementById('cong-sort');
    sortSelect.value = congSortOrder;
    sortSelect.addEventListener('change', () => {
        congSortOrder = sortSelect.value;
        loadCongregations();
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

        // Build combined array for sorting
        let entries = congs.map((c, i) => ({ c, visits: visitData[i] }));

        if (congSortOrder === 'name-desc') {
            entries.sort((a, b) => b.c.name.localeCompare(a.c.name));
        } else if (congSortOrder === 'visit-oldest') {
            // Null (never visited) goes to the bottom
            entries.sort((a, b) => {
                const da = a.visits.last?.date ?? null;
                const db = b.visits.last?.date ?? null;
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return da - db; // oldest date first
            });
        } else if (congSortOrder === 'visit-newest') {
            entries.sort((a, b) => {
                const da = a.visits.last?.date ?? null;
                const db = b.visits.last?.date ?? null;
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return db - da; // newest date first
            });
        }
        // default 'name-asc' — already sorted by Firestore


        list.innerHTML = entries.map(({ c, visits }) => {
            const { last, previous } = visits;

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

const renderCalendarView = async (container) => {
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
        currentMonth = subMonths(currentMonth, calendarViewRange);
        renderCalendarView(container);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth = addMonths(currentMonth, calendarViewRange);
        renderCalendarView(container);
    });
    document.getElementById('calendar-range-select').addEventListener('change', (e) => {
        calendarViewRange = parseInt(e.target.value, 10);
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
            downloadCSV(fileName, csvContent);
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
                    renderCalendarView(container);
                } catch (err) {
                    console.error('Error updating activity date:', err);
                    alert('Failed to move activity.');
                }
            }
        }
        draggedActivityData = null;
    });

    // Load existing activities
    const count = await loadMonthActivities(weeks);
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

        <!-- Assemblies List -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <!-- Header (Desktop Only) -->
            <div class="hidden md:grid md:grid-cols-12 gap-0 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <div class="col-span-4 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assembly Theme / Title</div>
                <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</div>
                <div class="col-span-3 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location/Circuit</div>
                <div class="col-span-1 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</div>
                <div class="col-span-2 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</div>
            </div>
            
            <div class="divide-y divide-slate-100 dark:divide-slate-700" id="assemblies-list">
                <div class="px-6 py-8 text-center text-slate-500 italic">Loading assemblies...</div>
            </div>
        </div>
    </div>
    `;

    try {
        const assemblies = await getAssemblies();
        const list = document.getElementById('assemblies-list');

        if (assemblies.length === 0) {
            list.innerHTML = `
                <div class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">No assemblies found</h3>
                        <p class="text-slate-500 dark:text-slate-400 mt-1">Get started by creating a new assembly.</p>
                    </div>
                </div>
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
                <div class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group flex flex-col md:grid md:grid-cols-12 items-start md:items-center p-4 md:p-0">
                    <div class="md:col-span-4 md:px-6 md:py-4 w-full mb-3 md:mb-0">
                        <div class="font-bold text-slate-900 dark:text-white text-base md:text-lg">${a.theme || 'Untitled Assembly'}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-slate-500">ID: #${a.id.slice(0, 6)}</span>
                            <span class="md:hidden text-xs text-slate-400 font-medium">·</span>
                            <span class="md:hidden text-xs text-slate-400 font-medium">${dateStr}</span>
                        </div>
                    </div>
                    <div class="hidden md:block md:col-span-2 md:px-6 md:py-4 text-sm text-slate-600 dark:text-slate-400">${dateStr}</div>
                    <div class="md:col-span-3 md:px-6 md:py-4 text-sm text-slate-600 dark:text-slate-400 w-full mb-3 md:mb-0 flex items-center gap-2 md:block">
                        <span class="material-symbols-outlined text-xs md:hidden">location_on</span>
                        <span>${a.location || 'TBD'}</span>
                    </div>
                    <div class="md:col-span-1 md:px-6 md:py-4 w-full mb-4 md:mb-0">
                        <button class="status-toggle-btn px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold transition-all hover:ring-2 hover:ring-offset-2 focus:outline-none ${statusClass}" data-id="${a.id}" data-status="${a.status || 'Draft'}">
                            ${a.status || 'Draft'}
                        </button>
                    </div>
                    <div class="md:col-span-2 md:px-6 md:py-4 text-right w-full flex justify-between md:justify-end items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-3 md:pt-0">
                        <span class="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</span>
                        <div class="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button class="view-assembly-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" data-id="${a.id}" title="View Details">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                            <button class="edit-assembly-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" data-id="${a.id}" title="Edit">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button class="delete-assembly-btn p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" data-id="${a.id}" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (err) {
        document.getElementById('assemblies-list').innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading assemblies: ${err.message}</td></tr>`;
    }

    // Wire up Create button
    document.getElementById('create-assembly-btn')?.addEventListener('click', () => renderAssemblyModal(container));

    // Wire up View buttons
    document.querySelectorAll('.view-assembly-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeAssemblyId = btn.dataset.id;
            setView('assembly-details');
        });
    });

    // Wire up Status Toggle buttons
    document.querySelectorAll('.status-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const currentStatus = btn.dataset.status;

            const statusWorkflow = ['Draft', 'Upcoming', 'Completed'];
            let currentIndex = statusWorkflow.indexOf(currentStatus);
            if (currentIndex === -1) currentIndex = 0;

            const nextStatus = statusWorkflow[(currentIndex + 1) % statusWorkflow.length];

            try {
                btn.disabled = true;
                btn.innerHTML = `<span class="flex items-center gap-1"><svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${nextStatus}</span>`;

                await updateAssembly(id, { status: nextStatus });
                renderAssembliesView(container);
            } catch (err) {
                console.error("Error updating status:", err);
                alert("Failed to update status: " + err.message);
                renderAssembliesView(container);
            }
        });
    });

    // Wire up Edit buttons
    document.querySelectorAll('.edit-assembly-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                // Fetch assembly data first
                const assemblies = await getAssemblies();
                const assembly = assemblies.find(a => a.id === id);
                if (assembly) {
                    renderAssemblyModal(container, assembly);
                }
            } catch (err) {
                console.error("Error fetching assembly for edit:", err);
            }
        });
    });

    // Wire up Delete buttons
    document.querySelectorAll('.delete-assembly-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Are you sure you want to delete this assembly?')) {
                try {
                    await deleteAssembly(id);
                    renderAssembliesView(container);
                } catch (err) {
                    console.error("Error deleting assembly:", err);
                    alert("Failed to delete assembly: " + err.message);
                }
            }
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
                <p class="text-slate-500 dark:text-slate-400 mt-1">Efficiently manage and track speakers across the circuit.  <span id="speaker-total" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"></span></p>
            </div>
            <div class="flex items-center gap-2">
                <button id="bulk-import-btn" class="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    <span>Bulk Import</span>
                </button>
                <button id="add-speaker-btn" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span>Add New Speaker</span>
                </button>
            </div>
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
                <table class="w-full text-left table-fixed">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <th class="w-[30%] px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors" data-sort="name">Full Name <span class="sort-arrow inline-block ml-0.5 text-[10px]"></span></th>
                            <th class="w-[25%] px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors" data-sort="congregation">Congregation <span class="sort-arrow inline-block ml-0.5 text-[10px]"></span></th>
                            <th class="w-[20%] px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors" data-sort="phone">Phone <span class="sort-arrow inline-block ml-0.5 text-[10px]"></span></th>
                            <th class="w-[10%] px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none transition-colors" data-sort="status">Status <span class="sort-arrow inline-block ml-0.5 text-[10px]"></span></th>
                            <th class="w-[15%] px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
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
                        <td class="px-4 py-3 whitespace-nowrap">
                            <div class="flex items-center gap-3">
                                <div class="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 shrink-0">
                                    ${initials}
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">${s.name}</p>
                                    ${s.email ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate">${s.email}</p>` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <p class="text-sm text-slate-700 dark:text-slate-300 truncate">${s.congregation || 'Unknown'}</p>
                        </td>
                        <td class="px-4 py-3">
                            <p class="text-sm text-slate-700 dark:text-slate-300 font-mono tracking-tight truncate">${s.phone || '-'}</p>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}">
                                <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                                ${s.status || 'Active'}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1">
                                <button class="edit-speaker-btn p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="Edit" data-id="${s.id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                </button>
                                <button class="delete-speaker-btn p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" title="Delete" data-id="${s.id}" data-name="${s.name}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        };

        renderList(speakers);

        // Show total count
        const totalEl = document.getElementById('speaker-total');
        if (totalEl) totalEl.textContent = `${speakers.length} total`;

        // Sort state
        let sortField = null;
        let sortAsc = true;
        let currentItems = [...speakers];

        const sortItems = (items) => {
            if (!sortField) return items;
            return [...items].sort((a, b) => {
                const valA = (a[sortField] || '').toLowerCase();
                const valB = (b[sortField] || '').toLowerCase();
                if (valA < valB) return sortAsc ? -1 : 1;
                if (valA > valB) return sortAsc ? 1 : -1;
                return 0;
            });
        };

        const updateSortArrows = () => {
            document.querySelectorAll('th[data-sort] .sort-arrow').forEach(el => {
                const field = el.parentElement.dataset.sort;
                el.textContent = field === sortField ? (sortAsc ? '▲' : '▼') : '';
            });
        };

        const applyFilterAndSort = () => {
            const term = (document.getElementById('speaker-search')?.value || '').toLowerCase();
            let items = speakers;
            if (term) {
                items = items.filter(s =>
                    s.name.toLowerCase().includes(term) ||
                    (s.congregation && s.congregation.toLowerCase().includes(term))
                );
            }
            currentItems = sortItems(items);
            renderList(currentItems);
        };

        // Search Filter
        const searchInput = document.getElementById('speaker-search');
        searchInput.addEventListener('input', () => applyFilterAndSort());

        // Sort headers
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (sortField === field) {
                    sortAsc = !sortAsc;
                } else {
                    sortField = field;
                    sortAsc = true;
                }
                updateSortArrows();
                applyFilterAndSort();
            });
        });

        // Delegate click events for list
        list.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-speaker-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const name = deleteBtn.dataset.name;
                if (!confirm(`Delete speaker "${name}"?`)) return;
                try {
                    await deleteSpeaker(id);
                    renderSpeakersView(container);
                } catch (err) {
                    alert('Error deleting speaker: ' + err.message);
                }
                return;
            }

            const editBtn = e.target.closest('.edit-speaker-btn');
            if (editBtn) {
                const id = editBtn.dataset.id;
                const speaker = speakers.find(s => s.id === id);
                if (speaker) {
                    renderAddSpeakerModal(container, speaker);
                }
                return;
            }
        });

        // Add Speaker Button
        document.getElementById('add-speaker-btn')?.addEventListener('click', () => renderAddSpeakerModal(container));
        document.getElementById('bulk-import-btn')?.addEventListener('click', () => renderBulkImportSpeakersModal(container));

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
            <div class="relative overflow-hidden bg-white dark:bg-slate-900 px-6 py-8 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm group hover:shadow-md transition-shadow">
                <!-- Decorative background elements -->
                <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-gradient-to-tr from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-start md:items-center gap-5">
                        <button id="back-to-assemblies" class="mt-1 md:mt-0 p-2.5 -ml-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center group/btn shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <svg class="w-5 h-5 transform group-hover/btn:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        </button>
                        <div>
                            <div class="flex items-center gap-3">
                                <div class="bg-blue-100/50 dark:bg-blue-900/20 p-1.5 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                                    <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] leading-none">analytics</span>
                                </div>
                                <h2 id="asm-detail-theme" class="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Loading...</h2>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400 mt-3 md:ml-11">
                                <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                                    <span class="material-symbols-outlined text-[16px] text-indigo-500 dark:text-indigo-400">event</span>
                                    <span id="asm-detail-date" class="text-sm font-semibold text-slate-700 dark:text-slate-300">---</span>
                                </div>
                                <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                                    <span class="material-symbols-outlined text-[16px] text-teal-500 dark:text-teal-400">location_on</span>
                                    <span id="asm-detail-location" class="text-sm font-semibold text-slate-700 dark:text-slate-300">---</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 md:self-stretch md:items-start pt-2 md:pt-0">
                        <button class="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:-translate-y-0.5 transition-all">
                            <span class="material-symbols-outlined text-[18px]">description</span>
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
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
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                <th class="px-4 py-3 md:px-6 md:py-4">No.</th>
                                <th class="px-4 py-3 md:px-6 md:py-4">Time</th>
                                <th class="px-4 py-3 md:px-6 md:py-4">Talk</th>
                                <th class="hidden md:table-cell px-6 py-4">Type</th>
                                <th class="hidden md:table-cell px-6 py-4">Dur.</th>
                                <th class="px-4 py-3 md:px-6 md:py-4">Speaker</th>
                                <th class="hidden md:table-cell px-6 py-4">Status</th>
                                <th class="px-4 py-3 md:px-6 md:py-4 text-right"></th>
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
                    <td class="px-4 py-3 md:px-6 md:py-5 text-sm font-medium text-slate-500">${index + 1}</td>
                    <td class="px-4 py-3 md:px-6 md:py-5 text-sm font-semibold text-slate-900 dark:text-white">${t.startTime}</td>
                    <td class="px-4 py-3 md:px-6 md:py-5">
                        <div class="flex flex-col gap-1">
                            <p class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${t.title}</p>
                            <div class="flex items-center gap-2 md:hidden">
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">${t.type || 'TK'}</span>
                                <span class="text-[10px] text-slate-400 font-medium">${t.duration} min</span>
                                <span class="inline-flex items-center gap-1 text-[10px] font-bold ${statusClass}">
                                    <span class="w-1 h-1 rounded-full ${statusDot}"></span>
                                    ${t.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td class="hidden md:table-cell px-6 py-5">
                        <span class="inline-flex items-center justify-center h-6 px-2 rounded bg-slate-100 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">${t.type || 'TK'}</span>
                    </td>
                    <td class="hidden md:table-cell px-6 py-5 text-sm text-slate-500 dark:text-slate-400">${t.duration} min</td>
                    <td class="px-4 py-3 md:px-6 md:py-5">
                        ${t.speakerName ? `
                        <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">${t.speakerName.substring(0, 2).toUpperCase()}</div>
                             <span class="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-none">${t.speakerName}</span>
                        </div>
                        ` : `
                        <button class="assign-talk-btn text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-1" data-id="${t.id}">
                            <span class="material-symbols-outlined text-xs">person_add</span> <span class="hidden sm:inline">Assign</span><span class="sm:hidden">Add</span>
                        </button>
                        `}
                    </td>
                    <td class="hidden md:table-cell px-6 py-5">
                         <button class="status-talk-btn inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass} hover:opacity-80 transition-opacity" data-id="${t.id}" data-status="${t.status}">
                            <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                            ${t.status || 'Pending'}
                        </button>
                    </td>
                    <td class="px-4 py-3 md:px-6 md:py-5 text-right">
                        <button class="edit-talk-btn text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" data-id="${t.id}"><span class="material-symbols-outlined">edit</span></button>
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
        document.getElementById('bulk-import-talks-btn')?.addEventListener('click', () => {
            renderBulkImportTalksModal(container, activeAssemblyId);
        });

        // Event delegation for table buttons
        list.addEventListener('click', async (e) => {
            const assignBtn = e.target.closest('.assign-talk-btn');
            if (assignBtn) {
                const talk = talks.find(t => t.id === assignBtn.dataset.id);
                if (talk) renderAddTalkModal(container, activeAssemblyId, talk);
                return;
            }

            const editBtn = e.target.closest('.edit-talk-btn');
            if (editBtn) {
                const talk = talks.find(t => t.id === editBtn.dataset.id);
                if (talk) renderAddTalkModal(container, activeAssemblyId, talk);
                return;
            }

            const statusBtn = e.target.closest('.status-talk-btn');
            if (statusBtn) {
                const id = statusBtn.dataset.id;
                const currentStatus = statusBtn.dataset.status || 'Pending';
                const statusWorkflow = ['Pending', 'Confirmed', 'Cancelled'];
                let currentIndex = statusWorkflow.indexOf(currentStatus);
                if (currentIndex === -1) currentIndex = 0;
                const nextStatus = statusWorkflow[(currentIndex + 1) % statusWorkflow.length];

                try {
                    await updateTalk(activeAssemblyId, id, { status: nextStatus });
                    renderAssemblyDetailsView(container);
                } catch (err) {
                    console.error("Error updating status:", err);
                    alert("Failed to update status: " + err.message);
                }
                return;
            }
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

const renderAssemblyModal = async (container, assemblyToEdit = null) => {
    const isEdit = !!assemblyToEdit;
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";

    // Format date for input field
    let dateStr = '';
    if (isEdit && assemblyToEdit.date) {
        const d = assemblyToEdit.date instanceof Date ? assemblyToEdit.date : assemblyToEdit.date.toDate?.() || new Date(assemblyToEdit.date);
        dateStr = d.toISOString().split('T')[0];
    }

    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[520px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${isEdit ? 'Edit Assembly' : 'Create New Assembly'}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme / Title</label>
                <input id="asm-theme" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Circuit Assembly 2026" type="text" value="${isEdit ? (assemblyToEdit.theme || '') : ''}"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                    <input id="asm-date" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" type="date" value="${dateStr}"/>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
                    <input id="asm-location" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Assembly Hall" type="text" value="${isEdit ? (assemblyToEdit.location || '') : ''}"/>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select id="asm-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="Draft" ${isEdit && assemblyToEdit.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    <option value="Upcoming" ${(!isEdit || assemblyToEdit.status === 'Upcoming') ? 'selected' : ''}>Upcoming</option>
                    <option value="Completed" ${isEdit && assemblyToEdit.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button id="save-assembly-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20 transition-all flex items-center gap-2">
                <span>${isEdit ? 'Save Changes' : 'Create Assembly'}</span>
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

            const assemblyData = {
                theme,
                date: new Date(dateVal),
                location: document.getElementById('asm-location').value,
                status: document.getElementById('asm-status').value,
            };

            if (isEdit) {
                await updateAssembly(assemblyToEdit.id, assemblyData);
            } else {
                await addAssembly({
                    ...assemblyData,
                    progress: 0
                });
            }

            closeModal();
            renderAssembliesView(container); // Refresh
        } catch (e) {
            console.error("Error saving assembly:", e);
            alert("Error saving assembly: " + e.message);
            btn.textContent = isEdit ? 'Save Changes' : 'Create Assembly';
            btn.disabled = false;
        }
    });
};

const renderAddTalkModal = async (container, assemblyId, existingTalk = null) => {
    const isEdit = !!existingTalk;
    const speakers = await getSpeakers();
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-[620px] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${isEdit ? 'Edit Talk' : 'Add New Talk'}</h3>
            <button id="close-modal-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-5">
            <div class="grid grid-cols-3 gap-4">
                <div class="col-span-1 space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                    <input id="talk-time" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="time" value="${isEdit ? (existingTalk.startTime || '09:30') : '09:30'}"/>
                </div>
                <div class="col-span-2 space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Talk Title / Theme</label>
                    <input id="talk-title" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Opening Song" type="text" value="${isEdit ? (existingTalk.title || '') : ''}"/>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                    <select id="talk-type" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="SC" ${isEdit && existingTalk.type === 'SC' ? 'selected' : ''}>Symposium (SC)</option>
                        <option value="AC" ${isEdit && existingTalk.type === 'AC' ? 'selected' : ''}>Address (AC)</option>
                        <option value="OS" ${isEdit && existingTalk.type === 'OS' ? 'selected' : ''}>Song/Prayer (OS)</option>
                        <option value="TK" ${(isEdit && existingTalk.type === 'TK') || !isEdit ? 'selected' : ''}>Talk (TK)</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration (min)</label>
                    <input id="talk-duration" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" type="number" value="${isEdit ? (existingTalk.duration || 10) : 10}"/>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign Speaker (Optional)</label>
                <select id="talk-speaker" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- No Speaker Assigned --</option>
                    ${speakers.map(s => `<option value="${s.id}" ${isEdit && existingTalk.speakerId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="space-y-1.5">
                 <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                 <select id="talk-status" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Pending" ${isEdit && existingTalk.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${isEdit && existingTalk.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                 </select>
            </div>
        </div>
        <div class="flex items-center justify-between px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            ${isEdit ? `<button id="delete-talk-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Delete Talk</button>` : '<div></div>'}
            <div class="flex items-center gap-3">
                <button id="cancel-modal-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button id="save-talk-btn" class="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
                    <span>${isEdit ? 'Save Changes' : 'Save Talk'}</span>
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

    if (isEdit) {
        document.getElementById('delete-talk-btn').addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this talk?')) return;
            try {
                await deleteTalk(assemblyId, existingTalk.id);
                closeModal();
                renderAssemblyDetailsView(container);
            } catch (e) {
                alert('Error deleting: ' + e.message);
            }
        });
    }

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

            const talkData = {
                title,
                startTime: document.getElementById('talk-time').value, // store as string HH:mm for simplicity or construct Date
                type: document.getElementById('talk-type').value,
                duration: parseInt(document.getElementById('talk-duration').value),
                speakerId,
                speakerName,
                status: document.getElementById('talk-status').value
            };

            if (isEdit) {
                await updateTalk(assemblyId, existingTalk.id, talkData);
            } else {
                await addTalk(assemblyId, talkData);
            }
            closeModal();
            renderAssemblyDetailsView(container); // Refresh details view
        } catch (e) {
            alert('Error saving: ' + e.message);
            btn.textContent = isEdit ? 'Save Changes' : 'Save Talk';
            btn.disabled = false;
        }
    });
};

const renderBulkImportTalksModal = async (container, assemblyId) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in max-h-[90vh]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">Bulk Import Talks</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Paste plain text — one talk per line</p>
            </div>
            <button id="close-bulk-talks-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto">
            <div class="space-y-1.5">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Format: <code class="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Time, Title, Type (SC/AC/OS/TK), Duration</code></label>
                <textarea id="bulk-talks-text" rows="8" class="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-y" placeholder="09:30, Opening Song, OS, 10\n09:40, Opening Address, AC, 10\n09:50, Symposium Part 1, SC, 15"></textarea>
            </div>
            <div id="bulk-talks-preview" class="hidden">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preview (<span id="bulk-talks-count">0</span> talks)</h4>
                <div class="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="bg-slate-50 dark:bg-slate-700/50"><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Time</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Title</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Type</th><th class="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Dur.</th></tr></thead>
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
    document.getElementById('close-bulk-talks-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-bulk-talks-btn').addEventListener('click', closeModal);

    let parsedTalks = [];

    const parseBulkText = () => {
        const raw = document.getElementById('bulk-talks-text').value.trim();
        if (!raw) return [];
        return raw.split('\n').filter(l => l.trim()).map(line => {
            const parts = line.split(/[,\t]/).map(p => p.trim());
            return {
                startTime: parts[0] || '00:00',
                title: parts[1] || 'Untitled Talk',
                type: (parts[2] || 'TK').toUpperCase(),
                duration: parseInt(parts[3]) || 10,
                speakerId: '',
                speakerName: null,
                status: 'Pending'
            };
        }).filter(t => t.title);
    };

    document.getElementById('bulk-talks-preview-btn').addEventListener('click', () => {
        parsedTalks = parseBulkText();
        const preview = document.getElementById('bulk-talks-preview');
        const body = document.getElementById('bulk-talks-preview-body');
        const count = document.getElementById('bulk-talks-count');
        const saveBtn = document.getElementById('save-bulk-talks-btn');

        if (parsedTalks.length === 0) {
            preview.classList.add('hidden');
            saveBtn.disabled = true;
            document.getElementById('bulk-talks-status').className = 'text-sm font-medium text-red-500';
            document.getElementById('bulk-talks-status').textContent = 'No valid talks found. Check your format.';
            document.getElementById('bulk-talks-status').classList.remove('hidden');
            return;
        }

        document.getElementById('bulk-talks-status').classList.add('hidden');
        count.textContent = parsedTalks.length;
        body.innerHTML = parsedTalks.map(t => `
            <tr>
                <td class="px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium">${t.startTime}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-bold">${t.title}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${t.type}</td>
                <td class="px-3 py-1.5 text-slate-600 dark:text-slate-400">${t.duration}m</td>
            </tr>
        `).join('');
        preview.classList.remove('hidden');
        saveBtn.disabled = false;
    });

    document.getElementById('save-bulk-talks-btn').addEventListener('click', async () => {
        if (parsedTalks.length === 0) return;
        const btn = document.getElementById('save-bulk-talks-btn');
        const statusEl = document.getElementById('bulk-talks-status');
        btn.disabled = true;
        btn.innerHTML = '<span>Importing...</span>';
        statusEl.className = 'text-sm font-medium text-blue-500';
        statusEl.classList.remove('hidden');

        let saved = 0;
        let errors = 0;
        for (const talk of parsedTalks) {
            try {
                await addTalk(assemblyId, talk);
                saved++;
                statusEl.textContent = `Importing ${saved} of ${parsedTalks.length}...`;
            } catch (e) {
                errors++;
                console.error('Error importing talk:', talk.title, e);
            }
        }

        if (errors === 0) {
            statusEl.className = 'text-sm font-medium text-green-600';
            statusEl.textContent = `✓ Successfully imported ${saved} talks!`;
        } else {
            statusEl.className = 'text-sm font-medium text-orange-500';
            statusEl.textContent = `Imported ${saved} talks, ${errors} failed.`;
        }

        setTimeout(() => {
            closeModal();
            renderAssemblyDetailsView(container);
        }, 1200);
    });
};
