document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Configuration
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const funnelInfo = {
        'latam': {
            title: 'Mapa do Prazer Masculino — LATAM',
            badge: 'GEO LATAM (Espanhol)',
            badgeClass: 'bg-emerald-100 text-emerald-800',
            aliases: ['latam', 'mapa-prazer-masculino-latam']
        },
        'chave-deusa-prazer-br': {
            title: 'Chave Deusa do Prazer — Brasil',
            badge: 'GEO Brasil (pt-BR)',
            badgeClass: 'bg-amber-100 text-amber-800',
            aliases: ['chave-deusa-prazer-br', 'chave-deusa-br']
        }
    };

    let currentOffer = 'latam';
    let currentTimeFilter = '24h';
    let fetchToken = 0;

    // Chart Setup
    const ctx = document.getElementById('trafficChart').getContext('2d');
    Chart.defaults.color = '#6b7280';
    Chart.defaults.scale.grid.color = '#f3f4f6';
    
    let trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Visitantes Únicos',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6
                },
                {
                    label: 'Desbloqueios (Interação)',
                    data: [],
                    borderColor: '#9333ea',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6
                },
                {
                    label: 'Intenção de Compra (Checkout)',
                    data: [],
                    borderColor: '#059669',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6
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
                    labels: { color: '#4b5563', usePointStyle: true, boxWidth: 6, font: { weight: '600', size: 11 } }
                },
                tooltip: {
                    backgroundColor: '#ffffff',
                    titleColor: '#111827',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: '#f3f4f6' }
                },
                x: {
                    grid: { color: 'transparent' },
                    ticks: { maxRotation: 0, font: { size: 10 } }
                }
            }
        }
    });

    // Fetch all events with pagination from Supabase
    async function fetchAllEvents(sinceIso) {
        const pageSize = 1000;
        let allRows = [];
        let from = 0;
        const aliases = funnelInfo[currentOffer]?.aliases || [currentOffer];

        while (true) {
            const { data, error } = await supabase
                .from('funnel_events')
                .select('event_type, created_at, offer_id, session_id')
                .in('offer_id', aliases)
                .gte('created_at', sinceIso)
                .order('created_at', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) {
                console.warn("Supabase fetch notice:", error.message);
                break;
            }
            if (!data || data.length === 0) break;
            allRows = allRows.concat(data);
            if (data.length < pageSize) break;
            from += pageSize;
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

        const now = new Date();
        let since = new Date();
        let labels = [];
        let bins = 0;

        if (timeFilter === '24h') {
            since.setHours(now.getHours() - 24);
            bins = 24;
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                labels.push(d.getHours().toString().padStart(2, '0') + ':00');
            }
        } else if (timeFilter === '7d') {
            since.setDate(now.getDate() - 6);
            since.setHours(0, 0, 0, 0);
            bins = 7;
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labels.push(`${day}/${month}`);
            }
        } else if (timeFilter === '30d') {
            since.setDate(now.getDate() - 29);
            since.setHours(0, 0, 0, 0);
            bins = 30;
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                labels.push(`${day}/${month}`);
            }
        }

        const data = await fetchAllEvents(since.toISOString());
        if (myToken !== fetchToken) return;

        // Session-based unique tracking
        const uniqueVisitors = new Set();
        const uniqueUnlocks = new Set();
        const uniqueVSL = new Set();
        const uniqueCheckouts = new Set();

        const bins_visitors = Array(bins).fill(0);
        const bins_unlocks = Array(bins).fill(0);
        const bins_checkouts = Array(bins).fill(0);
        const bins_seen_sessions = Array.from({ length: bins }, () => new Set());

        data.forEach(row => {
            const eventType = row.event_type;
            const eventTime = new Date(row.created_at);
            const sessId = row.session_id || 'anon_' + Math.random();

            // Aggregate Funnel Metrics
            if (eventType === 'gate_view' || eventType === 'landing_view') {
                uniqueVisitors.add(sessId);
            } else if (eventType === 'gate_unlock' || eventType === 'step_advance') {
                uniqueVisitors.add(sessId);
                uniqueUnlocks.add(sessId);
            } else if (eventType === 'vsl_view' || eventType === 'vsl_player_loaded' || eventType === 'vsl_player_interaction') {
                uniqueVisitors.add(sessId);
                uniqueVSL.add(sessId);
            } else if (eventType === 'click_checkout') {
                uniqueVisitors.add(sessId);
                uniqueCheckouts.add(sessId);
            }

            // Calculate Bin Index
            let binIndex = -1;
            if (timeFilter === '24h') {
                const diffHours = Math.floor((now - eventTime) / (1000 * 60 * 60));
                binIndex = bins - 1 - diffHours;
            } else {
                const diffDays = Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
                binIndex = bins - 1 - diffDays;
            }

            if (binIndex >= 0 && binIndex < bins) {
                if (eventType === 'gate_view' || eventType === 'landing_view') {
                    if (!bins_seen_sessions[binIndex].has(sessId)) {
                        bins_seen_sessions[binIndex].add(sessId);
                        bins_visitors[binIndex]++;
                    }
                } else if (eventType === 'gate_unlock' || eventType === 'step_advance') {
                    bins_unlocks[binIndex]++;
                } else if (eventType === 'click_checkout') {
                    bins_checkouts[binIndex]++;
                }
            }
        });

        const totalVisitors = Math.max(uniqueVisitors.size, data.length > 0 ? 1 : 0);
        const totalUnlocks = uniqueUnlocks.size;
        const totalVSL = uniqueVSL.size;
        const totalCheckouts = uniqueCheckouts.size;

        // Card 1: Visitas Únicas
        updateDOM('metric-visits', totalVisitors);
        // Card 2: Desbloqueios
        updateDOM('metric-responses', totalUnlocks);
        // Card 3: Taxa de Avanço (Desbloqueio / Visitantes)
        const advanceRate = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        updateDOM('metric-steps', advanceRate, 'percent');
        const pb = document.getElementById('metric-steps-bar');
        if (pb) pb.style.width = Math.min(100, Math.max(0, advanceRate)) + '%';

        // Card 4: Intenção de Checkout
        const checkoutRate = totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0;
        updateDOM('metric-leads', checkoutRate, 'percent');

        // Funil de Conversão (Etapa por Etapa)
        updateDOM('funnel-val-1', totalVisitors);
        updateDOM('funnel-val-2', totalUnlocks);
        updateDOM('funnel-val-3', totalVSL);
        updateDOM('funnel-val-4', totalCheckouts);

        const unlockPct = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        const vslPct = totalUnlocks > 0 ? (totalVSL / totalUnlocks) * 100 : (totalVisitors > 0 ? (totalVSL / totalVisitors) * 100 : 0);
        const checkoutPct = totalVSL > 0 ? (totalCheckouts / totalVSL) * 100 : (totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0);

        updateDOM('funnel-pct-2', unlockPct, 'percent');
        updateDOM('funnel-pct-3', vslPct, 'percent');
        updateDOM('funnel-pct-4', checkoutPct, 'percent');

        const fb2 = document.getElementById('funnel-bar-2');
        if (fb2) fb2.style.width = Math.min(100, Math.max(5, unlockPct)) + '%';
        const fb3 = document.getElementById('funnel-bar-3');
        if (fb3) fb3.style.width = Math.min(100, Math.max(5, vslPct)) + '%';
        const fb4 = document.getElementById('funnel-bar-4');
        if (fb4) fb4.style.width = Math.min(100, Math.max(5, checkoutPct)) + '%';

        // Taxas Complementares
        updateDOM('interaction-rate', unlockPct, 'percent');
        updateDOM('bounce-rate', Math.max(0, 100 - unlockPct), 'percent');

        // Update Chart
        trafficChart.data.labels = labels;
        trafficChart.data.datasets[0].data = bins_visitors;
        trafficChart.data.datasets[1].data = bins_unlocks;
        trafficChart.data.datasets[2].data = bins_checkouts;
        trafficChart.update('none');
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

    // Auto refresh every 15s to keep time bins live
    setInterval(fetchInitialData, 15000);

    // Sidebar Funnel Selector
    document.querySelectorAll('.offer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentOffer = e.currentTarget.dataset.offer;
            document.querySelectorAll('.offer-btn').forEach(b => {
                b.classList.remove('bg-white', 'border', 'border-gray-200', 'shadow-sm', 'text-gray-900');
                b.classList.add('text-gray-600', 'hover:bg-gray-100');
            });
            e.currentTarget.classList.add('bg-white', 'border', 'border-gray-200', 'shadow-sm', 'text-gray-900');
            e.currentTarget.classList.remove('text-gray-600', 'hover:bg-gray-100');

            const info = funnelInfo[currentOffer] || { title: currentOffer, badge: 'Funil', badgeClass: 'bg-gray-100 text-gray-800' };
            const titleEl = document.getElementById('current-funnel-title');
            const badgeEl = document.getElementById('current-funnel-badge');
            if (titleEl) titleEl.innerText = info.title;
            if (badgeEl) {
                badgeEl.innerText = info.badge;
                badgeEl.className = `text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${info.badgeClass}`;
            }
            
            fetchInitialData();
        });
    });

    // Time Filter Buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTimeFilter = e.currentTarget.dataset.time;
            document.querySelectorAll('.time-btn').forEach(b => {
                b.classList.remove('bg-white', 'shadow-sm', 'text-gray-900', 'font-semibold');
                b.classList.add('text-gray-500', 'font-medium');
            });
            e.currentTarget.classList.add('bg-white', 'shadow-sm', 'text-gray-900', 'font-semibold');
            e.currentTarget.classList.remove('text-gray-500', 'font-medium');
            fetchInitialData();
        });
    });

    // Initial Execution
    fetchInitialData();
});
