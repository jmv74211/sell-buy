import React from 'react'
import { useLocation } from 'react-router-dom'
import { Package, TrendingUp, Activity, Wallet, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatCard } from '@/components/StatCard'
import { useSettingsStore } from '@/store/settings'
import { t } from '@/utils/translations'
import { localDateStr } from '@/utils/date'
import { analyticsService } from '@/services/analytics'
import { estimationService } from '@/services/estimations'
import { purchaseService } from '@/services/purchases'
import { saleService } from '@/services/sales'
import type { SummaryStats, Estimation, Purchase, Sale, DashboardStats } from '@/types/api'
import {
  AreaChart,
  Area,
  Line,
  LineChart,
  Bar,
  BarChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts'

export function DashboardPage() {
  const language = useSettingsStore((state) => state.language)
  const location = useLocation()
  const [stats, setStats] = React.useState<SummaryStats | null>(null)
  const [estimations, setEstimations] = React.useState<Estimation[]>([])
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [sales, setSales] = React.useState<Sale[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [chartRange, setChartRange] = React.useState<'week' | 'month' | 'all'>('month')
  const [barChartRange, setBarChartRange] = React.useState<'last7' | 'last30' | 'last90' | 'all'>('last30')
  const [monthlyChartMode, setMonthlyChartMode] = React.useState<'estimated' | 'afterExpenses'>('afterExpenses')
  const [tableSortKey, setTableSortKey] = React.useState<string>('id')
  const [tableSortDir, setTableSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [customStats, setCustomStats] = React.useState<DashboardStats>({
    investment: { total_spent: 0, capital_immobilized: 0, cost_hacienda_current: 0, cost_hacienda_total: 0 },
    recovery: { money_recovered: 0, pending_sales: 0, total_expected_recovery: 0, balance: 0 },
    profitability: { realized_profit: 0, pending_profit: 0, total_profit: 0, avg_profit_per_sale: 0 },
    percentages: { recovery_pct: 0, roi: 0 },
    counts: { total_purchases: 0, sold_count: 0, pending_count: 0, conservado_count: 0 }
  })

  const getRowBackgroundColor = (sale: Sale | null, estimation: Estimation | undefined) => {
    // Verde: Si tiene venta realizada (precio de venta)
    if (sale) {
      return 'bg-green-100'
    }
    // Amarillo: Si NO tiene venta pero SÍ tiene estimación con ganancia > 0
    if (estimation && estimation.estimated_profit > 0) {
      return 'bg-yellow-100'
    }
    // Blanco: Sin estimación o estimación con ganancia <= 0
    return 'bg-white'
  }

  const BalanceTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const val: number = payload[0].value
    return (
      <div className="bg-white border border-gray-200 rounded shadow px-3 py-2 text-sm">
        <p className="text-gray-600 mb-1">{label}</p>
        <p className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {t(language, 'dashboard.dayBalance')}: {val >= 0 ? '+' : ''}{val.toFixed(2)} €
        </p>
      </div>
    )
  }

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const summaryStats = await analyticsService.getSummary()
      const dashboardStats = await analyticsService.getDashboardStats()
      const estimationsData = await estimationService.getAll()
      const purchasesData = await purchaseService.getAll()
      const salesData = await saleService.getAll()

      setStats(summaryStats)
      setEstimations(estimationsData)
      setPurchases(purchasesData)
      setSales(salesData)
      setCustomStats(dashboardStats)

      // Default selected date: most recent purchase date
      if (purchasesData.length > 0) {
        const latestDate = purchasesData
          .map(p => p.purchase_date.split('T')[0])
          .sort()
          .at(-1) ?? ''
        setSelectedDate(latestDate)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const dailyBalanceData = React.useMemo(() => {
    // Compute per-day balance: Σ(estimated_sale_price) - Σ(purchase_amount)
    const byDate = new Map<string, number>()
    for (const p of purchases) {
      const date = p.purchase_date.split('T')[0]
      const est = estimations.find(e => e.purchase_id === p.id)
      const estPrice = est?.estimated_sale_price ?? 0
      byDate.set(date, (byDate.get(date) ?? 0) + estPrice - p.amount)
    }
    return [...byDate.keys()]
      .sort()
      .map(date => {
        const [y, m, d] = date.split('-')
        return {
          isoDate: date,
          date: `${d}/${m}/${y}`,
          balance: Math.round((byDate.get(date) ?? 0) * 100) / 100,
        }
      })
  }, [purchases, estimations])

  const chartData = React.useMemo(() => {
    const now = new Date()
    const subtractDays = (n: number) => {
      const d = new Date(now)
      d.setDate(d.getDate() - n)
      return localDateStr(d)
    }
    const cutoff =
      chartRange === 'week'
        ? subtractDays(7)
        : chartRange === 'month'
        ? subtractDays(30)
        : '0000-00-00'

    return dailyBalanceData.filter(d => d.isoDate >= cutoff)
  }, [dailyBalanceData, chartRange])

  const barChartData = React.useMemo(() => {
    const now = new Date()
    const subtractDays = (n: number) => {
      const d = new Date(now)
      d.setDate(d.getDate() - n)
      return localDateStr(d)
    }

    const cutoff =
      barChartRange === 'last7'
        ? subtractDays(7)
        : barChartRange === 'last30'
        ? subtractDays(30)
        : barChartRange === 'last90'
        ? subtractDays(90)
        : '0000-00-00'

    return dailyBalanceData.filter(d => d.isoDate >= cutoff)
  }, [dailyBalanceData, barChartRange])

  const monthlyProfitData = React.useMemo(() => {
    const estimationsByPurchase = new Map(estimations.map(estimation => [estimation.purchase_id, estimation]))
    const profitsByMonth = new Map<string, number>()

    for (const purchase of purchases) {
      const estimatedProfit = estimationsByPurchase.get(purchase.id)?.estimated_profit ?? 0
      const month = purchase.purchase_date.slice(0, 7)
      const currentProfit = profitsByMonth.get(month) ?? 0
      const monthlyValue = monthlyChartMode === 'afterExpenses'
        ? estimatedProfit === 0 ? -purchase.amount : estimatedProfit
        : estimatedProfit
      profitsByMonth.set(
        month,
        currentProfit + monthlyValue,
      )
    }

    return [...profitsByMonth.entries()]
      .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
      .map(([month, profit]) => ({
        month,
        label: new Date(`${month}-01T00:00:00`).toLocaleDateString(
          language === 'es' ? 'es-ES' : 'en-US',
          { month: 'short', year: 'numeric' },
        ),
        profit: Math.round(profit * 100) / 100,
      }))
  }, [estimations, language, monthlyChartMode, purchases])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Recargar datos cuando el usuario vuelve a la página (visibility change)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadData])

  // Recargar datos cuando se actualiza una venta desde SalesPage o compra desde PurchasesPage
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshDashboard') {
        loadData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadData])

  const handleTableSort = (key: string) => {
    if (tableSortKey === key) setTableSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setTableSortKey(key); setTableSortDir('asc') }
  }
  const TableSortIcon = ({ col }: { col: string }) => tableSortKey === col
    ? tableSortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1 text-blue-500" /> : <ChevronDown size={14} className="inline ml-1 text-blue-500" />
    : <ChevronUp size={14} className="inline ml-1 text-gray-300" />
  const sortedTablePurchases = React.useMemo(() => [...purchases].sort((a, b) => {
    const estA = estimations.find(e => e.purchase_id === a.id)
    const estB = estimations.find(e => e.purchase_id === b.id)
    const saleA = estA?.sale_id ? sales.find(s => s.id === estA.sale_id) : null
    const saleB = estB?.sale_id ? sales.find(s => s.id === estB.sale_id) : null
    let av: any, bv: any
    switch (tableSortKey) {
      case 'name': av = a.article_name.toLowerCase(); bv = b.article_name.toLowerCase(); break
      case 'amount': av = a.amount; bv = b.amount; break
      case 'estSalePrice': av = estA?.estimated_sale_price ?? -Infinity; bv = estB?.estimated_sale_price ?? -Infinity; break
      case 'estProfit': av = estA?.estimated_profit ?? -Infinity; bv = estB?.estimated_profit ?? -Infinity; break
      case 'saleAmount': av = saleA?.amount ?? -Infinity; bv = saleB?.amount ?? -Infinity; break
      case 'gainNeto': av = saleA ? saleA.amount - a.amount : -Infinity; bv = saleB ? saleB.amount - b.amount : -Infinity; break
      case 'purchaseDate': av = a.purchase_date; bv = b.purchase_date; break
      case 'saleDate': av = saleA?.sale_date ?? ''; bv = saleB?.sale_date ?? ''; break
      default: av = a.id; bv = b.id
    }
    return tableSortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
  }), [purchases, estimations, sales, tableSortKey, tableSortDir])

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t(language, 'dashboard.title')}</h1>
          <p className="text-gray-600">{t(language, 'dashboard.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">{t(language, 'dashboard.loading')}</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid - 3 grouped panels: INVERSIÓN, RECUPERACIÓN, RENTABILIDAD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

              {/* INVERSIÓN */}
              <div className="rounded-lg shadow-md overflow-hidden">
                <div className="bg-orange-500 px-4 py-3 flex items-center gap-2">
                  <Wallet size={16} className="text-white" />
                  <h3 className="font-bold text-white text-sm tracking-widest uppercase">Inversión</h3>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Gastado</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.investment.total_spent.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5 group relative">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-help border-b border-dashed border-gray-400">
                      Capital Inmovilizado
                    </span>
                    <span className="text-sm font-bold text-gray-900">{customStats.investment.capital_immobilized.toFixed(2)} €</span>
                    <div className="absolute left-4 bottom-full mb-1.5 bg-white border border-gray-200 rounded shadow-lg px-3 py-1.5 text-xs text-gray-700 whitespace-nowrap z-10 hidden group-hover:block pointer-events-none">
                      Dinero invertido en artículos pendientes de venta.
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Coste Hacienda Actual</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.investment.cost_hacienda_current.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Coste Hacienda Total</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.investment.cost_hacienda_total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* RECUPERACIÓN */}
              <div className="rounded-lg shadow-md overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-white" />
                  <h3 className="font-bold text-white text-sm tracking-widest uppercase">Recuperación</h3>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dinero Recuperado</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.recovery.money_recovered.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ventas Pendientes</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.recovery.pending_sales.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recuperación Total Prevista</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.recovery.total_expected_recovery.toFixed(2)} €</span>
                  </div>
                  <div className={`flex justify-between items-center px-4 py-2.5 ${customStats.recovery.balance < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Saldo</span>
                    <span className={`text-sm font-bold ${customStats.recovery.balance < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {customStats.recovery.balance >= 0 ? '+' : ''}{customStats.recovery.balance.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recuperación (%)</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.percentages.recovery_pct.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* RENTABILIDAD */}
              <div className="rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-500 px-4 py-3 flex items-center gap-2">
                  <Activity size={16} className="text-white" />
                  <h3 className="font-bold text-white text-sm tracking-widest uppercase">Rentabilidad</h3>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beneficio Realizado</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.profitability.realized_profit.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beneficio Pendiente</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.profitability.pending_profit.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beneficio Total</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.profitability.total_profit.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beneficio Medio/Venta</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.profitability.avg_profit_per_sale.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rentabilidad (ROI)</span>
                    <span className="text-sm font-bold text-gray-900">{customStats.percentages.roi.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Counts row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Artículos</span>
                <span className="text-xl font-bold text-gray-800">{customStats.counts.total_purchases}</span>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 px-4 py-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">✅ Vendidos</span>
                <span className="text-xl font-bold text-green-700">{customStats.counts.sold_count}</span>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 px-4 py-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">⏳ Pendientes</span>
                <span className="text-xl font-bold text-yellow-700">{customStats.counts.pending_count}</span>
              </div>
              <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🗃️ Conservado</span>
                <span className="text-xl font-bold text-gray-700">{customStats.counts.conservado_count}</span>
              </div>
            </div>

            {/* Daily Balance View + Evolution Chart */}
            {(() => {
              const dayPurchases = purchases.filter(p => p.purchase_date.split('T')[0] === selectedDate)
              const sumEst = dayPurchases.reduce((s, p) => {
                const est = estimations.find(e => e.purchase_id === p.id)
                return s + (est?.estimated_sale_price ?? 0)
              }, 0)
              const sumBuy = dayPurchases.reduce((s, p) => s + p.amount, 0)
              const balance = sumEst - sumBuy

              const rangeLabels = { week: t(language, 'dashboard.lastWeek'), month: t(language, 'dashboard.lastMonth'), all: t(language, 'dashboard.allHistory') }

              return (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  {/* Header con mismo grid que el contenido */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-bold text-gray-900">{t(language, 'dashboard.balanceByDate')}</h2>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedDate && (
                        <span className={`ml-auto text-xl font-bold ${
                          balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Table + Chart grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Table */}
                    <div>
                      {dayPurchases.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          {selectedDate ? t(language, 'dashboard.noArticlesForDate') : t(language, 'dashboard.selectDate')}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="px-4 py-2 text-left font-semibold text-gray-700">{t(language, 'dashboard.tableHeaders.article')}</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-700">{t(language, 'dashboard.tableHeaders.purchase')}</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-700">{t(language, 'dashboard.tableHeaders.estSale')}</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-700">{t(language, 'dashboard.tableHeaders.balance')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayPurchases.map(p => {
                                const est = estimations.find(e => e.purchase_id === p.id)
                                const estPrice = est?.estimated_sale_price ?? 0
                                const rowBalance = estPrice - p.amount
                                return (
                                  <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-800">{p.article_name}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{p.amount.toFixed(2)} €</td>
                                    <td className="px-4 py-2 text-right text-gray-700">
                                      {estPrice > 0 ? `${estPrice.toFixed(2)} €` : '-'}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-medium ${
                                      rowBalance >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {rowBalance >= 0 ? '+' : ''}{rowBalance.toFixed(2)} €
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-300 bg-gray-50">
                                <td className="px-4 py-2 font-semibold text-gray-700">{t(language, 'dashboard.tableHeaders.total')} ({dayPurchases.length})</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700">{sumBuy.toFixed(2)} €</td>
                                <td className="px-4 py-2 text-right font-semibold text-gray-700">{sumEst > 0 ? `${sumEst.toFixed(2)} €` : '-'}</td>
                                <td className={`px-4 py-2 text-right font-bold ${
                                  balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Evolution Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">{t(language, 'dashboard.balanceEvolution')}</h3>
                        <select
                          value={chartRange}
                          onChange={e => setChartRange(e.target.value as 'week' | 'month' | 'all')}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {(Object.keys(rangeLabels) as Array<keyof typeof rangeLabels>).map(k => (
                            <option key={k} value={k}>{rangeLabels[k]}</option>
                          ))}
                        </select>
                      </div>
                      {chartData.length === 0 ? (
                        <p className="text-gray-400 text-center text-sm py-12">{t(language, 'dashboard.noDataForPeriod')}</p>
                      ) : (() => {
                        const rangeBalance = chartData.reduce((s, d) => s + d.balance, 0)
                        const lineColor = rangeBalance >= 0 ? '#16a34a' : '#dc2626'
                        const fillColor = rangeBalance >= 0 ? '#bbf7d0' : '#fecaca'
                        return (
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                            onClick={(e) => {
                              const point = e?.activePayload?.[0]?.payload
                              if (!point?.date) return
                              const [d, m, y] = point.date.split('/')
                              setSelectedDate(`${y}-${m}-${d}`)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                              <defs>
                                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                              />
                              <YAxis tick={{ fontSize: 11 }} width={48} unit=" €" />
                              <Tooltip content={<BalanceTooltip />} />
                              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
                              <Area
                                type="monotone"
                                dataKey="balance"
                                stroke={lineColor}
                                strokeWidth={2}
                                fill="url(#balanceGrad)"
                                dot={chartData.length <= 20 ? { fill: lineColor, r: 3 } : false}
                                activeDot={{ r: 5, fill: lineColor }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Daily Balance Bar Chart */}
            {(() => {
              const rangeLabels = {
                last7: t(language, 'dashboard.last7Days'),
                last30: t(language, 'dashboard.lastMonth'),
                last90: t(language, 'dashboard.last3Months'),
                all: t(language, 'dashboard.allHistory'),
              }
              const showBarLabels = barChartRange === 'last7' || barChartRange === 'last30'

              return (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">{t(language, 'dashboard.dailyBalanceBars')}</h2>
                    <select
                      value={barChartRange}
                      onChange={e => setBarChartRange(e.target.value as 'last7' | 'last30' | 'last90' | 'all')}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.keys(rangeLabels) as Array<keyof typeof rangeLabels>).map(k => (
                        <option key={k} value={k}>{rangeLabels[k]}</option>
                      ))}
                    </select>
                  </div>

                  {barChartData.length === 0 ? (
                    <p className="text-gray-400 text-center text-sm py-12">{t(language, 'dashboard.noDataForPeriod')}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={barChartData}
                        margin={{ top: showBarLabels ? 20 : 4, right: 12, left: 0, bottom: showBarLabels ? 32 : 12 }}
                        onClick={(e) => {
                          const point = e?.activePayload?.[0]?.payload
                          if (!point?.isoDate) return
                          setSelectedDate(point.isoDate)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} width={56} unit=" €" />
                        <Tooltip content={<BalanceTooltip />} />
                        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
                        <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                          {barChartData.map((entry) => (
                            <Cell key={entry.isoDate} fill={entry.balance >= 0 ? '#86efac' : '#fca5a5'} />
                          ))}
                          {showBarLabels && (
                            <LabelList
                              dataKey="balance"
                              content={({ x = 0, y = 0, width = 0, height = 0, value = 0 }: any) => {
                                const numericValue = Number(value)
                                const barX = Number(x)
                                const barY = Number(y)
                                const barWidth = Number(width)
                                const barHeight = Number(height)
                                return (
                                  <text
                                    x={barX + barWidth / 2}
                                    y={numericValue >= 0 ? barY - 8 : barY + barHeight + 22}
                                    textAnchor="middle"
                                    fill={numericValue >= 0 ? '#15803d' : '#b91c1c'}
                                    fontSize={11}
                                    fontWeight={600}
                                  >
                                    {numericValue >= 0 ? '+' : ''}{numericValue.toFixed(2)} €
                                  </text>
                                )
                              }}
                            />
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )
            })()}

            {/* Monthly Total Profit Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">{t(language, 'dashboard.monthlyProfit')}</h2>
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={monthlyChartMode === 'afterExpenses'}
                    onClick={() => setMonthlyChartMode('afterExpenses')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${monthlyChartMode === 'afterExpenses' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {t(language, 'dashboard.realProfit')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={monthlyChartMode === 'estimated'}
                    onClick={() => setMonthlyChartMode('estimated')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${monthlyChartMode === 'estimated' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {t(language, 'dashboard.idealProfit')}
                  </button>
                </div>
              </div>
              {monthlyProfitData.length === 0 ? (
                <p className="text-gray-400 text-center text-sm py-12">{t(language, 'dashboard.noDataForPeriod')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProfitData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} width={56} unit=" €" />
                    <Tooltip
                      formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)} €`, t(language, monthlyChartMode === 'estimated' ? 'dashboard.idealProfit' : 'dashboard.realProfit')]}
                      labelFormatter={label => `${t(language, 'dashboard.month')}: ${label}`}
                    />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name={t(language, monthlyChartMode === 'estimated' ? 'dashboard.idealProfit' : 'dashboard.realProfit')}
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 4 }}
                      activeDot={{ r: 6, fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">{t(language, 'dashboard.articles')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('id')}>{t(language, 'dashboard.tableHeaders.articleId')} <TableSortIcon col="id" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('name')}>{t(language, 'dashboard.tableHeaders.articleName')} <TableSortIcon col="name" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('amount')}>{t(language, 'dashboard.tableHeaders.purchasePrice')} <TableSortIcon col="amount" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('estSalePrice')}>{t(language, 'dashboard.tableHeaders.estimationSale')} <TableSortIcon col="estSalePrice" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('estProfit')}>{t(language, 'dashboard.tableHeaders.estimatedProfit')} <TableSortIcon col="estProfit" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('saleAmount')}>{t(language, 'dashboard.tableHeaders.salePrice')} <TableSortIcon col="saleAmount" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('gainNeto')}>{t(language, 'dashboard.tableHeaders.netProfit')} <TableSortIcon col="gainNeto" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('purchaseDate')}>{t(language, 'dashboard.tableHeaders.purchaseDate')} <TableSortIcon col="purchaseDate" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap" onClick={() => handleTableSort('saleDate')}>{t(language, 'dashboard.tableHeaders.saleDate')} <TableSortIcon col="saleDate" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTablePurchases.map((purchase) => {
                      const estimation = estimations.find(
                        (e) => e.purchase_id === purchase.id
                      )
                      const sale = estimation?.sale_id
                        ? sales.find((s) => s.id === estimation.sale_id)
                        : null
                      const estimationSalePrice = estimation?.estimated_sale_price
                        ? estimation.estimated_sale_price
                        : null
                      const gainNeto = sale
                        ? sale.amount - purchase.amount
                        : null
                      const purchaseDate = new Date(
                        purchase.purchase_date
                      ).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                      const saleDate = sale
                        ? new Date(sale.sale_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                        : '-'

                      return (
                        <tr
                          key={purchase.id}
                          className={`border-b ${getRowBackgroundColor(
                            sale,
                            estimation
                          )} hover:bg-opacity-75 transition-colors`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {purchase.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {purchase.article_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {purchase.amount.toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {estimationSalePrice
                              ? `${estimationSalePrice.toFixed(2)}€`
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {estimation?.estimated_profit
                              ? `${estimation.estimated_profit.toFixed(2)}€`
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {sale ? `${sale.amount.toFixed(2)}€` : '-'}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold ${
                              gainNeto && gainNeto >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {gainNeto !== null
                              ? `${gainNeto.toFixed(2)}€`
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {purchaseDate}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {saleDate}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-600">Error al cargar los datos</p>
        )}
      </main>
    </div>
  )
}
