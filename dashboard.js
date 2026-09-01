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

    let currentOffer = 'latam';
    let currentTimeFilter = 'today';
    let fetchToken = 0;

    // Dark Chart Setup
    const ctx = document.getElementById('trafficChart').getContext('2d');
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    
    let trafficChart = new Chart(ctx, {
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

    function showLoading(show) {
        const el = document.getElementById('loading-indicator');
        if (el) {
            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }

    // Parallel lightning-fast Supabase event fetcher
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

    async function fetchInitialData() {
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

        // Card 1: Visitantes Únicos no Gate
        updateDOM('metric-visits', totalVisitors);
        const visitsSub = document.getElementById('metric-visits-sub');
        if (visitsSub) visitsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1.5"></span> ${totalVisitors.toLocaleString('pt-BR')} sessões únicas no Gate`;

        // Card 2: Desbloqueios
        updateDOM('metric-responses', totalUnlocks);

        // Card 3: Taxa de Avanço (Desbloqueio / Visitantes)
        const advanceRate = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        updateDOM('metric-steps', advanceRate, 'percent');
        const pb = document.getElementById('metric-steps-bar');
        if (pb) pb.style.width = Math.min(100, Math.max(0, advanceRate)) + '%';

        // Card 4: Intenção de Checkout
        updateDOM('metric-leads', totalCheckouts);
        const leadsSub = document.getElementById('metric-leads-sub');
        const checkoutRate = totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0;
        if (leadsSub) leadsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span> ${checkoutRate.toFixed(1)}% do total de visitantes`;

        // Funil de Conversão (Jornada Etapa por Etapa)
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

        // Taxas de Resumo
        updateDOM('interaction-rate', unlockPct, 'percent');
        updateDOM('bounce-rate', Math.max(0, 100 - unlockPct), 'percent');

        // Update Chart
        trafficChart.data.labels = labels;
        trafficChart.data.datasets[0].data = bins_visitors;
        trafficChart.data.datasets[1].data = bins_unlocks;
        trafficChart.data.datasets[2].data = bins_checkouts;
        trafficChart.update();
    }

    // Realtime Supabase Channel
    let debounceTimer = null;
    supabase
        .channel('realtime-dashboard-events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
            const aliases = funnelInfo[currentOffer]?.aliases || [currentOffer];
            if (aliases.includes(payload.new.offer_id) || aliases.includes(payload.new.funnel_id)) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(fetchInitialData, 1000);
            }
        })
        .subscribe();

    // Auto refresh every 20s
    setInterval(fetchInitialData, 20000);

    // Sidebar Funnel Selector
    document.querySelectorAll('.offer-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentOffer = e.currentTarget.dataset.offer;
            document.querySelectorAll('.offer-item').forEach(b => {
                b.classList.remove('active');
            });
            e.currentTarget.classList.add('active');

            const info = funnelInfo[currentOffer] || { title: currentOffer, badge: 'Funil', badgeClass: 'bg-white/10 text-white' };
            const titleEl = document.getElementById('current-funnel-title');
            const badgeEl = document.getElementById('current-funnel-badge');
            if (titleEl) titleEl.innerText = info.title;
            if (badgeEl) {
                badgeEl.innerText = info.badge;
                badgeEl.className = `text-[10px] font-semibold px-2.5 py-1 rounded-full ${info.badgeClass}`;
            }
            
            fetchInitialData();
        });
    });

    // Time Filter Buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTimeFilter = e.currentTarget.dataset.time;
            document.querySelectorAll('.time-btn').forEach(b => {
                b.classList.remove('active', 'text-white');
                b.classList.add('text-slate-400');
            });
            e.currentTarget.classList.add('active', 'text-white');
            e.currentTarget.classList.remove('text-slate-400');
            fetchInitialData();
        });
    });

    // Initial Execution
    fetchInitialData();
});
