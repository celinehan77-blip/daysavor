import type {
  RecipeVisualAsset,
  RecipeVisualAssetType,
} from "@/types/recipeVisual";

type ProductionAssetSpec = RecipeVisualAsset & {
  batch: 1 | 2 | 3;
  promptSubject: string;
};

type CompactSpec = readonly [
  id: string,
  category: string,
  tags: readonly string[],
  compatibleActions: readonly string[],
  promptSubject: string,
];

const folderByType: Record<RecipeVisualAssetType, string> = {
  protein: "proteins",
  ingredient: "ingredients",
  seasoning: "seasonings",
  step: "steps",
  fallback: "fallback/production",
};

function expandSpecs(
  type: RecipeVisualAssetType,
  batch: 1 | 2 | 3,
  aspectRatio: "4:3" | "1:1",
  specs: readonly CompactSpec[],
): ProductionAssetSpec[] {
  return specs.map(
    ([id, category, tags, compatibleActions, promptSubject], index) => ({
      id,
      src: `/images/recipe-library/${folderByType[type]}/${category}/${id}.webp`,
      type,
      category,
      tags: [...tags],
      compatibleActions: [...compatibleActions],
      aspectRatio,
      visualWeight: Number((0.78 + (index % 5) * 0.035).toFixed(3)),
      batch,
      promptSubject,
    }),
  );
}

const batch1Proteins: CompactSpec[] = [
  ["protein-chicken-thigh-02", "chicken", ["chicken", "chicken-thigh", "鸡肉", "鸡腿肉"], ["cutting", "marinating", "stir-frying"], "clean boneless chicken thighs in a shallow ivory ceramic bowl"],
  ["protein-chicken-breast-01", "chicken", ["chicken", "chicken-breast", "鸡肉", "鸡胸肉"], ["cutting", "slicing", "marinating"], "clean chicken breast pieces on a shallow ivory plate"],
  ["protein-chicken-wings-01", "chicken", ["chicken", "chicken-wings", "鸡肉", "鸡翅"], ["marinating", "braising", "deep-frying"], "clean chicken wings arranged in a shallow ivory ceramic dish"],
  ["protein-chicken-sliced-01", "chicken", ["chicken", "sliced-chicken", "chicken-slices", "鸡肉", "鸡肉片"], ["slicing", "marinating", "stir-frying"], "thin sliced chicken arranged loosely in a small ivory bowl"],
  ["protein-chicken-pieces-01", "chicken", ["chicken", "chicken-pieces", "bone-in-chicken", "鸡块", "带骨鸡肉"], ["cutting", "braising", "simmering"], "clean bone-in chicken pieces on a pale ceramic plate"],
  ["protein-whole-chicken-01", "chicken", ["chicken", "whole-chicken", "整鸡", "鸡"], ["preparing", "steaming", "braising"], "a small clean whole chicken prepared for cooking on an ivory platter"],
  ["protein-chicken-diced-02", "chicken", ["chicken", "diced-chicken", "chicken-thigh", "鸡丁", "鸡腿肉"], ["dicing", "marinating", "stir-frying"], "neatly diced chicken thigh in a shallow cream ceramic bowl"],
  ["protein-duck-leg-01", "duck", ["duck", "duck-leg", "鸭", "鸭腿"], ["marinating", "braising", "roasting"], "clean duck legs in a shallow cream ceramic dish"],
  ["protein-duck-breast-01", "duck", ["duck", "duck-breast", "鸭", "鸭胸肉"], ["slicing", "marinating", "pan-frying"], "clean duck breast on a pale ceramic plate"],
  ["protein-duck-diced-01", "duck", ["duck", "diced-duck", "鸭", "鸭肉丁"], ["dicing", "marinating", "stir-frying"], "diced duck meat in a small ivory ceramic bowl"],
  ["protein-duck-pieces-01", "duck", ["duck", "duck-pieces", "鸭", "鸭块"], ["cutting", "braising", "simmering"], "clean duck pieces arranged in a shallow cream bowl"],
  ["protein-whole-duck-01", "duck", ["duck", "whole-duck", "鸭", "整鸭"], ["preparing", "braising", "roasting"], "a small clean whole duck prepared for cooking on an ivory platter"],
  ["protein-pork-tenderloin-01", "pork", ["pork", "pork-tenderloin", "猪肉", "里脊肉"], ["slicing", "shredding", "stir-frying"], "clean pork tenderloin strips on a shallow ivory plate"],
  ["protein-pork-ribs-01", "pork", ["pork", "pork-ribs", "猪肉", "排骨"], ["blanching", "braising", "sweet-sour"], "clean chopped pork ribs in a pale ceramic bowl"],
  ["protein-pork-sliced-01", "pork", ["pork", "sliced-pork", "pork-slices", "猪肉", "肉片"], ["slicing", "marinating", "stir-frying"], "thin sliced pork arranged in a shallow cream bowl"],
  ["protein-pork-diced-01", "pork", ["pork", "diced-pork", "猪肉", "猪肉丁"], ["dicing", "marinating", "stir-frying"], "neatly diced pork in a small ivory bowl"],
  ["protein-pork-minced-01", "pork", ["pork", "minced-pork", "猪肉", "猪肉末"], ["preparing", "stir-frying", "braising"], "clean minced pork in a small pale ceramic bowl"],
  ["protein-pork-trotter-01", "pork", ["pork", "pork-trotter", "猪肉", "猪蹄"], ["blanching", "braising", "simmering"], "clean chopped pork trotter pieces on a pale ceramic plate"],
  ["protein-beef-slices-01", "beef", ["beef", "beef-slices", "sliced-beef", "牛肉", "牛肉片"], ["slicing", "marinating", "stir-frying"], "thin beef slices arranged in a shallow ivory bowl"],
  ["protein-beef-brisket-02", "beef", ["beef", "beef-brisket", "beef-cubes", "牛肉", "牛腩"], ["cutting", "blanching", "simmering"], "clean beef brisket cubes in a pale ceramic bowl"],
  ["protein-beef-shredded-01", "beef", ["beef", "shredded-beef", "牛肉", "牛肉丝"], ["shredding", "marinating", "stir-frying"], "fine shredded beef on a shallow ivory plate"],
  ["protein-beef-minced-01", "beef", ["beef", "minced-beef", "牛肉", "牛肉末"], ["preparing", "stir-frying", "braising"], "clean minced beef in a small cream ceramic bowl"],
  ["protein-beef-steak-01", "beef", ["beef", "beef-steak", "牛肉", "牛排"], ["marinating", "pan-frying", "plating"], "a clean raw beef steak on a pale ceramic plate"],
  ["protein-beef-shank-01", "beef", ["beef", "beef-shank", "牛肉", "牛腱"], ["blanching", "braising", "simmering"], "clean beef shank pieces in a shallow ivory dish"],
];

const batch2Proteins: CompactSpec[] = [
  ["protein-whole-fish-01", "fish", ["fish", "whole-fish", "freshwater-fish", "鱼", "整鱼"], ["preparing", "steaming", "pan-frying"], "a clean whole freshwater fish on a long ivory ceramic platter"],
  ["protein-fish-slices-01", "fish", ["fish", "fish-slices", "鱼", "鱼片"], ["slicing", "marinating", "boiling"], "thin white fish slices in a shallow pale ceramic bowl"],
  ["protein-fish-cubes-01", "fish", ["fish", "fish-cubes", "鱼", "鱼块"], ["cutting", "marinating", "braising"], "clean fish cubes in a shallow ivory bowl"],
  ["protein-fish-steak-01", "fish", ["fish", "fish-steak", "鱼", "鱼排"], ["marinating", "pan-frying", "braising"], "clean white fish steaks on a pale ceramic plate"],
  ["protein-white-fish-01", "fish", ["fish", "white-fish", "fish-fillets", "鱼", "白身鱼"], ["preparing", "steaming", "pan-frying"], "clean white fish fillets on an ivory platter"],
  ["protein-peeled-shrimp-01", "seafood", ["seafood", "shrimp", "peeled-shrimp", "海鲜", "虾仁"], ["preparing", "marinating", "stir-frying"], "peeled shrimp in a shallow ivory ceramic bowl"],
  ["protein-squid-01", "seafood", ["seafood", "squid", "海鲜", "鱿鱼"], ["cutting", "blanching", "stir-frying"], "clean scored squid pieces on a pale ceramic plate"],
  ["protein-scallops-01", "seafood", ["seafood", "scallops", "海鲜", "扇贝"], ["preparing", "steaming", "pan-frying"], "clean scallops in pale shells on an ivory platter"],
  ["protein-shellfish-01", "seafood", ["seafood", "shellfish", "clam", "海鲜", "贝类"], ["preparing", "boiling", "stir-frying"], "clean mixed clams and shellfish in a shallow cream bowl"],
  ["protein-crab-01", "seafood", ["seafood", "crab", "海鲜", "螃蟹"], ["preparing", "steaming", "braising"], "a clean whole crab on a large ivory plate"],
  ["protein-mixed-seafood-01", "seafood", ["seafood", "mixed-seafood", "海鲜", "海鲜拼盘"], ["preparing", "stir-frying", "boiling"], "a restrained mix of shrimp squid and scallops on an ivory platter"],
  ["protein-whole-shrimp-02", "seafood", ["seafood", "shrimp", "whole-shrimp", "海鲜", "鲜虾"], ["preparing", "steaming", "stir-frying"], "whole fresh shrimp arranged in a shallow cream ceramic bowl"],
];

const batch1Ingredients: CompactSpec[] = [
  ["ingredient-ginger-garlic-01", "aromatics", ["ginger-garlic", "ginger", "garlic", "姜", "蒜"], ["preparing", "frying-aromatics"], "sliced ginger and peeled garlic in two small ivory dishes"],
  ["ingredient-chopped-scallion-01", "aromatics", ["chopped-scallion", "scallion", "葱", "葱花"], ["cutting", "preparing", "plating"], "finely chopped scallion in a tiny ivory ceramic dish"],
  ["ingredient-garlic-minced-01", "aromatics", ["garlic-minced", "garlic", "蒜", "蒜蓉"], ["cutting", "preparing", "frying-aromatics"], "fresh minced garlic in a small pale ceramic bowl"],
  ["ingredient-ginger-slices-01", "aromatics", ["ginger-slices", "ginger", "姜", "姜片"], ["slicing", "preparing", "frying-aromatics"], "thin ginger slices arranged in a tiny cream plate"],
  ["ingredient-dried-chili-peppercorn-02", "chili-pepper", ["dried-chili-peppercorn", "dried-chili", "peppercorn", "干辣椒", "花椒"], ["preparing", "frying-aromatics", "stir-frying"], "dried red chilies and Sichuan peppercorns loosely arranged in small ivory dishes"],
  ["ingredient-fresh-red-chili-01", "chili-pepper", ["fresh-red-chili", "fresh-chili", "红辣椒", "鲜辣椒"], ["cutting", "preparing", "stir-frying"], "fresh red chilies on a small pale ceramic plate"],
  ["ingredient-millet-chili-01", "chili-pepper", ["millet-chili", "fresh-chili", "小米辣", "辣椒"], ["cutting", "preparing", "stir-frying"], "small red millet chilies in a tiny ivory dish"],
  ["ingredient-green-red-pepper-01", "chili-pepper", ["green-red-pepper", "green-chili", "red-chili", "青红椒", "青椒", "红椒"], ["cutting", "stir-frying"], "sliced green and red peppers in a shallow cream bowl"],
  ["ingredient-chili-garlic-01", "chili-pepper", ["chili-garlic", "fresh-chili", "garlic", "辣椒", "蒜"], ["cutting", "frying-aromatics", "stir-frying"], "chopped fresh chili and garlic in two small ivory dishes"],
  ["ingredient-peanuts-02", "nuts", ["peanuts", "peanuts-nuts", "花生", "花生米"], ["preparing", "stir-frying", "plating"], "roasted peanuts in a small matte ivory ceramic bowl"],
];

const batch2Ingredients: CompactSpec[] = [
  ["ingredient-onion-bell-pepper-02", "vegetables", ["onion-bell-pepper", "onion", "bell-pepper", "洋葱", "彩椒"], ["cutting", "stir-frying"], "sliced onion and bell peppers in a shallow ivory dish"],
  ["ingredient-potato-carrot-01", "vegetables", ["potato-carrot", "potato", "carrot", "土豆", "胡萝卜"], ["cutting", "simmering", "braising"], "peeled potato and carrot chunks in a cream ceramic bowl"],
  ["ingredient-celery-garlic-sprout-01", "vegetables", ["celery-garlic-sprout", "celery", "garlic-sprout", "芹菜", "蒜苗"], ["cutting", "stir-frying"], "cut celery and garlic sprouts on a shallow ivory plate"],
  ["ingredient-tomato-onion-01", "vegetables", ["tomato-onion", "tomato", "onion", "番茄", "洋葱"], ["cutting", "stir-frying", "simmering"], "tomato wedges and sliced onion in a pale ceramic bowl"],
  ["ingredient-broccoli-carrot-01", "vegetables", ["broccoli-carrot", "broccoli", "carrot", "西兰花", "胡萝卜"], ["cutting", "blanching", "stir-frying"], "broccoli florets and carrot slices in an ivory dish"],
  ["ingredient-cabbage-vegetables-01", "vegetables", ["cabbage-vegetables", "cabbage", "vegetables", "卷心菜", "蔬菜"], ["cutting", "stir-frying"], "clean torn cabbage and a few pale vegetables in a shallow cream bowl"],
  ["ingredient-leafy-vegetables-01", "vegetables", ["leafy-vegetables", "greens", "青菜", "叶菜"], ["preparing", "blanching", "stir-frying"], "fresh leafy greens gathered in a shallow ivory dish"],
  ["ingredient-mixed-mushrooms-01", "mushrooms", ["mixed-mushrooms", "mushroom", "菌菇", "蘑菇"], ["preparing", "stir-frying", "simmering"], "a restrained selection of shiitake oyster and brown mushrooms on an ivory plate"],
  ["ingredient-shiitake-mushroom-01", "mushrooms", ["shiitake-mushroom", "mushroom", "香菇", "冬菇"], ["preparing", "stir-frying", "braising"], "fresh shiitake mushrooms in a shallow pale ceramic bowl"],
  ["ingredient-wood-ear-bamboo-shoot-01", "mushrooms", ["wood-ear-bamboo-shoot", "wood-ear", "bamboo-shoot", "木耳", "笋"], ["preparing", "blanching", "stir-frying"], "wood ear mushrooms and bamboo shoot slices in two ivory dishes"],
  ["ingredient-enoki-mushroom-01", "mushrooms", ["enoki-mushroom", "mushroom", "金针菇", "菌菇"], ["preparing", "steaming", "boiling"], "clean enoki mushrooms arranged in a shallow cream dish"],
  ["ingredient-mushroom-vegetable-02", "mushrooms", ["mushroom-vegetable", "mushroom", "greens", "蘑菇", "青菜"], ["preparing", "stir-frying", "simmering"], "mushrooms with a small amount of leafy greens on an ivory plate"],
  ["ingredient-star-anise-cinnamon-bay-leaf-01", "spices", ["star-anise-cinnamon-bay-leaf", "star-anise", "cinnamon", "bay-leaf", "八角", "桂皮", "香叶"], ["preparing", "braising", "simmering"], "star anise cinnamon and bay leaves loosely arranged on a tiny ivory dish"],
  ["ingredient-peppercorn-spices-01", "spices", ["peppercorn-spices", "peppercorn", "spices", "花椒", "香料"], ["preparing", "frying-aromatics", "braising"], "Sichuan peppercorns and a few dry spices in small pale dishes"],
];

const batch3Ingredients: CompactSpec[] = [
  ["ingredient-mixed-nuts-01", "nuts", ["mixed-nuts", "nuts", "坚果", "混合坚果"], ["preparing", "stir-frying", "plating"], "a restrained mix of cashew peanuts and walnut pieces in a small ivory bowl"],
  ["ingredient-sesame-seeds-01", "nuts", ["sesame-seeds", "sesame", "芝麻", "白芝麻"], ["preparing", "plating"], "white and black sesame seeds in two tiny pale ceramic dishes"],
  ["ingredient-tofu-beans-01", "beans", ["tofu-beans", "tofu", "beans", "豆腐", "豆类"], ["cutting", "preparing", "simmering"], "clean tofu cubes with a few cooked beans on an ivory plate"],
  ["ingredient-edamame-peas-01", "beans", ["edamame-peas", "edamame", "peas", "毛豆", "豌豆"], ["preparing", "blanching", "stir-frying"], "shelled edamame and green peas in a shallow cream bowl"],
  ["ingredient-coriander-scallion-01", "herbs", ["coriander-scallion", "coriander", "scallion", "香菜", "葱"], ["preparing", "plating"], "fresh coriander and scallion arranged loosely on an ivory plate"],
  ["ingredient-parsley-herbs-01", "herbs", ["parsley-herbs", "parsley", "herbs", "欧芹", "香草"], ["preparing", "plating"], "a small bundle of fresh parsley and soft herbs on a pale ceramic dish"],
  ["ingredient-mixed-dry-spices-01", "spices", ["mixed-dry-spices", "dry-spices", "spices", "干香料", "香料"], ["preparing", "braising", "simmering"], "a restrained assortment of dry Chinese spices in tiny ivory dishes"],
  ["ingredient-scallion-ginger-garlic-02", "aromatics", ["scallion-ginger-garlic", "aromatics", "葱", "姜", "蒜"], ["preparing", "frying-aromatics"], "scallion sections ginger slices and garlic cloves arranged naturally on a pale ceramic plate"],
];

const batch1Seasonings: CompactSpec[] = [
  ["seasoning-light-dark-soy-wine-02", "soy-sauce", ["light-soy-dark-soy-cooking-wine", "light-dark-soy-wine", "soy-sauce", "cooking-wine", "生抽", "老抽", "料酒"], ["marinating", "mixing-sauce", "braising"], "light soy dark soy and cooking wine in three small unbranded ceramic and glass dishes"],
  ["seasoning-vinegar-sugar-salt-02", "vinegar-sugar", ["vinegar-sugar-salt", "vinegar", "sugar", "salt", "醋", "糖", "盐"], ["mixing-sauce", "seasoning"], "dark vinegar sugar and salt in three coordinated small ivory dishes"],
  ["seasoning-salt-sugar-starch-01", "powders", ["salt-sugar-starch", "salt", "sugar", "starch", "盐", "糖", "淀粉"], ["marinating", "mixing-sauce"], "salt sugar and starch powders in three tiny ivory ceramic dishes"],
  ["seasoning-starch-water-02", "starch", ["starch-water", "starch", "slurry", "淀粉", "水淀粉"], ["marinating", "mixing-sauce", "thickening-sauce"], "starch slurry and dry starch in two small pale dishes"],
  ["seasoning-soy-vinegar-sugar-01", "mixed-sauces", ["soy-vinegar-sugar", "soy-sauce", "vinegar", "sugar", "酱油", "醋", "糖"], ["mixing-sauce", "stir-frying"], "soy sauce vinegar and sugar arranged in three small ivory dishes"],
  ["seasoning-kung-pao-sauce-02", "mixed-sauces", ["kung-pao-sauce", "mixed-sauces", "宫保汁", "碗汁"], ["mixing-sauce", "stir-frying"], "a glossy but restrained kung pao sauce in a small ivory bowl with separate soy vinegar and starch dishes"],
];

const batch2Seasonings: CompactSpec[] = [
  ["seasoning-braising-sauce-01", "mixed-sauces", ["braising-sauce", "soy-sauce", "sugar", "红烧汁", "酱油", "糖"], ["mixing-sauce", "braising"], "deep amber Chinese braising sauce with soy and rock sugar in small ivory dishes"],
  ["seasoning-sweet-sour-sauce-01", "mixed-sauces", ["sweet-sour-sauce", "vinegar", "sugar", "糖醋汁", "醋", "糖"], ["mixing-sauce", "stir-frying"], "warm amber sweet sour sauce with vinegar and sugar in coordinated tiny dishes"],
  ["seasoning-garlic-sauce-01", "mixed-sauces", ["garlic-sauce", "garlic", "soy-sauce", "蒜蓉汁", "蒜", "酱油"], ["mixing-sauce", "steaming", "stir-frying"], "pale garlic sauce with minced garlic and soy in small ivory ceramic dishes"],
  ["seasoning-spicy-sauce-01", "mixed-sauces", ["spicy-sauce", "chili-sauce", "辣酱", "香辣汁"], ["mixing-sauce", "stir-frying"], "restrained red chili sauce and chili flakes in two small pale ceramic dishes"],
  ["seasoning-oyster-soy-sauce-01", "mixed-sauces", ["oyster-soy-sauce", "oyster-sauce", "soy-sauce", "蚝油", "生抽"], ["mixing-sauce", "stir-frying"], "oyster sauce and light soy in two small unbranded ivory dishes"],
  ["seasoning-doubanjiang-sauce-01", "mixed-sauces", ["doubanjiang-sauce", "doubanjiang", "豆瓣酱", "郫县豆瓣"], ["frying-aromatics", "mixing-sauce", "braising"], "a small portion of red fermented broad bean chili paste in an ivory dish"],
  ["seasoning-black-pepper-sauce-01", "mixed-sauces", ["black-pepper-sauce", "black-pepper", "黑椒汁", "黑胡椒"], ["mixing-sauce", "pan-frying", "stir-frying"], "black pepper sauce with cracked black pepper in two small pale dishes"],
];

const batch3Seasonings: CompactSpec[] = [
  ["seasoning-chili-oil-sesame-oil-01", "oils", ["chili-oil-sesame-oil", "chili-oil", "sesame-oil", "辣椒油", "香油"], ["mixing-sauce", "stir-frying", "plating"], "chili oil and sesame oil in two small clear and ivory dishes"],
  ["seasoning-cooking-oil-sesame-oil-01", "oils", ["cooking-oil-sesame-oil", "cooking-oil", "sesame-oil", "食用油", "香油"], ["marinating", "stir-frying"], "clear cooking oil and amber sesame oil in two small unbranded dishes"],
  ["seasoning-scallion-oil-01", "oils", ["scallion-oil", "scallion", "葱油", "葱"], ["mixing-sauce", "plating"], "pale scallion oil with a few scallion rings in a small ivory dish"],
  ["seasoning-pepper-oil-01", "oils", ["pepper-oil", "peppercorn", "花椒油", "花椒"], ["mixing-sauce", "stir-frying"], "clear amber Sichuan pepper oil with a few peppercorns in a small pale dish"],
  ["seasoning-salt-white-pepper-01", "powders", ["salt-white-pepper", "salt", "white-pepper", "盐", "白胡椒"], ["marinating", "seasoning"], "salt and white pepper powder in two tiny ivory ceramic dishes"],
  ["seasoning-five-spice-powder-01", "powders", ["five-spice-powder", "five-spice", "五香粉", "香料粉"], ["marinating", "braising"], "warm brown five spice powder in a tiny pale ceramic dish"],
  ["seasoning-mixed-powders-01", "powders", ["mixed-powders", "starch-seasoning", "powders", "调味粉", "淀粉"], ["marinating", "mixing-sauce"], "three restrained pale seasoning powders in coordinated tiny ivory dishes"],
];

const batch1Steps: CompactSpec[] = [
  ["step-cutting-chicken-01", "cutting", ["cutting-chicken", "chicken", "切鸡肉", "鸡肉"], ["cutting"], "overhead close crop of chicken being cut into clean pieces on a pale board, only hands and knife visible"],
  ["step-cutting-beef-01", "cutting", ["cutting-beef", "beef", "切牛肉", "牛肉"], ["cutting", "slicing"], "overhead close crop of beef being sliced on a pale board, only hands and knife visible"],
  ["step-cutting-pork-01", "cutting", ["cutting-pork", "pork", "切猪肉", "猪肉"], ["cutting", "slicing"], "overhead close crop of pork being sliced on a pale board, only hands and knife visible"],
  ["step-marinating-chicken-02", "marinating", ["marinating-chicken", "chicken", "腌制鸡肉", "鸡肉"], ["marinating"], "chicken pieces being gently mixed with a pale marinade in an ivory bowl, only hands and chopsticks visible"],
  ["step-marinating-beef-01", "marinating", ["marinating-beef", "beef", "腌制牛肉", "牛肉"], ["marinating"], "beef slices being coated with marinade in an ivory bowl, only chopsticks and hands visible"],
  ["step-marinating-pork-01", "marinating", ["marinating-pork", "pork", "腌制猪肉", "猪肉"], ["marinating"], "pork strips being mixed with starch marinade in a cream bowl, only hands visible"],
  ["step-frying-chili-peppercorn-01", "frying-aromatics", ["frying-chili-peppercorn", "dried-chili-peppercorn", "干辣椒", "花椒", "爆香"], ["frying-aromatics"], "dried chilies and Sichuan peppercorns blooming in a pale wok, close overhead crop"],
  ["step-frying-scallion-ginger-garlic-01", "frying-aromatics", ["frying-scallion-ginger-garlic", "scallion-ginger-garlic", "葱姜蒜", "爆香"], ["frying-aromatics"], "scallion ginger and garlic gently sizzling in a light colored wok, close overhead crop"],
  ["step-stir-frying-beef-01", "stir-frying", ["stir-frying-beef", "beef", "翻炒牛肉", "牛肉"], ["stir-frying"], "beef slices being quickly stir fried in a light wok with a wooden spatula, close crop"],
  ["step-stir-frying-pork-01", "stir-frying", ["stir-frying-pork", "pork", "翻炒猪肉", "猪肉"], ["stir-frying"], "pork strips being quickly stir fried in a light wok, close overhead crop"],
];

const batch2Steps: CompactSpec[] = [
  ["step-cutting-fish-01", "cutting", ["cutting-fish", "fish", "切鱼", "鱼"], ["cutting", "slicing"], "white fish being cut cleanly on a pale board, only hands and knife visible"],
  ["step-marinating-fish-01", "marinating", ["marinating-fish", "fish", "腌鱼", "鱼"], ["marinating"], "fish fillets being lightly seasoned in an ivory dish, only chopsticks visible"],
  ["step-marinating-shrimp-01", "marinating", ["marinating-shrimp", "shrimp", "腌虾", "虾"], ["marinating"], "peeled shrimp being coated in a light marinade in a cream bowl"],
  ["step-blanching-meat-01", "blanching", ["blanching-meat", "meat", "焯肉", "焯水"], ["blanching"], "clean meat pieces being briefly blanched in a pale pot, close overhead crop"],
  ["step-blanching-vegetables-01", "blanching", ["blanching-vegetables", "vegetables", "焯蔬菜", "焯水"], ["blanching"], "green vegetables being briefly blanched in a pale pot, close overhead crop"],
  ["step-preparing-fish-01", "preparing", ["preparing-fish", "fish", "处理鱼", "鱼"], ["preparing"], "a whole fish being neatly scored and prepared on a pale board, only hands visible"],
  ["step-preparing-seafood-02", "preparing", ["preparing-seafood", "seafood", "处理海鲜", "海鲜"], ["preparing"], "shrimp and squid being cleaned on an ivory work surface, only hands visible"],
  ["step-stir-frying-seafood-01", "stir-frying", ["stir-frying-seafood", "seafood", "翻炒海鲜", "海鲜"], ["stir-frying"], "shrimp and squid being quickly stir fried in a light wok, close crop"],
  ["step-pan-frying-fish-01", "pan-frying", ["pan-frying-fish", "fish", "煎鱼", "鱼"], ["pan-frying"], "a whole fish gently pan frying in a pale skillet, close overhead crop"],
  ["step-pan-frying-fish-02", "pan-frying", ["pan-frying-fish", "fish", "香煎鱼", "鱼"], ["pan-frying"], "fish fillets developing a light golden crust in a cream skillet"],
  ["step-deep-frying-meat-01", "deep-frying", ["deep-frying-meat", "meat", "炸肉", "油炸"], ["deep-frying"], "small battered meat pieces frying golden in a light pot, close crop"],
  ["step-simmering-beef-02", "simmering", ["simmering-beef", "beef", "炖牛肉", "牛肉"], ["simmering"], "beef and root vegetables gently simmering in a pale ceramic pot"],
  ["step-braising-pork-01", "braising", ["braising-pork", "pork", "红烧猪肉", "猪肉"], ["braising"], "pork belly pieces braising in an amber sauce in a cream pot"],
  ["step-braising-pork-02", "braising", ["braising-pork", "pork-ribs", "焖排骨", "排骨"], ["braising"], "pork ribs gently braising in a warm amber sauce in a pale pot"],
  ["step-steaming-fish-01", "steaming", ["steaming-fish", "fish", "蒸鱼", "鱼"], ["steaming"], "a whole fish on an ivory platter inside a pale steamer, gentle steam"],
  ["step-steaming-fish-02", "steaming", ["steaming-fish", "fish", "清蒸鱼", "鱼"], ["steaming"], "white fish fillets steaming with ginger and scallion on an ivory plate"],
  ["step-boiling-seafood-01", "boiling", ["boiling-seafood", "seafood", "煮海鲜", "海鲜"], ["boiling"], "shellfish and shrimp gently boiling in a pale pot, close overhead crop"],
];

const batch3Steps: CompactSpec[] = [
  ["step-slicing-duck-01", "slicing", ["slicing-duck", "duck", "切鸭肉", "鸭肉"], ["slicing", "cutting"], "duck breast being sliced neatly on a pale board, only hands and knife visible"],
  ["step-dicing-duck-01", "dicing", ["dicing-duck", "duck", "鸭肉丁", "鸭肉"], ["dicing", "cutting"], "duck meat being diced into even pieces on a pale board"],
  ["step-shredding-pork-01", "shredding", ["shredding-pork", "pork", "猪肉丝", "猪肉"], ["shredding", "cutting"], "pork tenderloin being cut into fine shreds on a pale board"],
  ["step-marinating-duck-01", "marinating", ["marinating-duck", "duck", "腌制鸭肉", "鸭肉"], ["marinating"], "duck pieces being mixed with a light marinade in an ivory bowl"],
  ["step-braising-chicken-01", "braising", ["braising-chicken", "chicken", "焖鸡", "鸡肉"], ["braising"], "recognizable chicken pieces gently braising in a restrained amber sauce in a pale cream pot"],
  ["step-braising-duck-01", "braising", ["braising-duck", "duck", "焖鸭", "鸭肉"], ["braising"], "recognizable duck pieces gently braising with ginger in a restrained amber sauce in a pale cream pot"],
  ["step-simmering-duck-01", "simmering", ["simmering-duck", "duck", "炖鸭", "鸭肉"], ["simmering"], "recognizable duck pieces gently simmering with ginger in a pale ceramic pot"],
  ["step-boiling-fish-01", "boiling", ["boiling-fish", "fish", "煮鱼", "鱼片"], ["boiling"], "white fish slices gently cooking in a pale broth in an ivory pot"],
  ["step-steaming-seafood-01", "steaming", ["steaming-seafood", "seafood", "蒸海鲜", "虾", "螃蟹"], ["steaming"], "whole shrimp and a small crab steaming on an ivory plate inside a pale steamer"],
  ["step-mixing-kung-pao-sauce-01", "mixing-sauce", ["mixing-kung-pao-sauce", "kung-pao-sauce", "宫保汁", "调汁"], ["mixing-sauce"], "kung pao sauce being whisked in a small ivory bowl, close crop"],
  ["step-mixing-braising-sauce-01", "mixing-sauce", ["mixing-braising-sauce", "braising-sauce", "红烧汁", "调汁"], ["mixing-sauce"], "amber braising sauce being stirred in a small pale ceramic bowl"],
  ["step-thickening-sauce-01", "thickening-sauce", ["thickening-sauce", "starch-water", "勾芡", "水淀粉"], ["thickening-sauce"], "a thin stream of starch slurry thickening sauce in a light wok, close crop"],
  ["step-thickening-sauce-02", "thickening-sauce", ["thickening-sauce", "slurry", "勾芡", "收浓"], ["thickening-sauce"], "glossy sauce gently thickening around ingredients in a pale pan"],
  ["step-reducing-sauce-01", "reducing-sauce", ["reducing-sauce", "收汁", "浓缩酱汁"], ["reducing-sauce"], "amber sauce reducing to a gentle sheen in a cream skillet"],
  ["step-reducing-sauce-02", "reducing-sauce", ["reducing-sauce", "收汁", "浓缩"], ["reducing-sauce"], "a small amount of sauce reducing around meat in a pale pot"],
  ["step-adding-ingredients-01", "adding-ingredients", ["adding-ingredients", "下料", "加入配料"], ["adding-ingredients"], "prepared vegetables being added from a small ivory bowl into a light wok, only hands visible"],
  ["step-plating-fish-01", "plating", ["plating-fish", "fish", "鱼", "装盘"], ["plating"], "cooked fish being gently arranged on a long ivory platter"],
  ["step-plating-seafood-01", "plating", ["plating-seafood", "seafood", "海鲜", "装盘"], ["plating"], "cooked shrimp and seafood being neatly plated on an ivory dish"],
];

const batch3Fallbacks: CompactSpec[] = [
  ["fallback-protein-poultry-01", "chicken", ["type:protein", "poultry", "chicken", "duck"], [], "neutral clean poultry pieces in a shallow ivory bowl"],
  ["fallback-protein-red-meat-01", "beef", ["type:protein", "red-meat", "beef", "pork"], [], "neutral clean red meat pieces in a shallow ivory bowl"],
  ["fallback-protein-seafood-01", "fish", ["type:protein", "seafood", "fish", "shrimp"], [], "neutral clean fish and shellfish on an ivory plate"],
  ["fallback-ingredient-general-01", "other", ["type:ingredient", "vegetables", "aromatics"], [], "a restrained neutral assortment of common Chinese aromatics and vegetables"],
  ["fallback-seasoning-general-01", "other", ["type:seasoning", "seasoning", "sauce"], [], "three neutral Chinese sauces and powders in small ivory dishes"],
  ["fallback-step-preparing-01", "preparing", ["type:step", "preparing"], ["preparing"], "neutral food preparation scene on a pale work surface, only utensils visible"],
  ["fallback-step-cooking-01", "other", ["type:step", "cooking"], ["stir-frying", "simmering", "steaming"], "neutral close overhead cooking scene in a light colored pan"],
  ["fallback-general-food-01", "other", ["type:protein", "type:ingredient", "type:seasoning", "type:step"], [], "neutral refined Chinese cooking ingredients arranged on a warm ivory surface"],
];

export const productionAssetSpecs: ProductionAssetSpec[] = [
  ...expandSpecs("protein", 1, "4:3", batch1Proteins),
  ...expandSpecs("ingredient", 1, "4:3", batch1Ingredients),
  ...expandSpecs("seasoning", 1, "4:3", batch1Seasonings),
  ...expandSpecs("step", 1, "1:1", batch1Steps),
  ...expandSpecs("protein", 2, "4:3", batch2Proteins),
  ...expandSpecs("ingredient", 2, "4:3", batch2Ingredients),
  ...expandSpecs("seasoning", 2, "4:3", batch2Seasonings),
  ...expandSpecs("step", 2, "1:1", batch2Steps),
  ...expandSpecs("ingredient", 3, "4:3", batch3Ingredients),
  ...expandSpecs("seasoning", 3, "4:3", batch3Seasonings),
  ...expandSpecs("step", 3, "1:1", batch3Steps),
  ...expandSpecs("fallback", 3, "4:3", batch3Fallbacks),
];

const finalPrepVisuals = new Map<string, Pick<RecipeVisualAsset, "presentation" | "src">>([
  [
    "protein-chicken-diced-02",
    {
      presentation: "isolated",
      src: "/images/recipe-library/cutouts/proteins/chicken-thigh-cutout.png",
    },
  ],
  [
    "seasoning-salt-sugar-starch-01",
    {
      presentation: "isolated",
      src: "/images/recipe-library/cutouts/seasonings/seasoning-cutout.png",
    },
  ],
]);

export const productionRecipeVisualAssets: RecipeVisualAsset[] =
  productionAssetSpecs.map((asset) => {
    const finalVisual = finalPrepVisuals.get(asset.id);
    return {
      id: asset.id,
      src: finalVisual?.src ?? asset.src,
      presentation: finalVisual?.presentation,
      type: asset.type,
      category: asset.category,
      tags: asset.tags,
      compatibleActions: asset.compatibleActions,
      aspectRatio: asset.aspectRatio,
      visualWeight: asset.visualWeight,
    };
  });
