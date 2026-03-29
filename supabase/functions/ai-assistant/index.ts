import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  politician_context?: {
    name?: string;
    party?: string;
    constituency?: string;
    state?: string;
    designation?: string;
  };
  mode?: "chat" | "speech" | "briefing" | "grievance_reply" | "social_post" | "press_release" | "talking_points" | "analysis";
  politician_id?: string;
  save_content?: boolean;
  content_type?: string;
  prompt_summary?: string;
}

function buildSystemPrompt(context: RequestBody["politician_context"], mode: string): string {
  const name = context?.name || "the politician";
  const party = context?.party || "their party";
  const constituency = context?.constituency || "their constituency";
  const state = context?.state || "their state";
  const designation = context?.designation || "Member of Parliament";

  const baseContext = `You are NETHRA AI, a highly intelligent political assistant for ${name}, ${designation} from ${constituency}, ${state}, representing ${party}.
You have deep expertise in Indian politics, parliamentary procedures, constituency management, and political communication.
Always be professional, factual, culturally sensitive to Indian politics, and focused on helping ${name} serve their constituents better.`;

  const modeInstructions: Record<string, string> = {
    chat: `${baseContext}
Answer questions, provide analysis, help with decisions, and offer strategic political advice.
Reference Indian political context, democratic values, and constituency welfare.`,

    speech: `${baseContext}
You are a professional speechwriter. Generate powerful, inspiring speeches that:
- Open with a strong hook relevant to the occasion
- Reference local constituency issues and achievements
- Include data points and specific examples where possible
- Use appropriate Telugu/regional phrases if suitable
- End with a memorable call to action
Format the output as a well-structured speech with clear sections.`,

    briefing: `${baseContext}
You are a political intelligence analyst. Generate comprehensive briefings that include:
- Executive summary (3-4 key points)
- Detailed analysis with supporting evidence
- Political implications and risks
- Recommended actions
- Key talking points
Be analytical, evidence-based, and strategically focused.`,

    grievance_reply: `${baseContext}
You are drafting official constituent correspondence. Write professional, empathetic replies that:
- Acknowledge the constituent's concern with genuine empathy
- Explain what action is being taken or has been taken
- Provide a realistic timeline
- Offer direct contact for follow-up
- Maintain a warm but official tone appropriate for government communication
- Sign off as ${name}`,

    social_post: `${baseContext}
You are a social media strategist. Create engaging posts that:
- Are appropriate for Indian political social media (Twitter/X, Facebook, Instagram)
- Use relevant hashtags
- Are authentic to ${name}'s voice
- Drive engagement and inform constituents
Provide 3 variations: one concise tweet (under 280 chars), one Facebook post, one Instagram caption.`,

    press_release: `${baseContext}
You are a press secretary. Write formal press releases with:
- Headline, subheadline, dateline
- Lead paragraph (who, what, when, where, why)
- Body with quotes from ${name}
- Background information
- Boilerplate about ${name}'s office
- Contact information placeholder
Follow standard press release format.`,

    talking_points: `${baseContext}
Generate crisp, memorable talking points that:
- Are factual and defensible
- Address key issues of ${constituency} and ${state}
- Counter common opposition arguments
- Highlight achievements and plans
Format as bullet points with supporting statistics where relevant.`,

    analysis: `${baseContext}
You are a political analyst. Provide deep, structured analysis including:
- Situation assessment
- Key stakeholders and their positions
- Political risks and opportunities
- Historical context where relevant
- Data-driven insights
- Strategic recommendations
Be objective, nuanced, and comprehensive.`,
  };

  return modeInstructions[mode] || modeInstructions.chat;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { messages, politician_context, mode = "chat", politician_id, save_content, content_type, prompt_summary } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(politician_context, mode);

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const session = new Supabase.ai.Session("llama3.1-70b");

    const stream = await session.run(
      { messages: allMessages },
      { stream: true }
    ) as ReadableStream;

    const reader = stream.getReader();
    const chunks: string[] = [];

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = typeof value === "string" ? value : new TextDecoder().decode(value);
            chunks.push(chunk);
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();

          if (save_content && politician_id && chunks.length > 0) {
            const fullContent = chunks.join("");
            const userPrompt = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

            await supabase.from("ai_generated_content").insert({
              politician_id,
              content_type: content_type || mode,
              prompt: prompt_summary || userPrompt.slice(0, 500),
              content: fullContent,
              is_saved: false,
            });
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
