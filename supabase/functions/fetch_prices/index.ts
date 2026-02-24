/**
 * 每日价格抓取：不依赖外部价格 API，内置京东 p.3.cn，天猫/拼多多可扩展抓取逻辑
 * 由 Supabase Cron 每日触发，为已绑定平台 SKU 的物品写入 item_price_history
 */
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

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ——— 京东：公开价格接口（无需 key）
const JD_PRICE_API = 'https://p.3.cn/prices/mgets';

async function fetchJdPrice(sku: string): Promise<number | null> {
  const cleanSku = String(sku).replace(/^J_/, '');
  if (!cleanSku) return null;
  try {
    const url = `${JD_PRICE_API}?skuIds=J_${cleanSku}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Referer: 'https://item.m.jd.com/'
      }
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ p?: string }>;
    const item = arr?.[0];
    if (!item?.p) return null;
    const p = parseFloat(item.p);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

// ——— 天猫 / 拼多多：无公开免 key 接口，可在此扩展自建抓取（如请求详情页或开放平台）
async function fetchTmallPrice(_sku: string): Promise<number | null> {
  return null;
}

async function fetchPddPrice(_sku: string): Promise<number | null> {
  return null;
}

async function fetchPricesBuiltin(
  items: PriceRequestItem[]
): Promise<PriceResponseItem[]> {
  const results: PriceResponseItem[] = [];
  for (const req of items) {
    let price: number | null = null;
    if (req.platform === 'jd') {
      price = await fetchJdPrice(req.sku);
    } else if (req.platform === 'tmall') {
      price = await fetchTmallPrice(req.sku);
    } else if (req.platform === 'pdd') {
      price = await fetchPddPrice(req.sku);
    }
    if (price != null && price > 0) {
      results.push({ item_id: req.item_id, platform: req.platform, price });
    }
  }
  return results;
}

serve(async () => {
  const { data: items, error } = await supabase
    .from('items')
    .select('id,jd_sku,tmall_sku,pdd_sku');

  if (error) {
    console.error('Fetch items error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const requests: PriceRequestItem[] = [];
  for (const item of items ?? []) {
    if (item.jd_sku) {
      requests.push({ item_id: item.id, platform: 'jd', sku: item.jd_sku });
    }
    if (item.tmall_sku) {
      requests.push({
        item_id: item.id,
        platform: 'tmall',
        sku: item.tmall_sku
      });
    }
    if (item.pdd_sku) {
      requests.push({ item_id: item.id, platform: 'pdd', sku: item.pdd_sku });
    }
  }

  const prices = await fetchPricesBuiltin(requests);
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
        status: 500,
        headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    }
  );
});
