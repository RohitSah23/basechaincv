import { NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("fid, username, display_name, pfp_url, score, reaction_time")
      .order("score", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Add rank
    const rankedData = data.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    return NextResponse.json({ leaderboard: rankedData });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, score, time } = body;

    if (!fid || score === undefined) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Get current score
    console.log("Fetching current score for FID:", fid);
    const { data: current, error: fetchError } = await supabase
      .from("users")
      .select("score, reaction_time")
      .eq("fid", fid)
      .single();
    
    // Ignore error if user just doesn't exist yet (though sync should have created them)
    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching user score:", fetchError);
        // Don't throw, just assume 0? Or maybe throw to see why.
    }

    const previousScore = current?.score || 0;
    const previousTime = current?.reaction_time || Infinity;

    // 2. Only update if score is higher
    if (score > previousScore) {
      const { error } = await supabase
        .from("users")
        .update({ 
          score: Math.floor(score),
          reaction_time: Math.floor(Math.min(time, previousTime))
          // Let's just store the time associated with the best score, OR the best time ever.
          // User said "rank fid points". So points (score) is key.
          // I will update reaction_time ONLY if this is a high score run. 
          // Or I should track "best_reaction_time" independently?
          // Let's rely on score for now.
        })
        .eq("fid", fid);

      if (error) throw error;
      return NextResponse.json({ success: true, updated: true });
    }

    return NextResponse.json({ success: true, updated: false });

  } catch (e: any) {
    console.error("Score POST Error details:", e);
    return NextResponse.json({ error: String(e), details: e.message }, { status: 500 });
  }
}
