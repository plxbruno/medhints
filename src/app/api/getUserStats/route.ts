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

  //get the id of the user from which the stats are taken
  const targetUserId = request.headers.get("userId");

  //use foreign key relations to get all prescriptions created by user, with all of the doses for each prescriptions
  //and the medicine in each dose
  const { data, error } = await supabase
    .from("Profile")
    .select(`*, 
            ActivityLog(*), 
            Prescription(
              *, 
              PrescriptionDose(
                *, 
                Medicines(*)
              )
            )`
          )
    .eq("id", targetUserId)
    .single();

  if (error)
    return NextResponse.json({error: error.message});
  
  return NextResponse.json({ data });
}
