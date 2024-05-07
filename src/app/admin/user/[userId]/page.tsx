"use client";
import Alert from "@/app/alert/alert";
import { useAlert } from "@/app/alert/useAlert";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaBackspace } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";

interface Params {
  userId: string;
}

interface RouteParams {
  params: Params;
}

interface Medicine {
  id: number;
  name: string;
  type: string;
  title: string;
  description: string;
  concentrationString: string;
  dailyDoseNumber: string;
  doseAmount: string;
  numDays: string;
}

interface PrescriptionDose {
  id: number;
  medicineId: number;
  prescriptionId: number;
  customTitle: string;
  customDescription: string;
  Medicines: Medicine;
}

interface Prescription {
  id: number;
  ownerID: string;
  patientAge: number;
  patientWeight: number;
  prescriptionName: string;
  PrescriptionDose: PrescriptionDose[];
}

interface UserActivity {
  id: string;
  time: string;
  action: string;
  owner: string;
}

interface UserStats {
  id: string;
  role: string;
  email: string;
  createdAt: string;
  copiesMade: number;
  Prescription: Prescription[];
  ActivityLog: UserActivity[];
}

const emptyStats: UserStats = {
  id: "",
  role: "",
  email: "",
  createdAt: "",
  copiesMade: 0,
  Prescription: [],
  ActivityLog: []
};

function UserStats({ params: { userId } }: RouteParams) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const supabase = createClient();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>(emptyStats);

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
    const jwtToken = (await supabase.auth.getSession()).data.session
      ?.access_token;

    const response = await fetch("/api/getUserStats", {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        userId: userId,
      },
    });
    const respJson = await response.json();

    if (!response.ok) {
      //user is not logged in or is not an admin, so redirect them back to the dashboard page
      router.push("/dashboard");
      return;
    }

    //store all of the user data in the state list
    console.log(respJson.data);
    setUserStats(respJson.data);
    setIsLoading(false);
  };

  const getMedicineCounts = () => {
    //get dictionary with the number of occurences of each medicine in the saved prescriptions
    let counts: any = {};

    for (const prescription of userStats?.Prescription) {
      for (const dose of prescription.PrescriptionDose) {
        const medicine = dose.Medicines;
        const currentCount = counts[medicine.name] || 0;
        counts[medicine.name] = currentCount + 1;
      }
    }

    //convert the dictionary into a list of tuples (medicine name, counts)
    const countList = Object.keys(counts).map((name) => {
      return [name, counts[name]];
    });

    //sort the list in decreasing order of counts
    countList.sort((a, b) => b[1] - a[1]);
    return countList;
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
      {showAlert && <Alert message={message} type={type} />}

      <div data-theme="light" className="absolute top-0 w-full p-5">
        <button onClick={() => router.push("/admin")}>
          <FaArrowLeft />
        </button>
        <h1 className="pt-5 text-center text-3xl">{userStats?.email}</h1>
        <p className="text-center mt-1 mb-5">Data de criação: {(new Date(userStats?.createdAt)).toUTCString()}</p>

        <div className="mt-5">
          <p className="text-center text-xl">Medicamentos prescritos (prescrições salvas): </p>
          <ul className="menu mt-4 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-96">
            {getMedicineCounts().map(([name, count], id) => (
              <li key={id} className="block relative group text-center p-5">
                <span className="font-bold">{name}</span> 
                <span>
                ({count == 1 ? '1 vez' : `${count} vezes`})
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-5">
          <p className="text-center text-xl">Atividade</p>

          <ul className="menu mt-4 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-96">
            {userStats.ActivityLog
              .sort((a, b) => (new Date(a.time)) > (new Date(b.time)) ? -1 : 1)
              .map((activity, id) => (
              <li key={id} className="block relative group text-center p-5">
                <span>({(new Date(activity.time).toUTCString())})</span>
                <span className="font-bold">{activity.action}</span>
              </li>
            ))
          }
          </ul>
        </div>
      </div>
    </>
  );
}


//add copies made
//activity log
export default UserStats;
