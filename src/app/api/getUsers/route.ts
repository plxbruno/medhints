import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import validateToken from "../validateToken";

export async function GET(request: Request) {
  //create server side supabase client with service role key (to bypass row-level security)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  //check if user has provided valid token and is admin
  const authVal = await validateToken(supabase, request);

  if (authVal.error)
    return NextResponse.json({ error: authVal }, { status: 401 });

  //return all of the user profiles, or an error message if there is an error
  const { data: users, error } = await supabase.from("Profile").select("*");
  if (error) return NextResponse.json({ error }, { status: 401 });
  
  return NextResponse.json({ users });
}
