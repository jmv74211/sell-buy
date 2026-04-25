# Quick Start - Inventory Feature Examples

## 1. Create a Purchase with Article Code

### Via Frontend UI
```
1. Open Purchases page
2. Click "Nueva Compra"
3. Form fields:
   - Nombre del Artículo: "God Of War Ragnarok"
   - Código del Artículo: 5009
   - Fecha: 2026-04-25
   - Precio: €59.99
4. Click "Crear"
```

### Via API
```bash
curl -X POST http://localhost:8000/api/purchases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_name": "God Of War Ragnarok",
    "article_code": 5009,
    "purchase_date": "2026-04-25",
    "amount": 59.99
  }'
```

**Response**:
```json
{
  "id": 1,
  "user_id": 1,
  "article_name": "God Of War Ragnarok",
  "article_code": 5009,
  "purchase_date": "2026-04-25T00:00:00",
  "amount": 59.99,
  "created_at": "2026-04-25T10:00:00"
}
```

---

## 2. Import CSV with Article Codes

### Your CSV File Format
```csv
COD_ART,ARTÍCULO,PRECIO COMPRA,ESTIMACIÓN VENTA,REVENDIDO POR,GANANCIA ESTIMADA,GANANCIA NETA,FECHA COMPRA,FECHA VENTA
5000,Metal Gear Solid Collection,36,43,43,7,7,07-02-2026,24-02-2026
7009,Pokemon Leyendas ZA,35,40,40,5,5,11-02-2026,10-04-2026
5006,GTA V ps5 precintado,11.2,18,18,6.8,6.8,09-02-2026,14-04-2026
```

### Steps
1. Export CSV from your spreadsheet with COD_ART column
2. Go to Purchases page
3. Use import function (if available) or upload CSV
4. System automatically:
   - Reads COD_ART values
   - Matches them to articles in database
   - Links purchases to correct articles

---

## 3. Query Articles by Platform

### Get PS5 Games Only
```bash
# First, get platform ID for PS5
curl http://localhost:8000/api/inventory/platforms | grep -A2 "Playstation 5"

# Response shows platform_id: 5

# Then get all PS5 articles
curl http://localhost:8000/api/inventory/articles/platform/5
```

**Response**:
```json
[
  {
    "article_code": 5000,
    "article_name": "Metal Gear Solid Collection",
    "platform_id": 5,
    "created_at": "2026-04-25T10:00:00"
  },
  {
    "article_code": 5001,
    "article_name": "Need For Speed Unbound",
    "platform_id": 5,
    "created_at": "2026-04-25T10:00:00"
  },
  ...
]
```

### Get Nintendo Switch Games
```bash
# Platform 7 = Nintendo Switch
curl http://localhost:8000/api/inventory/articles/platform/7
```

---

## 4. Look Up an Article by Code

### Find Specific Game
```bash
# Get details for article code 5009
curl http://localhost:8000/api/inventory/articles/code/5009
```

**Response**:
```json
{
  "article_code": 5009,
  "article_name": "God Of War Ragnarok",
  "platform_id": 5,
  "created_at": "2026-04-25T10:00:00"
}
```

---

## 5. Frontend - Load Articles for Dropdown

### TypeScript Component Example
```typescript
import { inventoryService } from '@/services/inventory'
import { Article } from '@/types/api'

export function ArticleSelector() {
  const [articles, setArticles] = React.useState<Article[]>([])

  React.useEffect(() => {
    // Load all articles
    inventoryService.getArticles().then(setArticles)
  }, [])

  return (
    <select>
      <option value="">Seleccionar artículo...</option>
      {articles.map(article => (
        <option key={article.article_code} value={article.article_code}>
          [{article.article_code}] {article.article_name}
        </option>
      ))}
    </select>
  )
}
```

---

## 6. Create Multiple Articles (Bulk)

### Add New Games to Database
```bash
curl -X POST http://localhost:8000/api/inventory/articles/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "article_code": 5050,
      "article_name": "New Game 1",
      "platform_id": 5
    },
    {
      "article_code": 5051,
      "article_name": "New Game 2",
      "platform_id": 5
    }
  ]'
```

---

## 7. Edit Purchase to Add Article Code

### Frontend
```
1. Go to Purchases
2. Click Edit icon on a purchase
3. Now you can add or edit the Código del Artículo
4. Click "Actualizar"
```

### API
```bash
curl -X PUT http://localhost:8000/api/purchases/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_name": "God Of War Ragnarok",
    "article_code": 5009,
    "purchase_date": "2026-04-25",
    "amount": 59.99
  }'
```

---

## 8. Platform Reference - Complete List

### All 13 Platforms
```
Platform ID | Platform Name        | Code Range | Example Articles
1           | Playstation 1        | 1000       | 1000: Harry Potter
2           | Playstation 2        | 2000       | 2001: NFS Underground
3           | Playstation 3        | 3000       | 3022: GTA 5
4           | Playstation 4        | 4000       | 4003: NFS Heat
5           | Playstation 5        | 5000       | 5009: God of War Ragnarok
6           | Playstation 6        | 6000       | (Reserved)
7           | Nintendo Switch      | 7000       | 7009: Pokemon Legends ZA
8           | Nintendo Switch 2    | 8000       | (Reserved)
9           | Nintendo DS          | 9000       | 9001: Pokemon Pearl
10          | Game Boy Advance     | 10000      | 10001: Pokemon Sapphire
11          | Game Boy             | 11000      | 11002: Pokemon Yellow
12          | PSP                  | 12000      | 12001: GTA Liberty City
13          | PC                   | 13000      | 13001: Harry Potter
```

---

## 9. Common Article Codes

### Most Popular (For Reference)
```
PS5 (5000-5048):
  5000 → Metal Gear Solid Collection
  5006 → GTA V ps5
  5009 → God Of War Ragnarok
  5037 → Elden Ring

PS4 (4000-4052):
  4003 → Need For Speed Heat
  4015 → Red Dead Redemption 2
  4018 → GTA V
  4029 → Tekken 7

Nintendo Switch (7000-7013):
  7000 → Pokemon Let's Go Pikachu
  7004 → Pokemon Espada
  7008 → Pokemon Escarlata
  7009 → Pokemon Leyendas ZA
```

---

## 10. Error Handling Examples

### Article Code Not Found
```json
{
  "detail": "Article not found"
}
```
**Solution**: Check the article code exists in the database first

### Invalid Article Code Format
When importing CSV, if COD_ART value is invalid:
- System silently skips the article code (sets to null)
- Purchase is still created with article_name
- No error is raised

### Duplicate Article Code
```json
{
  "detail": "Article code already exists"
}
```
**Solution**: Choose a different article code

---

## Summary - Feature Capabilities

| Capability | Available | Notes |
|-----------|-----------|-------|
| Add purchase with article code | ✅ Yes | Optional field |
| Add purchase without code | ✅ Yes | Backward compatible |
| Edit article code | ✅ Yes | When editing purchase |
| Delete article code | ✅ Yes | Set to null when editing |
| Search by code | ⏳ Future | Can filter manually |
| Auto-complete articles | ⏳ Future | Can add dropdown |
| Bulk import articles | ✅ Yes | Via API |
| Import CSV with codes | ✅ Yes | COD_ART column |
| Filter by platform | ⏳ Future | Get via API now |

---

## Testing Checklist

- [ ] Create purchase WITH article code
- [ ] Create purchase WITHOUT article code
- [ ] Edit purchase to add article code
- [ ] Edit purchase to remove article code
- [ ] API: GET /api/inventory/articles
- [ ] API: GET /api/inventory/articles/code/5009
- [ ] API: GET /api/inventory/articles/platform/5
- [ ] API: GET /api/inventory/platforms
- [ ] Import CSV with COD_ART column
- [ ] Verify purchase table shows article codes
- [ ] Query specific article
- [ ] List platforms

---

Ready to use! Let me know if you need anything else! 🎮
