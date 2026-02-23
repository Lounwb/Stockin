import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type RequestBody = {
  barcode?: string;
};

type MxnzpResponse = {
  code: number;
  msg: string;
  data?: Array<{
    goodsName?: string;
    barcode?: string;
    price?: string;
    brand?: string;
    supplier?: string;
    standard?: string;
  }>;
};

type Product = {
  name: string | null;
  barcode: string | null;
  price: string | null;
  brand: string | null;
  supplier: string | null;
  standard: string | null;
};

type ResponseBody = {
  product: Product | null;
  raw?: MxnzpResponse;
};

const APP_ID = Deno.env.get('MXNZP_APP_ID');
const APP_SECRET = Deno.env.get('MXNZP_APP_SECRET');

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  let barcode: string | undefined;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    barcode = url.searchParams.get('barcode') ?? undefined;
  } else {
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    barcode = body.barcode;
  }

  if (!barcode) {
    return new Response(JSON.stringify({ error: 'barcode is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!APP_ID || !APP_SECRET) {
    return new Response(
      JSON.stringify({ error: 'MXNZP_APP_ID or MXNZP_APP_SECRET not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const apiUrl = new URL('https://www.mxnzp.com/api/barcode/goods/details');
  apiUrl.searchParams.set('barcode', barcode);
  apiUrl.searchParams.set('app_id', APP_ID);
  apiUrl.searchParams.set('app_secret', APP_SECRET);

  let mxResp: MxnzpResponse;

  try {
    const res = await fetch(apiUrl.toString());
    if (!res.ok) {
      const text = await res.text();
      console.error('mxnzp error', res.status, text);
      return new Response(
        JSON.stringify({ error: 'Upstream error', status: res.status }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    mxResp = (await res.json()) as MxnzpResponse;
  } catch (e) {
    console.error('mxnzp fetch failed', e);
    return new Response(JSON.stringify({ error: 'Fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const first = mxResp.data && mxResp.data.length > 0 ? mxResp.data[0] : undefined;

  const product: Product | null = first
    ? {
        name: first.goodsName ?? null,
        barcode: first.barcode ?? barcode ?? null,
        price: first.price ?? null,
        brand: first.brand ?? null,
        supplier: first.supplier ?? null,
        standard: first.standard ?? null
      }
    : null;

  const response: ResponseBody = {
    product,
    raw: mxResp
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

