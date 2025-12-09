# Category Image Migration Guide

## Issue
Your existing categories in the database have the old `image` field (single string), but the new system uses `images` array (up to 3 images).

## Solution Applied

### 1. ✅ Model Updated with Backward Compatibility
The Category model now has a virtual `image` field that returns the first image from the `images` array. This ensures old code still works.

### 2. ✅ Public Routes Updated
Public category routes now return `images` array instead of single `image`.

### 3. 🔄 Migration Script Created
A migration script is available to convert existing data.

---

## How to Run Migration

### Option 1: Run Migration Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run the migration script
npx tsx src/scripts/migrate-category-images.ts
```

This will:
- Find all categories with old `image` field
- Convert them to `images` array format
- Keep the original image as the first item in the array

### Option 2: Manual Database Update (MongoDB Shell)

```javascript
// Connect to your MongoDB
use amarshopbd

// Update all categories: convert 'image' string to 'images' array
db.categories.find({ image: { $exists: true, $ne: "" } }).forEach(function(doc) {
  if (!doc.images || doc.images.length === 0) {
    db.categories.updateOne(
      { _id: doc._id },
      { $set: { images: [doc.image] } }
    );
    print("Updated: " + doc.name);
  }
});
```

### Option 3: Update via Admin Panel
1. Go to each category in admin panel
2. Edit the category
3. Upload the same image (or 3 new images)
4. Save

---

## After Migration

### New Category Response Format:
```json
{
  "_id": "692f37709a02240f352911f8",
  "name": "BABY & MOM CARE",
  "slug": "baby-mom-care",
  "images": [
    "https://res.cloudinary.com/.../image1.jpg",
    "https://res.cloudinary.com/.../image2.jpg",
    "https://res.cloudinary.com/.../image3.jpg"
  ],
  "image": "https://res.cloudinary.com/.../image1.jpg",  // Virtual field (first image)
  "status": "ACTIVE"
}
```

### Frontend Updates Needed:

#### Old Code (Single Image):
```javascript
<img src={category.image} alt={category.name} />
```

#### New Code (Banner Slider with 3 Images):
```javascript
<Swiper>
  {category.images.map((img, i) => (
    <SwiperSlide key={i}>
      <img src={img} alt={`${category.name} banner ${i+1}`} />
    </SwiperSlide>
  ))}
</Swiper>
```

#### Backward Compatible (Still works):
```javascript
// This still works because of virtual field
<img src={category.image} alt={category.name} />

// But you can also use the array
<img src={category.images[0]} alt={category.name} />
```

---

## Verification

After migration, test:

1. **Get all categories:**
   ```
   GET /api/v1/categories
   ```
   Should return `images` array for each category

2. **Create new category with 3 images:**
   ```json
   POST /api/v1/admin/categories
   {
     "name": "Test Category",
     "slug": "test-category",
     "images": ["url1", "url2", "url3"]
   }
   ```

3. **Update existing category:**
   ```json
   PATCH /api/v1/admin/categories/:id
   {
     "images": ["url1", "url2", "url3"]
   }
   ```

---

## Rollback (If Needed)

If you need to rollback:

```javascript
// MongoDB Shell
db.categories.updateMany(
  {},
  { $set: { image: { $arrayElemAt: ["$images", 0] } } }
);
```

---

## Notes

- ✅ Virtual `image` field ensures backward compatibility
- ✅ Old frontend code will still work (shows first image)
- ✅ New frontend can use all 3 images for sliders
- ✅ Admin panel can now upload up to 3 images per category
- ✅ Validation ensures max 3 images
