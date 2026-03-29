import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLogin, setIsLogin] = React.useState(true)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState({
    name: '',
    email: '',
    user_name: '',
    password: '',
  })
  const [formData, setFormData] = React.useState({
    user_name: '',
    password: '',
    name: '',
    email: '',
  })

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validateField = (name: string, value: string, isRegisterMode: boolean): string => {
    // Validación de campos vacíos
    if (!value.trim()) {
      if (isRegisterMode) {
        if (name === 'name') return 'El nombre es requerido'
        if (name === 'email') return 'El email es requerido'
      }
      if (name === 'user_name') return 'El usuario es requerido'
      if (name === 'password') return 'La contraseña es requerida'
    }

    // Validación de formato (solo en modo registro)
    if (isRegisterMode) {
      if (name === 'name' && value.trim().length > 0 && value.trim().length < 2) {
        return 'El nombre debe tener al menos 2 caracteres'
      }
      if (name === 'email' && value.trim().length > 0 && !validateEmail(value)) {
        return 'Email inválido'
      }
      if (name === 'user_name' && value.trim().length > 0 && value.trim().length < 3) {
        return 'El usuario debe tener al menos 3 caracteres'
      }
      if (name === 'password' && value.length > 0 && value.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres'
      }
    }

    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setFieldErrors({
      ...fieldErrors,
      [name]: validateField(name, value, !isLogin),
    })
  }

  const validateForm = (): boolean => {
    const errors: any = {}

    if (isLogin) {
      // En login, solo validar que no estén vacíos
      if (!formData.user_name.trim()) {
        errors.user_name = 'El usuario es requerido'
      }
      if (!formData.password.trim()) {
        errors.password = 'La contraseña es requerida'
      }
    } else {
      // En registro, validar todo incluyendo longitud
      if (!formData.name.trim()) {
        errors.name = 'El nombre es requerido'
      } else if (formData.name.trim().length < 2) {
        errors.name = 'El nombre debe tener al menos 2 caracteres'
      }

      if (!formData.email.trim()) {
        errors.email = 'El email es requerido'
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Email inválido'
      }

      if (!formData.user_name.trim()) {
        errors.user_name = 'El usuario es requerido'
      } else if (formData.user_name.trim().length < 3) {
        errors.user_name = 'El usuario debe tener al menos 3 caracteres'
      }

      if (!formData.password.trim()) {
        errors.password = 'La contraseña es requerida'
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Limpiar errores previos
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setError('Por favor, completa correctamente todos los campos')
      return
    }

    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await authService.login(
          formData.user_name,
          formData.password
        )
        // Si llegamos aquí, el login fue exitoso
        setAuth(response.user, response.access_token)
        setIsLoading(false)
        navigate('/dashboard')
      } else {
        await authService.register(formData as any)
        setSuccess('¡Registro exitoso! Inicia sesión con tu cuenta.')
        setIsLoading(false)
        setTimeout(() => {
          setIsLogin(true)
          setFormData({ user_name: '', password: '', name: '', email: '' })
          setSuccess('')
        }, 2500)
      }
    } catch (err: any) {
      console.error('Login catch block - err:', err)
      console.error('Status:', err.response?.status)
      console.error('Data:', err.response?.data)

      let errorMessage = 'Error desconocido'

      if (err.response?.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos'
      } else if (err.response?.status === 400) {
        errorMessage = 'Usuario o contraseña incorrectos'
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      console.error('Final error message:', errorMessage)

      // Establecer el error en el estado
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm text-center animate-pulse">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle size={48} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h2>
            <p className="text-gray-600 mb-6">{success}</p>
            <div className="flex justify-center">
              <div className="animate-spin">
                <div className="border-4 border-blue-200 border-t-blue-600 rounded-full w-8 h-8"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle size={48} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h2>
            <p className="text-gray-600 mb-6 text-center font-medium text-lg">{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">SellBuy</h1>
          <p className="text-gray-600">Gestión de compras y ventas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <div className={`flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 ${fieldErrors.name ? 'border-2 border-red-500' : ''}`}>
                  <User size={20} className="text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-transparent outline-none flex-1"
                    placeholder="Tu nombre"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className={`flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 ${fieldErrors.email ? 'border-2 border-red-500' : ''}`}>
                  <Mail size={20} className="text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-transparent outline-none flex-1"
                    placeholder="tu@email.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {fieldErrors.email}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className={`flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 ${fieldErrors.user_name ? 'border-2 border-red-500' : ''}`}>
              <User size={20} className="text-gray-400" />
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                className="bg-transparent outline-none flex-1"
                placeholder="nombre_usuario"
              />
            </div>
            {fieldErrors.user_name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {fieldErrors.user_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className={`flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 ${fieldErrors.password ? 'border-2 border-red-500' : ''}`}>
              <Lock size={20} className="text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-transparent outline-none flex-1"
                placeholder="••••••••"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Cargando...' : isLogin ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setFieldErrors({ name: '', email: '', user_name: '', password: '' })
              setError('')
              setSuccess('')
              setFormData({ user_name: '', password: '', name: '', email: '' })
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            {isLogin ? 'Crea una aquí' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
