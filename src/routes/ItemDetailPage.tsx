import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { getItem, type Item, deleteItem } from '../api/items';
import { getPriceStats, type PriceStatsResponse } from '../api/prices';
import { PriceChart } from '../components/PriceChart';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceStatsResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getItem(id);
        setItem(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadPrices = async () => {
      setPriceLoading(true);
      setPriceError(null);
      try {
        const res = await getPriceStats(id, '1y');
        setPriceData(res);
      } catch (e) {
        setPriceError((e as Error).message);
      } finally {
        setPriceLoading(false);
      }
    };
    void loadPrices();
  }, [id]);

  const handleDelete = async () => {
    if (!item) return;
    // eslint-disable-next-line no-alert
    const ok = confirm('确定要删除该物品吗？');
    if (!ok) return;
    try {
      await deleteItem(item.id);
      navigate('/items', { replace: true });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    }
  };

  return (
    <AppShell title="物品详情" backTo="/items">
      {loading && <p className="text-sm text-slate-400">加载中...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && item && (
        <div className="space-y-4 pb-10">
          {item.image_url && (
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <img
                src={item.image_url}
                alt={item.name}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            {item.spec && (
              <p className="text-sm text-slate-300">规格：{item.spec}</p>
            )}
            <p className="text-sm text-slate-300">
              数量：<span className="font-mono">{item.quantity}</span>
              {item.unit}
            </p>
            {item.barcode && (
              <p className="text-xs text-slate-400">
                条形码：<span className="font-mono">{item.barcode}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate('/items/new', {
                  replace: true,
                  state: { fromAction: 'continueAdd', baseItemId: item.id }
                })
              }
              className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
            >
              继续添加
            </button>
            <button
              type="button"
              onClick={() => navigate(`/items/${item.id}/edit`)}
              className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-medium text-slate-50"
            >
              删除
            </button>
          </div>

          <section className="mt-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100">价格曲线</h3>
            <p className="text-[11px] text-slate-400">
              展示从录入到最近一年的京东 / 天猫 / 拼多多价格变化，以及最高价、最低价和近一年平均价。
            </p>
            {priceLoading && (
              <p className="mt-2 text-xs text-slate-400">价格数据加载中...</p>
            )}
            {priceError && (
              <p className="mt-2 text-xs text-red-400">
                加载价格失败：{priceError}
              </p>
            )}
            {!priceLoading && priceData && (
              <PriceChart data={priceData.history} stats={priceData.stats} />
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}

