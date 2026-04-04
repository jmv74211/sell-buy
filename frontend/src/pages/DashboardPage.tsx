import React from 'react'
import { useLocation } from 'react-router-dom'
import { Package, TrendingUp, Activity, Wallet, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatCard } from '@/components/StatCard'
import { useSettingsStore } from '@/store/settings'
import { t } from '@/utils/translations'
import { analyticsService } from '@/services/analytics'
import { estimationService } from '@/services/estimations'
import { purchaseService } from '@/services/purchases'
import { saleService } from '@/services/sales'
import type { SummaryStats, Estimation, Purchase, Sale } from '@/types/api'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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
  const [tableSortKey, setTableSortKey] = React.useState<string>('id')
  const [tableSortDir, setTableSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [customStats, setCustomStats] = React.useState({
    totalSpent: 0,
    recoveredEstimated: 0,
    totalExpectedProfit: 0,
    totalEarned: 0,
    totalBalance: 0,
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
      const estimationsData = await estimationService.getAll()
      const purchasesData = await purchaseService.getAll()
      const salesData = await saleService.getAll()

      setStats(summaryStats)
      setEstimations(estimationsData)
      setPurchases(purchasesData)
      setSales(salesData)

      // Default selected date: most recent purchase date
      if (purchasesData.length > 0) {
        const latestDate = purchasesData
          .map(p => p.purchase_date.split('T')[0])
          .sort()
          .at(-1) ?? ''
        setSelectedDate(latestDate)
      }

      // Calculate custom statistics — same formulas as the spreadsheet
      // Filtrar estimaciones válidas (con precio estimado > 0)
      const validEstimations = estimationsData.filter(e => e.estimated_sale_price && e.estimated_sale_price > 0)

      // TOTAL GASTADO = SUM(PRECIO COMPRA)
      const totalSpent = purchasesData.reduce((sum, p) => sum + p.amount, 0)

      // GANANCIA NETA por artículo: usa actual_profit guardado (puede incluir comisiones)
      // Si no hay actual_profit guardado, calcula venta - compra como fallback
      const gananciaNeta = (e: Estimation) => {
        if (!e.sale_id) return 0
        if (e.actual_profit != null) return e.actual_profit
        const sale = salesData.find(s => s.id === e.sale_id)
        const purchase = purchasesData.find(p => p.id === e.purchase_id)
        return sale && purchase ? sale.amount - purchase.amount : 0
      }

      // TOTAL GANADO = SUM(GANANCIA NETA)
      const totalEarned = validEstimations.reduce((sum, e) => sum + gananciaNeta(e), 0)

      // SALDO RECUPERADO ESTIMADO = SUM(ESTIMACIÓN VENTA) - SUM(GANANCIA NETA)
      const sumEstVenta = validEstimations.reduce((sum, e) => sum + (e.estimated_sale_price ?? 0), 0)
      const recoveredEstimated = sumEstVenta - totalEarned

      // TOTAL ESPERADO GANAR = SUM(GANANCIA ESTIMADA)
      const totalExpectedProfit = validEstimations.reduce((sum, e) => sum + e.estimated_profit, 0)

      // SALDO = SALDO_RECUPERADO - TOTAL_GASTADO + TOTAL_GANADO
      const totalBalance = recoveredEstimated - totalSpent + totalEarned

      setCustomStats({
        totalSpent,
        recoveredEstimated,
        totalExpectedProfit,
        totalEarned,
        totalBalance,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const chartData = React.useMemo(() => {
    // Compute per-day balance: Σ(estimated_sale_price) - Σ(purchase_amount)
    const byDate = new Map<string, number>()
    for (const p of purchases) {
      const date = p.purchase_date.split('T')[0]
      const est = estimations.find(e => e.purchase_id === p.id)
      const estPrice = est?.estimated_sale_price ?? 0
      byDate.set(date, (byDate.get(date) ?? 0) + estPrice - p.amount)
    }
    const sortedDates = [...byDate.keys()].sort()

    const now = new Date()
    const cutoff =
      chartRange === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : chartRange === 'month'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : '0000-00-00'

    // Per-day balance (same formula as the table: Σ est_sale_price - Σ purchase_amount)
    return sortedDates
      .filter(d => d >= cutoff)
      .map(date => {
        const [y, m, d] = date.split('-')
        return { date: `${d}/${m}/${y}`, balance: Math.round((byDate.get(date) ?? 0) * 100) / 100 }
      })
  }, [purchases, estimations, chartRange])

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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title={t(language, 'dashboard.totalBalance')}
                value={`${customStats.totalBalance.toFixed(2)}€`}
                icon={<Activity size={24} />}
                color={customStats.totalBalance >= 0 ? 'green' : 'red'}
              />
              <StatCard
                title={t(language, 'dashboard.totalSpent')}
                value={`${customStats.totalSpent.toFixed(2)}€`}
                icon={<TrendingDown size={24} />}
                color="red"
              />
              <StatCard
                title={t(language, 'dashboard.recoveredEstimated')}
                value={`${customStats.recoveredEstimated.toFixed(2)}€`}
                icon={<Wallet size={24} />}
                color="purple"
              />
              <StatCard
                title={t(language, 'dashboard.expectedProfit')}
                value={`${customStats.totalExpectedProfit.toFixed(2)}€`}
                icon={<Package size={24} />}
                color="blue"
              />
              <StatCard
                title={t(language, 'dashboard.totalEarned')}
                value={`${customStats.totalEarned.toFixed(2)}€`}
                icon={<TrendingUp size={24} />}
                color={customStats.totalEarned >= 0 ? 'green' : 'red'}
              />
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
