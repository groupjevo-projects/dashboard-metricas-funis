document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Init
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const funnelInfo = {
        'latam': {
            title: 'Mapa do Prazer Masculino — LATAM',
            badge: 'GEO LATAM (Espanhol)',
            badgeClass: 'bg-emerald-100 text-emerald-800'
        },
        'chave-deusa-prazer-br': {
            title: 'Chave Deusa do Prazer — Brasil',
            badge: 'GEO Brasil (pt-BR)',
            badgeClass: 'bg-amber-100 text-amber-800'
        }
    };

    // Sidebar switching
    const offerButtons = document.querySelectorAll('.offer-btn');
    let currentOffer = 'latam';

    // Chart Setup
    const ctx = document.getElementById('trafficChart').getContext('2d');
    Chart.defaults.color = '#6b7280';
    Chart.defaults.scale.grid.color = '#f3f4f6';
    
    let trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Visitantes', data: [], borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.08)', tension: 0.35, fill: true },
                { label: 'Desbloqueios', data: [], borderColor: '#9333ea', backgroundColor: 'transparent', tension: 0.35 },
                { label: 'Cliques Checkout', data: [], borderColor: '#059669', backgroundColor: 'transparent', tension: 0.35 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#4b5563', usePointStyle: true, boxWidth: 6, font: { weight: '500' } } },
                tooltip: { backgroundColor: '#ffffff', titleColor: '#111827', bodyColor: '#4b5563', borderColor: '#e5e7eb', borderWidth: 1 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                x: { grid: { color: 'transparent' } }
            }
        }
    });

    // Data State
    let metrics = { visitors: 0, responses: 0, vslViews: 0, leads: 0, vslClicks: 0 };
    let currentTimeFilter = '24h';
    let fetchToken = 0;

    async function fetchAllEvents(sinceIso) {
        const pageSize = 1000;
        let allRows = [];
        let from = 0;

        // Query by offer_id OR funnel_id
        while (true) {
            const { data, error } = await supabase
                .from('funnel_events')
                .select('event_type, created_at, offer_id')
                .eq('offer_id', currentOffer)
                .gte('created_at', sinceIso)
                .order('created_at', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) {
                console.warn("Retrying fetch or error occurred:", error.message);
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
        
        const newVal = format === 'percent' ? (value || 0).toFixed(1) + '%' : Math.round(value || 0).toString();
        if (el.innerText !== newVal) {
            el.innerText = newVal;
            el.classList.remove('value-updated');
            void el.offsetWidth;
            el.classList.add('value-updated');
        }
    }

    function renderMetrics() {
        const { visitors, responses, vslViews, leads, vslClicks } = metrics;
        
        // Cards
        updateDOM('metric-visits', visitors);
        updateDOM('metric-responses', responses);
        
        // Card 3: Taxa de avanço para próxima etapa
        const advanceRate = visitors > 0 ? (responses / visitors) * 100 : 0;
        updateDOM('metric-steps', advanceRate, 'percent');
        const pb = document.getElementById('metric-steps-bar');
        if(pb) pb.style.width = Math.min(100, advanceRate) + '%';
        
        // Card 4: Intenção de Checkout
        const checkoutRate = visitors > 0 ? (leads / visitors) * 100 : 0;
        updateDOM('metric-leads', checkoutRate, 'percent');

        // Funnel Step Calculations
        const rRate = visitors > 0 ? (responses / visitors) * 100 : 0;
        const vslRate = responses > 0 ? (vslViews / responses) * 100 : 0;
        const lRate = vslViews > 0 ? (leads / vslViews) * 100 : 0;
        
        updateDOM('funnel-val-1', visitors);
        updateDOM('funnel-val-2', responses);
        updateDOM('funnel-val-3', vslViews);
        updateDOM('funnel-val-4', leads);
        
        updateDOM('funnel-pct-2', rRate, 'percent');
        updateDOM('funnel-pct-3', vslRate, 'percent');
        updateDOM('funnel-pct-4', lRate, 'percent');

        const fb2 = document.getElementById('funnel-bar-2');
        if(fb2) fb2.style.width = Math.min(100, Math.max(5, rRate)) + '%';
        const fb3 = document.getElementById('funnel-bar-3');
        if(fb3) fb3.style.width = Math.min(100, Math.max(5, vslRate)) + '%';
        const fb4 = document.getElementById('funnel-bar-4');
        if(fb4) fb4.style.width = Math.min(100, Math.max(5, lRate)) + '%';

        updateDOM('interaction-rate', rRate, 'percent');
        updateDOM('bounce-rate', Math.max(0, 100 - rRate), 'percent');
    }

    async function fetchInitialData() {
        const myToken = ++fetchToken;
        const timeFilter = currentTimeFilter;

        const freshMetrics = { visitors: 0, responses: 0, vslViews: 0, leads: 0, vslClicks: 0 };

        const now = new Date();
        let since = new Date();
        let labels = [];
        let bins = 0;

        if (timeFilter === '24h') {
            since.setHours(now.getHours() - 24);
            bins = 24;
            for(let i=23; i>=0; i--) {
                const d = new Date(now.getTime() - i*60*60*1000);
                labels.push(d.getHours() + ':00');
            }
        } else if (timeFilter === '7d') {
            since.setDate(now.getDate() - 7);
            bins = 7;
            for(let i=6; i>=0; i--) {
                const d = new Date(now.getTime() - i*24*60*60*1000);
                labels.push(d.toLocaleDateString('pt-BR', {weekday: 'short'}));
            }
        } else if (timeFilter === '30d') {
            since.setDate(now.getDate() - 30);
            bins = 30;
            for(let i=29; i>=0; i--) {
                const d = new Date(now.getTime() - i*24*60*60*1000);
                labels.push(d.getDate() + '/' + (d.getMonth()+1));
            }
        }

        const data = await fetchAllEvents(since.toISOString());
        if (myToken !== fetchToken) return;

        const bins_data = [Array(bins).fill(0), Array(bins).fill(0), Array(bins).fill(0)];

        data.forEach(row => {
            const eventType = row.event_type;
            const eventTime = new Date(row.created_at || row.occurred_at);

            // Update Totals
            if (eventType === 'gate_view' || eventType === 'landing_view') freshMetrics.visitors++;
            else if (eventType === 'gate_unlock' || eventType === 'step_advance') freshMetrics.responses++;
            else if (eventType === 'vsl_view') freshMetrics.vslViews++;
            else if (eventType === 'vsl_player_interaction') freshMetrics.vslClicks++;
            else if (eventType === 'click_checkout') freshMetrics.leads++;

            // Bin into Chart
            let binIndex = -1;
            if (timeFilter === '24h') {
                binIndex = bins - 1 - Math.floor((now - eventTime) / (1000 * 60 * 60));
            } else if (timeFilter === '7d' || timeFilter === '30d') {
                binIndex = bins - 1 - Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
            }

            if (binIndex >= 0 && binIndex < bins) {
                if (eventType === 'gate_view' || eventType === 'landing_view') bins_data[0][binIndex]++;
                else if (eventType === 'gate_unlock' || eventType === 'step_advance') bins_data[1][binIndex]++;
                else if (eventType === 'click_checkout') bins_data[2][binIndex]++;
            }
        });

        metrics = freshMetrics;
        trafficChart.data.labels = labels;
        trafficChart.data.datasets[0].data = bins_data[0];
        trafficChart.data.datasets[1].data = bins_data[1];
        trafficChart.data.datasets[2].data = bins_data[2];

        renderMetrics();
        trafficChart.update('none');
    }

    // Subscribe to realtime inserts
    let realtimeDebounce = null;
    supabase
      .channel('realtime-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
          if (payload.new.offer_id === currentOffer || payload.new.funnel_id === currentOffer) {
              clearTimeout(realtimeDebounce);
              realtimeDebounce = setTimeout(fetchInitialData, 1500);
          }
      })
      .subscribe();

    offerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentOffer = e.currentTarget.dataset.offer;
            offerButtons.forEach(b => {
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

    fetchInitialData();
});
