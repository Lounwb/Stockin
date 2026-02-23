import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { PriceHistoryPoint, PriceStats } from '../api/prices';

type PriceChartProps = {
  data: PriceHistoryPoint[];
  stats: PriceStats;
};

export function PriceChart({ data, stats }: PriceChartProps) {
  const hasAny = data.length > 0;

  if (!hasAny) {
    return <p className="text-xs text-slate-400">暂无价格数据。</p>;
  }

  return (
    <div className="space-y-3">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tickLine={false}
              tickMargin={8}
              fontSize={10}
            />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              width={40}
              fontSize={10}
              tickFormatter={(v) => `¥${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#020617',
                borderColor: '#1e293b',
                borderRadius: 12
              }}
              labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
              formatter={(value: number, name) => [
                `¥${value.toFixed(2)}`,
                name === 'jd'
                  ? '京东'
                  : name === 'tmall'
                    ? '天猫'
                    : name === 'pdd'
                      ? '拼多多'
                      : name
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) =>
                value === 'jd' ? '京东' : value === 'tmall' ? '天猫' : '拼多多'
              }
            />
            <Line
              type="monotone"
              dataKey="jd"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="jd"
            />
            <Line
              type="monotone"
              dataKey="tmall"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="tmall"
            />
            <Line
              type="monotone"
              dataKey="pdd"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="pdd"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
        <PlatformStats label="京东" stats={stats.jd} />
        <PlatformStats label="天猫" stats={stats.tmall} />
        <PlatformStats label="拼多多" stats={stats.pdd} />
      </div>
    </div>
  );
}

type PlatformStatsProps = {
  label: string;
  stats: {
    max: number | null;
    min: number | null;
    avg1y: number | null;
  };
};

function PlatformStats({ label, stats }: PlatformStatsProps) {
  if (stats.max == null && stats.min == null && stats.avg1y == null) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
        <p className="text-[11px] font-medium text-slate-300">{label}</p>
        <p className="mt-1 text-[11px] text-slate-500">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
      <p className="text-[11px] font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-[11px] text-slate-400">
        最高：{stats.max != null ? `¥${stats.max.toFixed(2)}` : '-'}
      </p>
      <p className="text-[11px] text-slate-400">
        最低：{stats.min != null ? `¥${stats.min.toFixed(2)}` : '-'}
      </p>
      <p className="text-[11px] text-slate-400">
        近一年均价：
        {stats.avg1y != null ? `¥${stats.avg1y.toFixed(2)}` : '-'}
      </p>
    </div>
  );
}

