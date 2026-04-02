import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { saleService } from '@/services/sales'
import { purchaseService } from '@/services/purchases'
import { estimationService } from '@/services/estimations'
import type { Sale, Purchase, Estimation } from '@/types/api'
import { formatDate } from '@/utils/date'

export function SalesPage() {
  const [sales, setSales] = React.useState<Sale[]>([])
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [estimations, setEstimations] = React.useState<Estimation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [formData, setFormData] = React.useState({
    purchase_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    amount: '',
  })
  const [purchaseSearch, setPurchaseSearch] = React.useState('')
  const [showPurchaseDropdown, setShowPurchaseDropdown] = React.useState(false)
  const purchaseInputRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const salesData = await saleService.getAll()
      const purchasesData = await purchaseService.getAll()
      const estimationsData = await estimationService.getAll()
      setSales(salesData)
      setPurchases(purchasesData)
      setEstimations(estimationsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailablePurchases = () => {
    // Include purchases without a sale, plus the currently-edited sale's purchase
    return purchases.filter((purchase) => {
      const estimation = estimations.find((e) => e.purchase_id === purchase.id)
      const hasSale = estimation && estimation.sale_id
      if (!hasSale) return true
      // Allow the current purchase when editing
      if (editingId) {
        const currentSale = sales.find((s) => s.id === editingId)
        return currentSale && currentSale.purchase_id === purchase.id
      }
      return false
    })
  }

  const getFilteredPurchases = () => {
    const available = getAvailablePurchases()
    if (!purchaseSearch.trim()) return available
    const q = purchaseSearch.toLowerCase()
    return available.filter(
      (p) =>
        p.article_name.toLowerCase().includes(q) ||
        p.id.toString().includes(q)
    )
  }

  const getPurchaseName = (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    return purchase ? purchase.article_name : 'Desconocido'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await saleService.update(editingId, {
          purchase_id: parseInt(formData.purchase_id),
          sale_date: formData.sale_date,
          amount: parseFloat(formData.amount),
        } as any)
      } else {
        await saleService.create({
          purchase_id: parseInt(formData.purchase_id),
          sale_date: formData.sale_date,
          amount: parseFloat(formData.amount),
        } as any)
      }
      await loadData()
      setShowModal(false)
      setFormData({
        purchase_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        amount: '',
      })
      setPurchaseSearch('')
      setEditingId(null)
    } catch (error) {
      console.error('Error saving sale:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      try {
        await saleService.delete(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting sale:', error)
      }
    }
  }

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id)
    setFormData({
      purchase_id: sale.purchase_id.toString(),
      sale_date: sale.sale_date.split('T')[0],
      amount: sale.amount.toString(),
    })
    const purchase = purchases.find((p) => p.id === sale.purchase_id)
    setPurchaseSearch(purchase ? `(${purchase.id}) - ${purchase.article_name}` : '')
    setShowModal(true)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600">Registro de tus ventas</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({
                purchase_id: '',
                sale_date: new Date().toISOString().split('T')[0],
                amount: '',
              })
              setPurchaseSearch('')
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Venta
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID Artículo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Artículo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Precio</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.length > 0 ? (
                  [...sales].sort((a, b) => b.id - a.id).map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{sale.purchase_id}</td>
                      <td className="px-6 py-4">{getPurchaseName(sale.purchase_id)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-6 py-4">{sale.amount.toFixed(2)}€</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={showModal}
          title={editingId ? 'Editar Venta' : 'Nueva Venta'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Compra</label>
              <div ref={purchaseInputRef} className="relative">
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={(e) => {
                    setPurchaseSearch(e.target.value)
                    setFormData({ ...formData, purchase_id: '' })
                    setShowPurchaseDropdown(true)
                  }}
                  onFocus={() => setShowPurchaseDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPurchaseDropdown(false), 150)}
                  placeholder="Escribe para buscar por nombre o ID..."
                  className="w-full border rounded-lg px-3 py-2"
                  required={!formData.purchase_id}
                  autoComplete="off"
                />
                {/* Hidden input to enforce required validation on the actual ID */}
                <input
                  type="text"
                  value={formData.purchase_id}
                  required
                  readOnly
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {showPurchaseDropdown && getFilteredPurchases().length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {getFilteredPurchases().map((purchase) => (
                      <li
                        key={purchase.id}
                        onMouseDown={() => {
                          setFormData({ ...formData, purchase_id: purchase.id.toString() })
                          setPurchaseSearch(`(${purchase.id}) - ${purchase.article_name}`)
                          setShowPurchaseDropdown(false)
                        }}
                        className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm"
                      >
                        <span className="font-medium text-gray-500 mr-2">({purchase.id})</span>
                        {purchase.article_name}
                      </li>
                    ))}
                  </ul>
                )}
                {showPurchaseDropdown && purchaseSearch.trim() !== '' && getFilteredPurchases().length === 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-3 py-2 text-sm text-gray-500">
                    No se encontraron artículos
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={formData.sale_date}
                onChange={(e) =>
                  setFormData({ ...formData, sale_date: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  )
}
