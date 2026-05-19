const fs = require('fs');
const path = require('path');
const FOODS = require('./seed-data-raw');
const { imageUrlForFood } = require('./food-images');

const IMAGES_PATH = path.join(__dirname, 'data', 'item-images.json');
let imageMap = {};
if (fs.existsSync(IMAGES_PATH)) {
  imageMap = JSON.parse(fs.readFileSync(IMAGES_PATH, 'utf8'));
}

module.exports = FOODS.map(([label, description], i) => {
  const id = `food-${String(i + 1).padStart(3, '0')}`;
  const mapped = imageMap[id]?.image_url;
  return {
    id,
    label,
    description,
    image_url: mapped || imageUrlForFood(label, id),
  };
});
