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
  const { data, error } = await supabase.functions.invoke('barcode_lookup', {
    body: { barcode }
  });
  if (error) {
    throw error;
  }
  const result = data as BarcodeLookupResponse | null;
  if (!result) return null;

  if (!result.product) {
    const raw = result.raw;
    // 针对 10036「暂未收录此商品」的友好提示
    if (raw?.code === 10036 || raw?.msg?.includes('暂未收录')) {
      throw new Error('条形码暂未收录，请手动录入商品名称和规格。');
    }
    throw new Error(raw?.msg || '条形码解析失败，请手动录入商品信息。');
  }

  return result.product;
}

