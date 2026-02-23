import { supabase } from '../lib/supabaseClient';

export type BarcodeProduct = {
  name: string | null;
  barcode: string | null;
  price: string | null;
  brand: string | null;
  supplier: string | null;
  standard: string | null;
};

type BarcodeLookupResponse = {
  product: BarcodeProduct | null;
};

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const { data, error } = await supabase.functions.invoke('barcode_lookup', {
    body: { barcode }
  });
  if (error) {
    throw error;
  }
  const result = data as BarcodeLookupResponse | null;
  return result?.product ?? null;
}

