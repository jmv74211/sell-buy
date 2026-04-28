import type { Article, PlatformRange } from '@/types/api'

class InventoryService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Platform ranges
  async getPlatforms(): Promise<PlatformRange[]> {
    const response = await fetch(`${this.baseUrl}/api/inventory/platforms`)
    if (!response.ok) throw new Error('Failed to fetch platforms')
    return response.json()
  }

  async getPlatformById(id: number): Promise<PlatformRange> {
    const response = await fetch(`${this.baseUrl}/api/inventory/platforms/${id}`)
    if (!response.ok) throw new Error('Failed to fetch platform')
    return response.json()
  }

  async createPlatform(platform: Omit<PlatformRange, 'id' | 'created_at'>, token: string) {
    const response = await fetch(`${this.baseUrl}/api/inventory/platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(platform),
    })
    if (!response.ok) throw new Error('Failed to create platform')
    return response.json()
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles`)
    if (!response.ok) throw new Error('Failed to fetch articles')
    return response.json()
  }

  async getArticleByCode(code: number): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles/code/${code}`)
    if (!response.ok) throw new Error('Failed to fetch article')
    return response.json()
  }

  async getArticlesByPlatform(platformId: number): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles/platform/${platformId}`)
    if (!response.ok) throw new Error('Failed to fetch articles')
    return response.json()
  }

  async createArticle(article: Omit<Article, 'created_at'>, token: string) {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(article),
    })
    if (!response.ok) throw new Error('Failed to create article')
    return response.json()
  }

  async createArticlesBulk(articles: Omit<Article, 'created_at'>[], token: string): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(articles),
    })
    if (!response.ok) throw new Error('Failed to create articles')
    return response.json()
  }

  async updateArticle(code: number, article: Omit<Article, 'created_at'>, token: string) {
    console.log('updateArticle called with:', { code, article, tokenLength: token?.length });

    const url = `${this.baseUrl}/api/inventory/articles/${code}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    console.log('Request URL:', url);
    console.log('Headers:', { 'Content-Type': headers['Content-Type'], 'Authorization': `Bearer ${token?.substring(0, 20)}...` });

    const response = await fetch(url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(article),
    })

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update article' }))
      console.error('Error response:', error);
      throw new Error(error.detail || 'Failed to update article')
    }
    return response.json()
  }

  async deleteArticle(code: number, token: string) {
    const response = await fetch(`${this.baseUrl}/api/inventory/articles/${code}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to delete article')
    return response.json()
  }

  // Available inventory for sale
  async getAvailableInventory(token: string) {
    const response = await fetch(`${this.baseUrl}/api/inventory-view/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch available inventory')
    return response.json()
  }
}

export const inventoryService = new InventoryService()
