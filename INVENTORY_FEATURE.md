# Inventory Management Feature - Implementation Summary

## Overview
This document summarizes the implementation of the inventory management functionality for the SellBuy application. The feature allows users to identify and manage their article inventory through platform ranges and article codes.

## Database Schema Changes

### New Tables

#### 1. `platform_ranges` Table
Maps platform/console names to article code ranges.

| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | PRIMARY KEY |
| platform_name | String(100) | UNIQUE, NOT NULL |
| code_range | Integer | UNIQUE, NOT NULL |
| created_at | DateTime | DEFAULT NOW() |

**Data**:
- Playstation 1-5 and 6 (1000-6000)
- Nintendo Switch and Switch 2 (7000-8000)
- Nintendo DS (9000)
- Game Boy Advance (10000)
- Game Boy (11000)
- PSP (12000)
- PC (13000)

#### 2. `articles` Table
Maps article codes to article names with platform relationships.

| Column | Type | Constraints |
|--------|------|-------------|
| article_code | Integer | PRIMARY KEY |
| article_name | String(255) | NOT NULL |
| platform_id | Integer | FOREIGN KEY → platform_ranges.id |
| created_at | DateTime | DEFAULT NOW() |

**Data**: 300+ articles across all platforms

#### 3. `purchases` Table (Modified)
Added optional article_code field with foreign key relationship.

| Column (New) | Type | Constraints |
|--------|------|-------------|
| article_code | Integer | FOREIGN KEY → articles.article_code, NULLABLE |

## Backend Changes

### 1. Models (`app/models.py`)
- **PlatformRange**: New model for managing platform code ranges
- **Article**: New model for storing article codes and names
- **Purchase**: Updated to include optional `article_code` foreign key with relationship to Article

### 2. Schemas (`app/schemas.py`)
- **PlatformRangeBase/Create/Response**: Schemas for platform management
- **ArticleBase/Create/Response**: Schemas for article management
- **PurchaseBase/Create/Response**: Updated to include optional `article_code` field

### 3. API Routes (`app/api/routes/inventory.py`) - NEW FILE
New router with endpoints for inventory management:

#### Platform Ranges Endpoints
- `GET /api/inventory/platforms` - Get all platforms
- `GET /api/inventory/platforms/{id}` - Get specific platform
- `POST /api/inventory/platforms` - Create platform (Admin only)

#### Articles Endpoints
- `GET /api/inventory/articles` - Get all articles
- `GET /api/inventory/articles/code/{code}` - Get article by code
- `GET /api/inventory/articles/platform/{platform_id}` - Get articles by platform
- `POST /api/inventory/articles` - Create article (Admin only)
- `POST /api/inventory/articles/bulk` - Create multiple articles (Admin only)
- `PUT /api/inventory/articles/{code}` - Update article (Admin only)
- `DELETE /api/inventory/articles/{code}` - Delete article (Admin only)

### 4. CSV Import Enhancement (`app/api/routes/import_csv.py`)
- Updated to parse `COD_ART` column from CSV
- Automatically links articles to purchases via `article_code`
- Validates article codes exist in database before linking

### 5. Database Initialization (`backend/seed_inventory_data.py`) - NEW FILE
Python script to populate platform ranges and articles data:
- Creates all 13 platform ranges
- Creates 300+ articles across all platforms
- Run with: `python seed_inventory_data.py`

## Frontend Changes

### 1. Types (`src/types/api.ts`)
- **PlatformRange**: Interface for platform data
- **Article**: Interface for article data
- **Purchase**: Updated to include optional `article_code` field

### 2. Services
- **`src/services/inventory.ts` (NEW)**: TypeScript service for inventory API
- **`src/services/inventory.js` (NEW)**: JavaScript version of inventory service

Functions include:
- Platform management (getPlatforms, createPlatform)
- Article management (getArticles, getArticleByCode, getArticlesByPlatform, createArticle, updateArticle, deleteArticle)

### 3. Pages (`src/pages/PurchasesPage.tsx`)
Updated purchase form to include:
- New form field for article code input
- State management for `article_code` (optional)
- Display of article code in form and table
- Submission of article code with purchase data

**Form Changes**:
- Added "Código del Artículo" (Article Code) input field
- Position: Between article name and price fields
- Type: Number input
- Placeholder: "Ej: 5000, 7001"
- Optional field (can be left blank)

## Data Flow

### Reading Article Data
1. Frontend calls `inventoryService.getArticles()`
2. Backend returns list of all articles with codes and platform info
3. User can reference article codes when creating purchases

### Creating a Purchase with Article Code
1. User fills in purchase form including optional article code
2. Frontend validates article code format
3. Backend receives purchase data with article_code
4. Database creates purchase record with article_code FK
5. System maintains referential integrity through constraints

### Importing Articles from CSV
1. CSV must include `COD_ART` column with article codes
2. Import service matches codes to existing articles database
3. If article code not found in database, field is left null
4. Valid article codes are linked to purchases

## Usage Guide

### For Admin Users (Setting Up Data)

1. **Initialize Database**:
   ```bash
   cd backend
   python seed_inventory_data.py
   ```

2. **Access Platform and Article Management**:
   - Use API endpoints directly or create admin UI
   - Manage platforms: `/api/inventory/platforms`
   - Manage articles: `/api/inventory/articles`

### For Regular Users (Creating Purchases)

1. **Add Purchase with Article Code**:
   - Navigate to Purchases page
   - Click "Nueva Compra" (New Purchase)
   - Fill in article name
   - (Optional) Enter article code (e.g., 5000, 7001)
   - Enter purchase date and price
   - Click "Crear" (Create)

2. **Import Data from CSV**:
   - CSV must include columns: COD_ART, ARTÍCULO, FECHA COMPRA, PRECIO COMPRA, etc.
   - System automatically matches article codes
   - Article codes are preserved in imported purchases

3. **Search and Filter**:
   - Use existing search functionality to find purchases
   - Can search by article name or ID
   - Article codes are available in data but can be used for filtering in future updates

## Database Constraints and Referential Integrity

- `purchases.article_code` → `articles.article_code` (NULLABLE)
- `articles.platform_id` → `platform_ranges.id` (NOT NULL)
- Deleting articles cascades to related purchases (if implemented)
- Deleting platforms will fail if articles exist (referential integrity)

## Notes

### Backward Compatibility
- Article code is optional on purchases
- Existing purchases without codes continue to work
- System doesn't require article code to create purchases

### Data Validation
- Article codes are integers matching the code ranges
- Article names are limited to 255 characters
- Platform names are unique and limited to 100 characters

### Future Enhancements
1. Auto-complete for article codes based on platform selection
2. Article code search and filtering
3. Inventory analytics by platform and article code
4. Article code validation and suggestions in forms
5. Bulk article management UI
6. Export with article codes included

## Testing Checklist

- [ ] Verify tables created successfully in database
- [ ] Run seed script to populate data
- [ ] Test platform range CRUD endpoints
- [ ] Test article CRUD endpoints
- [ ] Create purchase with article code
- [ ] Create purchase without article code
- [ ] Edit purchase to add/remove article code
- [ ] Import CSV with COD_ART column
- [ ] Verify article codes persisted after CSV import
- [ ] Test foreign key constraints
- [ ] Verify optional article_code field accepts null values
- [ ] Test search and filter functionality
- [ ] Verify data display in purchase table
