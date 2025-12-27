import { NextResponse } from "next/server";
import { supabase } from "~/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user } = body;

    if (!user || !user.fid) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    // Prepare data
    const userData = {
      fid: user.fid,
      username: user.username,
      display_name: user.displayName,
      pfp_url: user.pfpUrl,
      wallet_address: user.verifications?.[0] || null, // taking first verified address
      last_seen: new Date().toISOString(),
    };

    // Upsert user
    const { error } = await supabase
      .from("users")
      .upsert(userData, { onConflict: "fid" });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Internal error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
