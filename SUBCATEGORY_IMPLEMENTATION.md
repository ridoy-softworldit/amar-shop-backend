# Subcategory System Implementation

## Overview
Full CRUD subcategory system with 3 image uploads for banner sliders, integrated with existing category and product systems.

## Changes Made

### 1. New Models
- **Subcategory Model** (`src/models/Subcategory.ts`)
  - Fields: name, slug, categoryId (ref to Category), images (max 3), description, status
  - Indexes on slug and categoryId for performance

### 2. Updated Models
- **Category Model** (`src/models/Category.ts`)
  - Changed `image` (single) → `images` (array, max 3)
  
- **Product Model** (`src/models/Product.ts`)
  - Added `subcategorySlug` field with index

### 3. New Routes

#### Admin Routes (`/api/v1/admin/subcategories`)
- `POST /subcategories` - Create subcategory
- `GET /subcategories` - List all (optional filter: ?categoryId=xxx)
- `GET /subcategories/:id` - Get single by ID
- `PATCH /subcategories/:id` - Update subcategory
- `DELETE /subcategories/:id` - Delete subcategory

#### Public Routes (`/api/v1/subcategories`)
- `GET /subcategories` - List active (optional filter: ?categoryId=xxx)
- `GET /subcategories/:slug` - Get by slug

### 4. Updated Routes

#### Admin Category Routes
- Updated to support `images` array (max 3)
- Added `GET /categories` endpoint

#### Admin Product Routes
- Added `subcategorySlug` to create/update DTOs

#### Public Product Routes
- Added `?subcategory=xxx` query filter
- Returns `subcategorySlug` in response

## API Usage Examples

### Create Category with Images
```json
POST /api/v1/admin/categories
{
  "name": "Electronics",
  "slug": "electronics",
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg",
    "https://cloudinary.com/image3.jpg"
  ],
  "status": "ACTIVE"
}
```

### Create Subcategory
```json
POST /api/v1/admin/subcategories
{
  "name": "Smartphones",
  "slug": "smartphones",
  "categoryId": "507f1f77bcf86cd799439011",
  "images": [
    "https://cloudinary.com/banner1.jpg",
    "https://cloudinary.com/banner2.jpg",
    "https://cloudinary.com/banner3.jpg"
  ],
  "status": "ACTIVE"
}
```

### Get Subcategories by Category
```
GET /api/v1/subcategories?categoryId=507f1f77bcf86cd799439011
```

### Create Product with Subcategory
```json
POST /api/v1/admin/products
{
  "title": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "price": 999,
  "categorySlug": "electronics",
  "subcategorySlug": "smartphones",
  "images": ["url1", "url2"],
  "stock": 50
}
```

### Filter Products by Subcategory
```
GET /api/v1/products?subcategory=smartphones
```

## Frontend Integration

### Banner Slider Implementation
Each category and subcategory now has 3 images that can be used for banner sliders:

```javascript
// Fetch category with images
const category = await fetch('/api/v1/categories/electronics');
// category.data.images = ["url1", "url2", "url3"]

// Fetch subcategories for a category
const subcategories = await fetch('/api/v1/subcategories?categoryId=xxx');
// Each subcategory has .images array with up to 3 URLs

// Use in slider component
<Slider>
  {category.images.map(img => <Slide key={img} src={img} />)}
</Slider>
```

### Product Creation Flow
1. Select Category → Get subcategories for that category
2. Select Subcategory (optional)
3. Upload product images
4. Submit with both `categorySlug` and `subcategorySlug`

## Database Indexes
- Subcategory: `slug` (unique), `categoryId + status`
- Product: Added `subcategorySlug` index
- Optimized for filtering products by category and/or subcategory

## Notes
- All image fields accept Cloudinary URLs
- Maximum 3 images per category/subcategory for banner sliders
- Subcategory is optional for products (backward compatible)
- Status field controls visibility (ACTIVE/HIDDEN)
- All routes require admin authentication except public GET endpoints
