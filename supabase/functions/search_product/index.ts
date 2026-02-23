import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type SearchRequest = {
  name?: string;
  barcode?: string;
};

type Candidate = {
  sku: string;
  title: string;
  price: number | null;
  url?: string;
};

type SearchResponse = {
  jd: Candidate[];
  tmall: Candidate[];
  pdd: Candidate[];
};

const PRICE_SERVICE_URL = Deno.env.get('PRICE_SERVICE_URL');
const PRICE_SERVICE_API_KEY = Deno.env.get('PRICE_SERVICE_API_KEY');

async function callExternalSearch(
  platform: 'jd' | 'tmall' | 'pdd',
  payload: SearchRequest
): Promise<Candidate[]> {
  if (!PRICE_SERVICE_URL) {
    return [];
  }

  const res = await fetch(`${PRICE_SERVICE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(PRICE_SERVICE_API_KEY ? { Authorization: `Bearer ${PRICE_SERVICE_API_KEY}` } : {})
    },
    body: JSON.stringify({
      platform,
      ...payload
    })
  });

  if (!res.ok) {
    console.error('Price service search error', platform, await res.text());
    return [];
  }

  const data = (await res.json()) as Candidate[];
  return data;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = (await req.json()) as SearchRequest;

  const [jd, tmall, pdd] = await Promise.all([
    callExternalSearch('jd', body),
    callExternalSearch('tmall', body),
    callExternalSearch('pdd', body)
  ]);

  const response: SearchResponse = { jd, tmall, pdd };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

