import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getMediaRuntimeDiagnostics } from "@/lib/media/extractAudio";

export const dynamic = "force-dynamic";

async function getTableCount(tableName: "stations" | "recipes") {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { count: 0, ok: false };
  }

  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  return {
    count: count ?? 0,
    ok: !error,
  };
}

export async function GET() {
  const configured = isSupabaseConfigured();
  const [stations, recipes, mediaRuntime] = await Promise.all([
    getTableCount("stations"),
    getTableCount("recipes"),
    getMediaRuntimeDiagnostics(),
  ]);

  return Response.json({
    deployCommit: process.env.DEPLOY_COMMIT_SHA || null,
    supabaseConfigured: configured,
    stationsCount: stations.count,
    recipesCount: recipes.count,
    stationsReadable: stations.ok,
    recipesReadable: recipes.ok,
    mediaRuntime,
    fallbackRetained: true,
  });
}
