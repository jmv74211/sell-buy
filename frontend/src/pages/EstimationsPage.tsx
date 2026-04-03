import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
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
  const [sortKey, setSortKey] = React.useState<string>('id')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [showModal, setShowModal] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }
  const [formData, setFormData] = React.useState({
    purchase_id: '',
    estimated_sale_price: '',
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

  const getArticleName = (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    return purchase ? purchase.article_name : 'Desconocido'
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

  const getAvailablePurchases = () => {
    // Filter purchases that don't have an estimation already
    // But include the current one if we're editing
    return purchases.filter((purchase) => {
      const hasEstimation = estimations.some((e) => e.purchase_id === purchase.id)
      if (editingId) {
        // When editing, include the current purchase even if it has an estimation
        const currentEstimation = estimations.find(e => e.id === editingId)
        return !hasEstimation || purchase.id === currentEstimation?.purchase_id
      }
      return !hasEstimation
    })
  }

  const calculateActualProfit = (purchaseId: number, saleId: number | null) => {
    const purchaseAmount = getPurchaseAmount(purchaseId)
    const saleAmount = getSaleAmount(saleId)
    return saleAmount - purchaseAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const purchaseId = parseInt(formData.purchase_id)
      const estSalePrice = formData.estimated_sale_price ? parseFloat(formData.estimated_sale_price) : null
      const purchaseAmount = getPurchaseAmount(purchaseId)
      const estProfit = estSalePrice != null ? estSalePrice - purchaseAmount : 0
      if (editingId) {
        await estimationService.update(editingId, {
          purchase_id: purchaseId,
          estimated_sale_price: estSalePrice,
          estimated_profit: estProfit,
        } as any)
      } else {
        await estimationService.create({
          purchase_id: purchaseId,
          estimated_sale_price: estSalePrice,
          estimated_profit: estProfit,
        } as any)
      }
      await loadData()
      setShowModal(false)
      setFormData({
        purchase_id: '',
        estimated_sale_price: '',
      })
      showToast('success', editingId ? 'Estimación actualizada correctamente' : 'Estimación creada correctamente')
      setEditingId(null)
      // Notify dashboard to refresh
      localStorage.setItem('refreshDashboard', Date.now().toString())
    } catch (error) {
      showToast('error', 'Error al guardar la estimación')
      console.error('Error saving estimation:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      await estimationService.delete(deleteId)
      setDeleteId(null)
      await loadData()
      showToast('success', 'Estimación eliminada correctamente')
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.message || 'Error desconocido'
      showToast('error', `Error al eliminar: ${detail}`)
      console.error('Error deleting estimation:', error)
      setDeleteId(null)
    }
  }

  const handleEdit = (estimation: Estimation) => {
    setEditingId(estimation.id)
    setFormData({
      purchase_id: estimation.purchase_id.toString(),
      estimated_sale_price: estimation.estimated_sale_price?.toString() ?? '',
    })
    setShowModal(true)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }
  const SortIcon = ({ col }: { col: string }) => sortKey === col
    ? sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1 text-blue-500" /> : <ChevronDown size={14} className="inline ml-1 text-blue-500" />
    : <ChevronUp size={14} className="inline ml-1 text-gray-300" />
  const sortedEstimations = [...estimations].sort((a, b) => {
    let av: any, bv: any
    if (sortKey === 'name') { av = getArticleName(a.purchase_id).toLowerCase(); bv = getArticleName(b.purchase_id).toLowerCase() }
    else if (sortKey === 'estSalePrice') { av = a.estimated_sale_price ?? -Infinity; bv = b.estimated_sale_price ?? -Infinity }
    else if (sortKey === 'estimated') { av = a.estimated_profit; bv = b.estimated_profit }
    else if (sortKey === 'actual') { av = a.actual_profit ?? -Infinity; bv = b.actual_profit ?? -Infinity }
    else { av = a.purchase_id; bv = b.purchase_id }
    return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
  })

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
                estimated_sale_price: '',
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
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('id')}>ID Artículo <SortIcon col="id" /></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('name')}>Artículo <SortIcon col="name" /></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('estSalePrice')}>
                    Precio Est. Venta <SortIcon col="estSalePrice" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('estimated')}>
                    Ganancia Estimada <SortIcon col="estimated" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('actual')}>
                    Ganancia Real <SortIcon col="actual" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estimations.length > 0 ? (
                  sortedEstimations.map((estimation) => {
                    const actualProfit = calculateActualProfit(
                      estimation.purchase_id,
                      estimation.sale_id
                    )
                    const difference =
                      actualProfit - estimation.estimated_profit
                    return (
                      <tr key={estimation.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{estimation.purchase_id}</td>
                        <td className="px-6 py-4">
                          {getArticleName(estimation.purchase_id)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-blue-600">
                            {estimation.estimated_sale_price != null ? `${Number(estimation.estimated_sale_price).toFixed(2)}€` : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              estimation.estimated_profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {estimation.estimated_profit.toFixed(2)}€
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
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
              <label className="block text-sm font-medium mb-1">Artículo</label>
              {editingId ? (
                // Show as read-only text when editing
                <div className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 flex items-center">
                  {getArticleName(parseInt(formData.purchase_id))}
                </div>
              ) : (
                // Show as select when creating
                <select
                  value={formData.purchase_id}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_id: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Selecciona una compra</option>
                  {getAvailablePurchases().map((purchase) => (
                    <option key={purchase.id} value={purchase.id}>
                      ({purchase.id}) - {purchase.article_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Precio Estimado de Venta (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_sale_price}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_sale_price: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: 350.00"
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

        {/* Confirm delete modal */}
        {deleteId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
              <h2 className="text-lg font-bold mb-3">Eliminar estimación</h2>
              <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar esta estimación?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-5 py-4 rounded-lg shadow-lg text-white max-w-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle size={20} className="mt-0.5 shrink-0" />
              : <XCircle size={20} className="mt-0.5 shrink-0" />
            }
            <span className="text-sm">{toast.msg}</span>
          </div>
        )}
      </main>
    </div>
  )
}
