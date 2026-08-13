import type { ParsedRecipeDraft } from "@/types/ai";

export type RecipeQualityIssueCode =
  | "MISSING_SEASONINGS"
  | "MISSING_AMOUNT"
  | "TOO_FEW_INGREDIENTS"
  | "TOO_FEW_STEPS"
  | "VAGUE_STEP"
  | "MISSING_DURATION"
  | "MISSING_HEAT"
  | "LOW_CONFIDENCE"
  | "MISSING_TAGS"
  | "SHORT_DESCRIPTION";

export type RecipeQualityIssue = {
  code: RecipeQualityIssueCode;
  severity: "warning" | "error";
  message: string;
  path: string;
};

export type RecipeQualityScore = {
  score: number;
  grade: "A" | "B" | "C" | "D";
  passed: boolean;
  issues: RecipeQualityIssue[];
  breakdown: {
    structure: number;
    ingredients: number;
    steps: number;
    metadata: number;
  };
};

const measurableAmountPattern =
  /\d|少许|一把|半|克|毫升|汤匙|茶匙|勺|杯|个|只|颗|片|块|根|瓣/;

function addIssue(
  issues: RecipeQualityIssue[],
  issue: RecipeQualityIssue,
) {
  issues.push(issue);
}

export function scoreParsedRecipeDraft(
  draft: ParsedRecipeDraft,
): RecipeQualityScore {
  const issues: RecipeQualityIssue[] = [];
  let structure = 20;
  let ingredients = 30;
  let steps = 35;
  let metadata = 15;

  if (draft.ingredients.length < 3) {
    ingredients -= 8;
    addIssue(issues, {
      code: "TOO_FEW_INGREDIENTS",
      severity: "warning",
      message: "主料和配菜少于 3 项。",
      path: "ingredients",
    });
  }

  if (draft.seasonings.length === 0) {
    ingredients -= 10;
    addIssue(issues, {
      code: "MISSING_SEASONINGS",
      severity: "error",
      message: "没有识别到调料。",
      path: "seasonings",
    });
  }

  const missingAmounts = [...draft.ingredients, ...draft.seasonings].filter(
    (ingredient) => !measurableAmountPattern.test(ingredient.amount),
  );

  if (missingAmounts.length > 0) {
    ingredients -= Math.min(8, missingAmounts.length * 2);
    addIssue(issues, {
      code: "MISSING_AMOUNT",
      severity: "warning",
      message: `${missingAmounts.length} 项食材缺少可执行的数量单位。`,
      path: "ingredients",
    });
  }

  if (draft.steps.length < 3) {
    steps -= 10;
    addIssue(issues, {
      code: "TOO_FEW_STEPS",
      severity: "error",
      message: "烹饪步骤少于 3 步。",
      path: "steps",
    });
  }

  const vagueSteps = draft.steps.filter(
    (step) => step.description.length < 8,
  );

  if (vagueSteps.length > 0) {
    steps -= Math.min(8, vagueSteps.length * 3);
    addIssue(issues, {
      code: "VAGUE_STEP",
      severity: "warning",
      message: `${vagueSteps.length} 个步骤描述过于简略。`,
      path: "steps.description",
    });
  }

  const missingDurations = draft.steps.filter(
    (step) => step.duration === "未说明",
  );

  if (missingDurations.length > 0) {
    steps -= Math.min(6, missingDurations.length * 2);
    addIssue(issues, {
      code: "MISSING_DURATION",
      severity: "warning",
      message: `${missingDurations.length} 个步骤没有时间信息。`,
      path: "steps.duration",
    });
  }

  const missingHeat = draft.steps.filter((step) => step.heat === "未说明");

  if (missingHeat.length > 0) {
    steps -= Math.min(8, missingHeat.length * 2);
    addIssue(issues, {
      code: "MISSING_HEAT",
      severity: "warning",
      message: `${missingHeat.length} 个步骤没有火候信息。`,
      path: "steps.heat",
    });
  }

  if (draft.confidence < 0.65) {
    structure -= 6;
    addIssue(issues, {
      code: "LOW_CONFIDENCE",
      severity: "warning",
      message: "解析置信度低于 0.65。",
      path: "confidence",
    });
  }

  if (draft.tags.length === 0) {
    metadata -= 5;
    addIssue(issues, {
      code: "MISSING_TAGS",
      severity: "warning",
      message: "缺少分类标签。",
      path: "tags",
    });
  }

  if (draft.description.length < 16) {
    metadata -= 5;
    addIssue(issues, {
      code: "SHORT_DESCRIPTION",
      severity: "warning",
      message: "菜谱描述过短。",
      path: "description",
    });
  }

  const score = Math.max(0, structure + ingredients + steps + metadata);
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";

  return {
    score,
    grade,
    passed: score >= 70 && !issues.some((issue) => issue.severity === "error"),
    issues,
    breakdown: {
      structure,
      ingredients,
      steps,
      metadata,
    },
  };
}
