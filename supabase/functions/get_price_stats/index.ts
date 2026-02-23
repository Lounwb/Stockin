import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Platform = 'jd' | 'tmall' | 'pdd';

type PriceRow = {
  platform: Platform;
  price: number;
  recorded_at: string;
};

type Range = 'all' | '1y';

type RequestBody = {
  item_id: string;
  range?: Range;
};

type HistoryPoint = {
  date: string;
  jd?: number;
  tmall?: number;
  pdd?: number;
};

type SinglePlatformStats = {
  max: number | null;
  min: number | null;
  avg1y: number | null;
};

type Stats = {
  jd: SinglePlatformStats;
  tmall: SinglePlatformStats;
  pdd: SinglePlatformStats;
};

type ResponseBody = {
  history: HistoryPoint[];
  stats: Stats;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function computeStats(rows: PriceRow[]): Stats {
  const platforms: Platform[] = ['jd', 'tmall', 'pdd'];
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const stats: Stats = {
    jd: { max: null, min: null, avg1y: null },
    tmall: { max: null, min: null, avg1y: null },
    pdd: { max: null, min: null, avg1y: null }
  };

  for (const platform of platforms) {
    const rowsForPlatform = rows.filter((r) => r.platform === platform);
    if (!rowsForPlatform.length) continue;

    let max = rowsForPlatform[0].price;
    let min = rowsForPlatform[0].price;

    let sum1y = 0;
    let count1y = 0;

    for (const r of rowsForPlatform) {
      if (r.price > max) max = r.price;
      if (r.price < min) min = r.price;

      const d = new Date(r.recorded_at);
      if (d >= oneYearAgo) {
        sum1y += r.price;
        count1y += 1;
      }
    }

    stats[platform].max = max;
    stats[platform].min = min;
    stats[platform].avg1y = count1y > 0 ? sum1y / count1y : null;
  }

  return stats;
}

function buildHistory(rows: PriceRow[]): HistoryPoint[] {
  const map = new Map<string, HistoryPoint>();

  for (const r of rows) {
    const date = r.recorded_at.slice(0, 10);
    const entry = map.get(date) ?? { date };
    entry[r.platform] = r.price;
    map.set(date, entry);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = (await req.json()) as RequestBody;
  const { item_id, range = 'all' } = body;

  if (!item_id) {
    return new Response(JSON.stringify({ error: 'item_id is required' }), {
      status: 400
    });
  }

  const query = supabase
    .from('item_price_history')
    .select('platform, price, recorded_at')
    .eq('item_id', item_id)
    .order('recorded_at', { ascending: true });

  let fromDate: string | null = null;
  if (range === '1y') {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    fromDate = oneYearAgo.toISOString().slice(0, 10);
  }

  const { data, error } = fromDate
    ? await query.gte('recorded_at', fromDate)
    : await query;

  if (error) {
    console.error('get_price_stats error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }

  const rows = (data ?? []) as PriceRow[];

  const history = buildHistory(rows);
  const stats = computeStats(rows);

  const response: ResponseBody = {
    history,
    stats
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

