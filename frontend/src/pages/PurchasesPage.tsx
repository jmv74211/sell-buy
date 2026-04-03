import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import { purchaseService } from '@/services/purchases'
import type { Purchase } from '@/types/api'
import { formatDate } from '@/utils/date'

export function PurchasesPage() {
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
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
    article_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    amount: '',
    item_condition: 5,
    platform_id: null as number | null,
  })

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const purchasesData = await purchaseService.getAll()
      setPurchases(purchasesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await purchaseService.update(editingId, {
          article_name: formData.article_name,
          purchase_date: formData.purchase_date,
          amount: parseFloat(formData.amount),
          item_condition: formData.item_condition,
          platform_id: formData.platform_id,
        } as any)
      } else {
        await purchaseService.create({
          article_name: formData.article_name,
          purchase_date: formData.purchase_date,
          amount: parseFloat(formData.amount),
          item_condition: formData.item_condition,
          platform_id: formData.platform_id,
        } as any)
      }
      await loadData()
      setShowModal(false)
      setFormData({
        article_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        amount: '',
        item_condition: 5,
        platform_id: null,
      })
      showToast('success', editingId ? 'Compra actualizada correctamente' : 'Compra creada correctamente')
      setEditingId(null)
    } catch (error) {
      showToast('error', 'Error al guardar la compra')
      console.error('Error saving purchase:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      await purchaseService.delete(deleteId)
      setDeleteId(null)
      await loadData()
      showToast('success', 'Compra eliminada correctamente')
    } catch (error) {
      showToast('error', 'Error al eliminar la compra')
      console.error('Error deleting purchase:', error)
      setDeleteId(null)
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setEditingId(purchase.id)
    setFormData({
      article_name: purchase.article_name,
      purchase_date: purchase.purchase_date.split('T')[0],
      amount: purchase.amount.toString(),
      item_condition: purchase.item_condition,
      platform_id: purchase.platform_id,
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
  const sortedPurchases = [...purchases].sort((a, b) => {
    let av: any, bv: any
    if (sortKey === 'name') { av = a.article_name.toLowerCase(); bv = b.article_name.toLowerCase() }
    else if (sortKey === 'date') { av = a.purchase_date; bv = b.purchase_date }
    else if (sortKey === 'amount') { av = a.amount; bv = b.amount }
    else { av = a.id; bv = b.id }
    return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
  })

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
            <p className="text-gray-600">Registro de tus compras</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({
                article_name: '',
                purchase_date: new Date().toISOString().split('T')[0],
                amount: '',
                item_condition: 5,
                platform_id: null,
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Compra
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
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('date')}>Fecha <SortIcon col="date" /></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => handleSort('amount')}>Precio <SortIcon col="amount" /></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length > 0 ? (
                  sortedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{purchase.id}</td>
                      <td className="px-6 py-4">{purchase.article_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td className="px-6 py-4">{purchase.amount.toFixed(2)}€</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
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
                      No hay compras registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={showModal}
          title={editingId ? 'Editar Compra' : 'Nueva Compra'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Artículo</label>
              <input
                type="text"
                value={formData.article_name}
                onChange={(e) =>
                  setFormData({ ...formData, article_name: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ej: iPhone 13, PlayStation 5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_date: e.target.value })
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
            <div>
              <label className="block text-sm font-medium mb-1">Condición del Artículo (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.item_condition}
                onChange={(e) =>
                  setFormData({ ...formData, item_condition: parseInt(e.target.value) })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </form>
        </Modal>

        {deleteId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
              <h2 className="text-lg font-bold mb-3">Eliminar compra</h2>
              <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar esta compra?</p>
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
