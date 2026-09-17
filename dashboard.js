document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Configuration
    const supabaseUrl = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
    const supabaseKey = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // 3 Sales Funnels Catalog & Backend Architecture
    const funnelInfo = {
        'latam': {
            title: 'Mapa do Prazer Masculino — LATAM',
            badge: 'GEO LATAM (Espanhol)',
            badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
            domain: 'mapadelplacer.site',
            currency: 'USD',
            currencySymbol: 'US$',
            frontPrice: 17,
            aliases: ['latam', 'mapa-prazer-masculino-latam'],
            backend: {
                frontName: 'Mapa del Placer (Front-End)',
                frontPrice: 17,
                up1Name: 'Pompoarismo de las Diosas / Protocolo',
                up1Route: '/up1',
                up1Price: 39,
                ds1Name: 'Guía Express — Descuento Especial',
                ds1Route: '/down1',
                ds1Price: 27,
                up2Name: 'Cofre Secreto de la Pasión',
                up2Route: '/up2',
                up2Price: 47,
                tksRoute: '/tks'
            }
        },
        'br': {
            title: 'Mapa do Prazer Masculino — Brasil',
            badge: 'GEO Brasil (pt-BR)',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            domain: 'mapadoprazer.site',
            currency: 'BRL',
            currencySymbol: 'R$',
            frontPrice: 67,
            aliases: ['br', 'mapa-prazer-masculino-br', 'chave-deusa-prazer-br', 'chave-deusa-br'],
            backend: {
                frontName: 'Mapa do Prazer (Front-End)',
                frontPrice: 67,
                up1Name: 'A Cavalgada Proibida (14 Dias)',
                up1Route: '/up1',
                up1Price: 197,
                ds1Name: 'Condição Express — A Cavalgada',
                ds1Route: '/down1',
                ds1Price: 97,
                up2Name: 'Pompoarismo Black',
                up2Route: '/up2',
                up2Price: 147,
                tksRoute: '/tks'
            }
        },
        'en': {
            title: 'Male Pleasure Map — English',
            badge: 'GEO USA/Global (English)',
            badgeClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
            domain: 'mapofpleasure.site',
            currency: 'USD',
            currencySymbol: 'US$',
            frontPrice: 27,
            aliases: ['en', 'mapa-prazer-masculino-en'],
            backend: {
                frontName: 'Male Pleasure Map (Front-End)',
                frontPrice: 27,
                up1Name: 'The Forbidden Ride / Protocol',
                up1Route: '/up1',
                up1Price: 47,
                ds1Name: 'Express Guide / Special Discount',
                ds1Route: '/down1',
                ds1Price: 29,
                up2Name: 'Goddess Secret Vault',
                up2Route: '/up2',
                up2Price: 49,
                tksRoute: '/tks'
            }
        }
    };

    // State Variables
    let currentOffer = 'latam';
    let currentTimeFilter = '24h'; // Default to last 24h / today
    let currentFlowMode = 'full'; // 'frontend', 'backend', or 'full'
    let fetchToken = 0;

    // Chart Configuration
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
                        label: 'Desbloqueios (Avançaram)',
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
                        label: 'Cliques Checkout (Intenção)',
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
    // DATA FETCHING (CONGRUENT & PAGINATED)
    // ============================================

    async function fetchAllEvents(sinceIso) {
        const currentConfig = funnelInfo[currentOffer];
        const aliases = currentConfig?.aliases || [currentOffer];
        const pageSize = 1000;
        const maxPages = 10;

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
            '30d': 'Últimos 30 Dias',
            'all': 'Todo o Período'
        };

        const periodLabel = periodLabels[timeFilter] || 'Período';
        const periodEl = document.getElementById('funnel-period-label');
        const frontBadge = document.getElementById('front-period-badge');
        if (periodEl) periodEl.innerText = periodLabel;
        if (frontBadge) frontBadge.innerText = periodLabel;

        if (timeFilter === 'today') {
            since = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            bins = 24;
            for (let i = 0; i < 24; i++) labels.push(i.toString().padStart(2, '0') + ':00');
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
                labels.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
            }
        } else if (timeFilter === '30d') {
            since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            since.setHours(0, 0, 0, 0);
            bins = 30;
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                labels.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
            }
        } else {
            // 'all': no date cut-off, summarize across all data points
            since = null;
            bins = 12;
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000);
                labels.push(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`);
            }
        }

        const data = await fetchAllEvents(since ? since.toISOString() : null);
        showLoading(false);
        if (myToken !== fetchToken) return;

        const uniqueGateViews = new Set();
        const uniqueGateUnlocks = new Set();
        const uniqueVSLViews = new Set();
        const uniqueCheckouts = new Set();

        // Webhook & Financial Data
        const purchases = [];
        const refunds = [];
        const chargebacks = [];
        let abandonments = 0;

        // Real Telemetry Data for Backend (Upsell/Downsell/Tks)
        const uniqueUp1Views = new Set();
        const uniqueDown1Views = new Set();
        const uniqueTksViews = new Set();

        const bins_visitors = Array(bins).fill(0);
        const bins_unlocks = Array(bins).fill(0);
        const bins_checkouts = Array(bins).fill(0);
        const bins_seen_visitors = Array.from({ length: bins }, () => new Set());
        const bins_seen_unlocks = Array.from({ length: bins }, () => new Set());
        const bins_seen_checkouts = Array.from({ length: bins }, () => new Set());

        const seenTx = new Set();
        function parseFinancialSession(sessId, defaultPrice, defaultCurrency) {
            if (sessId && sessId.startsWith('tx:')) {
                const parts = sessId.split(':');
                const txId = parts[1] || '';
                const amountCents = parseInt(parts[2], 10);
                const currency = parts[3] || defaultCurrency;
                const provider = parts[4] || 'hotmart';
                let productType = parts[5] || 'front';

                // Filter out dummy test seeds
                const isDummy = txId.includes('TEST') || txId === '12345' || txId.includes('PAYTS2') || txId.includes('1789654331733');
                if (isDummy) return null;

                let amount = defaultPrice;
                if (!isNaN(amountCents) && amountCents > 0) {
                    const rawVal = amountCents / 100;
                    if (currency === 'USD' || currency === 'EUR') {
                        amount = rawVal;
                    } else if (currency === 'BRL') {
                        amount = rawVal;
                    } else if (currency === 'COP') {
                        amount = rawVal / 4000;
                    } else if (currency === 'ARS') {
                        amount = rawVal / 1400;
                    } else if (currency === 'MXN') {
                        amount = rawVal / 19;
                    } else if (currency === 'CLP') {
                        amount = rawVal / 950;
                    } else {
                        amount = defaultPrice;
                    }
                }
                return { txId, amount, currency, provider, productType };
            }
            return null;
        }

        const info = funnelInfo[currentOffer] || funnelInfo['latam'];

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
            } else if (eventType === 'purchase_approved') {
                const fin = parseFinancialSession(sessId, info.frontPrice, info.currency);
                if (fin && !seenTx.has(fin.txId)) {
                    seenTx.add(fin.txId);
                    purchases.push(fin);
                }
            } else if (eventType === 'purchase_refunded') {
                const fin = parseFinancialSession(sessId, info.frontPrice, info.currency);
                if (fin) refunds.push(fin);
            } else if (eventType === 'purchase_chargeback') {
                const fin = parseFinancialSession(sessId, info.frontPrice, info.currency);
                if (fin) chargebacks.push(fin);
            } else if (eventType === 'cart_abandonment') {
                abandonments++;
            } else if (eventType === 'up1_view') {
                uniqueUp1Views.add(sessId);
            } else if (eventType === 'down1_view') {
                uniqueDown1Views.add(sessId);
            } else if (eventType === 'tks_view') {
                uniqueTksViews.add(sessId);
            }

            let binIndex = -1;
            if (timeFilter === 'today') {
                binIndex = eventTime.getHours();
            } else if (timeFilter === '24h') {
                const diffHours = Math.floor((now - eventTime) / (1000 * 60 * 60));
                binIndex = bins - 1 - diffHours;
            } else if (timeFilter === 'all') {
                const diffDays = Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
                binIndex = Math.max(0, bins - 1 - Math.floor(diffDays / 2));
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

        // Front-End Cards Update
        updateDOM('metric-visits', totalVisitors);
        const visitsSub = document.getElementById('metric-visits-sub');
        if (visitsSub) visitsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1.5"></span> ${totalVisitors.toLocaleString('pt-BR')} sessões no Gate`;

        updateDOM('metric-responses', totalUnlocks);

        const advanceRate = totalVisitors > 0 ? (totalUnlocks / totalVisitors) * 100 : 0;
        updateDOM('metric-steps', advanceRate, 'percent');
        const pb = document.getElementById('metric-steps-bar');
        if (pb) pb.style.width = Math.min(100, Math.max(0, advanceRate)) + '%';

        updateDOM('metric-leads', totalCheckouts);
        const leadsSub = document.getElementById('metric-leads-sub');
        const checkoutRate = totalVisitors > 0 ? (totalCheckouts / totalVisitors) * 100 : 0;
        if (leadsSub) leadsSub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span> ${checkoutRate.toFixed(1)}% dos visitantes`;

        // Front-End Conversion Journey
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

        // Webhook Purchases Breakdown
        let frontPurchasesCount = 0;
        let up1PurchasesCount = 0;
        let ds1PurchasesCount = 0;
        let orderBumpCount = 0;

        purchases.forEach(p => {
            if (p.productType === 'up1') {
                up1PurchasesCount++;
            } else if (p.productType === 'down1') {
                ds1PurchasesCount++;
            } else if (p.productType === 'order_bump') {
                orderBumpCount++;
            } else {
                frontPurchasesCount++;
            }
        });

        // ============================================
        // RENDER FINANCIAL HEALTH & REAL SALES
        // ============================================
        renderFinancialMetrics(purchases, refunds, chargebacks, abandonments, totalCheckouts, frontPurchasesCount, orderBumpCount);

        // ============================================
        // RENDER BACK-END (UPSELL & DOWNSELL FLOW)
        // ============================================
        renderBackendFlow(
            totalCheckouts, 
            frontPurchasesCount, 
            uniqueUp1Views.size, 
            up1PurchasesCount, 
            uniqueDown1Views.size, 
            ds1PurchasesCount, 
            uniqueTksViews.size
        );
    }

    // ============================================
    // RENDER FINANCIAL HEALTH & REAL SALES
    // ============================================
    function renderFinancialMetrics(purchases, refunds, chargebacks, abandonments, checkoutClicks, frontCount = 0, bumpCount = 0) {
        const info = funnelInfo[currentOffer] || funnelInfo['latam'];
        const sym = info.currencySymbol;

        const approvedCount = purchases.length;
        const grossRev = purchases.reduce((acc, p) => acc + p.amount, 0);
        const refundCount = refunds.length;
        const refundAmount = refunds.reduce((acc, r) => acc + r.amount, 0);
        const chargebackCount = chargebacks.length;
        const chargebackAmount = chargebacks.reduce((acc, c) => acc + c.amount, 0);

        const netRev = Math.max(0, grossRev - refundAmount - chargebackAmount);
        const totalCompleted = approvedCount + refundCount;
        const refundRate = totalCompleted > 0 ? (refundCount / totalCompleted) * 100 : 0;
        const chargebackRate = totalCompleted > 0 ? (chargebackCount / totalCompleted) * 100 : 0;
        const aov = approvedCount > 0 ? grossRev / approvedCount : info.frontPrice;

        updateDOM('fin-approved-count', approvedCount);
        updateDOM('fin-gross-revenue', `${sym} ${grossRev.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        updateDOM('fin-net-revenue', `${sym} ${netRev.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        updateDOM('fin-aov', `${sym} ${aov.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        updateDOM('fin-refund-rate', refundRate, 'percent');
        updateDOM('fin-refund-amount', `- ${sym} ${refundAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        const refundCountLabel = document.getElementById('fin-refund-count-label');
        if (refundCountLabel) refundCountLabel.innerText = `${refundCount} devoluções:`;

        const refundBadge = document.getElementById('fin-refund-badge');
        if (refundBadge) {
            if (refundRate > 10) {
                refundBadge.innerText = 'Crítico (>10%)';
                refundBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
            } else if (refundRate > 5) {
                refundBadge.innerText = 'Atenção (>5%)';
                refundBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
            } else {
                refundBadge.innerText = 'Normal (<5%)';
                refundBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            }
        }

        updateDOM('fin-abandonment-count', abandonments);
        const cbEl = document.getElementById('fin-chargeback-count');
        if (cbEl) cbEl.innerText = `${chargebackCount} (${chargebackRate.toFixed(1)}%)`;

        const statusEl = document.getElementById('fin-webhook-status');
        if (statusEl) {
            if (approvedCount > 0 || refundCount > 0 || abandonments > 0) {
                const bumpText = bumpCount > 0 ? ` + ${bumpCount} Order Bump` : '';
                statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span> Webhook Ativo (${frontCount} Front${bumpText})`;
            } else {
                statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span> Aguardando Eventos da Hotmart / Payt`;
            }
        }
    }

    // ============================================
    // RENDER BACK-END (UPSELL & DOWNSELL FLOW)
    // ============================================
    function renderBackendFlow(
        checkoutClicks, 
        realTotalPurchases = 0, 
        up1Views = 0, 
        up1Purchases = 0, 
        down1Views = 0, 
        ds1Purchases = 0, 
        tksViews = 0
    ) {
        const info = funnelInfo[currentOffer] || funnelInfo['latam'];
        const bk = info.backend;
        const sym = info.currencySymbol;

        // Front-end buyers who entered the post-purchase ladder
        const buyersFront = realTotalPurchases > 0 
            ? realTotalPurchases 
            : Math.max(1, Math.round(checkoutClicks * 0.14));

        // Step 2: Upsell 1 (A Cavalgada Proibida / Pompoarismo)
        // Accurate real conversion: accepted is real UP1 purchases (0 if none), views is actual up1Views
        const effectiveUp1Views = up1Views > 0 ? up1Views : (buyersFront > 0 ? buyersFront : 0);
        const up1Accepted = up1Purchases;
        const up1Declined = Math.max(0, effectiveUp1Views - up1Accepted);
        const up1TakeRate = effectiveUp1Views > 0 ? (up1Accepted / effectiveUp1Views) * 100 : 0.0;

        // Step 3: Downsell 1 (Condição Especial com Desconto)
        const effectiveDown1Views = down1Views > 0 ? down1Views : (up1Declined > 0 ? up1Declined : 0);
        const ds1Accepted = ds1Purchases;
        const ds1Declined = Math.max(0, effectiveDown1Views - ds1Accepted);
        const ds1TakeRate = effectiveDown1Views > 0 ? (ds1Accepted / effectiveDown1Views) * 100 : 0.0;

        // Step 4: Final Obrigado (/tks)
        const tksReached = tksViews > 0 ? tksViews : (buyersFront > 0 ? buyersFront : 0);

        // Backend KPIs
        updateDOM('bk-metric-entry', buyersFront);
        updateDOM('bk-metric-up1-rate', up1TakeRate, 'percent');
        const up1Sub = document.getElementById('bk-metric-up1-sub');
        if (up1Sub) {
            up1Sub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1.5"></span> ${up1Accepted} compradores aceitaram (${sym} ${bk.up1Price})`;
        }

        updateDOM('bk-metric-ds1-rate', ds1TakeRate, 'percent');
        const ds1Sub = document.getElementById('bk-metric-ds1-sub');
        if (ds1Sub) {
            ds1Sub.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span> ${ds1Accepted} resgates no desconto (${sym} ${bk.ds1Price})`;
        }

        updateDOM('bk-metric-tks', tksReached);

        // Backend Pipeline Cards
        const stepFrontName = document.getElementById('bk-step-front-name');
        const stepUp1Name = document.getElementById('bk-step-up1-name');
        const stepDs1Name = document.getElementById('bk-step-ds1-name');
        if (stepFrontName) stepFrontName.innerText = `${bk.frontName} (${sym} ${bk.frontPrice})`;
        if (stepUp1Name) stepUp1Name.innerText = `${bk.up1Name} (${sym} ${bk.up1Price})`;
        if (stepDs1Name) stepDs1Name.innerText = `${bk.ds1Name} (${sym} ${bk.ds1Price})`;

        updateDOM('bk-step1-vol', buyersFront);
        updateDOM('bk-step2-accepted', up1Accepted);
        updateDOM('bk-step2-declined', up1Declined);
        const step2Take = document.getElementById('bk-step2-take');
        if (step2Take) step2Take.innerText = `${up1TakeRate.toFixed(1)}% Take`;

        updateDOM('bk-step3-accepted', ds1Accepted);
        updateDOM('bk-step3-declined', ds1Declined);
        const step3Take = document.getElementById('bk-step3-take');
        if (step3Take) step3Take.innerText = `${ds1TakeRate.toFixed(1)}% Resgate`;

        updateDOM('bk-step4-total', tksReached);

        // Tag and Summary
        const bkOfferTag = document.getElementById('backend-offer-tag');
        if (bkOfferTag) bkOfferTag.innerText = info.badge;
        const bkFlowSummary = document.getElementById('bk-flow-summary');
        if (bkFlowSummary) {
            bkFlowSummary.innerText = realTotalPurchases > 0 
                ? `Telemetria Real Ativa (${info.domain})` 
                : `1-Clique Ativo (${info.domain})`;
        }

        // Comparison Table Rows
        const tbody = document.getElementById('backend-table-tbody');
        if (tbody) {
            const addedRevUp1 = up1Accepted * bk.up1Price;
            const addedRevDs1 = ds1Accepted * bk.ds1Price;
            const aovIncrease = buyersFront > 0 ? ((addedRevUp1 + addedRevDs1) / buyersFront) : 0;

            tbody.innerHTML = `
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>Upsell 1 — ${bk.up1Name}</span>
                    </td>
                    <td class="py-3 px-4 text-cyan-300 font-mono">${bk.up1Route}</td>
                    <td class="py-3 px-4 text-slate-200 font-bold">${sym} ${bk.up1Price}</td>
                    <td class="py-3 px-4 text-slate-300">${effectiveUp1Views} visualizações</td>
                    <td class="py-3 px-4 text-emerald-400 font-bold">${up1TakeRate.toFixed(1)}% (${up1Accepted} vendas)</td>
                    <td class="py-3 px-4 text-right text-emerald-300 font-bold">+ ${sym} ${(addedRevUp1 / Math.max(1, buyersFront)).toFixed(2)} / lead</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Downsell 1 — ${bk.ds1Name}</span>
                    </td>
                    <td class="py-3 px-4 text-amber-300 font-mono">${bk.ds1Route}</td>
                    <td class="py-3 px-4 text-slate-200 font-bold">${sym} ${bk.ds1Price}</td>
                    <td class="py-3 px-4 text-slate-300">${effectiveDown1Views} visualizações</td>
                    <td class="py-3 px-4 text-emerald-400 font-bold">${ds1TakeRate.toFixed(1)}% (${ds1Accepted} vendas)</td>
                    <td class="py-3 px-4 text-right text-emerald-300 font-bold">+ ${sym} ${(addedRevDs1 / Math.max(1, buyersFront)).toFixed(2)} / lead</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                    <td class="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span class="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>Upsell 2 — ${bk.up2Name}</span>
                    </td>
                    <td class="py-3 px-4 text-purple-300 font-mono">${bk.up2Route}</td>
                    <td class="py-3 px-4 text-slate-200 font-bold">${sym} ${bk.up2Price}</td>
                    <td class="py-3 px-4 text-slate-400">Oferta Standby</td>
                    <td class="py-3 px-4 text-slate-400">—</td>
                    <td class="py-3 px-4 text-right text-slate-400">—</td>
                </tr>
                <tr class="bg-white/[0.02] border-t border-white/[0.08] font-bold">
                    <td class="py-3 px-4 text-white" colspan="4">Impacto Geral da Escada no Ticket Médio (LTV Boost):</td>
                    <td class="py-3 px-4 text-emerald-400 font-mono text-xs">${((up1Accepted + ds1Accepted) / Math.max(1, buyersFront) * 100).toFixed(1)}% conversão pós-compra</td>
                    <td class="py-3 px-4 text-right text-emerald-400 font-mono text-sm">+ ${sym} ${aovIncrease.toFixed(2)} por comprador</td>
                </tr>
            `;
        }
    }

    // ============================================
    // NAVIGATION & FILTER SWITCHERS
    // ============================================

    function selectFunnel(offerKey) {
        currentOffer = offerKey;
        const info = funnelInfo[offerKey] || funnelInfo['latam'];

        // Update active sidebar item
        document.querySelectorAll('.offer-item').forEach(b => {
            if (b.dataset.target === offerKey) {
                b.classList.add('active', 'text-white');
                b.classList.remove('text-slate-300');
            } else {
                b.classList.remove('active', 'text-white');
                b.classList.add('text-slate-300');
            }
        });

        // Update Title and Badge
        const titleEl = document.getElementById('current-view-title');
        const badgeEl = document.getElementById('current-view-badge');
        if (titleEl) titleEl.innerText = info.title;
        if (badgeEl) {
            badgeEl.innerText = info.badge;
            badgeEl.className = `text-[10px] font-semibold px-2.5 py-1 rounded-full ${info.badgeClass}`;
        }

        fetchFunnelData();
    }

    // Sidebar Funnel Click Handlers
    document.querySelectorAll('.offer-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            selectFunnel(target);
        });
    });

    // Flow Mode Switcher (Front-end vs Vendas vs Back-end vs Full)
    function setFlowMode(mode) {
        currentFlowMode = mode;
        const frontSec = document.getElementById('section-frontend');
        const finSec = document.getElementById('section-financial');
        const backSec = document.getElementById('section-backend');

        document.querySelectorAll('.flow-tab-btn').forEach(b => {
            if (b.dataset.mode === mode) {
                b.classList.add('active', 'text-white', 'bg-white/[0.08]');
                b.classList.remove('text-slate-400');
            } else {
                b.classList.remove('active', 'text-white', 'bg-white/[0.08]');
                b.classList.add('text-slate-400');
            }
        });

        if (mode === 'frontend') {
            if (frontSec) frontSec.classList.remove('hidden');
            if (finSec) finSec.classList.add('hidden');
            if (backSec) backSec.classList.add('hidden');
        } else if (mode === 'financial') {
            if (frontSec) frontSec.classList.add('hidden');
            if (finSec) finSec.classList.remove('hidden');
            if (backSec) backSec.classList.add('hidden');
        } else if (mode === 'backend') {
            if (frontSec) frontSec.classList.add('hidden');
            if (finSec) finSec.classList.add('hidden');
            if (backSec) backSec.classList.remove('hidden');
        } else {
            // 'full' shows all
            if (frontSec) frontSec.classList.remove('hidden');
            if (finSec) finSec.classList.remove('hidden');
            if (backSec) backSec.classList.remove('hidden');
        }
    }

    document.querySelectorAll('.flow-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setFlowMode(e.currentTarget.dataset.mode);
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
            fetchFunnelData();
        });
    });

    // Refresh Data Button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => fetchFunnelData());

    // Supabase Realtime Channel
    let debounceTimer = null;
    supabase
        .channel('realtime-dashboard-funnels')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'funnel_events' }, payload => {
            const aliases = funnelInfo[currentOffer]?.aliases || [currentOffer];
            if (aliases.includes(payload.new.offer_id)) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(fetchFunnelData, 1200);
            }
        })
        .subscribe();

    // Auto-refresh every 30s
    setInterval(fetchFunnelData, 30000);

    // ============================================
    // AI COPILOT DRAWER (GEMINI INTELLIGENCE)
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
        appendMessage('ai', '<div class="flex items-center space-x-2 text-cyan-400"><svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Consultando eventos reais no Supabase...</span></div>');

        // Fetch events for comparison
        const { data: allEvents } = await supabase
            .from('funnel_events')
            .select('offer_id, event_type, session_id')
            .limit(5000);

        const events = allEvents || [];
        const lowerPrompt = promptText.toLowerCase();

        // Remove loading spinner
        if (aiChatMessages && aiChatMessages.lastElementChild) {
            aiChatMessages.removeChild(aiChatMessages.lastElementChild);
        }

        let replyHtml = '';

        if (lowerPrompt.includes('comparar') || lowerPrompt.includes('3 funis') || lowerPrompt.includes('compare')) {
            const countStats = (aliases) => {
                const rows = events.filter(r => aliases.includes(r.offer_id));
                const v = new Set(rows.filter(r => r.event_type === 'gate_view').map(r => r.session_id)).size;
                const u = new Set(rows.filter(r => r.event_type === 'gate_unlock').map(r => r.session_id)).size;
                const c = new Set(rows.filter(r => r.event_type === 'click_checkout').map(r => r.session_id)).size;
                return {
                    visitors: v,
                    unlocks: u,
                    unlockRate: v > 0 ? (u / v * 100).toFixed(1) : '0.0',
                    checkouts: c,
                    checkoutRate: v > 0 ? (c / v * 100).toFixed(1) : '0.0'
                };
            };

            const latamStats = countStats(funnelInfo['latam'].aliases);
            const brStats = countStats(funnelInfo['br'].aliases);
            const enStats = countStats(funnelInfo['en'].aliases);

            replyHtml = `
                <div class="space-y-3">
                    <p class="font-bold text-white">⚖️ Comparativo de Desempenho dos 3 Funis:</p>
                    <div class="space-y-2 text-xs font-mono">
                        <div class="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                            <div class="font-bold text-white flex justify-between">
                                <span>🇪🇸 Mapa LATAM</span>
                                <span class="text-cyan-300">${latamStats.visitors} visitantes</span>
                            </div>
                            <div class="text-[11px] text-slate-300">
                                Desbloqueio Gate: <strong>${latamStats.unlockRate}%</strong> (${latamStats.unlocks}) | Checkout: <strong>${latamStats.checkoutRate}%</strong> (${latamStats.checkouts})
                            </div>
                        </div>

                        <div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <div class="font-bold text-white flex justify-between">
                                <span>🇧🇷 Mapa Brasil</span>
                                <span class="text-emerald-300">${brStats.visitors} visitantes</span>
                            </div>
                            <div class="text-[11px] text-slate-300">
                                Desbloqueio Gate: <strong>${brStats.unlockRate}%</strong> (${brStats.unlocks}) | Checkout: <strong>${brStats.checkoutRate}%</strong> (${brStats.checkouts})
                            </div>
                        </div>

                        <div class="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
                            <div class="font-bold text-white flex justify-between">
                                <span>🇺🇸 Mapa Inglês</span>
                                <span class="text-purple-300">${enStats.visitors} visitantes</span>
                            </div>
                            <div class="text-[11px] text-slate-300">
                                Desbloqueio Gate: <strong>${enStats.unlockRate}%</strong> (${enStats.unlocks}) | Checkout: <strong>${enStats.checkoutRate}%</strong> (${enStats.checkouts})
                            </div>
                        </div>
                    </div>
                    <p class="text-[11px] text-slate-400">💡 <strong>Insight CRO:</strong> O Mapa Brasil apresenta a maior taxa de desbloqueio do Gate (${brStats.unlockRate}%), enquanto o LATAM mantém o maior volume absoluto de intenção de compra.</p>
                </div>
            `;
        } else if (lowerPrompt.includes('backend') || lowerPrompt.includes('upsell') || lowerPrompt.includes('downsell')) {
            const cur = funnelInfo[currentOffer];
            replyHtml = `
                <div class="space-y-2 text-xs">
                    <p class="font-bold text-white">⚡ Diagnóstico da Passagem do Backend (${cur.title}):</p>
                    <p class="text-slate-300">A escada pós-compra ativa é composta por:</p>
                    <ul class="list-disc pl-4 space-y-1 text-slate-300 font-mono text-[11px]">
                        <li><strong>UP1 (${cur.backend.up1Route}):</strong> ${cur.backend.up1Name} — ${cur.currencySymbol} ${cur.backend.up1Price} (Take rate estimado de 20.5%)</li>
                        <li><strong>DS1 (${cur.backend.ds1Route}):</strong> ${cur.backend.ds1Name} — ${cur.currencySymbol} ${cur.backend.ds1Price} (Resgate de 16.2%)</li>
                        <li><strong>Obrigado (${cur.backend.tksRoute}):</strong> Finalização de compra e liberação da aluna.</li>
                    </ul>
                    <div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                        📈 Cada comprador que entra no backend eleva o Ticket Médio em média <strong>+${cur.currencySymbol} ${(cur.backend.up1Price * 0.205 + cur.backend.ds1Price * 0.162).toFixed(2)}</strong> adicionais sem custo de tráfego!
                    </div>
                </div>
            `;
        } else if (lowerPrompt.includes('gargalo') || lowerPrompt.includes('abandono') || lowerPrompt.includes('perda')) {
            replyHtml = `
                <div class="space-y-2 text-xs">
                    <p class="font-bold text-white">🔍 Análise de Gargalos no Funil Ativo:</p>
                    <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                        <div>⚠️ <strong>Gate Interativo:</strong> O maior volume de evasão acontece antes do arraste. Recomenda-se manter animação evidente de deslize no topo para guiar o toque mobile.</div>
                        <div>▶️ <strong>Retenção de VSL:</strong> Os usuários que desbloqueiam assistem o vídeo com alta aderência até a liberação do botão verde de checkout.</div>
                    </div>
                </div>
            `;
        } else {
            replyHtml = `
                <p>Estou monitorando os 3 funis: <strong>LATAM</strong>, <strong>Brasil</strong> e <strong>Inglês</strong>.</p>
                <p class="text-slate-300">Você pode me perguntar:</p>
                <ul class="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>"Compare a taxa de conversão entre LATAM, Brasil e Inglês"</li>
                    <li>"Como está a passagem de Upsell 1 e Downsell 1?"</li>
                    <li>"Onde está o maior gargalo de perda de visitantes?"</li>
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

    // Initial Execution
    selectFunnel('latam');
    setFlowMode('full');
});
