import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { listItems, type Item, changeQuantity, deleteItem } from '../api/items';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { lookupBarcode } from '../api/barcode';

export function ItemsListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

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

  const handleScanDetected = async (code: string) => {
    setShowScanner(false);
    setScanError(null);
    try {
      const product = await lookupBarcode(code);
      navigate('/items/new', {
        state: {
          fromScan: true,
          barcode: code,
          initialName: product?.name ?? '',
          initialSpec: product?.standard ?? ''
        }
      });
    } catch (e) {
      setScanError((e as Error).message);
      navigate('/items/new', {
        state: {
          fromScan: true,
          barcode: code
        }
      });
    }
  };

  return (
    <AppShell
      title="库存概览"
      rightSlot={
        <button
          type="button"
          onClick={() => navigate('/items/new')}
          className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.45)]"
        >
          新增
        </button>
      }
    >
      {loading && <p className="text-sm text-slate-400">加载中...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && (
        <section className="mb-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>物品数量</span>
            <span className="font-mono text-emerald-400">
              {items.length.toString().padStart(2, '0')}
            </span>
          </div>
        </section>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          还没有记录，点击下方「扫码录入」或右上角「新增」开始录入物品。
        </p>
      )}

      <div className="mb-4">
        {scanError && <p className="mb-2 text-xs text-red-400">{scanError}</p>}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 px-4 py-3 text-sm font-medium text-slate-950 shadow-[0_18px_40px_rgba(16,185,129,0.55)]"
        >
          📷 扫码录入物品
        </button>
      </div>

      <ul className="space-y-3 pb-12">
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

      {showScanner && (
        <BarcodeScanner
          onDetected={(value) => {
            void handleScanDetected(value);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </AppShell>
  );
}

