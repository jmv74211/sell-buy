import React from 'react'
import { Menu, LogOut, Home, TrendingUp, Target, Download, Upload, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { purchaseService } from '@/services/purchases'
import { saleService } from '@/services/sales'
import { estimationService } from '@/services/estimations'
import apiClient from '@/services/api'
import clsx from 'clsx'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearAuth } = useAuthStore()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const [isImporting, setIsImporting] = React.useState(false)
  const importInputRef = React.useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = React.useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 6000)
  }

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      showToast('error', 'Por favor selecciona un archivo CSV')
      e.target.value = ''
      return
    }
    setPendingFile(file)
    setConfirmOpen(true)
    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (!pendingFile) return
    setConfirmOpen(false)
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', pendingFile)
      const response = await apiClient.post('/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { purchases, sales, estimations, errors } = response.data
      let msg = `Importación completada: ${purchases} compras, ${sales} ventas, ${estimations} estimaciones`
      if (errors && errors.length > 0) {
        msg += ` (${errors.length} errores)`
      }
      showToast('success', msg)
      setTimeout(() => {
        navigate(location.pathname, { replace: true })
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.message || 'Error desconocido'
      showToast('error', `Error al importar: ${detail}`)
    } finally {
      setIsImporting(false)
      setPendingFile(null)
    }
  }

  const handleExportData = async () => {
    try {
      const purchases = await purchaseService.getAll()
      const sales = await saleService.getAll()
      const estimations = await estimationService.getAll()

      // Helper: format number Spanish-style (dot thousands, comma decimal)
      const fmt = (n: number | null | undefined): string => {
        if (n === null || n === undefined) return '0'
        return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      }

      // Compute summary statistics
      const totalGastado = purchases.reduce((s, p) => s + p.amount, 0)
      const withEsp = estimations.filter(e => e.estimated_sale_price && e.estimated_sale_price > 0)
      const sumEstVenta = withEsp.reduce((s, e) => s + (e.estimated_sale_price ?? 0), 0)
      const sumGananciaNetaGt0 = estimations.reduce((s, e) => {
        if (!e.sale_id) return s
        const sale = sales.find(sa => sa.id === e.sale_id)
        const purchase = purchases.find(p => p.id === e.purchase_id)
        if (!sale || !purchase) return s
        const profit = sale.amount - purchase.amount
        return profit > 0 ? s + profit : s
      }, 0)
      const saldoRecuperado = sumEstVenta - sumGananciaNetaGt0
      const totalGanado = estimations.reduce((s, e) => {
        if (!e.sale_id) return s
        const sale = sales.find(sa => sa.id === e.sale_id)
        const purchase = purchases.find(p => p.id === e.purchase_id)
        if (!sale || !purchase) return s
        return s + (sale.amount - purchase.amount)
      }, 0)
      const saldo = saldoRecuperado + totalGanado - totalGastado
      const totalEsperado = estimations.reduce((s, e) => {
        if (e.sale_id) {
          const sale = sales.find(sa => sa.id === e.sale_id)
          const purchase = purchases.find(p => p.id === e.purchase_id)
          if (sale && purchase) return s + (sale.amount - purchase.amount)
        }
        return s + e.estimated_profit
      }, 0)

      // Build CSV rows — same format as the import CSV
      const rows: string[] = []

      // 7 summary header rows
      rows.push(',,,,,,,,,,,,')
      rows.push(`,,,,,TOTAL GASTADO,,${fmt(totalGastado)} €,,,,,`)
      rows.push(`,,,,,SALDO RECUPERADO ESTIMADO,,${fmt(saldoRecuperado)} €,,,,,`)
      rows.push(`,,,,,SALDO,,${fmt(saldo)} €,,,,,`)
      rows.push(`,,,,,TOTAL ESPERADO GANAR,,${fmt(totalEsperado)} €,,,,,`)
      rows.push(`,,,,,TOTAL GANADO,,${fmt(totalGanado)} €,,,,,`)
      rows.push(',,,,,,,,,,,,')

      // Column header row
      rows.push(',ARTÍCULO,,,,,,PRECIO COMPRA,ESTIMACIÓN VENTA,REVENDIDO POR,GANANCIA ESTIMADA,GANANCIA NETA,FECHA COMPRA,FECHA VENTA')

      // Data rows — sorted by purchase date ascending
      const sorted = [...purchases].sort(
        (a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
      )

      for (const purchase of sorted) {
        const estimation = estimations.find(e => e.purchase_id === purchase.id)
        const sale = estimation?.sale_id ? sales.find(s => s.id === estimation.sale_id) : null

        const precioCompra = fmt(purchase.amount)
        const estVenta = estimation?.estimated_sale_price ? fmt(estimation.estimated_sale_price) : '0'
        const revendidoPor = sale ? fmt(sale.amount) : '0'
        const gananciaEstimada = estimation ? fmt(estimation.estimated_profit) : '0'
        const gananciaNeta = sale
          ? fmt(sale.amount - purchase.amount)
          : (estimation?.actual_profit ? fmt(estimation.actual_profit) : '0')
        const fecha = new Date(purchase.purchase_date).toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }).replace(/\//g, '-')
        const fechaVenta = sale
          ? new Date(sale.sale_date).toLocaleDateString('es-ES', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            }).replace(/\//g, '-')
          : ''

        // Escape article name if it contains commas
        const articleName = purchase.article_name.includes(',')
          ? `"${purchase.article_name}"`
          : purchase.article_name

        rows.push(`,${articleName},,,,,,${precioCompra},${estVenta},${revendidoPor},${gananciaEstimada},${gananciaNeta},${fecha},${fechaVenta}`)
      }

      const csvContent = rows.join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Videojuegos - Compras_Ventas_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      showToast('error', 'Error al exportar los datos')
    }
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: TrendingUp, label: 'Compras', href: '/purchases' },
    { icon: TrendingUp, label: 'Ventas', href: '/sales' },
    { icon: Target, label: 'Estimaciones', href: '/estimations' },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <nav
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white p-6 transform transition-transform duration-300 lg:translate-x-0 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold">SellBuy</h1>
          <p className="text-blue-200 text-sm">Gestión de Ventas</p>
        </div>

        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.href
                    ? 'bg-blue-900'
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <label
          className={`absolute bottom-32 left-6 right-6 flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition-colors w-12 justify-center lg:w-auto cursor-pointer ${isImporting ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFileChange}
            disabled={isImporting}
          />
          <Upload size={20} />
          <span className="hidden lg:inline">{isImporting ? 'Importando...' : 'Importar datos'}</span>
        </label>

        <button
          onClick={handleExportData}
          className="absolute bottom-20 left-6 right-6 flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-400 hover:bg-blue-300 transition-colors w-12 justify-center lg:w-auto"
        >
          <Download size={20} />
          <span className="hidden lg:inline">Exportar datos</span>
        </button>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors w-12 justify-center lg:w-auto"
        >
          <LogOut size={20} />
          <span className="hidden lg:inline">Salir</span>
        </button>
      </nav>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Confirm import modal */}
      {confirmOpen && pendingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-3">Confirmar importación</h2>
            <p className="text-gray-700 mb-2">
              ¿Reimportar datos desde <span className="font-semibold">{pendingFile.name}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Esto borrará todas las compras, ventas y estimaciones actuales.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmOpen(false); setPendingFile(null) }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white transition-colors"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-lg shadow-lg text-white max-w-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success'
            ? <CheckCircle size={20} className="mt-0.5 shrink-0" />
            : <XCircle size={20} className="mt-0.5 shrink-0" />
          }
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}
    </>
  )
}
