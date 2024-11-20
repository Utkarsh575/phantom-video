import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const GET = async () => {
  try {
    const { data, error } = await supabase
      .from('recent-videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      throw error;
    }

    return NextResponse.json({ videos: data });
  } catch (error) {
    console.error("Error fetching recent videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent videos." },
      { status: 500 }
    );
  }
};
