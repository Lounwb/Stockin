import { supabase } from '../lib/supabaseClient';

export type Item = {
  id: string;
  user_id: string;
  name: string;
  spec: string | null;
  barcode: string | null;
  image_url: string | null;
  jd_sku: string | null;
  tmall_sku: string | null;
  pdd_sku: string | null;
  quantity: number;
  unit: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemInput = {
  user_id: string;
  name: string;
  spec?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  quantity?: number;
  unit?: string | null;
  jd_sku?: string | null;
  tmall_sku?: string | null;
  pdd_sku?: string | null;
};

export async function listItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function getItem(id: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Item;
}

export async function createItem(input: ItemInput) {
  const { data, error } = await supabase
    .from('items')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Item;
}

export async function updateItem(id: string, input: ItemInput) {
  const { data, error } = await supabase
    .from('items')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Item;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function changeQuantity(id: string, delta: number) {
  const { data, error } = await supabase
    .rpc('change_item_quantity', { p_item_id: id, p_delta: delta })
    .single();
  if (error) throw error;
  return data as Item;
}

