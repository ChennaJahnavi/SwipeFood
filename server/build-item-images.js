/**
 * Fetch a relevant meal photo per item from TheMealDB (run once, then commit data/item-images.json).
 * Usage: node build-item-images.js
 */
const fs = require('fs');
const path = require('path');
const FOODS = require('./seed-data-raw');
const { imageUrlForFood } = require('./food-images');

const OUT = path.join(__dirname, 'data', 'item-images.json');

const CATEGORY_FALLBACK = {
  pizza: 'Miscellaneous',
  burger: 'Beef',
  pasta: 'Pasta',
  ramen: 'Miscellaneous',
  sushi: 'Seafood',
  taco: 'Miscellaneous',
  salad: 'Vegetarian',
  soup: 'Miscellaneous',
  curry: 'Chicken',
  dessert: 'Dessert',
  breakfast: 'Breakfast',
  sandwich: 'Miscellaneous',
  chicken: 'Chicken',
  beef: 'Beef',
  seafood: 'Seafood',
};

const SEARCH_OVERRIDES = {
  'Margherita Pizza': 'pizza',
  'Spicy Ramen': 'ramen noodles',
  'Avocado Toast': 'avocado',
  'Chicken Tikka Masala': 'tikka',
  'Sushi Platter': 'sushi',
  'Fish Tacos': 'fish tacos',
  'Beef Burger': 'burger',
  'Caesar Salad': 'salad',
  'Pad Thai': 'pad thai',
  'Chocolate Lava Cake': 'chocolate cake',
  'Pho Bo': 'pho',
  'Greek Gyro': 'lamb',
  'Mac and Cheese': 'macaroni cheese',
  'Shrimp Pad See Ew': 'noodles',
  'Caprese Skewers': 'mozzarella',
  'BBQ Pulled Pork': 'pork',
  'Miso Soup': 'soup',
  'Eggs Benedict': 'eggs',
  'Chicken Shawarma': 'chicken',
  'Tiramisu': 'tiramisu',
  'Beef Pho': 'pho',
  'Veggie Burrito Bowl': 'burrito',
  'Lobster Roll': 'lobster',
  'Poke Bowl': 'salmon',
  'French Onion Soup': 'soup',
  'Chicken Katsu': 'chicken katsu',
  'Bruschetta': 'bruschetta',
  'Lamb Biryani': 'biryani',
  'Clam Chowder': 'clam',
  'Falafel Plate': 'falafel',
  'Carbonara': 'carbonara',
  'Spring Rolls': 'spring rolls',
  'Beef Tacos al Pastor': 'tacos',
  'Risotto ai Funghi': 'risotto',
  'Chicken Wings': 'chicken wings',
  'Croissant': 'croissant',
  'Bibimbap': 'bibimbap',
  'Minestrone': 'minestrone',
  'Crab Cakes': 'crab',
  'Shakshuka': 'shakshuka',
  'Tonkotsu Ramen': 'ramen',
  'Ceviche': 'ceviche',
  'Beef Wellington': 'beef',
  'Hummus Plate': 'hummus',
  'Chicken Parmesan': 'chicken parmesan',
  'Mango Sticky Rice': 'mango',
  'Oysters Rockefeller': 'oysters',
  'Peking Duck': 'duck',
  'Gazpacho': 'gazpacho',
  'Jambalaya': 'jambalaya',
  'Beef Stroganoff': 'stroganoff',
  'Dim Sum Basket': 'dumplings',
  'Paella Valenciana': 'paella',
  'Chicken Satay': 'satay',
  'Beef Carpaccio': 'beef carpaccio',
  'Churros': 'churros',
  'Moussaka': 'moussaka',
  'Tom Yum Soup': 'thai',
  'BLT Sandwich': 'bacon',
  'Beef Rendang': 'beef rendang',
  'Escargot': 'snails',
  'Chicken Pot Pie': 'chicken pie',
  'Gnocchi Pesto': 'pesto pasta',
  'Beef Bulgogi': 'bulgogi',
  'Cannoli': 'cannoli',
  'Osso Buco': 'veal',
  'Samosa': 'samosa',
  'Beef Bourguignon': 'beef bourguignon',
  'Croque Monsieur': 'ham sandwich',
  'Chicken Adobo': 'adobo',
  'Beef Empanadas': 'empanada',
  'Panna Cotta': 'panna cotta',
  'Beef Kebab': 'kebab',
  'Clam Linguine': 'linguine',
  'Chicken Mole': 'mole',
  'Beef Pho Tai': 'pho',
  'Beef Tartare': 'beef tartare',
  'Chicken Quesadilla': 'quesadilla',
  'Beef Chili': 'chili',
  'Chicken Piccata': 'chicken',
  'Beef Fajitas': 'fajitas',
  'Chicken Teriyaki': 'teriyaki',
  'Beef Meatballs': 'meatballs',
  'Chicken Curry': 'curry',
  'Beef Lasagna': 'lasagna',
  'Chicken Paella': 'paella',
  'Beef Sliders': 'sliders',
  'Chicken Dumplings': 'dumplings',
  'Beef Ravioli': 'ravioli',
  'Chicken Enchiladas': 'enchiladas',
  'Beef Hot Pot': 'hot pot',
  'Chicken Ramen': 'ramen',
  'Beef Sashimi': 'sashimi',
  'Chicken Fried Rice': 'fried rice',
  'Beef Udon': 'udon',
  'Chicken Gyoza': 'gyoza',
  'Beef Bibimbap': 'bibimbap',
  'Chicken Pho': 'pho',
  'Beef Tostadas': 'tostadas',
  'Chicken Tacos': 'tacos',
  'Beef Nachos': 'nachos',
  'Chicken Burrito': 'burrito',
  'Beef Queso Dip': 'cheese',
  'Chicken Soup': 'chicken soup',
};

function guessCategory(label) {
  const t = label.toLowerCase();
  if (/pizza|margherita/.test(t)) return 'pizza';
  if (/burger|slider/.test(t)) return 'burger';
  if (/ramen|pho|udon|noodle|pasta|lasagna|carbonara|ravioli|gnocchi|mac/.test(t)) return 'pasta';
  if (/sushi|sashimi|poke|ceviche|lobster|crab|clam|oyster|shrimp|fish/.test(t)) return 'seafood';
  if (/taco|burrito|nacho|quesadilla|enchilada|fajita|empanada/.test(t)) return 'taco';
  if (/salad|caprese|bruschetta|gazpacho/.test(t)) return 'salad';
  if (/soup|chowder|miso|minestrone/.test(t)) return 'soup';
  if (/curry|tikka|masala|biryani|rendang|mole|adobo/.test(t)) return 'curry';
  if (/cake|tiramisu|cannoli|churro|cotta|dessert|croissant|chocolate/.test(t)) return 'dessert';
  if (/egg|benedict|toast|breakfast|pancake/.test(t)) return 'breakfast';
  if (/sandwich|blt|croque|roll|gyro|shawarma/.test(t)) return 'sandwich';
  if (/chicken|wing|katsu|teriyaki|satay/.test(t)) return 'chicken';
  if (/beef|steak|burger|meatball|stroganoff|wellington/.test(t)) return 'beef';
  return 'beef';
}

function searchTerms(label) {
  if (SEARCH_OVERRIDES[label]) return [SEARCH_OVERRIDES[label]];
  const words = label.replace(/[^a-zA-Z ]/g, '').trim();
  return [...new Set([words, words.split(' ').slice(-2).join(' '), words.split(' ')[0]])].filter(Boolean);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function searchMeal(term) {
  const data = await fetchJson(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`
  );
  return data?.meals?.[0]?.strMealThumb || null;
}

async function categoryMeal(category, index) {
  const cat = CATEGORY_FALLBACK[category] || category;
  const data = await fetchJson(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`
  );
  const meals = data?.meals;
  if (!meals?.length) return null;
  const m = meals[index % meals.length];
  if (m.strMealThumb?.startsWith('http')) return m.strMealThumb;
  return `https://www.themealdb.com/images/media/meals/${m.strMealThumb}`;
}

async function main() {
  const out = {};
  for (let i = 0; i < FOODS.length; i++) {
    const [label] = FOODS[i];
    const id = `food-${String(i + 1).padStart(3, '0')}`;
    let imageUrl = null;
    let source = 'foodish';

    for (const term of searchTerms(label)) {
      imageUrl = await searchMeal(term);
      if (imageUrl) {
        source = 'themealdb';
        break;
      }
      await delay(100);
    }

    if (!imageUrl) {
      const cat = guessCategory(label);
      imageUrl = await categoryMeal(cat, i);
      if (imageUrl) source = 'themealdb-category';
      await delay(100);
    }

    if (!imageUrl) {
      imageUrl = imageUrlForFood(label, id);
    }

    out[id] = { label, image_url: imageUrl, source };
    process.stdout.write(`\r${i + 1}/${FOODS.length} ${label.slice(0, 28).padEnd(28)} [${source}]`);
  }

  console.log('\n');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const tdb = Object.values(out).filter((v) => v.source.startsWith('themealdb')).length;
  console.log(`Wrote ${OUT} — ${tdb}/104 from TheMealDB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
