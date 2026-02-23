import { supabase } from '../lib/supabaseClient';

export type PricePlatform = 'jd' | 'tmall' | 'pdd';

export type ProductCandidate = {
  sku: string;
  title: string;
  price: number | null;
  url?: string;
};

export type SearchProductResult = {
  jd: ProductCandidate[];
  tmall: ProductCandidate[];
  pdd: ProductCandidate[];
};

export async function searchProduct(params: {
  name?: string;
  barcode?: string;
}): Promise<SearchProductResult> {
  const { data, error } = await supabase.functions.invoke('search_product', {
    body: params
  });
  if (error) throw error;
  return (data ?? { jd: [], tmall: [], pdd: [] }) as SearchProductResult;
}

export type PriceHistoryPoint = {
  date: string;
  jd?: number;
  tmall?: number;
  pdd?: number;
};

export type SinglePlatformStats = {
  max: number | null;
  min: number | null;
  avg1y: number | null;
};

export type PriceStats = {
  jd: SinglePlatformStats;
  tmall: SinglePlatformStats;
  pdd: SinglePlatformStats;
};

export type PriceStatsResponse = {
  history: PriceHistoryPoint[];
  stats: PriceStats;
};

export async function getPriceStats(
  itemId: string,
  range: 'all' | '1y' = '1y'
): Promise<PriceStatsResponse> {
  const { data, error } = await supabase.functions.invoke('get_price_stats', {
    body: { item_id: itemId, range }
  });
  if (error) throw error;
  return data as PriceStatsResponse;
}


