import React from 'react'
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

  React.useEffect(() => {
    const loadData = async () => {
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

        const totalExpectedProfit = estimationsData.reduce((sum, e) => sum + e.estimated_profit, 0)

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
    }

    loadData()
  }, [])

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
          </>
        ) : (
          <p className="text-gray-600">Error al cargar los datos</p>
        )}
      </main>
    </div>
  )
}
