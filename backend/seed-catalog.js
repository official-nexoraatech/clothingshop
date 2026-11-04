import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './src/config/database.js';
import Category from './src/models/Category.js';
import Brand from './src/models/Brand.js';
import Product from './src/models/Product.js';
import ProductVariant from './src/models/ProductVariant.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });

const categories = [
  ['Men\'s Clothing', 'Everyday essentials and elevated wardrobe staples for men.'],
  ['Women\'s Clothing', 'Versatile contemporary clothing for women.'],
  ['Kids\' Clothing', 'Comfortable, durable clothing designed for children.'],
  ['T-Shirts', 'Soft cotton tees, polos and casual tops.'],
  ['Shirts', 'Casual, formal and smart-casual shirts.'],
  ['Jeans', 'Denim in modern, regular and relaxed fits.'],
  ['Trousers', 'Chinos, formal trousers and everyday bottoms.'],
  ['Dresses', 'Day-to-evening dresses for every occasion.'],
  ['Jackets', 'Layering pieces for changing weather and style.'],
  ['Ethnic Wear', 'Classic Indian silhouettes and festive essentials.'],
  ['Footwear', 'Comfortable footwear for work, weekends and sport.'],
  ['Accessories', 'Finishing pieces for practical everyday style.'],
].map(([name, description]) => ({ name, description, status: 'active' }));

const brands = [
  ['Nike', 'Performance-inspired clothing and footwear for active everyday life.'],
  ['Adidas', 'Sport-led essentials combining comfort, movement and style.'],
  ['Puma', 'Modern sportswear and casual staples with an athletic edge.'],
  ["Levi's", 'Heritage denim and timeless casual clothing.'],
  ['H&M', 'Contemporary wardrobe essentials for every season.'],
  ['Zara', 'Modern fashion with polished, versatile silhouettes.'],
  ['US Polo Assn.', 'Classic polo-inspired casualwear with a sporty spirit.'],
  ['Tommy Hilfiger', 'Preppy, elevated classics with a modern finish.'],
].map(([name, description]) => ({ name, description, status: 'active' }));

const images = {
  tee: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',
  mens: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1200&q=85',
  shirt: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=85',
  denim: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85',
  women: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
  dress: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85',
  ethnic: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&q=85',
  kids: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
  flats: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1200&q=85',
  accessories: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85',
  hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85',
  polo: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1200&q=85',
};

// name, slug, category, brand, price, discount, image group, variant profile, flags
const products = [
  ['Classic Cotton T-Shirt', 'classic-cotton-t-shirt', 'T-Shirts', 'Nike', 899, 10, 'tee', 'adult', true, true, true],
  ['Premium Polo T-Shirt', 'premium-polo-t-shirt', "Men's Clothing", 'US Polo Assn.', 1499, 12, 'polo', 'adult', true, false, true],
  ['Casual Oxford Shirt', 'casual-oxford-shirt', 'Shirts', 'Tommy Hilfiger', 1899, 10, 'shirt', 'adult', false, true, false],
  ['Slim Fit Denim Jeans', 'slim-fit-denim-jeans', 'Jeans', "Levi's", 2499, 15, 'denim', 'bottom', true, false, true],
  ['Regular Fit Jeans', 'regular-fit-jeans', 'Jeans', "Levi's", 2199, 10, 'denim', 'bottom', false, true, false],
  ['Formal Trousers', 'formal-trousers', 'Trousers', 'Zara', 2099, 8, 'mens', 'bottom', false, false, false],
  ['Casual Chinos', 'casual-chinos', 'Trousers', 'H&M', 1799, 12, 'mens', 'bottom', true, true, false],
  ['Lightweight Denim Jacket', 'lightweight-denim-jacket', 'Jackets', "Levi's", 2999, 10, 'jacket', 'adult', true, false, true],
  ['Premium Hoodie', 'premium-hoodie', "Men's Clothing", 'Puma', 2399, 15, 'hoodie', 'adult', false, true, true],
  ['Cotton Kurta', 'cotton-kurta', 'Ethnic Wear', 'H&M', 1599, 10, 'ethnic', 'adult', false, false, false],
  ['Floral Printed Dress', 'floral-printed-dress', 'Dresses', 'Zara', 2699, 18, 'dress', 'women', true, true, true],
  ['Casual Summer Top', 'casual-summer-top', "Women's Clothing", 'H&M', 1099, 12, 'women', 'women', false, true, false],
  ["Women's Straight Fit Jeans", 'womens-straight-fit-jeans', 'Jeans', "Levi's", 2399, 10, 'denim', 'bottom', true, false, true],
  ['Elegant Kurti', 'elegant-kurti', 'Ethnic Wear', 'Zara', 1899, 15, 'ethnic', 'women', false, true, false],
  ['Cotton Ethnic Suit', 'cotton-ethnic-suit', 'Ethnic Wear', 'H&M', 3299, 12, 'ethnic', 'women', true, false, false],
  ["Women's Casual Shirt", 'womens-casual-shirt', 'Shirts', 'Tommy Hilfiger', 1799, 10, 'shirt', 'women', false, true, false],
  ['Party Wear Dress', 'party-wear-dress', 'Dresses', 'Zara', 3799, 20, 'dress', 'women', true, false, true],
  ["Women's Denim Jacket", 'womens-denim-jacket', 'Jackets', "Levi's", 3199, 15, 'jacket', 'women', false, true, false],
  ['Palazzo Pants', 'palazzo-pants', 'Trousers', 'H&M', 1499, 8, 'women', 'bottom', false, false, false],
  ['Traditional Saree', 'traditional-saree', 'Ethnic Wear', 'Zara', 4499, 12, 'ethnic', 'onesize', true, true, true],
  ['Kids Cotton T-Shirt', 'kids-cotton-t-shirt', 'Kids\' Clothing', 'Nike', 699, 10, 'kids', 'kids', true, true, false],
  ['Kids Casual Shirt', 'kids-casual-shirt', 'Kids\' Clothing', 'H&M', 899, 8, 'kids', 'kids', false, true, false],
  ['Kids Denim Jeans', 'kids-denim-jeans', 'Kids\' Clothing', "Levi's", 1199, 12, 'kids', 'kidsBottom', false, false, true],
  ['Kids Printed Dress', 'kids-printed-dress', 'Kids\' Clothing', 'Zara', 1299, 15, 'kids', 'kids', true, true, true],
  ['Kids Hoodie', 'kids-hoodie', 'Kids\' Clothing', 'Puma', 1399, 10, 'hoodie', 'kids', false, false, false],
  ['Sports T-Shirt', 'sports-t-shirt', 'T-Shirts', 'Adidas', 1199, 12, 'tee', 'adult', true, true, true],
  ['Running Track Pants', 'running-track-pants', 'Trousers', 'Adidas', 1699, 10, 'mens', 'bottom', false, true, true],
  ['Casual Sneakers', 'casual-sneakers', 'Footwear', 'Puma', 2799, 15, 'shoes', 'shoe', true, false, true],
  ['Sports Shoes', 'sports-shoes', 'Footwear', 'Nike', 3599, 12, 'shoes', 'shoe', true, true, true],
  ["Women's Flats", 'womens-flats', 'Footwear', 'Zara', 1899, 10, 'flats', 'shoe', false, true, false],
  ['Leather Belt', 'leather-belt', 'Accessories', 'Tommy Hilfiger', 1199, 8, 'accessories', 'belt', false, false, false],
  ['Casual Backpack', 'casual-backpack', 'Accessories', 'Puma', 1999, 10, 'accessories', 'onesize', true, true, false],
  ['Fashion Cap', 'fashion-cap', 'Accessories', 'Adidas', 799, 5, 'accessories', 'onesize', false, true, false],
  ['Cotton Socks', 'cotton-socks', 'Accessories', 'Nike', 499, 0, 'accessories', 'onesize', false, false, false],
  ['Winter Sweatshirt', 'winter-sweatshirt', "Men's Clothing", 'H&M', 1899, 15, 'hoodie', 'adult', true, true, true],
  ['Formal Shirt', 'formal-shirt', 'Shirts', 'Tommy Hilfiger', 2199, 10, 'shirt', 'adult', true, false, false],
  ['Printed T-Shirt', 'printed-t-shirt', 'T-Shirts', 'Puma', 999, 12, 'tee', 'adult', false, true, true],
  ['Cargo Pants', 'cargo-pants', 'Trousers', 'Zara', 1999, 10, 'mens', 'bottom', true, false, true],
  ['Casual Shorts', 'casual-shorts', "Men's Clothing", 'Adidas', 1099, 8, 'mens', 'bottom', false, true, false],
  ['Premium Jacket', 'premium-jacket', 'Jackets', 'Tommy Hilfiger', 4299, 18, 'jacket', 'adult', true, false, true],
].map(([name, slug, categoryName, brandName, price, discount, imageKey, profile, isFeatured, isNewArrival, isTrending]) => ({
  name, slug, categoryName, brandName, price, discount, imageKey, profile, isFeatured, isNewArrival, isTrending,
  description: `${name} is a comfortable, carefully selected wardrobe essential designed for dependable everyday wear.`,
}));

const profiles = {
  adult: { sizes: ['S', 'M', 'L'], colors: ['Black', 'Navy Blue'] },
  women: { sizes: ['XS', 'S', 'M'], colors: ['Beige', 'Red'] },
  bottom: { sizes: ['S', 'M', 'L'], colors: ['Blue', 'Black'] },
  kids: { sizes: ['XS', 'S', 'M'], colors: ['Blue', 'Red'] },
  kidsBottom: { sizes: ['S', 'M', 'L'], colors: ['Blue', 'Grey'] },
  shoe: { sizes: ['6', '7', '8'], colors: ['Black', 'White'] },
  belt: { sizes: ['M', 'L'], colors: ['Black', 'Brown'] },
  onesize: { sizes: ['One Size'], colors: ['Black', 'Beige'] },
};

const report = { categories: { inserted: 0, skipped: 0 }, brands: { inserted: 0, skipped: 0 }, products: { inserted: 0, skipped: 0 }, variants: { inserted: 0, skipped: 0 }, errors: [] };

const mark = (type, wasInserted) => { report[type][wasInserted ? 'inserted' : 'skipped'] += 1; };
const insertOnly = async (Model, filter, document, type) => {
  const result = await Model.updateOne(filter, { $setOnInsert: document }, { upsert: true });
  mark(type, result.upsertedCount === 1);
  return Model.findOne(filter).select('_id').lean();
};
const skuPart = value => value.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
const variantsFor = (product, productIndex) => {
  const profile = profiles[product.profile];
  return profile.sizes.flatMap((size, sizeIndex) => profile.colors.map((color, colorIndex) => ({
    sku: `LVS-${String(productIndex + 1).padStart(3, '0')}-${skuPart(size)}-${skuPart(color)}`,
    size, color, price: product.price,
    stock: 12 + ((productIndex * 11 + sizeIndex * 5 + colorIndex * 3) % 36),
    lowStockThreshold: 5, status: 'active',
  })));
};

function validateSeed() {
  const slugs = new Set(products.map(product => product.slug));
  const generatedVariants = products.flatMap(variantsFor);
  const skus = new Set(generatedVariants.map(variant => variant.sku));
  if (products.length < 40) throw new Error(`Expected at least 40 products, found ${products.length}.`);
  if (slugs.size !== products.length) throw new Error('Seed product slugs must be unique.');
  if (skus.size !== generatedVariants.length) throw new Error('Seed variant SKUs must be unique.');
  if (products.some(product => !categories.some(category => category.name === product.categoryName) || !brands.some(brand => brand.name === product.brandName))) throw new Error('A product references an undefined category or brand.');
}

function printReport(label = 'Database seeding completed.') {
  console.info(`\n${label}`);
  for (const type of ['categories', 'brands', 'products', 'variants']) console.info(`${type[0].toUpperCase() + type.slice(1)}: inserted ${report[type].inserted}, skipped ${report[type].skipped}`);
  console.info(`Errors: ${report.errors.length}`);
  for (const error of report.errors) console.error(`- ${error}`);
}

async function seed() {
  validateSeed();
  if (process.argv.includes('--dry-run')) {
    report.categories.inserted = categories.length; report.brands.inserted = brands.length; report.products.inserted = products.length;
    report.variants.inserted = products.flatMap(variantsFor).length;
    printReport('Dry run completed. No MongoDB connection or records were changed.');
    return;
  }
  await connectDatabase();
  const categoryIds = new Map(); const brandIds = new Map();
  for (const category of categories) categoryIds.set(category.name, (await insertOnly(Category, { name: category.name }, category, 'categories'))._id);
  for (const brand of brands) brandIds.set(brand.name, (await insertOnly(Brand, { name: brand.name }, brand, 'brands'))._id);
  for (const [index, product] of products.entries()) {
    const document = {
      name: product.name, slug: product.slug, description: product.description,
      category: categoryIds.get(product.categoryName), brand: brandIds.get(product.brandName), price: product.price, discount: product.discount,
      images: [{ url: images[product.imageKey], alt: product.name, order: 0, isPrimary: true }], status: 'active',
      isFeatured: product.isFeatured, isNewArrival: product.isNewArrival, isTrending: product.isTrending,
    };
    const stored = await insertOnly(Product, { slug: product.slug }, document, 'products');
    for (const variant of variantsFor(product, index)) await insertOnly(ProductVariant, { sku: variant.sku }, { ...variant, product: stored._id }, 'variants');
  }
  const apiProductCount = await Product.countDocuments({ status: 'active', slug: { $in: products.map(product => product.slug) } });
  console.info(`Verified active seeded products in MongoDB: ${apiProductCount}/${products.length}`);
  printReport();
}

try { await seed(); } catch (error) { report.errors.push(error.message); printReport('Database seeding failed. No records were deleted.'); process.exitCode = 1; } finally { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); }
