// Vercel Serverless Function: Webhook Ingest for Payt and Hotmart
// Group Jevo Funnel Ops - Metrics & Conversions Control Plane

const SUPABASE_URL = 'https://ahtvpfunglhhtfpefsyi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MuW-XY0uxvizJ3zqtJKy5A_YMdJNrln';

module.exports = async (req, res) => {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Health-check & "Testar URL" ping support (Payt sends GET, HEAD or empty POST to test connectivity)
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({
      status: 'ok',
      service: 'Group Jevo Webhook Ingestion API',
      provider_detected: req.query.provider || 'generic',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const queryProvider = (req.query.provider || '').toLowerCase();
    const queryOffer = (req.query.offer || '').toLowerCase();
    
    // Parse body if received as string (urlencoded or raw json)
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        try {
          const params = new URLSearchParams(body);
          const parsed = {};
          for (const [key, val] of params.entries()) {
            parsed[key] = val;
          }
          body = parsed;
        } catch (e2) {
          body = {};
        }
      }
    }

    // Check if this is a test payload from Payt or Hotmart
    const isTest = body.teste === true || body.teste === 'true' || body.teste === '1' || body.is_test === true || body.event === 'TEST' || Object.keys(body).length === 0;
    if (isTest) {
      return res.status(200).json({
        status: 'ok',
        message: 'Teste de postback / webhook validado com sucesso!',
        provider: queryProvider || 'payt',
        timestamp: new Date().toISOString()
      });
    }

    let eventType = 'purchase_approved';
    let offerId = queryOffer || 'latam';
    let transactionId = `tx_${Date.now()}`;
    let amountCents = 0;
    let currency = 'USD';
    let provider = queryProvider || 'hotmart';
    let occurredAt = new Date().toISOString();

    // ----------------------------------------------------
    // PAYT POSTBACK PROCESSING (Brasil)
    // ----------------------------------------------------
    if (queryProvider === 'payt' || body.cliente || body.customer || body.code || body.status || body.current_status) {
      provider = 'payt';
      offerId = 'br';
      const rawStatus = (body.status || body.event || body.current_status || '').toLowerCase();

      if (rawStatus.includes('refund') || rawStatus.includes('estorn') || rawStatus.includes('reembols')) {
        eventType = 'purchase_refunded';
      } else if (rawStatus.includes('chargeback') || rawStatus.includes('bloquei') || rawStatus.includes('disput')) {
        eventType = 'purchase_chargeback';
      } else if (rawStatus.includes('cancel') || rawStatus.includes('recusad')) {
        eventType = 'purchase_canceled';
      } else if (rawStatus.includes('abandon') || rawStatus.includes('carrinho')) {
        eventType = 'cart_abandonment';
      } else {
        eventType = 'purchase_approved';
      }

      transactionId = body.id || body.code || body.transaction_id || `PAYT-${Date.now()}`;
      const total = Number(body.total || body.amount || body.valor || body.value || 0);
      amountCents = Math.round(total * 100);
      currency = 'BRL';
      if (body.created_at || body.date) {
        occurredAt = new Date(body.created_at || body.date).toISOString();
      }
    } 
    // ----------------------------------------------------
    // HOTMART WEBHOOK PROCESSING (LATAM / Global)
    // ----------------------------------------------------
    else {
      provider = 'hotmart';
      const rawEvent = (body.event || '').toUpperCase();
      const purchase = body.data?.purchase || body.purchase || {};
      const product = body.data?.product || body.product || {};
      const price = purchase.price || purchase.original_offer_price || {};

      const prodName = (product.name || '').toLowerCase();
      if (prodName.includes('brasil') || prodName.includes('chave') || prodName.includes('cavalgada')) {
        offerId = 'br';
      } else if (prodName.includes('english') || prodName.includes('male pleasure') || prodName.includes('forbidden')) {
        offerId = 'en';
      } else {
        offerId = queryOffer || 'latam';
      }

      if (rawEvent.includes('REFUND') || rawEvent.includes('REEMBOLSO')) {
        eventType = 'purchase_refunded';
      } else if (rawEvent.includes('CHARGEBACK') || rawEvent.includes('DISPUTA')) {
        eventType = 'purchase_chargeback';
      } else if (rawEvent.includes('CANCELED') || rawEvent.includes('EXPIRED') || rawEvent.includes('CANCELAD')) {
        eventType = 'purchase_canceled';
      } else if (rawEvent.includes('CART') || rawEvent.includes('ABANDON')) {
        eventType = 'cart_abandonment';
      } else {
        eventType = 'purchase_approved';
      }

      transactionId = purchase.transaction || body.id || `HOT-${Date.now()}`;
      const val = price.value || purchase.full_price?.value || 0;
      amountCents = Math.round(Number(val) * 100);
      currency = price.currency_code || purchase.price?.currency_value || (offerId === 'br' ? 'BRL' : 'USD');
      if (purchase.order_date) {
        occurredAt = new Date(purchase.order_date).toISOString();
      }
    }

    // Encoded financial session ID: tx:TRANSACTION_ID:AMOUNT_CENTS:CURRENCY:PROVIDER
    const financialSessionId = `tx:${transactionId}:${amountCents}:${currency}:${provider}`;

    // 3. Post directly to Supabase funnel_events
    await fetch(`${SUPABASE_URL}/rest/v1/funnel_events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify([{
        offer_id: offerId,
        event_type: eventType,
        session_id: financialSessionId,
        created_at: occurredAt
      }])
    }).catch(e => console.error('Supabase ingest fetch err:', e));

    return res.status(200).json({
      success: true,
      provider,
      offer_id: offerId,
      event_type: eventType,
      transaction_id: transactionId,
      amount_cents: amountCents,
      currency
    });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(200).json({
      success: false,
      error: err.message,
      note: 'Acknowledged with 200 to prevent provider retry storms'
    });
  }
};
