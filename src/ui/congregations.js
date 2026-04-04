import { getCongregations, addCongregation, deleteCongregation, updateCongregation, getLastTwoVisits } from "../db.js";

export const renderCongregationsView = async (container, options) => {
    container.innerHTML = `
    <div class="space-y-8 animate-fade-in-down">
        <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-8 border border-slate-200 dark:border-slate-700 ${options.currentDesign === 'foundation' ? 'foundation-card' : ''}">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Add Congregation</h2>
            <form id="add-cong-form" class="flex flex-col sm:flex-row gap-4">
                <input type="text" name="name" placeholder="Congregation Name" class="flex-grow shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400" required>
                    <input type="text" name="circuit" placeholder="Circuit (Optional)" class="sm:w-1/3 shadow-sm border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400">
                        <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 ${options.currentDesign === 'foundation' ? 'foundation-button' : ''}">Add Congregation</button>
                    </form>
                </div>
                <div class="bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 ${options.currentDesign === 'foundation' ? 'foundation-card' : ''}">
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
            loadCongregations(container, options);
        } catch (err) { alert("Error: " + err.message); }
    });

    // Restore and wire sort dropdown
    const sortSelect = document.getElementById('cong-sort');
    sortSelect.value = options.getCongSortOrder();
    sortSelect.addEventListener('change', () => {
        options.setCongSortOrder(sortSelect.value);
        loadCongregations(container, options);
    });

    loadCongregations(container, options);
};

const loadCongregations = async (container, options) => {
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

        if (options.getCongSortOrder() === 'name-desc') {
            entries.sort((a, b) => b.c.name.localeCompare(a.c.name));
        } else if (options.getCongSortOrder() === 'visit-oldest') {
            // Null (never visited) goes to the bottom
            entries.sort((a, b) => {
                const da = a.visits.last?.date ?? null;
                const db = b.visits.last?.date ?? null;
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return da - db; // oldest date first
            });
        } else if (options.getCongSortOrder() === 'visit-newest') {
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
                        loadCongregations(container, options);
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
