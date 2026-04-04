import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import { saleService } from '@/services/sales'
import { purchaseService } from '@/services/purchases'
import { estimationService } from '@/services/estimations'
import { useSettingsStore } from '@/store/settings'
import { t } from '@/utils/translations'
import type { Sale, Purchase, Estimation } from '@/types/api'
import { formatDate } from '@/utils/date'

export function SalesPage() {
  const language = useSettingsStore((state) => state.language)
  const [sales, setSales] = React.useState<Sale[]>([])
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [estimations, setEstimations] = React.useState<Estimation[]>([])
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
    sale_date: new Date().toISOString().split('T')[0],
    amount: '',
  })
  const [purchaseSearch, setPurchaseSearch] = React.useState('')
  const [showPurchaseDropdown, setShowPurchaseDropdown] = React.useState(false)
  const [tableSearchText, setTableSearchText] = React.useState('')
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
    // Include purchases without a sale AND with valid estimation (> 0)
    return purchases.filter((purchase) => {
      const estimation = estimations.find((e) => e.purchase_id === purchase.id)
      const hasSale = estimation && estimation.sale_id

      // If already has a sale, exclude it (unless editing)
      if (hasSale) {
        // Allow the current purchase when editing
        if (editingId) {
          const currentSale = sales.find((s) => s.id === editingId)
          return currentSale && currentSale.purchase_id === purchase.id
        }
        return false
      }

      // Must have an estimation with estimated_sale_price > 0
      if (!estimation || !estimation.estimated_sale_price || estimation.estimated_sale_price === 0) {
        return false
      }

      return true
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

  const getFilteredAndSortedSales = () => {
    let filtered = sales

    // Aplicar filtro de búsqueda
    if (tableSearchText.trim()) {
      const q = tableSearchText.toLowerCase()
      filtered = filtered.filter((sale) => {
        const articleName = getPurchaseName(sale.purchase_id).toLowerCase()
        return articleName.includes(q) || sale.purchase_id.toString().includes(q)
      })
    }

    // Aplicar ordenamiento
    return filtered.sort((a, b) => {
      let av: any, bv: any
      if (sortKey === 'name') { av = getPurchaseName(a.purchase_id).toLowerCase(); bv = getPurchaseName(b.purchase_id).toLowerCase() }
      else if (sortKey === 'date') { av = a.sale_date; bv = b.sale_date }
      else if (sortKey === 'amount') { av = a.amount; bv = b.amount }
      else { av = a.purchase_id; bv = b.purchase_id }
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
    })
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
      showToast('success', editingId ? t(language, 'sales.messages.updated') : t(language, 'sales.messages.created'))
      setEditingId(null)
      // Notify dashboard to refresh
      localStorage.setItem('refreshDashboard', Date.now().toString())
    } catch (error) {
      showToast('error', t(language, 'sales.messages.errorSaving'))
      console.error('Error saving sale:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    try {
      await saleService.delete(deleteId)
      setDeleteId(null)
      await loadData()
      showToast('success', t(language, 'sales.messages.deleted'))
    } catch (error) {
      showToast('error', t(language, 'sales.messages.errorDeleting'))
      console.error('Error deleting sale:', error)
      setDeleteId(null)
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

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }
  const SortIcon = ({ col }: { col: string }) => sortKey === col
    ? sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1 text-blue-500" /> : <ChevronDown size={14} className="inline ml-1 text-blue-500" />
    : <ChevronUp size={14} className="inline ml-1 text-gray-300" />
  const sortedSales = getFilteredAndSortedSales()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t(language, 'sales.title')}</h1>
            <p className="text-gray-600">{t(language, 'sales.subtitle')}</p>
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
            {t(language, 'sales.new')}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">{t(language, 'sales.loading')}</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4">
              <input
                type="text"
                value={tableSearchText}
                onChange={(e) => setTableSearchText(e.target.value)}
                placeholder={t(language, 'sales.search')}
                className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">Resultados: <span className="font-semibold text-gray-900">{sortedSales.length}</span></span>
            </div>
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
                {sales.length > 0 ? (
                  sortedSales.map((sale) => (
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
          </>
        )}

        <Modal
          isOpen={showModal}
          title={editingId ? 'Editar Venta' : 'Nueva Venta'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Compra</label>
              {editingId ? (
                // Show as read-only text when editing
                <div className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 flex items-center">
                  {purchaseSearch}
                </div>
              ) : (
                // Show as searchable input when creating
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
                    placeholder={t(language, 'sales.search')}
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
              )}
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

        {deleteId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
              <h2 className="text-lg font-bold mb-3">Eliminar venta</h2>
              <p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar esta venta?</p>
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
