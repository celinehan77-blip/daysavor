import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type HeroSpec = {
  id: string;
  category: string;
  kind: "recipe" | "category-fallback";
  subject: string;
  status?: "accepted";
};

const recipeHeroes: HeroSpec[] = [
  { id: "kung-pao-chicken", category: "chicken", kind: "recipe", subject: "finished Kung Pao chicken with distinct diced chicken, peanuts, dried red chilies and a restrained glossy sauce", status: "accepted" },
  { id: "yellow-braised-chicken", category: "chicken", kind: "recipe", subject: "finished Chinese yellow-braised chicken with bone-in chicken pieces, shiitake mushroom and green pepper in a warm ceramic bowl" },
  { id: "laziji-chicken", category: "chicken", kind: "recipe", subject: "finished Chongqing laziji spicy chicken with crisp small chicken pieces and abundant dried red chilies, appetizing but not overly oily" },
  { id: "beer-duck", category: "duck", kind: "recipe", subject: "finished Chinese beer-braised duck with tender duck pieces and aromatics in a warm ivory ceramic bowl" },
  { id: "ginger-duck", category: "duck", kind: "recipe", subject: "finished ginger duck with tender duck pieces and abundant ginger slices in a restrained amber sauce" },
  { id: "red-braised-pork", category: "pork", kind: "recipe", subject: "finished red-braised pork belly with neat glossy cubes in a warm ivory ceramic bowl" },
  { id: "fish-fragrant-pork", category: "pork", kind: "recipe", subject: "finished yuxiang shredded pork with clear pork shreds, wood ear mushroom, bamboo shoots and peppers" },
  { id: "sweet-sour-ribs", category: "pork", kind: "recipe", subject: "finished Chinese sweet-and-sour pork ribs with recognizable small rib bones and a restrained amber glaze" },
  { id: "beef-stew", category: "beef", kind: "recipe", subject: "finished potato beef stew with tender beef cubes and potato chunks in a warm ceramic bowl", status: "accepted" },
  { id: "black-pepper-beef", category: "beef", kind: "recipe", subject: "finished black-pepper beef strips with onion and bell pepper, clear beef texture and restrained sauce" },
  { id: "tomato-beef-brisket", category: "beef", kind: "recipe", subject: "finished tomato beef brisket stew with clear beef cubes and tomato in a warm ivory ceramic bowl" },
  { id: "steamed-fish", category: "fish", kind: "recipe", subject: "finished whole Chinese steamed fish with scallion and ginger on a long ivory platter", status: "accepted" },
  { id: "boiled-fish", category: "fish", kind: "recipe", subject: "finished Sichuan boiled fish with tender white fish slices, dried chilies and peppercorns in a shallow ivory bowl" },
  { id: "pan-fried-fish", category: "fish", kind: "recipe", subject: "finished golden pan-fried whole fish on an ivory platter with minimal scallion garnish" },
  { id: "garlic-vermicelli-shrimp", category: "seafood", kind: "recipe", subject: "finished garlic vermicelli shrimp with whole shrimp, translucent vermicelli and minced garlic clearly visible", status: "accepted" },
  { id: "spicy-squid", category: "seafood", kind: "recipe", subject: "finished spicy stir-fried scored squid with green and red peppers, unmistakable squid pieces and restrained sauce" },
  { id: "steamed-crab", category: "seafood", kind: "recipe", subject: "finished steamed whole crab on an ivory platter with minimal ginger accompaniment" },
];

const categoryFallbacks: HeroSpec[] = [
  { id: "fallback/chicken", category: "chicken", kind: "category-fallback", subject: "an elegant finished Chinese chicken dish with tender chicken pieces and subtle scallion garnish" },
  { id: "fallback/duck", category: "duck", kind: "category-fallback", subject: "an elegant finished Chinese duck dish with recognizable duck pieces in a restrained amber sauce" },
  { id: "fallback/pork", category: "pork", kind: "category-fallback", subject: "an elegant finished Chinese pork dish with recognizable pork slices and seasonal vegetables" },
  { id: "fallback/beef", category: "beef", kind: "category-fallback", subject: "an elegant finished Chinese beef dish with tender beef cubes and root vegetables" },
  { id: "fallback/fish", category: "fish", kind: "category-fallback", subject: "an elegant finished Chinese whole fish dish on a long ivory platter with scallion and ginger" },
  { id: "fallback/seafood", category: "seafood", kind: "category-fallback", subject: "an elegant finished Chinese seafood dish with shrimp, scallops and squid clearly visible" },
  { id: "fallback/other", category: "other", kind: "category-fallback", subject: "an elegant finished Chinese vegetable and tofu dish with seasonal greens and mushrooms" },
];

const sharedPrompt = [
  "high-end Chinese cookbook magazine photography",
  "wide 3:2 landscape composition",
  "finished plated food is the unmistakable subject",
  "subject concentrated on the right half",
  "left 38 percent kept calm and visually clean for title text",
  "warm cream-white table and pale ceramic serving ware",
  "natural soft morning light",
  "low saturation",
  "realistic appetizing texture",
  "soft restrained shadows",
  "no text, no logo, no brand, no person, no face",
  "no restaurant clutter, no advertising style, no unrelated dishes",
].join(", ");

const plan = {
  schemaVersion: 1,
  minimumLongEdge: 1536,
  runtimePriority: [
    "recipe.heroImageUrl",
    "static recipe hero cache",
    "category hero fallback",
  ],
  generationMode: "offline-background-only",
  heroes: [...recipeHeroes, ...categoryFallbacks].map((hero) => ({
    ...hero,
    src: `/images/recipe-library/hero/${hero.id}.webp`,
    status: hero.status ?? "pending",
    prompt:
      hero.status === "accepted"
        ? null
        : `${hero.subject}, ${sharedPrompt}`,
  })),
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));

async function main() {
  await writeFile(
    resolve(scriptDirectory, "hero-generation-plan.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  console.log(
    `Created Hero plan: ${plan.heroes.length} total, ${
      plan.heroes.filter((hero) => hero.status === "pending").length
    } pending.`,
  );
}

void main();
