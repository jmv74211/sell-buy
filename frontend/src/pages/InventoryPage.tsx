import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { inventoryService } from '@/services/inventory';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { t } from '@/utils/translations';

interface InventoryItem {
  article_name: string;
  article_code?: number;
  quantity_available: number;
  estimated_sale_price?: number;
}

interface Article {
  article_code: number;
  article_name: string;
  platform_id: number;
}

export function InventoryPage() {
  const language = useSettingsStore((state) => state.language);
  const { token } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [inventoryData, articlesData] = await Promise.all([
          inventoryService.getAvailableInventory(token),
          inventoryService.getArticles(),
        ]);
        setInventory(inventoryData);
        setArticles(articlesData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
        setError(errorMessage);

        // Check if it's an authentication error
        if (errorMessage.includes('401')) {
          console.error('Session expired. Please log in again.');
        }
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const totalValue = inventory.reduce(
    (sum, item) => sum + ((item.estimated_sale_price || 0) * item.quantity_available),
    0
  );

  const getArticleName = (articleCode?: number): string => {
    if (!articleCode) return '';
    const article = articles.find((a) => a.article_code === articleCode);
    return article ? article.article_name : '';
  };

  // Group inventory items by article_code and sum quantities
  const groupedInventory = inventory.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.article_code === item.article_code);
    if (existingItem) {
      existingItem.quantity_available += item.quantity_available;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as InventoryItem[]);

  const filteredInventory = groupedInventory.filter(item =>
    item.article_name.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.article_code?.toString().includes(searchText))
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventario Disponible</h1>
          <p className="text-gray-600">Artículos disponibles para venta</p>
        </div>

        {loading ? (
          <p className="text-gray-600">Cargando inventario...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error al cargar el inventario</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No hay artículos disponibles en el inventario
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm">Total de Artículos</p>
                <p className="text-3xl font-bold text-blue-600">{filteredInventory.length}</p>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar artículo por nombre o código..."
                className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Resultados: <span className="font-semibold text-gray-900">{filteredInventory.length}</span>
              </span>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre del Artículo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{getArticleName(item.article_code) || item.article_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.article_code ? item.article_code : '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="font-semibold text-blue-600">{item.quantity_available}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-600">
                        No se encontraron artículos que coincidan con la búsqueda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
