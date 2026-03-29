import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { estimationService } from '@/services/estimations'
import { purchaseService } from '@/services/purchases'
import { saleService } from '@/services/sales'
import type { Estimation, Purchase, Sale } from '@/types/api'
import { formatDate } from '@/utils/date'

export function EstimationsPage() {
  const [estimations, setEstimations] = React.useState<Estimation[]>([])
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [sales, setSales] = React.useState<Sale[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [formData, setFormData] = React.useState({
    purchase_id: '',
    sale_id: null as number | null,
    estimated_profit: '',
  })

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const estimationsData = await estimationService.getAll()
      const purchasesData = await purchaseService.getAll()
      const salesData = await saleService.getAll()
      setEstimations(estimationsData)
      setPurchases(purchasesData)
      setSales(salesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPurchaseName = (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    return purchase
      ? `${purchase.article_name} - ${purchase.amount.toFixed(2)}€`
      : 'Desconocido'
  }

  const getSaleName = (saleId: number | null) => {
    if (!saleId) return 'No realizada'
    const sale = sales.find((s) => s.id === saleId)
      return sale ? `${sale.amount.toFixed(2)}€` : 'Desconocido'
  }

  const getPurchaseAmount = (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    return purchase ? purchase.amount : 0
  }

  const getSaleAmount = (saleId: number | null) => {
    if (!saleId) return 0
    const sale = sales.find((s) => s.id === saleId)
    return sale ? sale.amount : 0
  }

  const calculateActualProfit = (purchaseId: number, saleId: number | null) => {
    const purchaseAmount = getPurchaseAmount(purchaseId)
    const saleAmount = getSaleAmount(saleId)
    return saleAmount - purchaseAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await estimationService.update(editingId, {
          purchase_id: parseInt(formData.purchase_id),
          sale_id: formData.sale_id,
          estimated_profit: parseFloat(formData.estimated_profit),
        } as any)
      } else {
        await estimationService.create({
          purchase_id: parseInt(formData.purchase_id),
          sale_id: formData.sale_id,
          estimated_profit: parseFloat(formData.estimated_profit),
        } as any)
      }
      await loadData()
      setShowModal(false)
      setFormData({
        purchase_id: '',
        sale_id: null,
        estimated_profit: '',
      })
      setEditingId(null)
    } catch (error) {
      console.error('Error saving estimation:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta estimación?')) {
      try {
        await estimationService.delete(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting estimation:', error)
      }
    }
  }

  const handleEdit = (estimation: Estimation) => {
    setEditingId(estimation.id)
    setFormData({
      purchase_id: estimation.purchase_id.toString(),
      sale_id: estimation.sale_id,
      estimated_profit: estimation.estimated_profit.toString(),
    })
    setShowModal(true)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estimaciones</h1>
            <p className="text-gray-600">Gestiona tus estimaciones de ganancia</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({
                purchase_id: '',
                sale_id: null,
                estimated_profit: '',
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Estimación
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Artículo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Ganancia Estimada
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Ganancia Real
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estimations.length > 0 ? (
                  estimations.map((estimation) => {
                    const actualProfit = calculateActualProfit(
                      estimation.purchase_id,
                      estimation.sale_id
                    )
                    const difference =
                      actualProfit - estimation.estimated_profit
                    return (
                      <tr key={estimation.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {getPurchaseName(estimation.purchase_id)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              estimation.estimated_profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ${estimation.estimated_profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              actualProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {estimation.sale_id ? `${actualProfit.toFixed(2)}€` : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {estimation.sale_id ? (
                            <span
                              className={`font-semibold ${
                                difference >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              ${difference.toFixed(2)}€
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => handleEdit(estimation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(estimation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                      No hay estimaciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={showModal}
          title={editingId ? 'Editar Estimación' : 'Nueva Estimación'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Compra</label>
              <select
                value={formData.purchase_id}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_id: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Selecciona una compra</option>
                {purchases.map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>
                    {purchase.article_name} - {purchase.amount.toFixed(2)}€
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Venta (Opcional)
              </label>
              <select
                value={formData.sale_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sale_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sin venta asociada</option>
                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    Venta #{sale.id} - {sale.amount.toFixed(2)}€
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ganancia Estimada
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_profit}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_profit: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: 150.00"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  )
}
