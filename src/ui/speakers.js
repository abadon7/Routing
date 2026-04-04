import { getSpeakers, addSpeaker, deleteSpeaker, updateSpeaker } from "../db.js";

export const renderSpeakersView = async (container) => {
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
