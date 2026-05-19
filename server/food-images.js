/**
 * Food images via Foodish API — only indices 1–20 are verified to exist per category.
 * https://github.com/sanatabdouni/foodish-api
 */
const FOODISH_CATEGORIES = [
  'pizza',
  'burger',
  'pasta',
  'biryani',
  'dessert',
  'dosa',
  'samosa',
  'rice',
  'butter-chicken',
  'idly',
];

const MAX_IMAGE_NUM = 20;

function foodishUrl(category, itemNum) {
  const safe = FOODISH_CATEGORIES.includes(category) ? category : 'pizza';
  const num = ((itemNum - 1) % MAX_IMAGE_NUM) + 1;
  return `https://foodish-api.com/images/${safe}/${safe}${num}.jpg`;
}

const RULES = [
  { keys: ['pizza', 'margherita'], category: 'pizza' },
  { keys: ['burger', 'slider', 'cheeseburger'], category: 'burger' },
  {
    keys: [
      'ramen',
      'pho',
      'udon',
      'noodle',
      'pad thai',
      'pad see',
      'linguine',
      'carbonara',
      'ravioli',
      'gnocchi',
      'mac and cheese',
      'lasagna',
      'pasta',
      'risotto',
      'minestrone',
    ],
    category: 'pasta',
  },
  { keys: ['taco', 'burrito', 'nacho', 'quesadilla', 'enchilada', 'fajita', 'tostada', 'empanada', 'queso'], category: 'burger' },
  { keys: ['tikka', 'masala', 'biryani', 'rendang', 'curry', 'korma'], category: 'biryani' },
  { keys: ['mole', 'adobo', 'shawarma', 'katsu', 'teriyaki', 'satay', 'chicken', 'wing', 'parmesan', 'piccata'], category: 'butter-chicken' },
  { keys: ['samosa'], category: 'samosa' },
  { keys: ['dosa', 'idly', 'idli'], category: 'dosa' },
  { keys: ['cake', 'tiramisu', 'cannoli', 'churro', 'cotta', 'sticky rice', 'lava', 'dessert', 'croissant', 'chocolate', 'ice cream'], category: 'dessert' },
  {
    keys: ['sushi', 'sashimi', 'poke', 'ceviche', 'lobster', 'crab', 'clam', 'oyster', 'shrimp', 'fish taco', 'fried rice', 'bibimbap', 'paella', 'jambalaya'],
    category: 'rice',
  },
  { keys: ['salad', 'caprese', 'bruschetta', 'gazpacho', 'soup', 'chowder', 'miso', 'gyro', 'falafel', 'hummus'], category: 'rice' },
  { keys: ['steak', 'beef', 'pork', 'bbq', 'pulled', 'wellington', 'stroganoff', 'kebab', 'bulgogi', 'carpaccio', 'tartare'], category: 'burger' },
  { keys: ['egg', 'benedict', 'toast', 'breakfast', 'sandwich', 'blt', 'croque'], category: 'dosa' },
];

function categoryForLabel(label) {
  const text = label.toLowerCase();
  for (const { keys, category } of RULES) {
    if (keys.some((k) => text.includes(k))) return category;
  }
  const n = label.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return FOODISH_CATEGORIES[n % FOODISH_CATEGORIES.length];
}

function itemNumberFromId(itemId) {
  const n = parseInt(String(itemId).replace('food-', ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Stable URL per item id + label category — each item gets a different photo when possible. */
function imageUrlForFood(label, itemId) {
  const num = itemNumberFromId(itemId);
  const category = categoryForLabel(label);
  return foodishUrl(category, num);
}

module.exports = { imageUrlForFood, categoryForLabel, foodishUrl, itemNumberFromId };
