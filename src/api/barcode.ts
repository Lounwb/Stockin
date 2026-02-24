import { supabase } from '../lib/supabaseClient';

export type BarcodeProduct = {
  name: string | null;
  barcode: string | null;
  price: string | null;
  brand: string | null;
  supplier: string | null;
  standard: string | null;
};

type BarcodeLookupRaw = {
  code?: number;
  msg?: string;
};

type BarcodeLookupResponse = {
  product: BarcodeProduct | null;
  raw?: BarcodeLookupRaw;
};

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const code = String(barcode ?? '').trim();
  if (!code) {
    throw new Error('条形码为空');
  }

  const { data, error } = await supabase.functions.invoke('barcode_lookup', {
    body: { barcode: code }
  });

  if (error) {
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
    throw new Error(msg || '条形码查询请求失败，请检查网络或稍后重试。');
  }

  const result = data as BarcodeLookupResponse | null;
  if (!result) return null;

  if (!result.product) {
    const raw = result.raw;
    if (raw?.code === 10036 || raw?.msg?.includes('暂未收录')) {
      throw new Error('条形码暂未收录，请手动录入商品名称和规格。');
    }
    throw new Error(raw?.msg || '条形码解析失败，请手动录入商品信息。');
  }

  return result.product;
}

