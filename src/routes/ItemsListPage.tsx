import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { listItems, type Item, changeQuantity, deleteItem } from '../api/items';

export function ItemsListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listItems();
        setItems(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleChangeQuantity = async (id: string, delta: number) => {
    try {
      const updated = await changeQuantity(id, delta);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    const ok = confirm('确定要删除该物品吗？');
    if (!ok) return;
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message);
    }
  };

  return (
    <AppShell
      title="库存列表"
      rightSlot={
        <button
          type="button"
          onClick={() => navigate('/items/new')}
          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-slate-950"
        >
          新增
        </button>
      }
    >
      {loading && <p className="text-sm text-slate-400">加载中...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          还没有记录，点击右上角「新增」开始录入物品。
        </p>
      )}

      <ul className="space-y-3 pb-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-3"
          >
            <button
              type="button"
              onClick={() => navigate(`/items/${item.id}`)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs text-slate-400">
                  无图
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-slate-400">
                    数量：<span className="font-mono">{item.quantity}</span>
                    {item.unit}
                  </p>
                </div>
                {item.spec && (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    规格：{item.spec}
                  </p>
                )}
              </div>
            </button>
            <div className="flex flex-col items-end gap-1">
              <div className="inline-flex rounded-full bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleChangeQuantity(item.id, -1)}
                  className="px-2 py-1 text-slate-200"
                >
                  -
                </button>
                <span className="px-2 py-1 text-slate-300">±</span>
                <button
                  type="button"
                  onClick={() => handleChangeQuantity(item.id, 1)}
                  className="px-2 py-1 text-emerald-400"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-[11px] text-slate-500"
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

