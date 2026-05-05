import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TAVILY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "TAVILY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        search_depth: "basic",
        max_results: 20,
        include_answer: false,
        include_images: false,
      }),
    });

    if (!tavilyRes.ok) {
      const errText = await tavilyRes.text();
      return new Response(
        JSON.stringify({ error: `Tavily API error: ${tavilyRes.status}`, detail: errText }),
        { status: tavilyRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: TavilyResponse = await tavilyRes.json();

    const results = (data.results ?? []).map((r, i) => {
      let displayUrl = r.url;
      try {
        const u = new URL(r.url);
        displayUrl = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
      } catch {
        // keep raw url
      }
      return {
        id: `tavily-${i}-${Date.now()}`,
        title: r.title || displayUrl,
        description: r.content.slice(0, 180),
        longDescription: r.content,
        advertiser: (() => {
          try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; }
        })(),
        url: r.url,
        displayUrl,
        tags: [],
      };
    });

    return new Response(
      JSON.stringify({ results, query: data.query }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
