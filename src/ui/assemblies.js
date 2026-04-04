import { format } from "date-fns";
import { getAssemblies, updateAssembly, deleteAssembly } from "../db.js";

export const renderAssembliesView = async (container, options) => {
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
                    <div class="md:col-span-3 md:px-6 md:py-4 text-sm text-slate-600 dark:text-slate-400 w-full mb-3 md:mb-0 flex flex-col justify-center">
                        <div class="flex items-center gap-2 md:block">
                            <span class="material-symbols-outlined text-xs md:hidden">location_on</span>
                            <span>${a.location || 'TBD'}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-1 font-medium bg-slate-100 dark:bg-slate-700/50 inline-block px-1.5 py-0.5 rounded md:hidden">${a.eventType === 'Regional Convention (3 Days)' ? 'Regional Conv.' : 'Circuit Assembly'}</div>
                    </div>
                    <div class="md:col-span-1 md:px-6 md:py-4 w-full mb-4 md:mb-0 flex flex-col gap-2">
                        <button class="status-toggle-btn px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold transition-all hover:ring-2 hover:ring-offset-2 focus:outline-none ${statusClass} self-start" data-id="${a.id}" data-status="${a.status || 'Draft'}">
                            ${a.status || 'Draft'}
                        </button>
                        <div class="hidden md:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 self-start">${a.eventType === 'Regional Convention (3 Days)' ? 'RC (3-Day)' : 'CA (1-Day)'}</div>
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
    document.getElementById('create-assembly-btn')?.addEventListener('click', () => options.onCreateAssembly(container));

    // Wire up View buttons
    document.querySelectorAll('.view-assembly-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            options.onOpenAssembly(btn.dataset.id);
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
