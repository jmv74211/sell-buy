import React from 'react'
import { useLocation } from 'react-router-dom'
import { DollarSign, Package, TrendingUp, Activity, Wallet, TrendingDown } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { StatCard } from '@/components/StatCard'
import { analyticsService } from '@/services/analytics'
import { estimationService } from '@/services/estimations'
import { purchaseService } from '@/services/purchases'
import { saleService } from '@/services/sales'
import type { SummaryStats, Estimation, Purchase, Sale } from '@/types/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function DashboardPage() {
  const location = useLocation()
  const [stats, setStats] = React.useState<SummaryStats | null>(null)
  const [monthlyData, setMonthlyData] = React.useState([])
  const [estimations, setEstimations] = React.useState<Estimation[]>([])
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [sales, setSales] = React.useState<Sale[]>([])
  const [loading, setLoading] = React.useState(true)
  const [estimationStats, setEstimationStats] = React.useState({
    totalEstimated: 0,
    totalActual: 0,
    difference: 0,
    estimationCount: 0,
  })
  const [customStats, setCustomStats] = React.useState({
    totalSpent: 0,
    recoveredEstimated: 0,
    totalExpectedProfit: 0,
    totalEarned: 0,
    totalBalance: 0,
  })

  const getRowBackgroundColor = (purchase: Purchase, estimation: Estimation | undefined) => {
    if (estimation?.sale_id) {
      return 'bg-green-100'
    } else if (estimation) {
      return 'bg-yellow-100'
    }
    return 'bg-white'
  }

  const loadData = React.useCallback(async () => {
    try {
      const summaryStats = await analyticsService.getSummary()
      const monthly = await analyticsService.getMonthly()
      const estimationsData = await estimationService.getAll()
      const purchasesData = await purchaseService.getAll()
      const salesData = await saleService.getAll()

      setStats(summaryStats)
      setEstimations(estimationsData)
      setPurchases(purchasesData)
      setSales(salesData)

      // Process monthly data for chart
      const processedData = monthly.purchases.map((p: any) => ({
        month: p.month.split('T')[0],
        purchases: p.amount,
        sales: monthly.sales.find((s: any) => s.month === p.month)?.amount || 0,
      }))
      setMonthlyData(processedData)

      // Calculate estimation stats
      let totalEstimated = 0
      let totalActual = 0
      estimationsData.forEach((est) => {
        totalEstimated += est.estimated_profit
        const purchase = purchasesData.find((p) => p.id === est.purchase_id)
        const sale = est.sale_id
          ? salesData.find((s) => s.id === est.sale_id)
          : null

        if (purchase && sale) {
          const actualProfit = sale.amount - purchase.amount
          totalActual += actualProfit
        }
      })

      setEstimationStats({
        totalEstimated,
        totalActual,
        difference: totalActual - totalEstimated,
        estimationCount: estimationsData.filter((e) => e.sale_id).length,
      })

      // Calculate custom statistics
      const totalSpent = purchasesData.reduce((sum, p) => sum + p.amount, 0)

      const estimationsWithoutSale = estimationsData.filter((e) => !e.sale_id)
      const recoveredEstimated = estimationsWithoutSale.reduce((sum, e) => sum + e.estimated_profit, 0)

      // Calculate total expected profit: use actual profit if sold, estimated if not
      let totalExpectedProfit = 0
      estimationsData.forEach((est) => {
        if (est.sale_id) {
          // If sold, use actual profit from sale
          const purchase = purchasesData.find((p) => p.id === est.purchase_id)
          const sale = salesData.find((s) => s.id === est.sale_id)
          if (purchase && sale) {
            totalExpectedProfit += sale.amount - purchase.amount
          }
        } else {
          // If not sold, use estimated profit
          totalExpectedProfit += est.estimated_profit
        }
      })

      let totalEarned = 0
      estimationsData.forEach((est) => {
        if (est.sale_id) {
          const purchase = purchasesData.find((p) => p.id === est.purchase_id)
          const sale = salesData.find((s) => s.id === est.sale_id)
          if (purchase && sale) {
            totalEarned += sale.amount - purchase.amount
          }
        }
      })

      // Calculate total balance: sum of all items' balance
      // For each item:
      // - If sold: sale_price - purchase_price
      // - If not sold but estimated: estimated_sale_price - purchase_price
      // - If no estimation: -purchase_price
      let totalBalance = 0
      purchasesData.forEach((purchase) => {
        const estimation = estimationsData.find((e) => e.purchase_id === purchase.id)

        if (estimation?.sale_id) {
          // Sold: use actual sale price
          const sale = salesData.find((s) => s.id === estimation.sale_id)
          if (sale) {
            totalBalance += sale.amount - purchase.amount
          }
        } else if (estimation) {
          // Not sold but has estimation: use estimated sale price
          totalBalance += estimation.estimated_profit
        } else {
          // No estimation: only account for negative purchase price
          totalBalance -= purchase.amount
        }
      })

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

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Reload data when user navigates back to dashboard
  React.useEffect(() => {
    if (location.pathname === '/dashboard') {
      loadData()
    }
  }, [location, loadData])

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bienvenido a tu plataforma de gestión</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Total Gastado"
                value={`${customStats.totalSpent.toFixed(2)}€`}
                icon={<TrendingDown size={24} />}
                color="red"
              />
              <StatCard
                title="Saldo Recuperado Estimado"
                value={`${customStats.recoveredEstimated.toFixed(2)}€`}
                icon={<Wallet size={24} />}
                color="yellow"
              />
              <StatCard
                title="Total Esperado Ganar"
                value={`${customStats.totalExpectedProfit.toFixed(2)}€`}
                icon={<Package size={24} />}
                color="blue"
              />
              <StatCard
                title="Total Ganado"
                value={`${customStats.totalEarned.toFixed(2)}€`}
                icon={<TrendingUp size={24} />}
                color={customStats.totalEarned >= 0 ? 'green' : 'red'}
              />
              <StatCard
                title="Saldo Total"
                value={`${customStats.totalBalance.toFixed(2)}€`}
                icon={<Activity size={24} />}
                color={customStats.totalBalance >= 0 ? 'green' : 'red'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Trend */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold mb-4">Compras vs Ventas Mensuales</h2>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#3b82f6"
                        name="Compras"
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#10b981"
                        name="Ventas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No hay datos disponibles
                  </p>
                )}
              </div>

              {/* Summary Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold mb-4">Resumen</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Compras Realizadas</span>
                    <span className="font-bold text-2xl text-blue-600">
                      {stats.purchase_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-gray-600">Ventas Completadas</span>
                    <span className="font-bold text-2xl text-green-600">
                      {stats.sale_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ganancia Real</span>
                    <span
                      className={`font-bold text-2xl ${
                        estimationStats.totalActual >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {estimationStats.totalActual.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Artículos</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Nombre Artículo
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Precio Compra
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Estimación Venta
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Ganancia Estimada
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Precio Venta
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Ganancia Neta
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Fecha Compra
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Fecha Venta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => {
                      const estimation = estimations.find(
                        (e) => e.purchase_id === purchase.id
                      )
                      const sale = estimation?.sale_id
                        ? sales.find((s) => s.id === estimation.sale_id)
                        : null
                      const estimationSalePrice = estimation?.estimated_profit
                        ? purchase.amount + estimation.estimated_profit
                        : null
                      const gainNeto = sale
                        ? sale.amount - purchase.amount
                        : null
                      const purchaseDate = new Date(
                        purchase.purchase_date
                      ).toLocaleDateString()
                      const saleDate = sale
                        ? new Date(sale.sale_date).toLocaleDateString()
                        : '-'

                      return (
                        <tr
                          key={purchase.id}
                          className={`border-b ${getRowBackgroundColor(
                            purchase,
                            estimation
                          )} hover:bg-opacity-75 transition-colors`}
                        >
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
