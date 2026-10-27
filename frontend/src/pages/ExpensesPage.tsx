import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Modal } from '@/components/Modal'
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import { expenseService } from '@/services/expenses'
import { useSettingsStore } from '@/store/settings'
import type { Expense } from '@/types/api'
import { formatDate, localDateStr } from '@/utils/date'

export function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sortKey, setSortKey] = React.useState('id')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [showModal, setShowModal] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [searchText, setSearchText] = React.useState('')
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [formData, setFormData] = React.useState({ article_name: '', purchase_date: localDateStr(), amount: '' })
  const language = useSettingsStore((state) => state.language)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const loadData = async () => {
    try {
      setExpenses(await expenseService.getAll())
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { loadData() }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const data = { article_name: formData.article_name, purchase_date: formData.purchase_date, amount: parseFloat(formData.amount) }
      if (editingId) await expenseService.update(editingId, data)
      else await expenseService.create(data)
      await loadData()
      setShowModal(false)
      setEditingId(null)
      setFormData({ article_name: '', purchase_date: localDateStr(), amount: '' })
      showToast('success', editingId ? 'Gasto actualizado correctamente' : 'Gasto creado correctamente')
      localStorage.setItem('refreshDashboard', Date.now().toString())
    } catch (error) {
      showToast('error', 'Error al guardar el gasto')
      console.error('Error saving expense:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteId === null) return
    try {
      await expenseService.delete(deleteId)
      setDeleteId(null)
      await loadData()
      showToast('success', 'Gasto eliminado correctamente')
      localStorage.setItem('refreshDashboard', Date.now().toString())
    } catch (error) {
      showToast('error', 'Error al eliminar el gasto')
      setDeleteId(null)
      console.error('Error deleting expense:', error)
    }
  }

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((direction) => direction === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ column }: { column: string }) => sortKey === column
    ? sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1 text-blue-500" /> : <ChevronDown size={14} className="inline ml-1 text-blue-500" />
    : <ChevronUp size={14} className="inline ml-1 text-gray-300" />

  const visibleExpenses = expenses
    .filter((expense) => !searchText.trim() || expense.article_name.toLowerCase().includes(searchText.toLowerCase()) || expense.id.toString().includes(searchText))
    .sort((a, b) => {
      const values = sortKey === 'article_name'
        ? [a.article_name.toLowerCase(), b.article_name.toLowerCase()]
        : sortKey === 'purchase_date' ? [a.purchase_date, b.purchase_date] : sortKey === 'amount' ? [a.amount, b.amount] : [a.id, b.id]
      return sortDir === 'asc' ? (values[0] < values[1] ? -1 : values[0] > values[1] ? 1 : 0) : (values[0] > values[1] ? -1 : values[0] < values[1] ? 1 : 0)
    })

  const openNew = () => {
    setEditingId(null)
    setFormData({ article_name: '', purchase_date: localDateStr(), amount: '' })
    setShowModal(true)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-gray-900">Gastos</h1><p className="text-gray-600">Registro de gastos generales</p></div>
          <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"><Plus size={20} />Nuevo Gasto</button>
        </div>
        {loading ? <p className="text-gray-600">Cargando...</p> : <>
          <div className="mb-4 flex items-center gap-4">
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buscar por artículo o ID..." className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm text-gray-600 whitespace-nowrap">Resultados: <span className="font-semibold text-gray-900">{visibleExpenses.length}</span></span>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full"><thead className="bg-gray-100 border-b"><tr>
              <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => handleSort('id')}>Id <SortIcon column="id" /></th>
              <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => handleSort('article_name')}>Artículo <SortIcon column="article_name" /></th>
              <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => handleSort('amount')}>Precio de compra <SortIcon column="amount" /></th>
              <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => handleSort('purchase_date')}>Fecha de compra <SortIcon column="purchase_date" /></th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr></thead><tbody>
              {visibleExpenses.length ? visibleExpenses.map((expense) => <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{expense.id}</td><td className="px-6 py-4">{expense.article_name}</td><td className="px-6 py-4">{expense.amount.toFixed(2)}€</td><td className="px-6 py-4 text-gray-600">{formatDate(expense.purchase_date)}</td>
                <td className="px-6 py-4 flex gap-2"><button title="Editar" onClick={() => { setEditingId(expense.id); setFormData({ article_name: expense.article_name, purchase_date: expense.purchase_date.split('T')[0], amount: expense.amount.toString() }); setShowModal(true) }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button><button title="Eliminar" onClick={() => setDeleteId(expense.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button></td>
              </tr>) : <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-600">No hay gastos registrados</td></tr>}
            </tbody></table>
          </div>
        </>}
        <Modal isOpen={showModal} title={editingId ? 'Editar Gasto' : 'Nuevo Gasto'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Artículo</label><input value={formData.article_name} onChange={(event) => setFormData({ ...formData, article_name: event.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
            <div><label className="block text-sm font-medium mb-1">Precio de compra</label><input type="number" step="0.01" min="0" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: event.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha de compra</label><input type="date" value={formData.purchase_date} onChange={(event) => setFormData({ ...formData, purchase_date: event.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">{editingId ? 'Actualizar' : 'Crear'}</button>
          </form>
        </Modal>
        {deleteId !== null && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6"><h2 className="text-lg font-bold mb-3">Eliminar gasto</h2><p className="text-gray-700 mb-6">¿Estás seguro de que deseas eliminar este gasto?</p><div className="flex gap-3 justify-end"><button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-gray-300">Cancelar</button><button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-500 text-white">Eliminar</button></div></div></div>}
        {toast && <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-5 py-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}<span className="text-sm">{toast.msg}</span></div>}
      </main>
    </div>
  )
}