document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Init
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Tab switching
    const tabSummary = document.getElementById('tab-summary');
    const tabFlow = document.getElementById('tab-flow');
    const viewSummary = document.getElementById('view-summary');
    const viewFlow = document.getElementById('view-flow');
    
    // Sidebar switching
    const offerButtons = document.querySelectorAll('.offer-btn');
    let currentOffer = 'latam';

    function switchTab(tab) {
        if (tab === 'summary') {
            tabSummary.classList.add('active', 'text-white', 'border-orange-500');
            tabSummary.classList.remove('text-gray-400', 'border-transparent');
            tabFlow.classList.remove('active', 'text-white', 'border-orange-500');
            tabFlow.classList.add('text-gray-400', 'border-transparent');
            viewSummary.classList.remove('hidden');
            viewFlow.classList.add('hidden');
        } else {
            tabFlow.classList.add('active', 'text-white', 'border-orange-500');
            tabFlow.classList.remove('text-gray-400', 'border-transparent');
            tabSummary.classList.remove('active', 'text-white', 'border-orange-500');
            tabSummary.classList.add('text-gray-400', 'border-transparent');
            viewFlow.classList.remove('hidden');
            viewSummary.classList.add('hidden');
            setTimeout(drawConnections, 50);
        }
    }

    tabSummary.addEventListener('click', () => switchTab('summary'));
    tabFlow.addEventListener('click', () => switchTab('flow'));

    function drawConnections() {
        const svg = document.getElementById('connections-svg');
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
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.scale.grid.color = '#361608';
    
    const trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${Math.floor(i/2)}:${i%2==0?'00':'30'}`),
            datasets: [
                { label: 'Visitantes', data: Array(24).fill(0), borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', tension: 0.4, fill: true },
                { label: 'Desbloqueios', data: Array(24).fill(0), borderColor: '#ec4899', backgroundColor: 'transparent', tension: 0.4 },
                { label: 'Checkouts', data: Array(24).fill(0), borderColor: '#f97316', backgroundColor: 'transparent', tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 6 } },
                tooltip: { backgroundColor: '#1c0c05', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: '#52220c', borderWidth: 1 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#361608' } },
                x: { grid: { color: 'transparent' } }
            }
        }
    });

    // Data State
    let metrics = { visitors: 0, responses: 0, vslViews: 0, leads: 0 };

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
        const { visitors, responses, vslViews, leads } = metrics;
        
        // Cards
        updateDOM('metric-visits', visitors);
        updateDOM('metric-responses', responses);
        
        const score = (responses/(visitors||1))*40 + (leads/(responses||1))*60;
        updateDOM('metric-steps', isNaN(score) ? 0 : score);
        updateDOM('metric-leads', leads);

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

        // Flow Nodes
        updateDOM('node-gate-views', visitors);
        updateDOM('node-vsl-views', responses);
        updateDOM('node-vsl-retention', rRate, 'percent');
        updateDOM('node-check-views', vslViews);
        updateDOM('node-check-retention', vslRate, 'percent');

        // Update chart current hour with totals
        const hour = new Date().getHours();
        const datasets = trafficChart.data.datasets;
        datasets[0].data[hour] = visitors;
        datasets[1].data[hour] = responses;
        datasets[2].data[hour] = leads;
        trafficChart.update('none');
    }

    function processEvent(eventType) {
        if (eventType === 'gate_view') metrics.visitors++;
        else if (eventType === 'gate_unlock') metrics.responses++;
        else if (eventType === 'vsl_view') metrics.vslViews++;
        else if (eventType === 'click_checkout') metrics.leads++;
        renderMetrics();
    }

    async function fetchInitialData() {
        metrics = { visitors: 0, responses: 0, vslViews: 0, leads: 0 };
        // Reset chart
        trafficChart.data.datasets.forEach(ds => ds.data = Array(24).fill(0));
        trafficChart.update('none');

        const { data, error } = await supabase
            .from('funnel_events')
            .select('event_type')
            .eq('offer_id', currentOffer);
            
        if (error) {
            console.error("Error fetching initial data", error);
            return;
        }
        
        data.forEach(row => processEvent(row.event_type));
    }

    // Subscribe to realtime inserts
    supabase
      .channel('realtime-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
          if (payload.new.offer_id === currentOffer) {
              processEvent(payload.new.event_type);
          }
      })
      .subscribe();

    offerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            currentOffer = targetBtn.dataset.offer;
            
            offerButtons.forEach(b => {
                b.classList.remove('bg-[#361608]', 'text-white', 'border-[#52220c]');
                b.classList.add('text-gray-400', 'border-transparent');
                b.querySelector('.text-xs').classList.replace('text-gray-400', 'text-gray-500');
            });
            
            targetBtn.classList.add('bg-[#361608]', 'text-white', 'border-[#52220c]');
            targetBtn.classList.remove('text-gray-400', 'border-transparent');
            targetBtn.querySelector('.text-xs').classList.replace('text-gray-500', 'text-gray-400');
            
            fetchInitialData();
        });
    });

    fetchInitialData();
    switchTab('summary');
});
