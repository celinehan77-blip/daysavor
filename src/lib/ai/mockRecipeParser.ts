import type {
  ParsedRecipeDraft,
  RecipeParseInput,
  RecipeParseResult,
} from "@/types/ai";

const mockParserWarning = "当前使用 Mock Parser，未进行真实 AI 解析。";

function normalizeInput(input: RecipeParseInput): string {
  return `${input.rawText ?? ""} ${input.sourceUrl ?? ""}`.toLowerCase();
}

function withMockWarning(draft: ParsedRecipeDraft): ParsedRecipeDraft {
  return {
    ...draft,
    warnings: Array.from(new Set([...draft.warnings, mockParserWarning])),
  };
}

const kungPaoDraft: ParsedRecipeDraft = {
  titleZh: "宫保鸡丁",
  titleEn: "Kung Pao Chicken",
  description: "鸡丁滑嫩，花生香脆，酸甜微辣，是适合家常复刻的经典川味菜。",
  timeMinutes: 30,
  difficulty: "中等",
  flavor: "酸甜微辣",
  mainIngredient: "鸡腿肉",
  primaryCategory: "chicken",
  primaryIngredient: "鸡腿肉",
  classificationConfidence: 0.96,
  classificationReason: "菜名、主食材和烹饪步骤都以鸡肉为主体",
  classificationSource: "ai",
  primaryIngredientTags: ["chicken-thigh", "diced-chicken"],
  ingredientImageTags: [
    "peanuts-nuts",
    "dried-chili-peppercorn",
    "scallion-ginger-garlic",
  ],
  seasoningImageTags: [
    "light-dark-soy-wine",
    "vinegar-sugar-salt",
    "kung-pao-sauce",
  ],
  stepActionTags: [
    "marinating-chicken",
    "frying-aromatics",
    "stir-frying-chicken",
  ],
  heroImagePromptData: {
    dishName: "宫保鸡丁",
    englishName: "Kung Pao Chicken",
    primaryIngredient: "鸡腿肉",
    keyIngredients: ["花生", "干辣椒", "花椒"],
    flavor: "酸甜微辣",
    cuisine: "川菜",
    composition: "成菜置于右侧，左侧留出标题空间",
    textSafeArea: "left",
  },
  tags: ["川菜", "下饭菜", "鸡肉", "家常"],
  ingredients: [
    { name: "鸡腿肉", amount: "300g", group: "main", note: "切成约 1.5cm 鸡丁" },
    { name: "熟花生", amount: "50g", group: "side", note: "最后下锅保持酥脆" },
    { name: "大葱", amount: "1 根", group: "side", note: "切小段" },
  ],
  seasonings: [
    { name: "生抽", amount: "2 勺", group: "seasoning", note: "调味" },
    { name: "香醋", amount: "1.5 勺", group: "seasoning", note: "形成酸香" },
    { name: "白糖", amount: "1 勺", group: "seasoning", note: "平衡酸辣" },
    { name: "干辣椒", amount: "适量", group: "seasoning", note: "按口味调整" },
  ],
  steps: [
    {
      title: "腌制鸡丁",
      description: "鸡丁加入少量生抽、料酒和淀粉抓匀，静置 10 分钟。",
      duration: "10 分钟",
      heat: "无需加热",
      tips: "淀粉不要太多，薄薄挂浆即可。",
    },
    {
      title: "炒香料头",
      description: "热锅下油，放入干辣椒、花椒和葱段炒出香味。",
      duration: "3 分钟",
      heat: "中小火",
      tips: "火不要太大，避免辣椒发苦。",
    },
    {
      title: "合炒收汁",
      description: "下鸡丁炒至变色，倒入调好的碗汁，最后加入花生快速翻匀。",
      duration: "6 分钟",
      heat: "大火",
      tips: "花生最后放，口感更脆。",
    },
  ],
  confidence: 0.82,
  warnings: [],
};

const beefDraft: ParsedRecipeDraft = {
  titleZh: "土豆炖牛肉",
  titleEn: "Braised Beef with Potatoes",
  description: "牛肉软烂入味，土豆吸满汤汁，是适合提前炖好的一锅家常菜。",
  timeMinutes: 75,
  difficulty: "中等",
  flavor: "咸香浓郁",
  mainIngredient: "牛腩",
  primaryCategory: "beef",
  primaryIngredient: "牛腩",
  classificationConfidence: 0.95,
  classificationReason: "牛腩用量最大且决定菜品主体和主要炖煮步骤",
  classificationSource: "ai",
  primaryIngredientTags: ["beef-brisket", "beef-cubes"],
  ingredientImageTags: ["onion-pepper"],
  seasoningImageTags: ["light-dark-soy-wine", "vinegar-sugar-salt"],
  stepActionTags: ["preparing", "simmering-beef", "simmering-beef"],
  heroImagePromptData: {
    dishName: "土豆炖牛肉",
    englishName: "Braised Beef with Potatoes",
    primaryIngredient: "牛腩",
    keyIngredients: ["土豆", "胡萝卜"],
    flavor: "咸香浓郁",
    cuisine: "家常菜",
    composition: "炖菜置于右侧，左侧保留文字空间",
    textSafeArea: "left",
  },
  tags: ["炖菜", "牛肉", "家常", "暖胃"],
  ingredients: [
    { name: "牛腩", amount: "500g", group: "main", note: "切块后焯水" },
    { name: "土豆", amount: "2 个", group: "side", note: "切滚刀块" },
    { name: "胡萝卜", amount: "1 根", group: "side", note: "可选" },
  ],
  seasonings: [
    { name: "生抽", amount: "2 勺", group: "seasoning", note: "基础咸鲜" },
    { name: "老抽", amount: "1 勺", group: "seasoning", note: "上色" },
    { name: "八角", amount: "1 个", group: "seasoning", note: "增香" },
    { name: "冰糖", amount: "少许", group: "seasoning", note: "提亮汤汁" },
  ],
  steps: [
    {
      title: "牛肉焯水",
      description: "牛腩冷水下锅，加姜片和料酒煮开，撇去浮沫后捞出。",
      duration: "10 分钟",
      heat: "大火",
      tips: "焯水后用温水冲洗，肉质更稳定。",
    },
    {
      title: "炒香炖煮",
      description: "锅中炒香姜蒜和香料，放入牛肉、生抽、老抽和热水，小火炖至软烂。",
      duration: "55 分钟",
      heat: "小火",
      tips: "水量一次加足，中途尽量不加冷水。",
    },
    {
      title: "加入土豆",
      description: "放入土豆块继续炖煮，直到土豆绵软、汤汁略微收浓。",
      duration: "15 分钟",
      heat: "中小火",
      tips: "土豆后放，避免炖散。",
    },
  ],
  confidence: 0.78,
  warnings: [],
};

const fishDraft: ParsedRecipeDraft = {
  titleZh: "清蒸鱼",
  titleEn: "Steamed Fish",
  description: "保留鱼肉鲜味的清爽做法，葱姜去腥，热油激香，适合日常晚餐。",
  timeMinutes: 20,
  difficulty: "简单",
  flavor: "鲜香清淡",
  mainIngredient: "鲜鱼",
  primaryCategory: "fish",
  primaryIngredient: "鲜鱼",
  classificationConfidence: 0.94,
  classificationReason: "整条鲜鱼是菜名、用量和清蒸步骤的主体",
  classificationSource: "ai",
  primaryIngredientTags: ["fresh-fish"],
  ingredientImageTags: ["scallion-ginger-garlic"],
  seasoningImageTags: ["light-dark-soy-wine"],
  stepActionTags: ["preparing-seafood", "steaming", "plating-dish"],
  heroImagePromptData: {
    dishName: "清蒸鱼",
    englishName: "Steamed Fish",
    primaryIngredient: "鲜鱼",
    keyIngredients: ["葱", "姜"],
    flavor: "鲜香清淡",
    cuisine: "中式家常菜",
    composition: "鱼盘置于右侧，左侧保留文字空间",
    textSafeArea: "left",
  },
  tags: ["清蒸", "鱼", "快手菜", "清淡"],
  ingredients: [
    { name: "鲜鱼", amount: "1 条", group: "main", note: "鲈鱼、鳜鱼等均可" },
    { name: "姜", amount: "6 片", group: "side", note: "去腥" },
    { name: "葱", amount: "2 根", group: "side", note: "切丝" },
  ],
  seasonings: [
    { name: "蒸鱼豉油", amount: "2 勺", group: "seasoning", note: "最后淋入" },
    { name: "食用油", amount: "2 勺", group: "seasoning", note: "烧热激香" },
    { name: "料酒", amount: "1 勺", group: "seasoning", note: "可选去腥" },
  ],
  steps: [
    {
      title: "处理鱼身",
      description: "鱼身擦干，两侧划刀，铺姜片和葱段。",
      duration: "5 分钟",
      heat: "无需加热",
      tips: "鱼身水分擦干，蒸出来更清爽。",
    },
    {
      title: "上锅清蒸",
      description: "水开后放入鱼，大火蒸至鱼眼发白、鱼肉刚熟。",
      duration: "8 分钟",
      heat: "水开后大火",
      tips: "时间按鱼大小调整，避免蒸老。",
    },
    {
      title: "淋油调味",
      description: "倒掉蒸出的汁水，铺葱丝，淋蒸鱼豉油，再浇热油。",
      duration: "3 分钟",
      heat: "大火",
      tips: "热油要足够热，才能激出葱香。",
    },
  ],
  confidence: 0.8,
  warnings: [],
};

function pickDraft(input: RecipeParseInput): ParsedRecipeDraft {
  const normalized = normalizeInput(input);

  if (
    normalized.includes("宫保") ||
    normalized.includes("鸡丁") ||
    normalized.includes("kung pao")
  ) {
    return withMockWarning(kungPaoDraft);
  }

  if (normalized.includes("牛肉") || normalized.includes("beef")) {
    return withMockWarning(beefDraft);
  }

  if (normalized.includes("鱼") || normalized.includes("fish")) {
    return withMockWarning(fishDraft);
  }

  return {
    ...withMockWarning(kungPaoDraft),
    confidence: 0.52,
  };
}

export async function mockRecipeParser(
  input: RecipeParseInput,
): Promise<RecipeParseResult> {
  return {
    ok: true,
    draft: pickDraft(input),
    error: null,
    errorCode: null,
    provider: "mock",
    usedFallback: true,
  };
}
