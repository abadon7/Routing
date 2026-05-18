import { getTalksForSpeaker, getAssemblies, getSpeakers } from "../db.js";
import { format } from 'date-fns';

export const renderSpeakerDetailsModal = async (container, speakerId, speakerEmail = null) => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] animate-fade-in p-4";
    modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">Speaker Profile</h3>
            <button id="close-speaker-detail-btn" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        
        <div id="speaker-detail-content" class="flex-1 overflow-y-auto">
            <div class="p-12 text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p class="text-slate-500 dark:text-slate-400 font-medium">Loading speaker details and history...</p>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-speaker-detail-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    try {
        const [speakers, allAssemblies, talksRaw] = await Promise.all([
            getSpeakers(),
            getAssemblies(),
            getTalksForSpeaker(speakerId, speakerEmail)
        ]);

        const speaker = speakers.find(s => s.id === speakerId) || { name: 'Unknown Speaker', email: speakerEmail };
        
        // Match talks with assembly names
        const talks = talksRaw.map(talk => {
            const assembly = allAssemblies.find(a => a.id === talk.assemblyId);
            return {
                ...talk,
                assemblyName: assembly ? assembly.name : 'Unknown Assembly',
                assemblyDate: assembly ? assembly.date : null
            };
        }).sort((a, b) => {
            if (!a.assemblyDate) return 1;
            if (!b.assemblyDate) return -1;
            return b.assemblyDate - a.assemblyDate; // Newest first
        });

        const initials = speaker.name ? speaker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        const statusClass = speaker.status === 'Unavailable'
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';

        const content = document.getElementById('speaker-detail-content');
        content.innerHTML = `
            <!-- Header/Bio Section -->
            <div class="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div class="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                    <div class="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-600/20 shrink-0">
                        ${initials}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                            <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">${speaker.name}</h2>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}">
                                ${speaker.status || 'Active'}
                            </span>
                        </div>
                        <p class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">${speaker.congregation || 'No Congregation assigned'}</p>
                        
                        <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            ${speaker.email ? `
                                <a href="mailto:${speaker.email}" class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    ${speaker.email}
                                </a>
                            ` : ''}
                            ${speaker.phone ? `
                                <a href="tel:${speaker.phone}" class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    ${speaker.phone}
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Tabs Wrapper -->
            <div class="p-6 md:p-8">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        Talk History
                        <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">${talks.length} total</span>
                    </h3>
                </div>

                ${talks.length === 0 ? `
                    <div class="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <p class="text-slate-500 dark:text-slate-400 font-medium">No talk history found for this speaker.</p>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${talks.map(talk => {
                            const dateStr = talk.assemblyDate ? format(talk.assemblyDate, 'MMM d, yyyy') : 'No Date';
                            const isPast = talk.assemblyDate && talk.assemblyDate < new Date();
                            
                            return `
                                <div class="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900">
                                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isPast ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}">
                                                    ${isPast ? 'Past' : 'Upcoming'}
                                                </span>
                                                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">${dateStr}</span>
                                            </div>
                                            <h4 class="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${talk.theme || talk.talkName || 'Untitled Talk'}</h4>
                                            <p class="text-sm text-slate-500 dark:text-slate-400">${talk.assemblyName}</p>
                                        </div>
                                        <div class="flex items-center gap-3 shrink-0">
                                            ${talk.outline ? `<span class="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2 py-1 rounded transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-700 dark:group-hover:text-blue-300">#${talk.outline}</span>` : ''}
                                            ${talk.startTime ? `
                                            <div class="text-right">
                                                <div class="text-xs font-bold text-slate-700 dark:text-slate-300">${talk.startTime}</div>
                                                <div class="text-[10px] text-slate-400">${talk.duration ? talk.duration + 'm' : ''}</div>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ${talk.performanceNotes ? `
                                        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p class="text-xs text-slate-500 dark:text-slate-400 italic font-serif">"${talk.performanceNotes}"</p>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        console.error('Error rendering speaker details:', err);
        const content = document.getElementById('speaker-detail-content');
        content.innerHTML = `
            <div class="p-12 text-center">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Error Loading Data</h3>
                <p class="text-slate-500 dark:text-slate-400">${err.message}</p>
                <button onclick="this.closest('.fixed').remove()" class="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold transition-colors">Close</button>
            </div>
        `;
    }
};
