"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";
import { useAlert } from "../alert/useAlert";
import Alert from "../alert/alert";
import { FaCross, FaCrown, FaLandMineOn, FaX } from "react-icons/fa6";

interface UserData {
  id: string;
  createdAt: string;
  email: string;
  role: string;
}

function AdminPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const onPageLoad = async () => {
    //refresh the user's local jwt token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      //error refreshing user token
      router.push("/dashboard");
      return;
    }

    //get the jwt token from local storage and send it to the server
    const jwtToken = (await supabase.auth.getSession()).data.session?.access_token;
    
    const response = await fetch("/api/getUsers", {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    const respJson = await response.json();

    if (!response.ok) {
      //user is not logged in or is not an admin, so redirect them back to the dashboard page
      router.push("/dashboard");
      return;
    }

    //store all of the user data in the state list
    console.log(respJson.users);
    setUsers(respJson.users);
    setIsLoading(false);
  };

  useEffect(() => {
    onPageLoad();
  }, []);

  //show the loading indicator if the page is loading
  if (isLoading)
    return (
      <div
        className="flex items-center justify-center h-screen"
        data-theme="light"
      >
        <span className="loading loading-ring loading-lg text-center"></span>
      </div>
    );

  return (
    <>
      {/* Alert bar at the top */}
      {showAlert && <Alert message={message} type={type} />}

      <div data-theme="light" className="absolute top-0 w-full h-full p-5">
        <h1 className="text-3xl font-semibold text-center mt-5">
          Panel de administrador
        </h1>

        <h2 className="mt-5 p-5 text-2xl">Usuários</h2>

        <ul className="menu mt-2 p-5 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-[80vh] text-center">
          {users.map((user, index) => (
            <li key={index} className="block relative text-center"
                onClick={() => router.push(`/admin/user/${user.id}`)}>
              <span>
                {user.email}
                {user.role === "admin" && (
                  <FaCrown className="text-yellow-400" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default AdminPage;
