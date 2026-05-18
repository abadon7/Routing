import { format } from "date-fns";
import { getAssemblies, updateAssembly, deleteAssembly } from "../db.js";
import { getStoredDesign } from "./preferences.js";

export const renderAssembliesView = async (container, options) => {
    const isTactician = getStoredDesign() === 'tactician';

    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down ${isTactician ? 'tactician-design' : ''}">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div class="flex flex-col gap-2">
                <h2 class="${isTactician ? 'editorial-header' : 'text-3xl font-bold text-slate-900 dark:text-white tracking-tight'}">Assemblies</h2>
                <p class="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Manage and track speaker assignments for upcoming circuits.</p>
            </div>
            <button id="create-assembly-btn" class="${isTactician ? 'tactile-button-primary pl-5 pr-6 py-3 shadow-[0_8px_16px_-6px_rgba(255,107,44,0.4)]' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 px-6 py-3'} flex items-center justify-center gap-2 rounded-xl font-bold transition-all transform hover:-translate-y-0.5">
                <svg class="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span class="${isTactician ? 'display-font tracking-widest uppercase text-[11px] font-black' : ''}">${isTactician ? 'New' : 'Create New Assembly'}</span>
            </button>
        </div>

        <!-- Assemblies List -->
        <div class="${isTactician ? '' : 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm'}">
            <!-- Header (Desktop Only) -->
            <div class="${isTactician ? 'hidden md:grid md:grid-cols-12 gap-6 px-6 mb-4' : 'hidden md:grid md:grid-cols-12 gap-0 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700'}">
                <div class="col-span-4 ${isTactician ? 'py-0 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] display-font select-none' : 'px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]'}">Assembly Theme & Details</div>
                <div class="col-span-2 ${isTactician ? 'py-0 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] display-font select-none' : 'px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]'}">Schedule Date</div>
                <div class="col-span-3 ${isTactician ? 'py-0 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] display-font select-none' : 'px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]'}">Location & Type</div>
                <div class="col-span-1 ${isTactician ? 'py-0 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] display-font select-none' : 'px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]'}">Status</div>
                <div class="col-span-2 ${isTactician ? 'py-0 text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] display-font select-none text-right' : 'px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right'}">Actions</div>
            </div>
            
            <div class="${isTactician ? 'space-y-4' : 'divide-y divide-slate-100 dark:divide-slate-700'}" id="assemblies-list">
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
                <div class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div class="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                             <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-500">event_busy</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white">No assemblies scheduled</h3>
                        <p class="text-slate-500 dark:text-slate-400 mt-2">Get started by creating your first circuit assembly or regional convention.</p>
                        <button onclick="document.getElementById('create-assembly-btn').click()" class="mt-8 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                            Create First Assembly
                        </button>
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

                if (isTactician) {
                    const TACTICIAN_STATUS_STYLES = {
                        'Completed': 'bg-[#d4edda] text-[#155724]',
                        'Upcoming': 'bg-[#cce5ff] text-[#004085]',
                        'Draft': 'bg-[#fff2cc] text-[#856404]'
                    };
                    const statusClassTactician = TACTICIAN_STATUS_STYLES[a.status] || TACTICIAN_STATUS_STYLES['Draft'];

                    return `
                    <div class="no-line-list-item px-6 py-5 group cursor-pointer assembly-row transition-all flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-6" data-id="${a.id}">
                        <div class="col-span-4 w-full">
                            <div class="display-font text-lg text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${a.theme || 'Untitled Assembly'}</div>
                            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID #${a.id.slice(0, 6)}</div>
                        </div>
                        
                        <div class="hidden md:flex flex-col col-span-2">
                            <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${dateStr}</span>
                            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">${a.date ? format(a.date, 'EEEE') : ''}</span>
                        </div>

                        <div class="col-span-3 w-full flex items-center gap-2">
                            <div class="min-w-0">
                                <span class="text-sm text-slate-600 dark:text-slate-300 font-medium truncate block">${a.location || 'Location TBD'}</span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">${a.eventType === 'Regional Convention (3 Days)' ? '3-Day RC' : '1-Day CA'}</span>
                            </div>
                        </div>

                        <div class="col-span-1 w-full flex items-center">
                            <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] display-font flex items-center gap-1.5 w-max ${statusClassTactician}">
                                ${a.status || 'Draft'}
                            </span>
                        </div>

                        <div class="col-span-2 w-full flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                            <button class="edit-assembly-btn p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all" data-id="${a.id}" title="Edit Settings">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </button>
                            <button class="delete-assembly-btn p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all" data-id="${a.id}" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    `;
                }

                return `
                <div class="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group flex flex-col md:grid md:grid-cols-12 items-start md:items-center p-5 md:p-0 cursor-pointer assembly-row border-l-4 border-l-transparent hover:border-l-blue-500" data-id="${a.id}">
                    <div class="md:col-span-4 md:px-6 md:py-4 w-full mb-4 md:mb-0">
                        <div class="font-bold text-slate-900 dark:text-white text-base md:text-lg tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${a.theme || 'Untitled Assembly'}</div>
                        <div class="flex items-center gap-2 mt-1.5">
                            <span class="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">ID #${a.id.slice(0, 6)}</span>
                            <span class="md:hidden text-xs text-slate-400 font-medium">·</span>
                            <span class="md:hidden text-xs text-slate-400 font-medium">${dateStr}</span>
                        </div>
                    </div>
                    
                    <div class="hidden md:flex md:col-span-2 md:px-6 md:py-4 flex-col">
                        <span class="text-sm font-bold text-slate-800 dark:text-slate-200">${dateStr}</span>
                        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">${a.date ? format(a.date, 'EEEE') : ''}</span>
                    </div>

                    <div class="md:col-span-3 md:px-6 md:py-4 w-full mb-4 md:mb-0 flex flex-col justify-center">
                        <div class="flex items-center gap-2">
                             <span class="material-symbols-outlined text-[18px] text-slate-400 shrink-0">location_on</span>
                             <span class="text-sm text-slate-600 dark:text-slate-300 font-medium truncate">${a.location || 'Location TBD'}</span>
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${a.eventType === 'Regional Convention (3 Days)' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}">
                                ${a.eventType === 'Regional Convention (3 Days)' ? '3-Day RC' : '1-Day CA'}
                            </span>
                        </div>
                    </div>

                    <div class="md:col-span-1 md:px-6 md:py-4 w-full mb-5 md:mb-0">
                        <button class="status-toggle-btn w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm ${statusClass}" data-id="${a.id}" data-status="${a.status || 'Draft'}">
                             <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                             ${a.status || 'Draft'}
                        </button>
                    </div>

                    <div class="md:col-span-2 md:px-6 md:py-4 text-right w-full flex justify-end items-center border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-5 md:pt-0">
                        <div class="flex items-center gap-1">
                            <button class="edit-assembly-btn p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all" data-id="${a.id}" title="Edit Settings">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </button>
                            <button class="delete-assembly-btn p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-slate-400 hover:text-red-600 transition-all ml-1" data-id="${a.id}" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (err) {
        document.getElementById('assemblies-list').innerHTML = `
            <div class="px-6 py-12 text-center">
                <div class="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined">error</span>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">Failed to load assemblies</h3>
                <p class="text-slate-500 dark:text-slate-400 mt-1">${err.message}</p>
            </div>
        `;
    }

    // Wire up Create button
    document.getElementById('create-assembly-btn')?.addEventListener('click', () => options.onCreateAssembly(container));

    // Wire up assembly row click
    document.querySelectorAll('.assembly-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Only trigger if not clicking a button
            if (e.target.closest('button')) return;
            options.onOpenAssembly(row.dataset.id);
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
                renderAssembliesView(container, options);
            } catch (err) {
                console.error("Error updating status:", err);
                alert("Failed to update status: " + err.message);
                renderAssembliesView(container, options);
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
                    options.onEditAssembly(container, assembly);
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
                    renderAssembliesView(container, options);
                } catch (err) {
                    console.error("Error deleting assembly:", err);
                    alert("Failed to delete assembly: " + err.message);
                }
            }
        });
    });
};
