import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { HourlyForecast } from '../../types';

interface ForecastChartProps {
  hourlyCurve: HourlyForecast[];
  targetHourLabel?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  hourlyCurve,
  targetHourLabel,
}) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={hourlyCurve}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0FAF9A" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0FAF9A" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            unit="%"
          />

          {/* Peak Warning Threshold at 80% */}
          <ReferenceLine
            y={80}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{ value: 'Peak Demand (>80%)', position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as HourlyForecast;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-elevated border border-slate-800 text-xs">
                    <div className="font-bold text-slate-200 mb-1">{data.hour} Forecast</div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Occupancy:</span>
                      <span className={`font-bold ${data.occupancyPct >= 80 ? 'text-rose-400' : 'text-teal-400'}`}>
                        {data.occupancyPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Available:</span>
                      <span className="font-bold text-emerald-400">{data.availableSpots} bays</span>
                    </div>
                    {data.isPeak && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-amber-300 font-medium">
                        ⚠️ High turnover / reservation recommended
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="occupancyPct"
            stroke="#0FAF9A"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#occupancyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
