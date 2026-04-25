# 🎮 Inventory Management Feature - Setup Guide

## What Was Implemented

Your inventory management feature has been fully implemented! The system now allows you to:

✅ **Manage Platform Ranges** - Define code ranges for gaming platforms (PS1-PS5, Nintendo, etc.)
✅ **Store Article Codes** - Keep a database of 300+ games with unique codes
✅ **Link Purchases to Articles** - Every purchase can be associated with an article code
✅ **Import from CSV** - CSV files with COD_ART column automatically link to articles
✅ **API Endpoints** - RESTful API for managing all inventory data
✅ **Frontend Form** - New article code field in purchase form

## Database Architecture

### Three New/Modified Tables:

```
platform_ranges
├── id (Primary Key)
├── platform_name (Unique)
├── code_range (Unique)
└── created_at

       ↓ (1:N)

articles
├── article_code (Primary Key)
├── article_name
├── platform_id (Foreign Key → platform_ranges.id)
└── created_at

       ↓ (N:1)

purchases (MODIFIED)
├── id (Primary Key)
├── article_code (Foreign Key → articles.article_code, NULLABLE)
├── article_name
├── ... (other fields)
```

## Setup Steps

### 1. **Start Your Docker Environment**
```bash
cd /home/jmv74211/projects/sell-buy
docker-compose up -d
```

### 2. **Populate Initial Data**
```bash
# Enter the backend container
docker-compose exec backend bash

# Run the seed script
python seed_inventory_data.py

# Expected output:
# ✅ Database seeded successfully!
#    - 13 platforms created
#    - 300+ articles created
```

### 3. **Verify Installation**

**Test from outside container:**
```bash
# Get all articles
curl http://localhost:8000/api/inventory/articles | head -20

# Get platforms
curl http://localhost:8000/api/inventory/platforms

# Expected: JSON arrays with article/platform data
```

## Files Created/Modified

### Backend
- ✅ `app/models.py` - Added PlatformRange and Article models, updated Purchase
- ✅ `app/schemas.py` - Added schemas for platforms and articles
- ✅ `app/api/routes/inventory.py` - **NEW** Full inventory API (120+ lines)
- ✅ `app/api/routes/__init__.py` - Registered inventory router
- ✅ `app/api/routes/import_csv.py` - Added article code parsing
- ✅ `main.py` - Registered inventory router
- ✅ `backend/seed_inventory_data.py` - **NEW** Seed script (300+ lines)

### Frontend
- ✅ `src/types/api.ts` - Added PlatformRange and Article interfaces
- ✅ `src/services/inventory.ts` - **NEW** TypeScript service
- ✅ `src/services/inventory.js` - **NEW** JavaScript service
- ✅ `src/pages/PurchasesPage.tsx` - Added article code field to form

### Documentation
- ✅ `INVENTORY_FEATURE.md` - Comprehensive implementation guide
- ✅ `API_INVENTORY_REFERENCE.md` - API endpoints reference

## Using the Feature

### Adding a Purchase with Article Code

1. **Navigate to Purchases page**
2. **Click "Nueva Compra" (New Purchase)**
3. **Fill the form:**
   - Nombre del Artículo: `God Of War Ragnarok`
   - Código del Artículo: `5009` (optional)
   - Fecha: `2026-04-25`
   - Precio: `59.99`
4. **Click "Crear"**

### Importing CSV with Article Codes

Your CSV must include the `COD_ART` column:
```
COD_ART,ARTÍCULO,PRECIO COMPRA,FECHA COMPRA,ESTIMACIÓN VENTA,...
5000,Metal Gear Solid Collection,36,07-02-2026,43,...
5009,God Of War Ragnarok,25,12-02-2026,0,...
```

The system will:
- ✅ Read COD_ART column
- ✅ Match codes to articles in database
- ✅ Link purchases to article codes
- ✅ Keep article names as well

### Available Article Code Ranges

| Platform | Range | Examples |
|----------|-------|----------|
| Playstation 1 | 1000-1007 | 1000: Harry Potter |
| Playstation 2 | 2000-2066 | 2001: NFS Underground |
| Playstation 3 | 3000-3025 | 3022: GTA 5 |
| Playstation 4 | 4000-4052 | 4003: NFS Heat |
| Playstation 5 | 5000-5048 | 5009: God of War Ragnarok |
| Nintendo Switch | 7000-7013 | 7000: Pokemon Let's Go |
| Nintendo DS | 9000-9017 | 9001: Pokemon Pearl |
| Game Boy Advance | 10000-10005 | 10001: Pokemon Sapphire |
| Game Boy | 11000-11005 | 11002: Pokemon Yellow |
| PSP | 12000-12010 | 12001: GTA Liberty City |
| PC | 13000-13009 | 13001: Harry Potter |

## API Examples

### Get All Articles
```bash
curl http://localhost:8000/api/inventory/articles
```

### Get Article by Code
```bash
curl http://localhost:8000/api/inventory/articles/code/5009
```

### Get Articles by Platform
```bash
curl http://localhost:8000/api/inventory/articles/platform/7  # Nintendo Switch
```

### Get All Platforms
```bash
curl http://localhost:8000/api/inventory/platforms
```

## Frontend Service Usage

### TypeScript
```typescript
import { inventoryService } from '@/services/inventory'

// Get all articles
const articles = await inventoryService.getArticles()

// Get Nintendo Switch games
const switchGames = await inventoryService.getArticlesByPlatform(7)

// Get specific game
const game = await inventoryService.getArticleByCode(5009)
```

### JavaScript
```javascript
import * as inventory from '@/services/inventory.js'

const articles = await inventory.getArticles()
```

## Data Structure

### Article Object
```json
{
  "article_code": 5009,
  "article_name": "God Of War Ragnarok",
  "platform_id": 5,
  "created_at": "2026-04-25T10:00:00"
}
```

### Platform Object
```json
{
  "id": 5,
  "platform_name": "Playstation 5",
  "code_range": 5000,
  "created_at": "2026-04-25T10:00:00"
}
```

### Purchase Object (Updated)
```json
{
  "id": 123,
  "user_id": 1,
  "article_name": "God Of War Ragnarok",
  "article_code": 5009,
  "purchase_date": "2026-04-25T10:00:00",
  "amount": 59.99,
  "created_at": "2026-04-25T10:00:00"
}
```

## Key Features

### 1. **Optional Article Codes**
- ✅ Purchases work with OR without article codes
- ✅ Backward compatible with existing data
- ✅ No breaking changes

### 2. **CSV Integration**
- ✅ Reads COD_ART column automatically
- ✅ Creates purchases with article codes
- ✅ Skips articles if code not found

### 3. **Data Integrity**
- ✅ Foreign key constraints
- ✅ Unique article codes
- ✅ Referential integrity

### 4. **RESTful API**
- ✅ Full CRUD operations
- ✅ Admin-only endpoints (POST/PUT/DELETE)
- ✅ Public read endpoints

## Troubleshooting

### Issue: Seed script fails
**Solution**: Make sure you're inside the backend container
```bash
docker-compose exec backend python seed_inventory_data.py
```

### Issue: Article code field not appearing in form
**Solution**: Verify frontend rebuild:
```bash
docker-compose down
docker-compose up -d --build
```

### Issue: CSV import not reading COD_ART
**Solution**: Ensure CSV has proper column header: `COD_ART`

## Next Steps / Future Enhancements

1. **Article Selection Dropdown**
   - Auto-complete based on platform
   - Search by article name

2. **Inventory Dashboard**
   - Show articles by platform
   - Track inventory levels
   - Filter by article code

3. **Analytics**
   - Most purchased articles
   - Platform distribution
   - Profit by article code

4. **Bulk Operations**
   - Bulk add articles
   - Bulk import articles
   - Batch price updates

5. **Filtering**
   - Filter purchases by article code
   - Filter by platform range
   - Search by code range

## Support

For API documentation: See `API_INVENTORY_REFERENCE.md`
For feature documentation: See `INVENTORY_FEATURE.md`

---

**Implementation Date**: April 25, 2026
**Status**: ✅ Complete and Ready to Use
**Total Articles**: 300+
**Total Platforms**: 13
**Total Code Ranges**: 1000-13009

¡Listo! Your inventory management system is now ready to use! 🎮
