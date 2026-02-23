import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Platform = 'jd' | 'tmall' | 'pdd';

type PriceRequestItem = {
  item_id: string;
  platform: Platform;
  sku: string;
};

type PriceResponseItem = {
  item_id: string;
  platform: Platform;
  price: number;
};

const PRICE_SERVICE_URL = Deno.env.get('PRICE_SERVICE_URL');
const PRICE_SERVICE_API_KEY = Deno.env.get('PRICE_SERVICE_API_KEY');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchCurrentPrices(
  items: PriceRequestItem[]
): Promise<PriceResponseItem[]> {
  if (!PRICE_SERVICE_URL || items.length === 0) {
    return [];
  }

  const res = await fetch(`${PRICE_SERVICE_URL}/current_prices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(PRICE_SERVICE_API_KEY ? { Authorization: `Bearer ${PRICE_SERVICE_API_KEY}` } : {})
    },
    body: JSON.stringify({ items })
  });

  if (!res.ok) {
    console.error('Price service current_prices error', await res.text());
    return [];
  }

  const data = (await res.json()) as PriceResponseItem[];
  return data;
}

serve(async () => {
  // 查询所有已绑定任一平台 SKU 的物品
  const { data: items, error } = await supabase
    .from('items')
    .select('id,jd_sku,tmall_sku,pdd_sku');

  if (error) {
    console.error('Fetch items error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }

  const requests: PriceRequestItem[] = [];

  for (const item of items ?? []) {
    if (item.jd_sku) {
      requests.push({
        item_id: item.id,
        platform: 'jd',
        sku: item.jd_sku
      });
    }
    if (item.tmall_sku) {
      requests.push({
        item_id: item.id,
        platform: 'tmall',
        sku: item.tmall_sku
      });
    }
    if (item.pdd_sku) {
      requests.push({
        item_id: item.id,
        platform: 'pdd',
        sku: item.pdd_sku
      });
    }
  }

  const prices = await fetchCurrentPrices(requests);

  const today = new Date().toISOString().slice(0, 10);

  if (prices.length > 0) {
    const upsertPayload = prices.map((p) => ({
      item_id: p.item_id,
      platform: p.platform,
      price: p.price,
      recorded_at: today
    }));

    const { error: upsertError } = await supabase
      .from('item_price_history')
      .upsert(upsertPayload, {
        onConflict: 'item_id,platform,recorded_at'
      });

    if (upsertError) {
      console.error('Upsert price history error', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      items_checked: requests.length,
      prices_saved: prices.length
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
});

