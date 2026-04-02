import React from 'react'
import { Menu, LogOut, Home, TrendingUp, Target, Download, Upload } from 'lucide-react'
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

  const handleImportData = () => {
    importInputRef.current?.click()
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo CSV')
      return
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres reimportar los datos desde "${file.name}"?\n\nEsto borrará todas las compras, ventas y estimaciones actuales y las reemplazará con los datos del CSV. Los datos del usuario se mantendrán intactos.`
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post('/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { purchases, sales, estimations, errors } = response.data
      let msg = `✅ Importación completada:\n• ${purchases} compras\n• ${sales} ventas\n• ${estimations} estimaciones`
      if (errors && errors.length > 0) {
        msg += `\n\n⚠️ ${errors.length} errores:\n${errors.slice(0, 5).join('\n')}`
      }
      alert(msg)
      // Reload current page data
      navigate(location.pathname, { replace: true })
      window.location.reload()
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Error desconocido'
      alert(`❌ Error al importar: ${detail}`)
    } finally {
      setIsImporting(false)
      e.target.value = ''
    }
  }

  const handleExportData = async () => {
    try {
      const purchases = await purchaseService.getAll()
      const sales = await saleService.getAll()
      const estimations = await estimationService.getAll()

      const backupData = {
        exportDate: new Date().toISOString(),
        purchases,
        sales,
        estimations,
      }

      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sellbuy_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error al exportar los datos')
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

        <input
          ref={importInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportFileChange}
        />

        <button
          onClick={handleImportData}
          disabled={isImporting}
          className="absolute bottom-32 left-6 right-6 flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-60 transition-colors w-12 justify-center lg:w-auto"
        >
          <Upload size={20} />
          <span className="hidden lg:inline">{isImporting ? 'Importando...' : 'Importar datos'}</span>
        </button>

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
    </>
  )
}
