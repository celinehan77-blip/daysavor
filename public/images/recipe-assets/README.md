# Recipe asset library

These images are generated once during development and served as static files.
The recipe detail page never calls an image-generation API at runtime.

## Format

- Recommended source: 1024 × 1024 or larger, square PNG/WebP.
- Background: opaque warm cream or warm white; transparency is not required.
- Runtime: local files under `/public/images/recipe-assets/`.
- Missing files automatically fall back to `fallback/neutral-food.png`.

## Stable filenames

### Proteins

- `proteins/chicken.png` — available
- `proteins/pork.png` — reserved
- `proteins/beef.png` — reserved
- `proteins/fish.png` — reserved

### Ingredient groups

- `ingredients/scallion-ginger-garlic.png` — reserved
- `ingredients/chili-peppercorn.png` — available
- `ingredients/mushroom-vegetables.png` — reserved
- `ingredients/nuts-seeds.png` — reserved
- `ingredients/tofu-beans.png` — reserved
- `ingredients/mixed-aromatics.png` — reserved

### Seasoning groups

- `seasonings/soy-vinegar-wine.png` — available
- `seasonings/salt-sugar-starch.png` — reserved
- `seasonings/chili-oil-sesame-oil.png` — reserved
- `seasonings/mixed-sauces.png` — reserved

### Steps

- `steps/cutting.png` — available
- `steps/marinating.png` — available
- `steps/preparing.png` — available
- `steps/frying-aromatics.png` — available
- `steps/stir-frying.png` — available
- `steps/simmering.png` — reserved
- `steps/thickening-sauce.png` — available
- `steps/plating.png` — available

### Fallback

- `fallback/neutral-food.png` — available

## Shared generation direction

High-end cookbook editorial photography; warm restrained natural morning
light; cream-white and warm beige background; low saturation; realistic food
texture; top-down or slight oblique angle; soft shadows and generous negative
space. Avoid ecommerce gloss, restaurant plating, complex backgrounds, text,
logos and watermarks.
