document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Init
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Tab switching
    
    
    
    
    
    // Sidebar switching
    const offerButtons = document.querySelectorAll('.offer-btn');
    let currentOffer = 'latam';

        }

    
    

    function drawConnections() {
        const svg = document.getElementById('flow-connections');
        if (!svg) return;
        svg.innerHTML = ''; 
        
        const connections = [
            { from: 'start-out', to: 'gate-in' },
            { from: 'gate-out', to: 'vsl-in' },
            { from: 'vsl-out', to: 'checkout-in' }
        ];

        const svgRect = svg.getBoundingClientRect();

        connections.forEach(conn => {
            const elFrom = document.querySelector(`[data-id="${conn.from}"]`);
            const elTo = document.querySelector(`[data-id="${conn.to}"]`);
            
            if (elFrom && elTo) {
                const rectFrom = elFrom.getBoundingClientRect();
                const rectTo = elTo.getBoundingClientRect();

                const startX = rectFrom.left + rectFrom.width / 2 - svgRect.left;
                const startY = rectFrom.top + rectFrom.height / 2 - svgRect.top;
                
                const endX = rectTo.left + rectTo.width / 2 - svgRect.left;
                const endY = rectTo.top + rectTo.height / 2 - svgRect.top;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const controlPointOffset = Math.abs(endX - startX) / 2;
                const d = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
                
                path.setAttribute('d', d);
                path.setAttribute('class', 'connection-line');
                path.style.animation = 'dash 10s linear infinite';
                path.style.strokeDasharray = '5, 5';
                
                svg.appendChild(path);
            }
        });
    }

    window.addEventListener('resize', () => {
        if (!viewFlow.classList.contains('hidden')) drawConnections();
    });

    // Chart Setup
    const ctx = document.getElementById('trafficChart').getContext('2d');
    Chart.defaults.color = '#6b7280';
    Chart.defaults.scale.grid.color = '#f3f4f6';
    
    let trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Visitantes', data: [], borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', tension: 0.4, fill: true },
                { label: 'Desbloqueios', data: [], borderColor: '#ec4899', backgroundColor: 'transparent', tension: 0.4 },
                { label: 'Checkouts', data: [], borderColor: '#f97316', backgroundColor: 'transparent', tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 6 } },
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
        if(pb) pb.style.width = advanceRate + '%';
        
        // Card 4: Taxa de cliques VSL
        const vslClickRate = visitors > 0 ? (vslClicks / visitors) * 100 : 0;
        updateDOM('metric-leads', vslClickRate, 'percent');

        // Funnel
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

        updateDOM('funnel-rate', visitors > 0 ? (leads / visitors) * 100 : 0, 'percent');
        updateDOM('interaction-rate', rRate, 'percent');
        updateDOM('bounce-rate', 100 - rRate, 'percent');


    }

    async function fetchInitialData() {
        metrics = { visitors: 0, responses: 0, vslViews: 0, leads: 0, vslClicks: 0 };
        
        const now = new Date();
        let since = new Date();
        let labels = [];
        let bins = 0;
        
        if (currentTimeFilter === '24h') {
            since.setHours(now.getHours() - 24);
            bins = 24;
            for(let i=23; i>=0; i--) {
                const d = new Date(now.getTime() - i*60*60*1000);
                labels.push(d.getHours() + ':00');
            }
        } else if (currentTimeFilter === '7d') {
            since.setDate(now.getDate() - 7);
            bins = 7;
            for(let i=6; i>=0; i--) {
                const d = new Date(now.getTime() - i*24*60*60*1000);
                labels.push(d.toLocaleDateString('pt-BR', {weekday: 'short'}));
            }
        } else if (currentTimeFilter === '30d') {
            since.setDate(now.getDate() - 30);
            bins = 30;
            for(let i=29; i>=0; i--) {
                const d = new Date(now.getTime() - i*24*60*60*1000);
                labels.push(d.getDate() + '/' + (d.getMonth()+1));
            }
        }
        
        trafficChart.data.labels = labels;
        trafficChart.data.datasets.forEach(ds => ds.data = Array(bins).fill(0));
        trafficChart.update('none');

        const { data, error } = await supabase
            .from('funnel_events')
            .select('event_type, created_at')
            .eq('offer_id', currentOffer)
            .gte('created_at', since.toISOString());
            
        if (error) {
            console.error("Error fetching data", error);
            return;
        }
        
        data.forEach(row => {
            const eventType = row.event_type;
            const eventTime = new Date(row.created_at);
            
            // Update Totals
            if (eventType === 'gate_view') metrics.visitors++;
            else if (eventType === 'gate_unlock') metrics.responses++;
            else if (eventType === 'vsl_view') metrics.vslViews++;
            else if (eventType === 'vsl_player_interaction') metrics.vslClicks++;
            else if (eventType === 'click_checkout') metrics.leads++;
            
            // Bin into Chart
            let binIndex = -1;
            if (currentTimeFilter === '24h') {
                binIndex = bins - 1 - Math.floor((now - eventTime) / (1000 * 60 * 60));
            } else if (currentTimeFilter === '7d' || currentTimeFilter === '30d') {
                binIndex = bins - 1 - Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
            }
            
            if (binIndex >= 0 && binIndex < bins) {
                if (eventType === 'gate_view') trafficChart.data.datasets[0].data[binIndex]++;
                else if (eventType === 'gate_unlock') trafficChart.data.datasets[1].data[binIndex]++;
                else if (eventType === 'click_checkout') trafficChart.data.datasets[2].data[binIndex]++;
            }
        });
        
        renderMetrics();
        trafficChart.update('none');
    }

    // Subscribe to realtime inserts
    supabase
      .channel('realtime-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
          if (payload.new.offer_id === currentOffer) {
              fetchInitialData(); // Re-fetch to re-bin
          }
      })
      .subscribe();

    offerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentOffer = e.currentTarget.dataset.offer;
            offerButtons.forEach(b => {
                b.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
                b.classList.add('text-gray-500', 'hover:text-gray-900');
                
            });
            e.currentTarget.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
            e.currentTarget.classList.remove('text-gray-500', 'hover:text-gray-900');
            
            fetchInitialData();
        });
    });

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTimeFilter = e.currentTarget.dataset.time;
            document.querySelectorAll('.time-btn').forEach(b => {
                b.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
                b.classList.add('text-gray-500', 'hover:text-gray-900');
            });
            e.currentTarget.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
            e.currentTarget.classList.remove('text-gray-500', 'hover:text-gray-900');
            fetchInitialData();
        });
    });

    fetchInitialData();
    
});
