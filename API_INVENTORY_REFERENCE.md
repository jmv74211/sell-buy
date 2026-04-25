# Inventory Management API Reference

## Base URL
```
http://localhost:8000/api/inventory
```

## Platform Ranges

### Get All Platforms
```http
GET /platforms
```

**Response**:
```json
[
  {
    "id": 1,
    "platform_name": "Playstation 1",
    "code_range": 1000,
    "created_at": "2026-04-25T10:00:00"
  },
  ...
]
```

### Get Platform by ID
```http
GET /platforms/{id}
```

**Parameters**:
- `id` (integer): Platform ID

**Response**:
```json
{
  "id": 1,
  "platform_name": "Playstation 1",
  "code_range": 1000,
  "created_at": "2026-04-25T10:00:00"
}
```

### Create Platform (Admin Only)
```http
POST /platforms
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "platform_name": "Playstation 7",
  "code_range": 7000
}
```

**Response**: 201 Created
```json
{
  "id": 14,
  "platform_name": "Playstation 7",
  "code_range": 7000,
  "created_at": "2026-04-25T10:00:00"
}
```

---

## Articles

### Get All Articles
```http
GET /articles
```

**Response**:
```json
[
  {
    "article_code": 1000,
    "article_name": "Harry Potter Y La Piedra Filosofal",
    "platform_id": 1,
    "created_at": "2026-04-25T10:00:00"
  },
  ...
]
```

### Get Article by Code
```http
GET /articles/code/{code}
```

**Parameters**:
- `code` (integer): Article code

**Response**:
```json
{
  "article_code": 5009,
  "article_name": "God Of War Ragnarok",
  "platform_id": 5,
  "created_at": "2026-04-25T10:00:00"
}
```

### Get Articles by Platform
```http
GET /articles/platform/{platform_id}
```

**Parameters**:
- `platform_id` (integer): Platform ID

**Response**: Array of articles for the platform
```json
[
  {
    "article_code": 7000,
    "article_name": "Pokémon Let's Go Pikachu",
    "platform_id": 7,
    "created_at": "2026-04-25T10:00:00"
  },
  {
    "article_code": 7001,
    "article_name": "Pokémon Let's Go Evee",
    "platform_id": 7,
    "created_at": "2026-04-25T10:00:00"
  },
  ...
]
```

### Create Article (Admin Only)
```http
POST /articles
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "article_code": 5049,
  "article_name": "New Game Title",
  "platform_id": 5
}
```

**Response**: 201 Created
```json
{
  "article_code": 5049,
  "article_name": "New Game Title",
  "platform_id": 5,
  "created_at": "2026-04-25T10:00:00"
}
```

### Create Multiple Articles (Bulk) (Admin Only)
```http
POST /articles/bulk
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
[
  {
    "article_code": 5050,
    "article_name": "Game Title 1",
    "platform_id": 5
  },
  {
    "article_code": 5051,
    "article_name": "Game Title 2",
    "platform_id": 5
  }
]
```

**Response**: 201 Created
```json
[
  {
    "article_code": 5050,
    "article_name": "Game Title 1",
    "platform_id": 5,
    "created_at": "2026-04-25T10:00:00"
  },
  {
    "article_code": 5051,
    "article_name": "Game Title 2",
    "platform_id": 5,
    "created_at": "2026-04-25T10:00:00"
  }
]
```

### Update Article (Admin Only)
```http
PUT /articles/{code}
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters**:
- `code` (integer): Article code

**Request Body**:
```json
{
  "article_code": 5050,
  "article_name": "Updated Game Title",
  "platform_id": 5
}
```

**Response**: 200 OK
```json
{
  "article_code": 5050,
  "article_name": "Updated Game Title",
  "platform_id": 5,
  "created_at": "2026-04-25T10:00:00"
}
```

### Delete Article (Admin Only)
```http
DELETE /articles/{code}
Authorization: Bearer {token}
```

**Parameters**:
- `code` (integer): Article code

**Response**: 200 OK
```json
{
  "detail": "Article deleted"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Platform already exists"
}
```

### 404 Not Found
```json
{
  "detail": "Article not found"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

---

## Frontend Integration Examples

### TypeScript Service
```typescript
import { inventoryService } from '@/services/inventory'

// Get all articles
const articles = await inventoryService.getArticles()

// Get articles for a platform
const switchGames = await inventoryService.getArticlesByPlatform(7)

// Get specific article
const game = await inventoryService.getArticleByCode(5009)
```

### JavaScript Functions
```javascript
import * as inventory from '@/services/inventory.js'

// Get all articles
const articles = await inventory.getArticles()

// Get specific article
const game = await inventory.getArticleByCode(5000)
```

---

## Platform Code Ranges Reference

| Platform | Code Range | Count |
|----------|-----------|-------|
| Playstation 1 | 1000-1007 | 8 |
| Playstation 2 | 2000-2066 | 67 |
| Playstation 3 | 3000-3025 | 26 |
| Playstation 4 | 4000-4052 | 53 |
| Playstation 5 | 5000-5048 | 49 |
| Playstation 6 | 6000 | (Reserved) |
| Nintendo Switch | 7000-7013 | 14 |
| Nintendo Switch 2 | 8000 | (Reserved) |
| Nintendo DS | 9000-9017 | 18 |
| Game Boy Advance | 10000-10005 | 6 |
| Game Boy | 11000-11005 | 6 |
| PSP | 12000-12010 | 11 |
| PC | 13000-13009 | 10 |

**Total Articles**: 300+
