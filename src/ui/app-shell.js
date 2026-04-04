const getNavButton = ({ id, label, iconPath, currentView, activeView, sidebarCollapsed }) => {
  const isActive = currentView === activeView;
  const stateClass = isActive
    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200';

  return `
    <button id="${id}" class="w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-colors ${stateClass}" title="${sidebarCollapsed ? label : ''}">
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path></svg>
      ${sidebarCollapsed ? '' : label}
    </button>`;
};

export const getAppShellMarkup = ({ currentUser, currentView, currentDesign, sidebarCollapsed }) => `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-300">
      <aside class="${sidebarCollapsed ? 'w-24' : 'w-64'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex z-20 transition-all duration-300 ${currentDesign === 'foundation' ? 'foundation-sidebar' : ''}">
        <div class="h-16 flex items-center ${sidebarCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'} border-b border-slate-100 dark:border-slate-700 gap-2">
            <div class="flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} min-w-0">
                <div class="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm text-white shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                ${sidebarCollapsed ? '' : '<h1 class="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Routing</h1>'}
            </div>
            <button id="sidebar-toggle" class="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0" title="${sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}">
                <svg class="w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
        </div>

        <nav class="flex-1 ${sidebarCollapsed ? 'p-3' : 'p-4'} space-y-1 overflow-y-auto">
            ${sidebarCollapsed ? '' : '<p class="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">Main</p>'}
            ${getNavButton({ id: 'nav-calendar', label: 'Dashboard', iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', currentView, activeView: 'calendar', sidebarCollapsed })}
            ${getNavButton({ id: 'nav-congregations', label: 'Congregations', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', currentView, activeView: 'congregations', sidebarCollapsed })}
            ${sidebarCollapsed ? '' : '<p class="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">Assembly Manager</p>'}
            ${getNavButton({ id: 'nav-assemblies', label: 'Assemblies', iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', currentView, activeView: 'assemblies', sidebarCollapsed })}
            ${getNavButton({ id: 'nav-speakers', label: 'Speakers', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', currentView, activeView: 'speakers', sidebarCollapsed })}
            ${getNavButton({ id: 'nav-reports', label: 'Reports', iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', currentView, activeView: 'reports', sidebarCollapsed })}
        </nav>

        <div class="${sidebarCollapsed ? 'p-3' : 'p-4'} border-t border-slate-100 dark:border-slate-700">
             <div class="flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" id="user-profile">
                <div class="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs font-bold shrink-0">
                    ${(currentUser.displayName || currentUser.email).charAt(0).toUpperCase()}
                </div>
                ${sidebarCollapsed ? '' : `<div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">${currentUser.displayName || 'User'}</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 truncate">${currentUser.email}</p>
                </div>`}
                <button id="logout-btn" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Logout">
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

      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-colors duration-300">
         <header class="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-8 transition-colors duration-300 ${currentDesign === 'foundation' ? 'foundation-header' : ''}">
             <div class="flex-1 max-w-lg">
                 <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                     </div>
                     <input type="text" id="search-input" class="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="Search appointments or events...">
                 </div>
             </div>
             <div class="flex items-center gap-4 ml-4">
                 <button id="theme-toggle" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Toggle Theme">
                    <svg class="w-6 h-6 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <svg class="w-6 h-6 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                 </button>
                 <button id="design-toggle" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Change Design">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                 </button>
                 <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
                     <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                     <span class="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                 </button>
                 <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                     <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </button>
             </div>
         </header>

         <div class="flex-1 overflow-y-auto p-6 md:p-8" id="main-content"></div>
      </main>
    </div>
    <div id="modal-container" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center transition-opacity" style="display:none"></div>
  `;
