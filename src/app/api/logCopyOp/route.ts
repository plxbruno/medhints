import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import validateToken from "../validateToken";
import { error } from "console";

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

  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json(
      {
        error: "You must provide a token",
      },
      { status: 401 }
    );
  }

  let user;

  try {
    //check if the token is valid
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
    if (!user) throw new Error("Token is not valid");
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err,
      },
      { status: 401 }
    );
  }

  //get the current number of copies made by the user
  const { data: profile, error: err1 } = await supabase
    .from("Profile")
    .select("*")
    .eq("id", user.id)
    .single();
  if (err1)
    return NextResponse.json(
      {
        error: err1,
      },
      { status: 401 }
    );

  const currentCopyCount = profile.copiesMade;

  //increment the number of copies made and store result in the database
  const { error: err2 } = await supabase
    .from("Profile")
    .update({ copiesMade: currentCopyCount + 1 })
    .eq("id", user.id);
  if (err2)
    return NextResponse.json(
      {
        error: err2,
      },
      { status: 401 }
    );

  return NextResponse.json(
    {
      data: "success",
    },
    { status: 200 }
  );
}
