import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  FileWarning,
  Type,
  Calendar,
  Layers,
  BarChart2,
  LineChart as LineChartIcon,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { InspectionRecord } from '../types/metrology';
import {
  VIOLATION_CATEGORIES,
  buildThirtyDayViolationTrends,
  ViolationCategoryMeta,
  TrendDataPoint
} from '../utils/trendData';

interface ViolationTrendChartProps {
  inspections: InspectionRecord[];
}

export const ViolationTrendChart: React.FC<ViolationTrendChartProps> = ({ inspections }) => {
  // Chart timeframe: 30, 14, or 7 days
  const [timeRange, setTimeRange] = useState<30 | 14 | 7>(30);
  
  // Visual presentation: area, line, or bar
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  // Selected violation category keys to display
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    missing_mrp: true,
    font_size: true,
    prohibited_terms: true,
    consumer_care: true,
    unit_sale_price: true
  });

  // Calculate trends based on current inspections and selected timeframe
  const trendAnalysis = useMemo(() => {
    return buildThirtyDayViolationTrends(inspections, timeRange);
  }, [inspections, timeRange]);

  const {
    data,
    categoryTotals,
    mostFrequentCategory,
    totalViolations,
    peakDay,
    growthRatePercent
  } = trendAnalysis;

  // Toggle single category visibility
  const toggleCategory = (key: string) => {
    const activeCount = Object.values(visibleCategories).filter(Boolean).length;
    // Prevent deselecting everything
    if (visibleCategories[key] && activeCount === 1) return;
    setVisibleCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectAllCategories = () => {
    setVisibleCategories({
      missing_mrp: true,
      font_size: true,
      prohibited_terms: true,
      consumer_care: true,
      unit_sale_price: true
    });
  };

  const isolateCategory = (key: string) => {
    const nextState: Record<string, boolean> = {
      missing_mrp: false,
      font_size: false,
      prohibited_terms: false,
      consumer_care: false,
      unit_sale_price: false
    };
    nextState[key] = true;
    setVisibleCategories(nextState);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as TrendDataPoint;
    if (!dataPoint) return null;

    return (
      <div 
        id="violation-trend-tooltip" 
        className="bg-slate-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl p-3.5 border border-slate-700 min-w-[240px] text-xs pointer-events-none"
      >
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
          <div className="font-bold flex items-center gap-1.5 text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{dataPoint.date} ({dataPoint.dayOfWeek})</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Audit Date: {dataPoint.rawDate}
          </span>
        </div>

        <div className="space-y-1.5">
          {VIOLATION_CATEGORIES.filter(cat => visibleCategories[cat.key]).map(cat => {
            const val = dataPoint[cat.key];
            return (
              <div key={cat.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300">{cat.shortLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cat.ruleCitation.split('&')[0]}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {val} case{val === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-700/80 pt-2 mt-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300">Total Day Infractions</span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {dataPoint.total} violations
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      id="violation-trend-section"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Statutory Violation Trends &amp; Frequency
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
              Last {timeRange} Days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Temporal distribution of Packaged Commodities non-compliances (missing MRP, font size under-height, prohibited units, etc.)
          </p>
        </div>

        {/* View Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              id="trend-range-30"
              onClick={() => setTimeRange(30)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                timeRange === 30
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              id="trend-range-14"
              onClick={() => setTimeRange(14)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                timeRange === 14
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Days
            </button>
            <button
              id="trend-range-7"
              onClick={() => setTimeRange(7)}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                timeRange === 7
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              id="chart-type-area"
              onClick={() => setChartType('area')}
              title="Stacked Area Chart"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              id="chart-type-line"
              onClick={() => setChartType('line')}
              title="Multi-Line Chart"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Line</span>
            </button>
            <button
              id="chart-type-bar"
              onClick={() => setChartType('bar')}
              title="Stacked Bar Chart"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Highlight Mini-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            30-Day Infraction Total
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {totalViolations}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span>Trend:</span>
            <span className={growthRatePercent >= 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {growthRatePercent >= 0 ? `+${growthRatePercent}%` : `${growthRatePercent}%`}
            </span>
            <span className="text-slate-400">vs prior period</span>
          </div>
        </div>

        <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Most Recurring Infraction
          </div>
          <div className="text-xl font-black text-rose-700 mt-0.5">
            {categoryTotals.missing_mrp}
          </div>
          <div className="text-[10px] text-rose-800/80 mt-0.5 truncate" title="Missing MRP / Tax Omission">
            Missing MRP / Tax Clause (Rule 6(1)(f))
          </div>
        </div>

        <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-200/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
            Font Height / PDP Issues
          </div>
          <div className="text-xl font-black text-purple-700 mt-0.5">
            {categoryTotals.font_size}
          </div>
          <div className="text-[10px] text-purple-800/80 mt-0.5 truncate" title="Rule 7 & Schedule II Height standards">
            Under-height lettering (Rule 7)
          </div>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Peak Audit Spike
          </div>
          <div className="text-xl font-black text-amber-800 mt-0.5">
            {peakDay.count} cases
          </div>
          <div className="text-[10px] text-amber-800/80 mt-0.5 truncate">
            {peakDay.date}
          </div>
        </div>
      </div>

      {/* Violation Category Interactive Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
            Filter Violations:
          </span>
          {VIOLATION_CATEGORIES.map(cat => {
            const isVisible = visibleCategories[cat.key];
            const count = categoryTotals[cat.key] || 0;
            return (
              <button
                key={cat.key}
                id={`filter-cat-${cat.key}`}
                onClick={() => toggleCategory(cat.key)}
                onDoubleClick={() => isolateCategory(cat.key)}
                title={`${cat.description} (Double-click to isolate)`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isVisible
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 line-through'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isVisible ? cat.color : '#cbd5e1' }}
                />
                <span>{cat.shortLabel}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                  isVisible ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={selectAllCategories}
          className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {VIOLATION_CATEGORIES.map(cat => (
                  <linearGradient key={`grad-${cat.key}`} id={`grad-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cat.color} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={cat.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={timeRange === 30 ? 3 : timeRange === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {VIOLATION_CATEGORIES.map(cat => {
                if (!visibleCategories[cat.key]) return null;
                return (
                  <Area
                    key={cat.key}
                    type="monotone"
                    dataKey={cat.key}
                    name={cat.shortLabel}
                    stroke={cat.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#grad-${cat.key})`}
                    stackId="1"
                  />
                );
              })}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={timeRange === 30 ? 3 : timeRange === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {VIOLATION_CATEGORIES.map(cat => {
                if (!visibleCategories[cat.key]) return null;
                return (
                  <Line
                    key={cat.key}
                    type="monotone"
                    dataKey={cat.key}
                    name={cat.shortLabel}
                    stroke={cat.color}
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: cat.color }}
                    activeDot={{ r: 5, strokeWidth: 1, stroke: '#ffffff' }}
                  />
                );
              })}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={timeRange === 30 ? 3 : timeRange === 14 ? 1 : 0}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {VIOLATION_CATEGORIES.map(cat => {
                if (!visibleCategories[cat.key]) return null;
                return (
                  <Bar
                    key={cat.key}
                    dataKey={cat.key}
                    name={cat.shortLabel}
                    fill={cat.color}
                    stackId="a"
                    radius={[1, 1, 0, 0]}
                  />
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Statutory Insights Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600">
        <div className="flex items-start sm:items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Enforcement Trend Observation:</strong> Non-compliant MRP (missing tax clause or altered stickers) and font size under-height accounted for over <strong>{Math.round(((categoryTotals.missing_mrp + categoryTotals.font_size) / (totalViolations || 1)) * 100)}%</strong> of all statutory notices issued under Section 18 / Section 36 in the past {timeRange} days.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
          Updated: Today (Live Stream)
        </div>
      </div>
    </div>
  );
};
