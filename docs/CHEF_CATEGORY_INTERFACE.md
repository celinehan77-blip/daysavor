# Chef Category Interface

本文件是风味地图视觉任务与分类功能层之间的稳定边界。

视觉组件不得直接读取 Supabase、`localStorage`、`recipes` 表字段或分类规则；只消费这里定义的 `ChefCategoryViewModel`。

## 数据类型

```ts
type ChefCategoryViewModel = {
  id:
    | "chicken"
    | "duck"
    | "pork"
    | "beef"
    | "lamb"
    | "fish"
    | "shrimp"
    | "crab"
    | "other";
  displayName: string;
  englishName: string;
  description: string;
  recipeCount: number;
  latestRecipeName: string | null;
  href: string;
  isEmpty: boolean;
};
```

类型定义位置：`src/types/classification.ts`。

## 数据获取方法

### 客户端视觉组件

优先使用：

```ts
import { useChefCategories } from "@/hooks/useChefCategories";

const { categories, isLoading, error } = useChefCategories();
```

视觉组件只按 `categories.map(...)` 渲染，不调用 Supabase client，不自行统计数量，不根据是否为空过滤数组。

### 数据层调用

```ts
import {
  getChefCategories,
  getChefCategoriesForUser,
} from "@/lib/data/recipeClassification";
```

- `getChefCategories()`：读取当前登录用户的数据；游客时读取当前浏览器的本地生成和收藏。
- `getChefCategoriesForUser(userId)`：只接受当前认证用户自身的 id；不匹配时返回完整的九个空分类，避免暴露其他用户数据。
- `buildChefCategoryViewModels(recipes)`：纯转换函数，仅供功能层与测试使用。

## 分类 ID 与固定顺序

数组永远按下面顺序返回，不能因空分类删项：

1. `chicken`
2. `duck`
3. `pork`
4. `beef`
5. `lamb`
6. `fish`
7. `shrimp`
8. `crab`
9. `other`

## 路由规则

每个 ViewModel 都提供真实路由：

```text
/chef/chicken
/chef/duck
/chef/pork
/chef/beef
/chef/lamb
/chef/fish
/chef/shrimp
/chef/crab
/chef/other
```

`/chef/[categoryId]` 会根据分类 ID 读取当前用户对应的生成或收藏菜谱。不得把多个分类重定向到 `Chicken Station`。

## 空分类规则

空分类仍在数组中，字段固定为：

```ts
{
  recipeCount: 0,
  latestRecipeName: null,
  isEmpty: true,
}
```

视觉层可据此显示空状态、弱化票根或显示“暂无菜谱”，但不得改变分类 ID、href 或删除该项。

## 视觉任务可修改范围

视觉任务可以修改风味地图、票根和分类页的展示组件与样式，例如：

- `src/components/flavor-map/FlavorMapScreen.tsx`
- `src/components/flavor-map/StationTicket.tsx`
- `src/components/station/ChickenStationScreen.tsx`

接入时应改为消费 `useChefCategories()` 或由上层传入的 `ChefCategoryViewModel[]`。

## 视觉任务禁止修改的功能层

下列文件属于分类业务边界，不应由视觉任务修改：

- `src/types/classification.ts`
- `src/lib/classification/recipeCategories.ts`
- `src/lib/data/recipeClassification.ts`
- `src/hooks/useChefCategories.ts`
- `src/lib/data/supabase/recipes.ts`
- `src/lib/data/supabase/mappers.ts`
- `src/lib/data/localGeneratedRecipe.ts`
- `src/app/chef/[categoryId]/page.tsx`
- `src/components/station/ChefCategoryScreen.tsx`
- `supabase/migrations/20260727090433_add_recipe_classification.sql`

这些文件负责分类 ID、AI 结果、当前用户隔离、数据保存、查询、纠错和动态路由。视觉改动不应复制、替换或绕过其中的逻辑。
