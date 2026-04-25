const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Platform ranges
export const getPlatforms = async () => {
  const response = await fetch(`${baseUrl}/api/inventory/platforms`)
  if (!response.ok) throw new Error('Failed to fetch platforms')
  return response.json()
}

export const getPlatformById = async (id) => {
  const response = await fetch(`${baseUrl}/api/inventory/platforms/${id}`)
  if (!response.ok) throw new Error('Failed to fetch platform')
  return response.json()
}

export const createPlatform = async (platform, token) => {
  const response = await fetch(`${baseUrl}/api/inventory/platforms`, {
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
export const getArticles = async () => {
  const response = await fetch(`${baseUrl}/api/inventory/articles`)
  if (!response.ok) throw new Error('Failed to fetch articles')
  return response.json()
}

export const getArticleByCode = async (code) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles/code/${code}`)
  if (!response.ok) throw new Error('Failed to fetch article')
  return response.json()
}

export const getArticlesByPlatform = async (platformId) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles/platform/${platformId}`)
  if (!response.ok) throw new Error('Failed to fetch articles')
  return response.json()
}

export const createArticle = async (article, token) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles`, {
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

export const createArticlesBulk = async (articles, token) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles/bulk`, {
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

export const updateArticle = async (code, article, token) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles/${code}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(article),
  })
  if (!response.ok) throw new Error('Failed to update article')
  return response.json()
}

export const deleteArticle = async (code, token) => {
  const response = await fetch(`${baseUrl}/api/inventory/articles/${code}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error('Failed to delete article')
  return response.json()
}
