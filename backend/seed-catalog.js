import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from './src/models/Category.js';
import Brand from './src/models/Brand.js';
import Product from './src/models/Product.js';
import ProductVariant from './src/models/ProductVariant.js';
import InventoryLog from './src/models/InventoryLog.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });

const categoryDefinitions = [
  ['Men', 'Everyday clothing and considered essentials for men.'],
  ['Women', 'Versatile clothing made for everyday dressing.'],
  ['Kids', 'Comfortable, easy-care favourites for kids.'],
  ['T-Shirts', 'Soft tees, everyday layers and relaxed fits.'],
  ['Shirts', 'Polished shirts and relaxed overshirts.'],
  ['Jeans', 'Denim in classic and contemporary fits.'],
  ['Trousers', 'Tailored, relaxed and utility trousers.'],
  ['Hoodies', 'Comfortable fleece and loopback layers.'],
  ['Sweatshirts', 'Easy pullovers for comfortable layering.'],
  ['Jackets', 'Lightweight outerwear and versatile jackets.'],
  ['Dresses', 'Day-to-evening dresses in considered silhouettes.'],
  ['Tops', 'Everyday tops, blouses and warm-weather layers.'],
  ['Ethnic Wear', 'Modern Indian occasion and everyday wear.'],
  ['Footwear', 'Comfortable shoes for everyday wear.'],
  ['Accessories', 'Finishing touches and useful everyday carry.'],
];

const brandDefinitions = [
  ['Urban Style', 'Sample in-house label for modern everyday clothing.'],
  ['Classic Wear', 'Sample in-house label for timeless wardrobe staples.'],
  ['Street Culture', 'Sample in-house label for relaxed streetwear.'],
  ['Denim House', 'Sample in-house label focused on denim essentials.'],
  ['Trend Avenue', 'Sample in-house label for contemporary looks.'],
  ['Cotton Club', 'Sample in-house label for soft cotton essentials.'],
  ['Everyday Fashion', 'Sample in-house label for easy daily dressing.'],
  ['Modern Threads', 'Sample in-house label for versatile separates.'],
  ['Active Street', 'Sample in-house label for casual active styles.'],
  ['Fashion Studio', 'Sample in-house label for considered occasion wear.'],
];

const productGroups = [
  ['Men', 499, [
    ['Everyday Cotton Crew Tee', 'A breathable cotton crew-neck tee with a relaxed, easy-to-style fit.', 'White'],
    ['Oxford Button-Down Shirt', 'A versatile cotton-blend Oxford shirt with a clean button-down collar.', 'Blue'],
    ['Straight-Fit Denim Jeans', 'Classic straight-fit denim with a comfortable mid-rise waist.', 'Indigo'],
    ['Weekend Zip Hoodie', 'A soft, midweight fleece hoodie with a practical full-length zip.', 'Olive'],
  ]],
  ['Women', 599, [
    ['Draped Satin Midi Dress', 'A fluid midi dress with a soft drape for day or evening styling.', 'Maroon'],
    ['Relaxed Linen Blouse', 'A light linen-blend blouse with an easy shape and natural texture.', 'Beige'],
    ['Tailored Wide-Leg Trousers', 'High-rise tailored trousers with a clean front and flowing leg.', 'Black'],
    ['Ribbed Everyday Tee', 'A soft rib-knit tee designed for comfortable everyday layering.', 'Grey'],
  ]],
  ['Kids', 399, [
    ['Play-All-Day Graphic Tee', 'A soft cotton jersey tee with a cheerful original graphic.', 'Navy'],
    ['Soft Knit Jogger Set', 'A comfortable two-piece knit set for play, rest and everything between.', 'Blue'],
    ['Mini Denim Jacket', 'A lightweight denim layer with easy movement and classic pockets.', 'Indigo'],
    ['Weekend Crew Sweatshirt', 'A cosy cotton-blend crew sweatshirt for cool-day layering.', 'Grey'],
  ]],
  ['T-Shirts', 399, [
    ['Essential Heavyweight Tee', 'A substantial cotton jersey tee with a structured everyday fit.', 'Black'],
    ['Relaxed Pocket T-Shirt', 'A soft, relaxed tee finished with a practical chest pocket.', 'White'],
    ['Ribbed Baby Tee', 'A close-fitting rib-knit tee with a soft stretch feel.', 'Maroon'],
    ['Longline Cotton Tee', 'An easy longline cotton tee designed for relaxed layering.', 'Olive'],
  ]],
  ['Shirts', 699, [
    ['Textured Oxford Shirt', 'A breathable textured shirt that works neatly dressed or worn open.', 'Blue'],
    ['Soft Flannel Overshirt', 'A brushed overshirt with a warm hand feel and useful pockets.', 'Navy'],
    ['Camp-Collar Linen Shirt', 'A light linen-blend shirt with a laid-back camp collar.', 'Beige'],
    ['Classic Poplin Shirt', 'A crisp cotton-blend poplin shirt with a versatile regular fit.', 'White'],
  ]],
  ['Jeans', 1099, [
    ['Vintage Straight Jeans', 'Washed denim in a timeless straight leg with a comfortable rise.', 'Blue'],
    ['Relaxed Denim Jeans', 'Relaxed-fit jeans made for comfort and easy everyday outfits.', 'Indigo'],
    ['Tapered Dark-Wash Jeans', 'A clean dark wash and tapered leg for a polished denim look.', 'Navy'],
    ['High-Rise Wide-Leg Jeans', 'High-rise denim with a flowing wide leg and classic five-pocket finish.', 'Blue'],
  ]],
  ['Trousers', 899, [
    ['Pleated Tailored Trousers', 'Tailored trousers with a subtle pleat and comfortable drape.', 'Black'],
    ['Everyday Chino Pants', 'Soft cotton-blend chinos with a versatile straight fit.', 'Beige'],
    ['Linen Drawstring Trousers', 'Airy linen-blend trousers with an adjustable drawstring waist.', 'Olive'],
    ['Relaxed Utility Trousers', 'Easy utility trousers finished with functional patch pockets.', 'Navy'],
  ]],
  ['Hoodies', 899, [
    ['Classic Fleece Hoodie', 'A soft brushed-fleece hoodie with a roomy front pocket.', 'Grey'],
    ['Zip-Through Hoodie', 'A versatile zip hoodie for easy temperature-friendly layering.', 'Black'],
    ['Oversized Graphic Hoodie', 'A relaxed heavyweight hoodie with an original studio graphic.', 'Navy'],
    ['Lightweight Loopback Hoodie', 'A breathable loopback layer suited to cool mornings and evenings.', 'Olive'],
  ]],
  ['Sweatshirts', 799, [
    ['Crewneck Fleece Sweatshirt', 'A cosy crewneck in soft fleece with a clean, classic finish.', 'Maroon'],
    ['Half-Zip Sweatshirt', 'A midweight pullover with a practical half-zip neckline.', 'Grey'],
    ['Embroidered Pullover', 'A comfortable cotton-blend pullover with understated embroidery.', 'Navy'],
    ['Drop-Shoulder Sweatshirt', 'An easy oversized silhouette with relaxed dropped shoulders.', 'Beige'],
  ]],
  ['Jackets', 1499, [
    ['Utility Field Jacket', 'A lightweight field jacket with functional pockets and a clean shape.', 'Olive'],
    ['Lightweight Denim Jacket', 'A versatile denim jacket for comfortable transitional layering.', 'Blue'],
    ['Quilted Everyday Jacket', 'A light quilted layer with a smooth lining and easy fit.', 'Black'],
    ['Relaxed Bomber Jacket', 'A modern bomber with ribbed trims and a soft, comfortable lining.', 'Navy'],
  ]],
  ['Dresses', 1199, [
    ['Floral Wrap Midi Dress', 'A light wrap-style midi dress with an easy adjustable waist.', 'Maroon'],
    ['Cotton Poplin Shirt Dress', 'A crisp cotton-blend shirt dress with a relaxed midi length.', 'White'],
    ['Sleeveless Knit Midi Dress', 'A soft stretch-knit dress with a clean sleeveless silhouette.', 'Black'],
    ['Evening Satin Slip Dress', 'A fluid satin-finish slip dress with understated evening appeal.', 'Blue'],
  ]],
  ['Tops', 599, [
    ['Square-Neck Ribbed Top', 'A soft rib-knit top with a flattering square neckline.', 'Black'],
    ['Linen Button Top', 'A breezy linen-blend top with simple button-front detailing.', 'Beige'],
    ['Soft Draped Blouse', 'A lightweight blouse with a fluid drape and versatile shape.', 'Maroon'],
    ['Everyday Cotton Tank', 'A comfortable cotton-blend tank for warm days and layering.', 'White'],
  ]],
  ['Ethnic Wear', 999, [
    ['Printed Kurta Set', 'A breathable kurta set with a refined all-over print.', 'Indigo'],
    ['Embroidered Straight Kurta', 'A straight-fit kurta with subtle embroidery and easy movement.', 'Maroon'],
    ['Festive Anarkali Dress', 'A flowing occasion silhouette with considered decorative detail.', 'Navy'],
    ['Cotton Co-Ord Set', 'A coordinated cotton-blend set designed for comfortable all-day wear.', 'Olive'],
  ]],
  ['Footwear', 1299, [
    ['Everyday Canvas Sneakers', 'Lightweight canvas sneakers with a comfortable everyday sole.', 'White'],
    ['Minimal Leather Slides', 'Clean-lined slides with a cushioned footbed for easy wear.', 'Beige'],
    ['Classic Court Sneakers', 'Low-profile court sneakers with a versatile, clean finish.', 'Black'],
    ['Weekend Knit Trainers', 'Flexible knit trainers designed for comfortable daily movement.', 'Grey'],
  ]],
  ['Accessories', 499, [
    ['Everyday Crossbody Bag', 'A practical compact crossbody with an adjustable shoulder strap.', 'Black'],
    ['Soft Cotton Scarf', 'A lightweight woven cotton scarf with a soft hand feel.', 'Maroon'],
    ['Structured Mini Tote', 'A structured mini tote with room for everyday essentials.', 'Beige'],
    ['Classic Baseball Cap', 'A cotton twill cap with an adjustable back strap.', 'Navy'],
  ]],
];

// Unsplash fashion photographs used as sample product imagery.
const photoIds = [
  '1539109136881-3be0616acf4b', '1529139574466-a303027c1d8b', '1483985988355-763728e1935b',
  '1490481651871-ab68de25d43d', '1485230895905-ec40ba36b9bc', '1515886657613-9f3515b0c78f',
  '1534528741775-53994a69daeb', '1525507119028-ed4c629a60a3', '1544441893-675973e31985',
  '1496747611176-843222e1e57c', '1523398002811-999ca8dec234', '1512436991641-6745cdb1723f',
  '1503342217505-b0a15ec3261c', '1548126032-079a0fb0099d', '1551488831-00ddcb6c6bd3',
  '1509631179647-0177331693ae', '1503341504253-dff4815485f1', '1490114538077-0a7f8cb49891',
  '1618354691373-d851c5c3a990', '1551028719-00167b16eac5', '1591047139829-d91aecb6caea',
  '1551232864-3f0890e580d9', '1566206091558-7f218b696731', '1595777457583-95e059d581b8',
  '1583743814966-8936f37f4678', '1584917865442-de89df76afd3', '1576566588028-4147f3842f27',
  '1572804013427-4d7ca7268217', '1542291026-7eec264c27ff', '1562157873-818bc0726f68',
  '1598033129183-c4f50c736f10', '1578681994506-b8f463449011', '1521572163474-6864f9cf17ab',
  '1758138719176-f4debfc12207', '1566827611562-07947e1ad779', '1734418046223-567d550f457d',
  '1544005313-94ddf0286df2', '1603346133594-d87d8e292686', '1588887922554-4a8d61521314',
  '1664891408817-bb950dfd0bfd', '1553452527-56f87a4dede2', '1592020009248-c3ec9f0d7456',
  '1549351778-5738a76408a3', '1510074229140-bdfc2ff28550', '1545594263-11616914c0e2',
  '1574201635302-388dd92a4c3f', '1626931292157-2d3c3d4b8d2e', '1764510376760-bde16d1e08ba',
  '1698681240776-c4a10d022e1e', '1785508889038-1fb7a6408dd5', '1753161618086-21aebcb7ec5d',
  '1649172850684-4ccdd44127e6', '1526692202263-843e30c353e8', '1768478701507-24b1c8de2df0',
  '1657042760573-93f8e73faeeb', '1656383118558-686bfb79b5ae', '1774359535371-c9ea5ad2e8ec',
  '1788200587577-953475819fa7', '1728476397002-99cc5e75e42f', '1768825136230-34fb80291f19',
];

const previousDuplicateImageIds = new Set([
  '1539109136881-3be0616acf4b', '1529139574466-a303027c1d8b', '1496747611176-843222e1e57c',
  '1512436991641-6745cdb1723f', '1551488831-00ddcb6c6bd3', '1509631179647-0177331693ae',
  '1591047139829-d91aecb6caea', '1566206091558-7f218b696731', '1576566588028-4147f3842f27',
  '1572804013427-4d7ca7268217', '1490114538077-0a7f8cb49891', '1503341504253-dff4815485f1',
  '1598033129183-c4f50c736f10', '1523398002811-999ca8dec234', '1485230895905-ec40ba36b9bc',
  '1544441893-675973e31985', '1515886657613-9f3515b0c78f', '1548126032-079a0fb0099d',
  '1503342217505-b0a15ec3261c', '1583743814966-8936f37f4678', '1551028719-00167b16eac5',
  '1595777457583-95e059d581b8', '1534528741775-53994a69daeb', '1483985988355-763728e1935b',
  '1578681994506-b8f463449011', '1562157873-818bc0726f68',
]);

const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases = { mens: 'men', menswear: 'men', womens: 'women', womenswear: 'women', kidswear: 'kids', tee: 'tshirts', tees: 'tshirts', tshirt: 'tshirts', t_shirts: 'tshirts', ethnic: 'ethnicwear', shoes: 'footwear', bags: 'accessories' };
const canonical = (value) => aliases[normalize(value)] || normalize(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const localHost = (uri) => {
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('MONGO_URI is not a valid MongoDB URL.'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Catalog seeding is restricted to a local MongoDB host. Remote or production databases are not supported.');
  }
  return parsed.hostname.replace(/^\[|\]$/g, '');
};

async function inventory() {
  const [categories, brands, products, variants, activeProducts, httpsProducts, activeVariants, stockRows, categoryRows, brandRows] = await Promise.all([
    Category.find().select('name status').lean(), Brand.find().select('name status').lean(), Product.find().select('name slug status images category brand').lean(),
    ProductVariant.find().select('product status stock').lean(), Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ images: { $elemMatch: { url: /^https:\/\//i } } }), ProductVariant.countDocuments({ status: 'active' }),
    ProductVariant.aggregate([{ $match: { status: 'active', stock: { $gt: 0 } } }, { $group: { _id: '$product', units: { $sum: '$stock' } } }]),
    Category.find().select('_id name').lean(), Brand.find().select('_id name').lean(),
  ]);
  const categoryIds = new Set(categoryRows.map((item) => String(item._id)));
  const brandIds = new Set(brandRows.map((item) => String(item._id)));
  const activeVariantProducts = new Set(variants.filter((item) => item.status === 'active').map((item) => String(item.product)));
  const stockByProduct = new Map(stockRows.map((item) => [String(item._id), item.units]));
  const productsWithStock = new Set(stockRows.map((item) => String(item._id)));
  const distinctHttpsImageUrls = new Set(products.flatMap((product) => (product.images || []).filter((image) => /^https:\/\//i.test(image.url || '')).map((image) => image.url)));
  const categoriesWithoutProducts = categoryRows.filter((category) => !products.some((product) => String(product.category) === String(category._id))).map((category) => category.name);
  return {
    categories: categories.length, brands: brands.length, products: products.length, variants: variants.length,
    activeCategories: categories.filter((item) => item.status === 'active').length,
    activeBrands: brands.filter((item) => item.status === 'active').length,
    activeProducts,
    productsWithHttpsImages: httpsProducts,
    distinctHttpsImageUrls: distinctHttpsImageUrls.size,
    activeVariants,
    productsWithActiveVariants: activeVariantProducts.size,
    productsInStock: productsWithStock.size,
    availableUnits: [...stockByProduct.values()].reduce((sum, units) => sum + units, 0),
    productsWithValidCategory: products.filter((item) => categoryIds.has(String(item.category))).length,
    productsWithValidBrand: products.filter((item) => brandIds.has(String(item.brand))).length,
    categoriesWithoutProducts,
  };
}

async function getOrCreateNames(Model, definitions, targetCount, field) {
  let records = await Model.find().lean();
  const selected = new Map(records.map((record) => [canonical(record.name), record]));
  let inserted = 0;
  for (const [name, description] of definitions) {
    const key = canonical(name);
    if (selected.has(key) || records.length >= targetCount) continue;
    let record = await Model.findOneAndUpdate(
      { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
      { $setOnInsert: { name, description, status: 'active' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    if (!record) record = await Model.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
    if (record) { selected.set(key, record.toObject ? record.toObject() : record); records.push(record); inserted += 1; }
  }
  const all = await Model.find().lean();
  const active = all.filter((record) => record.status === 'active');
  const byKey = new Map(all.map((record) => [canonical(record.name), record]));
  return { inserted, records: all, active, byKey, field };
}

async function addMissingVariants(product, basePrice, baseColor, groupName, productIndex) {
  const sizes = groupName === 'Footwear' ? ['UK 6', 'UK 7', 'UK 8', 'UK 9'] : groupName === 'Accessories' ? ['One Size'] : ['S', 'M', 'L', 'XL'];
  const colors = groupName === 'Accessories' ? ['Black', 'Beige', 'Olive', 'Maroon'] : [baseColor];
  const pairs = groupName === 'Accessories' ? colors.map((color) => ['One Size', color]) : sizes.map((size) => [size, baseColor]);
  const priceBackfill = await ProductVariant.updateMany(
    { product: product._id, sku: /^LVS-/, price: { $exists: false } },
    { $set: { price: basePrice } },
  );
  const existingCount = await ProductVariant.countDocuments({ product: product._id, status: 'active' });
  let inserted = 0;
  for (const [size, color] of pairs) {
    if (inserted + existingCount >= 4) break;
    if (await ProductVariant.exists({ product: product._id, size, color })) continue;
    const sizeCode = size.replace(/[^a-z0-9]/gi, '').toUpperCase();
    const colorCode = color.replace(/[^a-z0-9]/gi, '').toUpperCase();
    const sku = `LVS-${product._id.toString().toUpperCase()}-${sizeCode}-${colorCode}`;
    const stock = 8 + ((productIndex * 7 + inserted * 5) % 24);
    const result = await ProductVariant.updateOne(
      { product: product._id, size, color },
      { $setOnInsert: { sku, size, color, price: basePrice, stock, status: 'active' } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    const variant = await ProductVariant.findOne({ product: product._id, size, color });
    if (result.upsertedCount) {
      await InventoryLog.create({ product: product._id, variant: variant._id, quantityChange: stock, previousStock: 0, newStock: stock, operation: 'Restock', reason: 'Initial sample catalog stock' });
      inserted += 1;
    } else if (variant?.sku === sku && !(await InventoryLog.exists({ variant: variant._id, reason: 'Initial sample catalog stock' }))) {
      await InventoryLog.create({ product: product._id, variant: variant._id, quantityChange: variant.stock, previousStock: 0, newStock: variant.stock, operation: 'Restock', reason: 'Initial sample catalog stock' });
    }
  }
  return { inserted, pricesBackfilled: priceBackfill.modifiedCount };
}

async function seed() {
  const categoryResult = await getOrCreateNames(Category, categoryDefinitions, 15, 'category');
  const brandResult = await getOrCreateNames(Brand, brandDefinitions, 10, 'brand');
  const categoryByKey = categoryResult.byKey;
  const activeCategories = categoryResult.active;
  const activeBrands = brandResult.active;
  if (!activeCategories.length || !activeBrands.length) throw new Error('At least one active category and brand are required before products can be seeded.');

  let activeProductCount = await Product.countDocuments({ status: 'active' });
  let productsInserted = 0;
  let variantsInserted = 0;
  let variantPricesBackfilled = 0;
  let productImagesRepaired = 0;
  let productIndex = 0;
  const flatSpecs = productGroups.flatMap(([group, basePrice, entries]) => entries.map(([name, description, color], index) => ({ group, basePrice: basePrice + index * 75, name, description, color, index })));

  for (let index = 0; index < flatSpecs.length; index += 1) {
    const spec = flatSpecs[index];
    const category = categoryByKey.get(canonical(spec.group)) || activeCategories[index % activeCategories.length];
    if (category.status !== 'active') continue;
    const normalizedName = new RegExp(`^${escapeRegex(spec.name)}$`, 'i');
    const baseSlug = `lavella-demo-${slugify(spec.name)}`;
    let slug = baseSlug;
    let product = await Product.findOne({ name: { $regex: normalizedName } });
    if (!product) {
      product = await Product.findOne({ slug });
      let suffix = 2;
      while (product && normalize(product.name) !== normalize(spec.name)) {
        slug = `${baseSlug}-${suffix++}`;
        product = await Product.findOne({ slug });
      }
    }
    if (!product && activeProductCount < 60) {
      const brand = activeBrands[index % activeBrands.length];
      const photoId = photoIds[index % photoIds.length].replace(/^photo-/, '').split('?')[0];
      const imageUrl = `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=900&q=82`;
      const isSale = index % 4 === 0;
      try {
        product = await Product.findOneAndUpdate(
          { slug },
          { $setOnInsert: {
            name: spec.name, slug, description: spec.description, category: category._id, brand: brand._id,
            price: spec.basePrice, discount: isSale ? 10 : 0,
            images: [{ url: imageUrl, alt: `${spec.name} in ${spec.color}`, order: 0, isPrimary: true }],
            status: 'active', isFeatured: index % 5 === 0, isNewArrival: index % 3 === 0, isTrending: index % 4 === 1,
          } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        );
        if (product?.slug === slug && product?.category && product?.brand) {
          productsInserted += 1;
          activeProductCount += 1;
        }
      } catch (error) {
        if (error.code !== 11000) throw error;
        product = await Product.findOne({ slug });
      }
    }
    if (product?.slug === slug) {
      if (index >= 33 && product.images?.[0]?.alt === `${spec.name} in ${spec.color}`) {
        const currentUrl = product.images[0].url;
        const currentPhotoId = currentUrl.match(/\/photo-([^?]+)/)?.[1];
        if (previousDuplicateImageIds.has(currentPhotoId)) {
          const newPhotoId = photoIds[index].replace(/^photo-/, '').split('?')[0];
          const imageUrl = `https://images.unsplash.com/photo-${newPhotoId}?auto=format&fit=crop&w=900&q=82`;
          const repair = await Product.updateOne(
            { _id: product._id, 'images.0.url': currentUrl },
            { $set: { images: [{ url: imageUrl, alt: `${spec.name} in ${spec.color}`, order: 0, isPrimary: true }] } },
          );
          productImagesRepaired += repair.modifiedCount;
        }
      }
      const variants = await addMissingVariants(product, spec.basePrice, spec.color, spec.group, productIndex);
      variantsInserted += variants.inserted;
      variantPricesBackfilled += variants.pricesBackfilled;
      productIndex += 1;
    }
  }
  return { categoriesInserted: categoryResult.inserted, brandsInserted: brandResult.inserted, productsInserted, variantsInserted, variantPricesBackfilled, productImagesRepaired };
}

const apply = process.argv.includes('--apply');
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('MONGO_URI is required; configure backend/.env first.');
const host = localHost(uri);
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to local MongoDB host ${host}; database ${mongoose.connection.name}. No credentials are shown.`);
  console.log(`${apply ? 'BEFORE' : 'CURRENT'} CATALOG INVENTORY`);
  console.log(JSON.stringify(await inventory(), null, 2));
  if (apply) {
    const inserted = await seed();
    console.log('INSERT SUMMARY');
    console.log(JSON.stringify(inserted, null, 2));
    console.log('AFTER CATALOG INVENTORY');
    console.log(JSON.stringify(await inventory(), null, 2));
  } else {
    console.log('Report only. Pass --apply to add missing sample catalog rows; only local MongoDB is permitted.');
  }
} finally {
  await mongoose.disconnect();
}
