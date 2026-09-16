document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Configuration
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const funnelInfo = {
        'latam': {
            title: 'Mapa do Prazer Masculino — LATAM',
            badge: 'GEO LATAM (Espanhol)',
            badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
            aliases: ['latam', 'mapa-prazer-masculino-latam']
        },
        'chave-deusa-prazer-br': {
            title: 'Chave Deusa do Prazer — Brasil',
            badge: 'GEO Brasil (pt-BR)',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            aliases: ['chave-deusa-prazer-br', 'chave-deusa-br']
        }
    };

    const membersInfo = {
        'mapa-prazer-masculino-latam': {
            title: 'Área de Membros — Mapa LATAM',
            badge: 'Hotmart & Kiwify (Espanhol)',
            badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
            kpiBadge: 'LATAM'
        },
        'mapa-prazer-masculino-br': {
            title: 'Área de Membros — Mapa Brasil',
            badge: 'Payt & Kiwify (pt-BR)',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            kpiBadge: 'Brasil'
        },
        'mapa-prazer-masculino-en': {
            title: 'Área de Membros — Mapa Inglês',
            badge: 'Hotmart & Kiwify (English)',
            badgeClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
            kpiBadge: 'Inglês'
        }
    };

    // State Variables
    let currentNavType = 'funnel'; // 'funnel' or 'members'
    let currentOffer = 'latam';
    let currentMembersArea = 'mapa-prazer-masculino-latam';
    let currentTimeFilter = 'today';
    let currentMemberStatusFilter = 'all';
    let memberSearchQuery = '';
    let allMembersData = [];
    let fetchToken = 0;

    // Dark Chart Setup
    const ctx = document.getElementById('trafficChart')?.getContext('2d');
    let trafficChart = null;

    if (ctx) {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
        
        trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Visitantes Únicos (Gate)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#07090e',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    },
                    {
                        label: 'Desbloqueios (Passaram)',
                        data: [],
                        borderColor: '#a855f7',
                        backgroundColor: 'transparent',
                        tension: 0.35,
                        pointBackgroundColor: '#a855f7',
                        pointBorderColor: '#07090e',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    },
                    {
                        label: 'Cliques Checkout (Hotmart)',
                        data: [],
                        borderColor: '#34d399',
                        backgroundColor: 'transparent',
                        tension: 0.35,
                        pointBackgroundColor: '#34d399',
                        pointBorderColor: '#07090e',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: '#94a3b8', 
                            usePointStyle: true, 
                            boxWidth: 8, 
                            font: { weight: '600', size: 11 },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(11, 15, 23, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        cornerRadius: 8,
                        bodyFont: { family: "'JetBrains Mono', monospace" }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0, color: '#64748b' },
                        grid: { color: 'rgba(255, 255, 255, 0.04)' }
                    },
                    x: {
                        grid: { color: 'transparent' },
                        ticks: { maxRotation: 0, font: { size: 10 }, color: '#64748b' }
                    }
                }
            }
        });
    }

    function showLoading(show) {
        const el = document.getElementById('loading-indicator');
        if (el) {
            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }

    function updateDOM(id, value, format = 'number') {
        const el = document.getElementById(id);
        if (!el) return;
        
        let newVal = '0';
        if (format === 'percent') {
            newVal = (Number(value) || 0).toFixed(1) + '%';
        } else {
            newVal = (Number(value) || 0).toLocaleString('pt-BR');
        }

        if (el.innerText !== newVal) {
            el.innerText = newVal;
            el.classList.remove('value-updated');
            void el.offsetWidth;
            el.classList.add('value-updated');
        }
    }

    // ============================================
    // FUNNEL ANALYTICS DATA FETCHING
    // ============================================

    async function fetchAllEvents(sinceIso) {
        const aliases = funnelInfo[currentOffer]?.aliases || [currentOffer];
        const pageSize = 1000;
        const maxPages = 15;

        const pagePromises = Array.from({ length: maxPages }, (_, i) => {
            const from = i * pageSize;
            let query = supabase
                .from('funnel_events')
                .select('event_type, created_at, offer_id, session_id')
                .in('offer_id', aliases);

            if (sinceIso) {
                query = query.gte('created_at', sinceIso);
            }

            return query
                .order('created_at', { ascending: true })
                .range(from, from + pageSize - 1);
        });

        const results = await Promise.all(pagePromises);
        let allRows = [];
        for (const res of results) {
            if (res.data && res.data.length > 0) {
                allRows = allRows.concat(res.data);
            }
        }
        return allRows;
    }

    async function fetchFunnelData() {
        const myToken = ++fetchToken;
        const timeFilter = currentTimeFilter;
        showLoading(true);

        const now = new Date();
        let since = null;
        let labels = [];
        let bins = 0;

        const periodLabels = {
            'today': 'Hoje',
            '24h': 'Últimas 24 Horas',
            '7d': 'Últimos 7 Dias',
            '30d': 'Últimos 30 Dias'
        };
        const periodEl = document.getElementById('funnel-period-label');
        if (periodEl) periodEl.innerText = periodLabels[timeFilter] || 'Período';

        if (timeFilter === 'today') {
            since = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            bins = 24;
            for (let i = 0; i < 24; i++) {
                labels.push(i.toString().padStart(2, '0') + ':00');
            }
        } else if (timeFilter === '24h') {
            since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            bins = 24;
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                labels.push(d.getHours().toString().padStart(2, '0') + ':00');
            }
        } else if (timeFilter === '7d') {
            since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            since.setHours(0, 0, 0, 0);
            bins = 7;
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labels.push(`${day}/${month}`);
            }
        } else if (timeFilter === '30d') {
            since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            since.setHours(0, 0, 0, 0);
            bins = 30;
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labels.push(`${day}/${month}`);
            }
        }

        const data = await fetchAllEvents(since ? since.toISOString() : null);
        showLoading(false);
        if (myToken !== fetchToken) return;

        const uniqueGateViews = new Set();
        const uniqueGateUnlocks = new Set();
        const uniqueVSLViews = new Set();
        const uniqueCheckouts = new Set();

        const bins_visitors = Array(bins).fill(0);
        const bins_unlocks = Array(bins).fill(0);
        const bins_checkouts = Array(bins).fill(0);
        const bins_seen_visitors = Array.from({ length: bins }, () => new Set());
        const bins_seen_unlocks = Array.from({ length: bins }, () => new Set());
        const bins_seen_checkouts = Array.from({ length: bins }, () => new Set());

        data.forEach(row => {
            const eventType = row.event_type;
            const eventTime = new Date(row.created_at);
            const sessId = row.session_id || ('row_' + row.id);

            if (eventType === 'gate_view' || eventType === 'landing_view') {
                uniqueGateViews.add(sessId);
            } else if (eventType === 'gate_unlock' || eventType === 'step_advance') {
                uniqueGateUnlocks.add(sessId);
            } else if (eventType === 'vsl_view' || eventType === 'vsl_player_loaded' || eventType === 'vsl_player_interaction') {
                uniqueVSLViews.add(sessId);
            } else if (eventType === 'click_checkout') {
                uniqueCheckouts.add(sessId);
            }

            let binIndex = -1;
            if (timeFilter === 'today') {
                binIndex = eventTime.getHours();
            } else if (timeFilter === '24h') {
                const diffHours = Math.floor((now - eventTime) / (1000 * 60 * 60));
                binIndex = bins - 1 - diffHours;
            } else {
                const diffDays = Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
                binIndex = bins - 1 - diffDays;
            }

            if (binIndex >= 0 && binIndex < bins) {
                if (eventType === 'gate_view' || eventType === 'landing_view') {
                    if (!bins_seen_visitors[binIndex].has(sessId)) {
                        bins_seen_visitors[binIndex].add(sessId);
                        bins_visitors[binIndex]++;
                    }
                } else if (eventType === 'gate_unlock' || eventType === 'step_advance') {
                    if (!bins_seen_unlocks[binIndex].has(sessId)) {
                        bins_seen_unlocks[binIndex].add(sessId);
                        bins_unlocks[binIndex]++;
                    }
                } else if (eventType === 'click_checkout') {
                    if (!bins_seen_checkouts[binIndex].has(sessId)) {
                        bins_seen_checkouts[binIndex].add(sessId);
                        bins_checkouts[binIndex]++;
                    }
                }
            }
        });

        const totalVisitors = uniqueGateViews.size;
        const totalUnlocks = uniqueGateUnlocks.size;
        const totalVSL = Math.max(uniqueVSLViews.size, totalUnlocks > 0 ? totalUnlocks : 0);
        const totalCheckouts = uniqueCheckouts.size;

        // Cards Update
        updateDOM('metric-visits', totalVisitors);
        const visitsSub = document.getElementById('metric-visits-sub');
        if (visitsSub) visitsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1.5"></span> ${totalVisitors.toLocaleString('pt-BR')} sessões únicas no Gate`;

        updateDOM('metric-responses', totalUnlocks);

        const advanceRate = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        updateDOM('metric-steps', advanceRate, 'percent');
        const pb = document.getElementById('metric-steps-bar');
        if (pb) pb.style.width = Math.min(100, Math.max(0, advanceRate)) + '%';

        updateDOM('metric-leads', totalCheckouts);
        const leadsSub = document.getElementById('metric-leads-sub');
        const checkoutRate = totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0;
        if (leadsSub) leadsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span> ${checkoutRate.toFixed(1)}% do total de visitantes`;

        // Conversion Journey
        updateDOM('funnel-val-1', totalVisitors);
        updateDOM('funnel-val-2', totalUnlocks);
        updateDOM('funnel-val-3', totalVSL);
        updateDOM('funnel-val-4', totalCheckouts);

        const unlockPct = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        const vslPct = totalUnlocks > 0 ? (totalVSL / totalUnlocks) * 100 : (totalVisitors > 0 ? (totalVSL / totalVisitors) * 100 : 0);
        const checkoutPct = totalVSL > 0 ? (totalCheckouts / totalVSL) * 100 : (totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0);

        updateDOM('funnel-pct-2', unlockPct, 'percent');
        updateDOM('funnel-pct-3', Math.min(100, vslPct), 'percent');
        updateDOM('funnel-pct-4', checkoutPct, 'percent');

        const fb2 = document.getElementById('funnel-bar-2');
        if (fb2) fb2.style.width = Math.min(100, Math.max(5, unlockPct)) + '%';
        const fb3 = document.getElementById('funnel-bar-3');
        if (fb3) fb3.style.width = Math.min(100, Math.max(5, Math.min(100, vslPct))) + '%';
        const fb4 = document.getElementById('funnel-bar-4');
        if (fb4) fb4.style.width = Math.min(100, Math.max(5, checkoutPct)) + '%';

        updateDOM('interaction-rate', unlockPct, 'percent');
        updateDOM('bounce-rate', Math.max(0, 100 - unlockPct), 'percent');

        // Update Chart
        if (trafficChart) {
            trafficChart.data.labels = labels;
            trafficChart.data.datasets[0].data = bins_visitors;
            trafficChart.data.datasets[1].data = bins_unlocks;
            trafficChart.data.datasets[2].data = bins_checkouts;
            trafficChart.update();
        }
    }

    // ============================================
    // MEMBERS ACCESS & DRIP 7-DAY MANAGEMENT
    // ============================================

    function getDripStatus(member) {
        const now = new Date();
        const unlockAt = member.unlock_at ? new Date(member.unlock_at) : null;
        const isLegacy = member.is_legacy === true;
        const isManualOverride = member.manual_override_unlocked === true;
        const isTimeUnlocked = unlockAt ? now >= unlockAt : true;

        if (isLegacy) {
            return {
                type: 'legacy',
                label: '👑 Legado (Acesso Total)',
                badgeClass: 'badge-legacy',
                canOverride: false
            };
        }
        if (isManualOverride) {
            return {
                type: 'manual',
                label: '🔓 Liberado Manualmente',
                badgeClass: 'badge-drip-unlocked',
                canOverride: false
            };
        }
        if (isTimeUnlocked) {
            return {
                type: 'unlocked',
                label: '✅ Liberado (+7 Dias)',
                badgeClass: 'badge-drip-unlocked',
                canOverride: false
            };
        }

        // Remaining time calculation
        const diffMs = unlockAt ? (unlockAt - now) : 0;
        const diffHoursTotal = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const days = Math.floor(diffHoursTotal / 24);
        const hours = diffHoursTotal % 24;

        return {
            type: 'drip',
            label: `⏳ Faltam ${days}d ${hours}h`,
            badgeClass: 'badge-drip-locked',
            canOverride: true,
            daysRemaining: days
        };
    }

    async function fetchMembersData() {
        showLoading(true);
        const { data, error } = await supabase
            .from('members_access')
            .select('*')
            .eq('funnel_id', currentMembersArea)
            .order('purchase_at', { ascending: false });

        showLoading(false);

        if (error) {
            console.error('Error fetching members access data:', error);
            return;
        }

        allMembersData = data || [];
        renderMembersKPIsAndTable();
    }

    function renderMembersKPIsAndTable() {
        const info = membersInfo[currentMembersArea];
        const areaBadge = document.getElementById('member-kpi-area-badge');
        if (areaBadge && info) areaBadge.innerText = info.kpiBadge;

        let countTotal = allMembersData.length;
        let countDrip = 0;
        let countUnlocked = 0;
        let countLegacy = 0;

        allMembersData.forEach(member => {
            const status = getDripStatus(member);
            if (status.type === 'legacy') countLegacy++;
            else if (status.type === 'drip') countDrip++;
            else countUnlocked++;
        });

        updateDOM('member-kpi-total', countTotal);
        updateDOM('member-kpi-drip', countDrip);
        updateDOM('member-kpi-unlocked', countUnlocked);
        updateDOM('member-kpi-legacy', countLegacy);

        // Filter Counts in Pills
        const countAllEl = document.getElementById('count-filter-all');
        const countDripEl = document.getElementById('count-filter-drip');
        const countUnlockedEl = document.getElementById('count-filter-unlocked');
        const countLegacyEl = document.getElementById('count-filter-legacy');
        if (countAllEl) countAllEl.innerText = countTotal;
        if (countDripEl) countDripEl.innerText = countDrip;
        if (countUnlockedEl) countUnlockedEl.innerText = countUnlocked;
        if (countLegacyEl) countLegacyEl.innerText = countLegacy;

        // Filter rows for Table
        const filtered = allMembersData.filter(m => {
            const status = getDripStatus(m);
            // Status filter
            if (currentMemberStatusFilter === 'drip' && status.type !== 'drip') return false;
            if (currentMemberStatusFilter === 'unlocked' && status.type !== 'unlocked' && status.type !== 'manual') return false;
            if (currentMemberStatusFilter === 'legacy' && status.type !== 'legacy') return false;

            // Search query filter
            if (memberSearchQuery) {
                const q = memberSearchQuery.toLowerCase();
                const name = (m.name || '').toLowerCase();
                const email = (m.email || '').toLowerCase();
                const tx = (m.transaction_id || '').toLowerCase();
                return name.includes(q) || email.includes(q) || tx.includes(q);
            }
            return true;
        });

        const tbody = document.getElementById('members-tbody');
        const emptyState = document.getElementById('members-empty');

        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        tbody.innerHTML = filtered.map(member => {
            const status = getDripStatus(member);
            const purchaseDate = member.purchase_at 
                ? new Date(member.purchase_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—';
            
            const lastAccessDate = member.last_access_at
                ? new Date(member.last_access_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                : 'Nunca acessou';

            const providerBadgeClass = member.provider === 'hotmart' ? 'badge-hotmart' : (member.provider === 'payt' ? 'badge-payt' : 'badge-kiwify');
            const providerName = member.provider === 'hotmart' ? 'Hotmart' : (member.provider === 'payt' ? 'Payt' : 'Kiwify');

            return `
                <tr class="hover:bg-white/[0.02] transition-colors" data-member-id="${member.id}">
                    <td class="py-4 px-6">
                        <div class="font-bold text-white text-xs">${member.name || 'Aluna'}</div>
                        <div class="text-[11px] text-cyan-300/80 font-mono mt-0.5">${member.email}</div>
                        ${member.transaction_id ? `<div class="text-[9px] text-slate-500 font-mono mt-0.5">TX: ${member.transaction_id}</div>` : ''}
                    </td>
                    <td class="py-4 px-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${providerBadgeClass}">
                            ${providerName}
                        </span>
                    </td>
                    <td class="py-4 px-4 font-mono text-[11px] text-slate-300">
                        <div>${purchaseDate}</div>
                        <div class="text-[9px] text-slate-500 mt-0.5">Compra oficial</div>
                    </td>
                    <td class="py-4 px-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${status.badgeClass}">
                            ${status.label}
                        </span>
                    </td>
                    <td class="py-4 px-4 font-mono text-[11px]">
                        <div class="text-slate-300">${lastAccessDate}</div>
                        <div class="text-[9px] text-slate-500 mt-0.5">${member.access_count || 0} acessos totais</div>
                    </td>
                    <td class="py-4 px-6 text-right">
                        ${status.canOverride ? `
                            <button class="unlock-member-btn px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1.5 ml-auto" data-id="${member.id}" data-email="${member.email}">
                                <span>🔓</span>
                                <span>Liberar Agora</span>
                            </button>
                        ` : `
                            <span class="text-[11px] text-slate-500 font-medium">Liberado ✓</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Unlock Button Listeners
        tbody.querySelectorAll('.unlock-member-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const memberId = e.currentTarget.dataset.id;
                const memberEmail = e.currentTarget.dataset.email;
                if (!confirm(`Deseja liberar imediatamente todos os bônus para ${memberEmail}?`)) return;

                btn.disabled = true;
                btn.innerHTML = '<span>⏳</span><span>Liberando...</span>';

                const { error } = await supabase
                    .from('members_access')
                    .update({ manual_override_unlocked: true })
                    .eq('id', memberId);

                if (error) {
                    alert('Erro ao liberar acesso: ' + error.message);
                    btn.disabled = false;
                    btn.innerHTML = '<span>🔓</span><span>Liberar Agora</span>';
                } else {
                    await fetchMembersData();
                }
            });
        });
    }

    // ============================================
    // NAVIGATION SWITCHER (FUNNELS vs MEMBERS)
    // ============================================

    function switchView(type, target) {
        currentNavType = type;
        
        const viewFunnels = document.getElementById('view-funnels');
        const viewMembers = document.getElementById('view-members');
        const funnelTimeFilters = document.getElementById('funnel-time-filters');
        const membersAreaTabs = document.getElementById('members-area-tabs');
        const titleEl = document.getElementById('current-view-title');
        const badgeEl = document.getElementById('current-view-badge');

        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

        if (type === 'funnel') {
            currentOffer = target;
            if (viewFunnels) viewFunnels.classList.remove('hidden');
            if (viewMembers) viewMembers.classList.add('hidden');
            if (funnelTimeFilters) funnelTimeFilters.classList.remove('hidden');
            if (membersAreaTabs) {
                membersAreaTabs.classList.remove('flex');
                membersAreaTabs.classList.add('hidden');
            }

            const activeBtn = document.querySelector(`.offer-item[data-target="${target}"]`);
            if (activeBtn) activeBtn.classList.add('active');

            const info = funnelInfo[currentOffer] || { title: currentOffer, badge: 'Funil', badgeClass: 'bg-white/10 text-white' };
            if (titleEl) titleEl.innerText = info.title;
            if (badgeEl) {
                badgeEl.innerText = info.badge;
                badgeEl.className = `text-[10px] font-semibold px-2.5 py-1 rounded-full ${info.badgeClass}`;
            }

            fetchFunnelData();
        } else {
            currentMembersArea = target;
            if (viewFunnels) viewFunnels.classList.add('hidden');
            if (viewMembers) viewMembers.classList.remove('hidden');
            if (funnelTimeFilters) funnelTimeFilters.classList.add('hidden');
            if (membersAreaTabs) {
                membersAreaTabs.classList.remove('hidden');
                membersAreaTabs.classList.add('flex');
            }

            const activeNavBtn = document.querySelector(`.member-nav-item[data-target="${target}"]`);
            if (activeNavBtn) activeNavBtn.classList.add('active');

            document.querySelectorAll('.member-tab-btn').forEach(tb => {
                if (tb.dataset.funnel === target) {
                    tb.classList.add('active', 'text-white');
                    tb.classList.remove('text-slate-400');
                } else {
                    tb.classList.remove('active', 'text-white');
                    tb.classList.add('text-slate-400');
                }
            });

            const info = membersInfo[currentMembersArea] || { title: currentMembersArea, badge: 'Membros', badgeClass: 'bg-white/10 text-white' };
            if (titleEl) titleEl.innerText = info.title;
            if (badgeEl) {
                badgeEl.innerText = info.badge;
                badgeEl.className = `text-[10px] font-semibold px-2.5 py-1 rounded-full ${info.badgeClass}`;
            }

            fetchMembersData();
        }
    }

    // Nav Item Click Handlers
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.dataset.type;
            const target = e.currentTarget.dataset.target;
            switchView(type, target);
        });
    });

    // Members Area Top Tab Handlers
    document.querySelectorAll('.member-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.funnel;
            switchView('members', target);
        });
    });

    // Funnel Time Filter Buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTimeFilter = e.currentTarget.dataset.time;
            document.querySelectorAll('.time-btn').forEach(b => {
                b.classList.remove('active', 'text-white');
                b.classList.add('text-slate-400');
            });
            e.currentTarget.classList.add('active', 'text-white');
            e.currentTarget.classList.remove('text-slate-400');
            fetchFunnelData();
        });
    });

    // Member Status Filter Pills
    document.querySelectorAll('.member-filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMemberStatusFilter = e.currentTarget.dataset.status;
            document.querySelectorAll('.member-filter-pill').forEach(b => {
                b.classList.remove('active', 'text-white');
                b.classList.add('text-slate-400');
            });
            e.currentTarget.classList.add('active', 'text-white');
            e.currentTarget.classList.remove('text-slate-400');
            renderMembersKPIsAndTable();
        });
    });

    // Member Search Input
    const searchInput = document.getElementById('member-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            memberSearchQuery = e.target.value.trim();
            renderMembersKPIsAndTable();
        });
    }

    // Refresh Members Button
    const refreshMembersBtn = document.getElementById('refresh-members-btn');
    if (refreshMembersBtn) {
        refreshMembersBtn.addEventListener('click', () => {
            fetchMembersData();
        });
    }

    // Realtime Supabase Channels
    let debounceFunnelTimer = null;
    let debounceMembersTimer = null;

    supabase
        .channel('realtime-dashboard-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
            const aliases = funnelInfo[currentOffer]?.aliases || [currentOffer];
            if (aliases.includes(payload.new.offer_id) || aliases.includes(payload.new.funnel_id)) {
                clearTimeout(debounceFunnelTimer);
                debounceFunnelTimer = setTimeout(fetchFunnelData, 1000);
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members_access' }, payload => {
            clearTimeout(debounceMembersTimer);
            debounceMembersTimer = setTimeout(() => {
                if (currentNavType === 'members') fetchMembersData();
            }, 1000);
        })
        .subscribe();

    // Auto refresh every 25s
    setInterval(() => {
        if (currentNavType === 'funnel') fetchFunnelData();
        else fetchMembersData();
    }, 25000);

    // ============================================
    // AI COPILOT DRAWER (GEMINI CHAT ASSISTANT)
    // ============================================

    const aiDrawer = document.getElementById('ai-drawer');
    const aiDrawerOverlay = document.getElementById('ai-drawer-overlay');
    const openAiBtn = document.getElementById('open-ai-copilot-btn');
    const headerAiBtn = document.getElementById('header-ai-btn');
    const closeAiBtn = document.getElementById('close-ai-drawer-btn');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatMessages = document.getElementById('ai-chat-messages');

    function openAiDrawer() {
        if (aiDrawer) aiDrawer.classList.add('drawer-open');
        if (aiDrawerOverlay) aiDrawerOverlay.classList.remove('hidden');
        if (aiChatInput) setTimeout(() => aiChatInput.focus(), 300);
    }

    function closeAiDrawer() {
        if (aiDrawer) aiDrawer.classList.remove('drawer-open');
        if (aiDrawerOverlay) aiDrawerOverlay.classList.add('hidden');
    }

    if (openAiBtn) openAiBtn.addEventListener('click', openAiDrawer);
    if (headerAiBtn) headerAiBtn.addEventListener('click', openAiDrawer);
    if (closeAiBtn) closeAiBtn.addEventListener('click', closeAiDrawer);
    if (aiDrawerOverlay) aiDrawerOverlay.addEventListener('click', closeAiDrawer);

    function appendMessage(sender, text) {
        if (!aiChatMessages) return;
        const isAi = sender === 'ai';
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`;

        const iconHtml = isAi 
            ? '<div class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-sm">🤖</div>'
            : '<div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 text-sm">👤</div>';

        const bubbleClasses = isAi 
            ? 'bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-200 space-y-2 max-w-[85%]'
            : 'bg-cyan-600/30 border border-cyan-500/40 rounded-2xl rounded-tr-none p-3.5 text-xs text-white max-w-[85%]';

        msgDiv.innerHTML = `
            ${iconHtml}
            <div class="${bubbleClasses}">
                ${text}
            </div>
        `;

        aiChatMessages.appendChild(msgDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }

    async function handleAiPrompt(promptText) {
        appendMessage('user', promptText);
        appendMessage('ai', '<div class="flex items-center space-x-2 text-cyan-400"><svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Consultando base do Supabase...</span></div>');

        // Fetch fresh all-areas members context
        const { data: allMembers } = await supabase
            .from('members_access')
            .select('*')
            .order('purchase_at', { ascending: false });

        const members = allMembers || [];
        const lowerPrompt = promptText.toLowerCase();

        // Remove loading spinner
        if (aiChatMessages && aiChatMessages.lastElementChild) {
            aiChatMessages.removeChild(aiChatMessages.lastElementChild);
        }

        let replyHtml = '';

        // Check for manual unlock command
        const emailMatch = promptText.match(/[\w.-]+@[\w.-]+\.\w+/);
        if ((lowerPrompt.includes('libera') || lowerPrompt.includes('desbloque')) && emailMatch) {
            const targetEmail = emailMatch[0];
            const targetMember = members.find(m => m.email.toLowerCase() === targetEmail.toLowerCase());

            if (!targetMember) {
                replyHtml = `<p>❌ Não encontrei nenhum cadastro com o e-mail <strong>${targetEmail}</strong> no Supabase.</p>`;
            } else {
                const { error: updErr } = await supabase
                    .from('members_access')
                    .update({ manual_override_unlocked: true })
                    .eq('id', targetMember.id);

                if (updErr) {
                    replyHtml = `<p class="text-rose-400">❌ Erro ao liberar acesso: ${updErr.message}</p>`;
                } else {
                    replyHtml = `
                        <p class="text-emerald-400 font-bold">✅ Bônus liberados com sucesso!</p>
                        <p>A aluna <strong>${targetMember.name || targetEmail}</strong> (${targetEmail}) teve o status atualizado para <em>manual_override_unlocked = true</em>.</p>
                        <p class="text-[10px] text-slate-400 font-mono">Oferta: ${targetMember.funnel_id} | Gateway: ${targetMember.provider}</p>
                    `;
                    fetchMembersData();
                }
            }
        } else if (lowerPrompt.includes('quem desbloqueia') || lowerPrompt.includes('próximos 3 dias') || lowerPrompt.includes('completam 7 dias')) {
            const now = new Date();
            const upcoming = members.filter(m => {
                if (m.is_legacy || m.manual_override_unlocked) return false;
                if (!m.unlock_at) return false;
                const unlock = new Date(m.unlock_at);
                const diffDays = (unlock - now) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 3.5;
            });

            if (upcoming.length === 0) {
                replyHtml = `<p>🔍 Não há nenhuma aluna com desbloqueio previsto para os próximos 3 dias. Todas as compras ativas estão em dia ou liberadas!</p>`;
            } else {
                replyHtml = `
                    <p class="font-bold text-white">⏳ Alunas que desbloqueiam bônus em breve (${upcoming.length}):</p>
                    <ul class="space-y-1.5 mt-2">
                        ${upcoming.map(m => {
                            const unlock = new Date(m.unlock_at);
                            const diffHours = Math.max(0, Math.floor((unlock - now) / (1000 * 60 * 60)));
                            const days = Math.floor(diffHours / 24);
                            const hours = diffHours % 24;
                            return `
                                <li class="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <div class="font-bold text-white">${m.name || 'Aluna'} (${m.email})</div>
                                        <div class="text-[10px] text-slate-400 font-mono">Gateway: ${m.provider.toUpperCase()} | Oferta: ${m.funnel_id}</div>
                                    </div>
                                    <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">Faltam ${days}d ${hours}h</span>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                `;
            }
        } else if (lowerPrompt.includes('resumo') || lowerPrompt.includes('geral')) {
            const latamTotal = members.filter(m => m.funnel_id === 'mapa-prazer-masculino-latam').length;
            const brTotal = members.filter(m => m.funnel_id === 'mapa-prazer-masculino-br').length;
            const enTotal = members.filter(m => m.funnel_id === 'mapa-prazer-masculino-en').length;
            const totalDrip = members.filter(m => getDripStatus(m).type === 'drip').length;
            const totalUnlocked = members.filter(m => getDripStatus(m).type === 'unlocked' || getDripStatus(m).type === 'manual').length;
            const totalLegacy = members.filter(m => m.is_legacy === true).length;

            replyHtml = `
                <div class="space-y-2">
                    <p class="font-bold text-white">📊 Panorama Geral de Membros & Drip:</p>
                    <div class="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                        <div class="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                            <div class="text-xs font-bold text-white">${latamTotal}</div>
                            <div>LATAM</div>
                        </div>
                        <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            <div class="text-xs font-bold text-white">${brTotal}</div>
                            <div>Brasil</div>
                        </div>
                        <div class="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                            <div class="text-xs font-bold text-white">${enTotal}</div>
                            <div>Inglês</div>
                        </div>
                    </div>
                    <div class="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] space-y-1">
                        <div>🔒 <strong>Em Drip (&lt; 7 dias):</strong> ${totalDrip} alunas</div>
                        <div>✅ <strong>Bônus Liberados:</strong> ${totalUnlocked} alunas</div>
                        <div>👑 <strong>Alunas Legadas:</strong> ${totalLegacy} alunas</div>
                    </div>
                </div>
            `;
        } else if (lowerPrompt.includes('brasil') || lowerPrompt.includes('payt')) {
            const brMembers = members.filter(m => m.funnel_id === 'mapa-prazer-masculino-br');
            replyHtml = `
                <div class="space-y-2">
                    <p class="font-bold text-white">🇧🇷 Membros do Mapa Brasil (Payt / Kiwify):</p>
                    <p class="text-slate-300">Total cadastrado: <strong>${brMembers.length} alunas</strong>.</p>
                    <ul class="space-y-1 mt-2">
                        ${brMembers.slice(0, 5).map(m => {
                            const st = getDripStatus(m);
                            return `
                                <li class="p-2 rounded bg-white/[0.03] text-[11px] flex justify-between items-center">
                                    <div>
                                        <div class="font-semibold text-white">${m.name || 'Aluna'} (${m.email})</div>
                                        <div class="text-[9px] text-slate-500 font-mono">Gateway: ${m.provider}</div>
                                    </div>
                                    <span class="text-[10px] ${st.badgeClass} px-2 py-0.5 rounded font-mono">${st.label}</span>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;
        } else {
            replyHtml = `
                <p>Encontrei <strong>${members.length} membros</strong> cadastrados no Supabase.</p>
                <p class="text-slate-300">Você pode me pedir para:</p>
                <ul class="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Ver alunas em período de Drip</li>
                    <li>Liberar acesso imediato digitando <em>"Libera o bônus para aluna@email.com"</em></li>
                    <li>Filtrar por gateway (Hotmart, Payt, Kiwify) ou país</li>
                </ul>
            `;
        }

        appendMessage('ai', replyHtml);
    }

    if (aiChatForm) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = aiChatInput.value.trim();
            if (!text) return;
            aiChatInput.value = '';
            handleAiPrompt(text);
        });
    }

    document.querySelectorAll('.ai-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const prompt = e.currentTarget.dataset.prompt;
            handleAiPrompt(prompt);
        });
    });

    // Initial Execution (Start with Funnel View)
    fetchFunnelData();
});
