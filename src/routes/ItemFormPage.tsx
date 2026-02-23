import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { createItem, getItem, updateItem, type Item } from '../api/items';
import { useAuth } from '../contexts/AuthContext';
import { ImageUploader } from '../components/ImageUploader';
import { BarcodeScanner } from '../components/BarcodeScanner';
import {
  searchProduct,
  type ProductCandidate,
  type SearchProductResult
} from '../api/prices';

type PlatformCandidatesProps = {
  label: string;
  platform: 'jd' | 'tmall' | 'pdd';
  candidates: ProductCandidate[];
  selectedSku: string;
  onSelect: (sku: string) => void;
};

function PlatformCandidates({
  label,
  platform,
  candidates,
  selectedSku,
  onSelect
}: PlatformCandidatesProps) {
  if (!candidates.length) {
    return (
      <div>
        <p className="text-[11px] text-slate-400">
          {label}：暂无匹配结果，可稍后在详情页中手动绑定。
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate-300">{label}</p>
      <div className="space-y-1">
        {candidates.slice(0, 3).map((c) => (
          <label
            key={`${platform}-${c.sku}`}
            className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-2 py-1.5"
          >
            <input
              type="radio"
              name={`platform-${platform}`}
              className="mt-0.5 h-3 w-3"
              checked={selectedSku === c.sku}
              onChange={() => onSelect(c.sku)}
            />
            <div className="flex-1">
              <p className="line-clamp-2 text-[11px] text-slate-100">
                {c.title}
              </p>
              {c.price != null && (
                <p className="mt-0.5 text-[11px] text-emerald-400">
                  参考价：¥{c.price.toFixed(2)}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

type ItemFormPageProps = {
  mode: 'create' | 'edit';
};

export function ItemFormPage({ mode }: ItemFormPageProps) {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as {
    state?:
      | {
          fromScan?: boolean;
          barcode?: string;
          initialName?: string;
          initialSpec?: string;
        }
      | undefined;
  };
  const navigate = useNavigate();

  const [initialItem, setInitialItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(location.state?.initialName ?? '');
  const [spec, setSpec] = useState(location.state?.initialSpec ?? '');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [barcode, setBarcode] = useState(location.state?.barcode ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [jdSku, setJdSku] = useState('');
  const [tmallSku, setTmallSku] = useState('');
  const [pddSku, setPddSku] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchProductResult | null>(
    null
  );
  const [searchError, setSearchError] = useState<string | null>(null);

  const fromScan = location.state?.fromScan ?? false;
  const showScanHint =
    fromScan &&
    !location.state?.initialName &&
    !location.state?.initialSpec;

  useEffect(() => {
    if (mode === 'edit' && id) {
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const item = await getItem(id);
          setInitialItem(item);
          setName(item.name);
          setSpec(item.spec ?? '');
          setUnit(item.unit ?? '');
          setQuantity(String(item.quantity));
          setBarcode(item.barcode ?? '');
          setImageUrl(item.image_url);
          setJdSku(item.jd_sku ?? '');
          setTmallSku(item.tmall_sku ?? '');
          setPddSku(item.pdd_sku ?? '');
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setLoading(false);
        }
      };
      void load();
    }
  }, [mode, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('当前未登录，无法保存物品，请先通过邮箱登录。');
      return;
    }
    setSaving(true);
    setError(null);
    const quantityNum = quantity === '' ? 0 : Math.max(0, parseInt(quantity, 10) || 0);
    try {
      if (mode === 'create') {
        const created = await createItem({
          user_id: user.id,
          name,
          spec: spec || null,
          unit: unit || null,
          quantity: quantityNum,
          barcode: barcode || null,
          image_url: imageUrl,
          jd_sku: jdSku || null,
          tmall_sku: tmallSku || null,
          pdd_sku: pddSku || null
        });
        // 新增完成后跳到根目录（由路由重定向到列表）
        navigate('/', { replace: true });
      } else if (mode === 'edit' && initialItem) {
        const updated = await updateItem(initialItem.id, {
          user_id: user.id,
          name,
          spec: spec || null,
          unit: unit || null,
          quantity: quantityNum,
          barcode: barcode || null,
          image_url: imageUrl,
          jd_sku: jdSku || null,
          tmall_sku: tmallSku || null,
          pdd_sku: pddSku || null
        });
        navigate(`/items/${updated.id}`, { replace: true });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'create' ? '新增物品' : '编辑物品';

  return (
    <AppShell title={title} backTo="/">
      {loading ? (
        <p className="text-sm text-slate-400">加载中...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pb-8">
          {showScanHint && (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              此条形码暂未在商品库中收录，请手动填写名称、规格等信息。
            </p>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              名称
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              规格
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="例如：瓶装 500ml / 12 罐/箱"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <label className="flex-1 text-xs font-medium text-slate-300">
              数量
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setQuantity(v);
                }}
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
              />
            </label>
            <label className="w-24 text-xs font-medium text-slate-300">
              单位
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="瓶/箱"
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex items-end gap-3">
              <label className="flex-1 text-xs font-medium text-slate-300">
                条形码
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="可手动输入或点击右侧扫码"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="mb-0.5 rounded-xl border border-emerald-500/60 px-3 py-2 text-xs text-emerald-400"
              >
                扫码
              </button>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-200">电商平台匹配</p>
              <button
                type="button"
                onClick={async () => {
                  setSearching(true);
                  setSearchError(null);
                  try {
                    const result = await searchProduct({
                      name,
                      barcode: barcode || undefined
                    });
                    setSearchResult(result);
                  } catch (e) {
                    setSearchError((e as Error).message);
                  } finally {
                    setSearching(false);
                  }
                }}
                className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-slate-950 disabled:opacity-60"
                disabled={searching || !name}
              >
                {searching ? '匹配中...' : '自动匹配'}
              </button>
            </div>
            {searchError && <p className="text-xs text-red-400">{searchError}</p>}
            {searchResult && (
              <div className="mt-2 space-y-2 text-[11px] text-slate-300">
                <PlatformCandidates
                  label="京东"
                  platform="jd"
                  candidates={searchResult.jd}
                  selectedSku={jdSku}
                  onSelect={setJdSku}
                />
                <PlatformCandidates
                  label="天猫"
                  platform="tmall"
                  candidates={searchResult.tmall}
                  selectedSku={tmallSku}
                  onSelect={setTmallSku}
                />
                <PlatformCandidates
                  label="拼多多"
                  platform="pdd"
                  candidates={searchResult.pdd}
                  selectedSku={pddSku}
                  onSelect={setPddSku}
                />
              </div>
            )}
          </div>

          {user && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300">物品图片</p>
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                pathPrefix={user.id}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          {showScanner && (
            <BarcodeScanner
              onDetected={(value) => {
                setBarcode(value);
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          )}
        </form>
      )}
    </AppShell>
  );
}

