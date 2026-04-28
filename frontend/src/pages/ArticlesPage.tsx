import { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { inventoryService } from '@/services/inventory';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import type { Article, PlatformRange } from '@/types/api';
import { Plus, X, Edit2, Trash2, Check, Upload } from 'lucide-react';

export function ArticlesPage() {
  const language = useSettingsStore((state) => state.language);
  const { token, clearAuth } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [addingArticleToPlat, setAddingArticleToPlat] = useState<number | null>(null);
  const [newArticleCode, setNewArticleCode] = useState('');
  const [newArticleName, setNewArticleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editingArticleCode, setEditingArticleCode] = useState<number | null>(null);
  const [editArticleCode, setEditArticleCode] = useState('');
  const [editArticleName, setEditArticleName] = useState('');
  const [deletingArticleCode, setDeletingArticleCode] = useState<number | null>(null);
  const [importingPlatformId, setImportingPlatformId] = useState<number | null>(null);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<number | null>(null);
  const importFileInputRef = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefreshSession = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const handleAuthError = (errorMsg: string) => {
    if (errorMsg.includes('Could not validate credentials') || errorMsg.includes('401')) {
      showToast('error', 'Tu sesión ha expirado. Redirigiendo...');
      setTimeout(() => handleRefreshSession(), 2000);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [articlesData, platformsData] = await Promise.all([
          inventoryService.getArticles(),
          inventoryService.getPlatforms(),
        ]);
        setArticles(articlesData);
        setPlatforms(platformsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching articles');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleAddArticle = async (platformId: number) => {
    if (!newArticleCode.trim() || !newArticleName.trim()) {
      showToast('error', 'Por favor completa todos los campos');
      return;
    }

    const codeNum = parseInt(newArticleCode);
    if (isNaN(codeNum)) {
      showToast('error', 'El código de artículo debe ser un número');
      return;
    }

    if (!token) {
      showToast('error', 'No autenticado');
      return;
    }

    setIsSaving(true);
    try {
      const newArticle = await inventoryService.createArticle(
        {
          article_code: codeNum,
          article_name: newArticleName,
          platform_id: platformId,
        },
        token
      );
      setArticles([...articles, newArticle]);
      setNewArticleCode('');
      setNewArticleName('');
      setAddingArticleToPlat(null);
      showToast('success', 'Artículo creado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear artículo';
      console.error('Error creating article:', err);

      if (errorMsg.includes('Could not validate credentials') || errorMsg.includes('401')) {
        showToast('error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        showToast('error', errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setAddingArticleToPlat(null);
    setNewArticleCode('');
    setNewArticleName('');
  };

  const handleStartEdit = (article: Article) => {
    setEditingArticleCode(article.article_code);
    setEditArticleCode(article.article_code.toString());
    setEditArticleName(article.article_name);
  };

  const handleCancelEdit = () => {
    setEditingArticleCode(null);
    setEditArticleCode('');
    setEditArticleName('');
  };

  const handleSaveEdit = async () => {
    if (!editArticleName.trim()) {
      showToast('error', 'Por favor completa el nombre del artículo');
      return;
    }

    if (!token) {
      showToast('error', 'Tu sesión ha expirado. Por favor, actualiza la página.');
      console.warn('Token is missing. Current token:', token);
      return;
    }

    if (!editingArticleCode) {
      showToast('error', 'Error: Artículo no identificado');
      return;
    }

    setIsSaving(true);
    try {
      const article = articles.find((a: Article) => a.article_code === editingArticleCode);
      if (!article) {
        showToast('error', 'Artículo no encontrado');
        return;
      }

      console.log('Updating article:', {
        code: editingArticleCode,
        name: editArticleName,
        platformId: article.platform_id,
        tokenPresent: !!token,
      });

      const updatedArticle = await inventoryService.updateArticle(
        editingArticleCode,
        {
          article_code: editingArticleCode,
          article_name: editArticleName,
          platform_id: article.platform_id,
        },
        token
      );

      if (!updatedArticle) {
        showToast('error', 'Error: No se recibió respuesta del servidor');
        return;
      }

      setArticles(articles.map((a: Article) => (a.article_code === editingArticleCode ? updatedArticle : a)));
      setEditingArticleCode(null);
      setEditArticleCode('');
      setEditArticleName('');
      showToast('success', 'Artículo actualizado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar artículo';
      console.error('Error updating article:', err);
      if (errorMsg.includes('401') || errorMsg.includes('validate credentials')) {
        showToast('error', 'Tu sesión ha expirado. Por favor, actualiza la página.');
      } else {
        showToast('error', errorMsg);
      }
    } finally {
      setIsSaving(false);
      setEditingArticleCode(null);
      setEditArticleCode('');
      setEditArticleName('');
    }
  };

  const handleDeleteArticle = async () => {
    if (!token || !deletingArticleCode) {
      showToast('error', 'Error: No autenticado');
      return;
    }

    setIsSaving(true);
    try {
      await inventoryService.deleteArticle(deletingArticleCode, token);
      setArticles(articles.filter(a => a.article_code !== deletingArticleCode));
      setDeletingArticleCode(null);
      showToast('success', 'Artículo eliminado exitosamente');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar artículo';
      console.error('Error deleting article:', err);

      if (errorMsg.includes('Could not validate credentials') || errorMsg.includes('401')) {
        handleAuthError(errorMsg);
      } else {
        showToast('error', errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportArticlesClick = (platformId: number) => {
    if (importFileInputRef.current[platformId]) {
      importFileInputRef.current[platformId]?.click();
    }
  };

  const handleImportFileChange = async (e: any, platformId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('error', 'Por favor selecciona un archivo CSV');
      e.target.value = '';
      return;
    }

    if (!token) {
      showToast('error', 'No autenticado');
      return;
    }

    setImportingPlatformId(platformId);
    setIsSaving(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line: string) => line.trim());

      if (lines.length === 0) {
        showToast('error', 'El archivo CSV está vacío');
        return;
      }

      const importedArticles: Omit<Article, 'created_at'>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted fields)
        const fields: string[] = [];
        let currentField = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            fields.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }
        fields.push(currentField);

        // Assuming CSV format: article_code,article_name
        const codeStr = fields[0]?.trim().replace(/"/g, '');
        const name = fields[1]?.trim().replace(/"/g, '');

        if (!codeStr || !name) continue;

        const code = parseInt(codeStr);
        if (isNaN(code)) {
          console.warn(`Fila ${i + 1}: Código inválido: ${codeStr}`);
          continue;
        }

        importedArticles.push({
          article_code: code,
          article_name: name,
          platform_id: platformId,
        });
      }

      if (importedArticles.length === 0) {
        showToast('error', 'No se encontraron artículos válidos en el archivo');
        return;
      }

      // Delete existing articles for this platform and import new ones
      const articlesInPlatform = articles.filter((a: Article) => a.platform_id === platformId);
      const codesToDelete = articlesInPlatform.map((a: Article) => a.article_code);

      // Delete old articles
      for (const code of codesToDelete) {
        await inventoryService.deleteArticle(code, token);
      }

      // Import new articles
      const newArticles = await inventoryService.createArticlesBulk(importedArticles, token);

      // Replace articles for this platform
      const otherArticles = articles.filter((a: Article) => a.platform_id !== platformId);
      setArticles([...otherArticles, ...newArticles]);

      showToast('success', `Se importaron ${newArticles.length} artículos exitosamente`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al importar artículos';
      console.error('Error importing articles:', err);

      if (errorMsg.includes('Could not validate credentials') || errorMsg.includes('401')) {
        handleAuthError(errorMsg);
      } else {
        showToast('error', errorMsg);
      }
    } finally {
      setIsSaving(false);
      setImportingPlatformId(null);
      e.target.value = '';
    }
  };

  // Group articles by platform
  const articlesByPlatform = platforms.map((platform) => ({
    platform,
    articles: articles.filter((article) => article.platform_id === platform.id),
  }));

  // Filter articles based on search text
  const filteredArticlesByPlatform = articlesByPlatform
    .map((group) => ({
      ...group,
      articles: group.articles.filter(
        (article) =>
          article.article_name.toLowerCase().includes(searchText.toLowerCase()) ||
          article.article_code.toString().includes(searchText)
      ),
    }))
    .filter((group) => selectedPlatformFilter === null || group.platform.id === selectedPlatformFilter);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Artículos</h1>
          <p className="text-gray-600">Catálogo de artículos por plataforma</p>
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando artículos...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No hay artículos disponibles
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm">Total de Artículos</p>
                <p className="text-3xl font-bold text-blue-600">{articles.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Total de Plataformas</p>
                <p className="text-3xl font-bold text-green-600">{platforms.length}</p>
              </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar artículo por nombre o código..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatformFilter(selectedPlatformFilter === platform.id ? null : platform.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPlatformFilter === platform.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={selectedPlatformFilter === platform.id ? 'Mostrar todas' : `Filtrar por ${platform.platform_name}`}
                  >
                    {platform.platform_name}
                  </button>
                ))}
              </div>
            </div>

            {searchText && filteredArticlesByPlatform.every((group) => group.articles.length === 0) ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                No se encontraron artículos que coincidan con la búsqueda
              </div>
            ) : (
              <div className="space-y-8">
                {filteredArticlesByPlatform.map((group) => (
                  <div key={group.platform.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">{group.platform.platform_name}</h2>
                        <p className="text-blue-100 text-sm">
                          {group.articles.length} artículo{group.articles.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors">
                        <input
                          ref={(el) => {
                            if (el) importFileInputRef.current[group.platform.id] = el;
                          }}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => handleImportFileChange(e, group.platform.id)}
                          disabled={isSaving || importingPlatformId === group.platform.id}
                        />
                        <Upload size={18} />
                        <span className="text-sm">Importar artículos</span>
                      </label>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 flex-1">
                              Código de Artículo
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 flex-1">
                              Nombre del Artículo
                            </th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 w-20">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.articles.map((article) =>
                            editingArticleCode === article.article_code ? (
                              <tr key={article.article_code} className="border-b bg-yellow-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-mono text-gray-900 font-semibold bg-gray-100 px-2 py-1 rounded">
                                    {editArticleCode}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    value={editArticleName}
                                    onChange={(e) => setEditArticleName(e.target.value)}
                                    placeholder="Nombre del artículo..."
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    disabled={isSaving}
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={handleSaveEdit}
                                      disabled={isSaving}
                                      title="Guardar"
                                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white p-2 rounded text-xs transition-colors"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={isSaving}
                                      title="Cancelar"
                                      className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 p-2 rounded text-xs transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={article.article_code} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-mono text-gray-900 font-semibold">
                                  {article.article_code}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{article.article_name}</td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleStartEdit(article)}
                                      disabled={isSaving}
                                      title="Editar"
                                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white p-2 rounded text-xs transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => setDeletingArticleCode(article.article_code)}
                                      disabled={isSaving}
                                      title="Eliminar"
                                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white p-2 rounded text-xs transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                          {addingArticleToPlat === group.platform.id ? (
                            <tr className="border-b bg-blue-50">
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  value={newArticleCode}
                                  onChange={(e) => setNewArticleCode(e.target.value)}
                                  placeholder="Código..."
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={newArticleName}
                                  onChange={(e) => setNewArticleName(e.target.value)}
                                  placeholder="Nombre del artículo..."
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={isSaving}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleAddArticle(group.platform.id)}
                                    disabled={isSaving}
                                    title="Guardar"
                                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white p-2 rounded text-xs transition-colors"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancelAdd}
                                    disabled={isSaving}
                                    title="Cancelar"
                                    className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 p-2 rounded text-xs transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                          <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                            <td colSpan={3} className="px-6 py-3">
                              {addingArticleToPlat === group.platform.id ? null : (
                                <button
                                  onClick={() => setAddingArticleToPlat(group.platform.id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 w-full md:w-auto"
                                >
                                  <Plus size={18} />
                                  Añadir artículo
                                </button>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {deletingArticleCode !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-lg font-bold mb-2 text-gray-900">Confirmar eliminación</h2>
              <p className="text-gray-700 mb-2">
                ¿Está seguro de que desea eliminar el artículo con código{' '}
                <span className="font-semibold">{deletingArticleCode}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeletingArticleCode(null)}
                  disabled={isSaving}
                  className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 px-4 py-2 rounded font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteArticle}
                  disabled={isSaving}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                >
                  {isSaving ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
