# Admin Panel Implementation Prompt

## System Overview
Backend now supports:
- **Categories** with 3 banner images each
- **Subcategories** with 3 banner images each (linked to parent category)
- **Products** can belong to both category and subcategory

---

## 🎯 ADMIN PANEL REQUIREMENTS

### 1. CATEGORY MANAGEMENT PAGE

#### Features Needed:
- **List View**: Display all categories with thumbnail of first image
- **Create Form**:
  - Name (text input)
  - Slug (text input, auto-generate from name)
  - Title (optional text input)
  - **3 Image Upload Fields** (for banner slider)
  - Description (textarea)
  - Status (dropdown: ACTIVE/HIDDEN)
  
- **Edit Form**: Same as create, pre-filled with existing data
- **Delete**: Confirm before deletion

#### API Endpoints:
```
GET    /api/v1/admin/categories          - List all
POST   /api/v1/admin/categories          - Create
PATCH  /api/v1/admin/categories/:id      - Update
DELETE /api/v1/admin/categories/:id      - Delete
```

#### Request Body Example:
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "title": "Shop Electronics",
  "images": [
    "https://res.cloudinary.com/xxx/banner1.jpg",
    "https://res.cloudinary.com/xxx/banner2.jpg",
    "https://res.cloudinary.com/xxx/banner3.jpg"
  ],
  "description": "All electronic items",
  "status": "ACTIVE"
}
```

---

### 2. SUBCATEGORY MANAGEMENT PAGE

#### Features Needed:
- **List View**: 
  - Display all subcategories with parent category name
  - Filter by category dropdown
  
- **Create Form**:
  - **Parent Category** (dropdown - fetch from `/api/v1/admin/categories`)
  - Name (text input)
  - Slug (text input, auto-generate from name)
  - **3 Image Upload Fields** (for banner slider)
  - Description (textarea)
  - Status (dropdown: ACTIVE/HIDDEN)
  
- **Edit Form**: Same as create, pre-filled
- **Delete**: Confirm before deletion

#### API Endpoints:
```
GET    /api/v1/admin/subcategories                    - List all
GET    /api/v1/admin/subcategories?categoryId=xxx     - Filter by category
GET    /api/v1/admin/subcategories/:id                - Get single
POST   /api/v1/admin/subcategories                    - Create
PATCH  /api/v1/admin/subcategories/:id                - Update
DELETE /api/v1/admin/subcategories/:id                - Delete
```

#### Request Body Example:
```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "categoryId": "507f1f77bcf86cd799439011",
  "images": [
    "https://res.cloudinary.com/xxx/sub-banner1.jpg",
    "https://res.cloudinary.com/xxx/sub-banner2.jpg",
    "https://res.cloudinary.com/xxx/sub-banner3.jpg"
  ],
  "description": "Latest smartphones",
  "status": "ACTIVE"
}
```

---

### 3. PRODUCT MANAGEMENT PAGE (UPDATES)

#### Add to Existing Product Form:
- **Category** (dropdown - fetch from `/api/v1/admin/categories`)
- **Subcategory** (dropdown - dynamically load based on selected category)
  - Fetch from: `/api/v1/admin/subcategories?categoryId={selectedCategoryId}`
  - Optional field (can be empty)

#### Updated Request Body:
```json
{
  "title": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "price": 999,
  "categorySlug": "electronics",
  "subcategorySlug": "smartphones",
  "images": ["url1", "url2"],
  "stock": 50,
  "status": "ACTIVE"
}
```

---

## 🖼️ IMAGE UPLOAD IMPLEMENTATION

### Your Project Uses: Client-Side Direct Upload with Signed URLs

### Upload Flow:
1. Get upload signature from backend: `POST /api/v1/uploads`
2. Upload directly to Cloudinary from browser using signature
3. Get back Cloudinary URL from Cloudinary response
4. Store URLs in `images` array field

### Step 1: Get Upload Signature
```javascript
POST /api/v1/uploads
Headers: { Authorization: "Bearer <admin_token>" }

Response:
{
  "ok": true,
  "data": {
    "cloudName": "your-cloud-name",
    "apiKey": "your-api-key",
    "timestamp": 1234567890,
    "signature": "generated-signature",
    "folder": "banners"
  }
}
```

### Step 2: Upload to Cloudinary
```javascript
const uploadToCloudinary = async (file) => {
  // Get signature from your backend
  const sigResponse = await fetch('/api/v1/uploads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const { cloudName, apiKey, timestamp, signature, folder } = sigResponse.data;

  // Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const result = await cloudinaryResponse.json();
  return result.secure_url; // This is the URL to store
};
```

### Step 3: Delete Image (Optional)
```javascript
POST /api/v1/uploads/delete
Headers: { Authorization: "Bearer <admin_token>" }
Body: { "publicId": "banners/image123" }

Response: { "ok": true, "data": {...} }
```

### Complete React Component Example:
```jsx
const ImageUploader = ({ images, setImages, maxImages = 3 }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      // Get signature
      const sigRes = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const { cloudName, apiKey, timestamp, signature, folder } = 
        (await sigRes.json()).data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const result = await uploadRes.json();
      
      // Add URL to images array
      setImages([...images, result.secure_url]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {images.map((url, i) => (
        <div key={i}>
          <img src={url} alt={`Banner ${i+1}`} />
          <button onClick={() => setImages(images.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      {images.length < maxImages && (
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files[0])}
          disabled={uploading}
        />
      )}
    </div>
  );
};
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Category Page:
- [ ] Create category list table with columns: Name, Slug, Images (thumbnail), Status, Actions
- [ ] Add "Create Category" button → opens modal/form
- [ ] Category form with 3 image upload fields
- [ ] Edit button for each category
- [ ] Delete button with confirmation
- [ ] Image preview for uploaded images
- [ ] Slug auto-generation from name

### Subcategory Page:
- [ ] Create subcategory list table with columns: Name, Parent Category, Slug, Images, Status, Actions
- [ ] Category filter dropdown at top
- [ ] Add "Create Subcategory" button → opens modal/form
- [ ] Subcategory form with parent category dropdown + 3 image uploads
- [ ] Edit button for each subcategory
- [ ] Delete button with confirmation
- [ ] Show parent category name in list

### Product Page Updates:
- [ ] Add Category dropdown (fetch from API)
- [ ] Add Subcategory dropdown (dynamic based on category)
- [ ] When category changes, reload subcategory options
- [ ] Display both category and subcategory in product list
- [ ] Allow filtering products by category and subcategory

---

## 🎨 UI/UX RECOMMENDATIONS

### Image Upload Component:
- Show 3 upload boxes side by side
- Display preview after upload
- Allow remove/replace individual images
- Show upload progress
- Label as "Banner Image 1", "Banner Image 2", "Banner Image 3"

### Category/Subcategory Relationship:
- In subcategory form, show category name clearly
- In product form, show hierarchy: "Electronics > Smartphones"
- Breadcrumb navigation: Categories → Subcategories → Products

### Validation:
- Require at least 1 image (max 3)
- Unique slug validation
- Category required for subcategory
- Show error messages clearly

---

## 🔧 TECHNICAL NOTES

### Authentication:
All admin endpoints require authentication header:
```
Authorization: Bearer <admin_token>
```

### Error Handling:
```json
// Success
{ "ok": true, "data": {...} }

// Error
{ "ok": false, "code": "ERROR_CODE", "message": "Error description" }
```

### State Management:
- Store categories list in state for dropdowns
- Refresh subcategories when category filter changes
- Cache uploaded image URLs before form submission

### Form Libraries Suggestion:
- React Hook Form + Zod validation
- Ant Design / Material-UI for components
- React Dropzone for image uploads

---

## 📱 FRONTEND BANNER SLIDER USAGE

Once implemented, frontend can fetch and display:

```javascript
// Get category with 3 banner images
const category = await fetch('/api/v1/categories/electronics');
// category.data.images = ["url1", "url2", "url3"]

// Get subcategories for category
const subs = await fetch('/api/v1/subcategories?categoryId=xxx');
// Each subcategory has .images array

// Use in slider
<Swiper>
  {category.images.map(img => (
    <SwiperSlide key={img}>
      <img src={img} alt="Banner" />
    </SwiperSlide>
  ))}
</Swiper>
```

---

## 🚀 QUICK START STEPS

1. **Create Categories Page**
   - Build CRUD UI for categories
   - Implement 3-image upload
   - Test create/edit/delete

2. **Create Subcategories Page**
   - Build CRUD UI for subcategories
   - Add category dropdown
   - Implement 3-image upload
   - Add category filter

3. **Update Products Page**
   - Add category dropdown
   - Add dynamic subcategory dropdown
   - Update product creation/edit forms

4. **Test Complete Flow**
   - Create category with 3 images
   - Create subcategory under that category with 3 images
   - Create product with both category and subcategory
   - Verify images display correctly

---

## ✅ VALIDATION RULES

- **Category Name**: Required, min 2 chars, unique
- **Category Slug**: Required, min 2 chars, unique, lowercase-hyphenated
- **Category Images**: Array, max 3 URLs
- **Subcategory Name**: Required, min 2 chars
- **Subcategory Slug**: Required, min 2 chars, unique
- **Subcategory CategoryId**: Required, valid ObjectId
- **Subcategory Images**: Array, max 3 URLs
- **Product CategorySlug**: Optional string
- **Product SubcategorySlug**: Optional string

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoint URLs
3. Confirm authentication token is valid
4. Check request body matches examples above
5. Verify image URLs are valid Cloudinary URLs
