import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

interface RetType{
  user: User | null;
  error: any;
}

/**
 * Check if the user making the request is an admin, before proceeding with the server-side code. 
 * If the user is an admin true is returned, otherwise an error message is returned
 */
export default async (supabase: SupabaseClient<any, "public", any>, request: Request): Promise<RetType> => {
  //check if user provided a token
  const token = request.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return {
      user: null, 
      error: 'You must provide a token'
    };
  }

  try {
    //check if the token is valid
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Token is not valid");

    //check if user is an admin
    const { data: targetUser, error: selectError } = await supabase
      .from("Profile")
      .select("*")
      .eq('id', user.id)
      .single();

    if (selectError) throw new Error(selectError.message);
    if (targetUser.role !== "admin") throw new Error("User is not an admin");
    return {user, error: null};

  } catch (err: any) {
    return {user: null, error: err};
  }
};
