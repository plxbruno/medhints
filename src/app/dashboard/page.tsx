"use client";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Alert from "../alert/alert";
import { useAlert } from "../alert/useAlert";
import {
  Medicine,
  MedicineDosage,
  Prescription,
  SavedPrescription,
  Section,
  emptyPrescription,
  Model, 
  emptyModel
} from "./types";
import PrescriptionDisplay from "./prescriptionDisplay";
import ModelDisplay from "./modelDisplay";

export default function Dashboard() {
  //router and supabase objects
  const supabase = createClient();
  const router = useRouter();

  const [medicineList, setMedicineList] = useState<Medicine[]>([]); //list of available medicines
  const [savedPrescriptions, setSavedPrescriptions] = useState<SavedPrescription[]>([]); //list of saved prescriptions
  const [savedModels, setSavedModels] = useState<Model[]>([]); //list of saved models

  const [currentPrescription, setCurrentPrescription] = useState<Prescription>(emptyPrescription); //currently selected prescription
  const [currentModel, setCurrentModel] = useState<Model>(emptyModel); //currently selected model

  //UI state management
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<Section>(Section.NewPrescription);
  const [isUpperCase, setIsUpperCase] = useState<boolean>(false);

  /**
   * Function to called when the page is loaded to check if user is logged in
   */
  const onPageLoad = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      router.push("/");
    }

    await loadMedicines();
    await loadSavedPrescriptions();
    await loadSavedModels();
    setIsLoading(false);
  };

  /**
   * Retrieve the list of all the saved medicines when the page is loaded
   */
  const loadMedicines = async () => {
    const { data, error } = await supabase.from("Medicines").select("*");
    if (error) {
      triggerAlert("Erro a carregar medicamentos", "error");
    }

    setMedicineList(data?.sort((a, b) => a.name.localeCompare(b.name)) || []); //sort the medicine names alphabetically
  };

  /**
   * Retrieve the list of all saved prescriptions when the page is loaded
   */
  const loadSavedPrescriptions = async () => {
    //get all of the prescriptions from the database, incluiding the medicine doses and medicine objects linked through the foreign keys (cascading)
    const { data: prescriptions, error } = await supabase.from("Prescription")
      .select(`
          *,
          PrescriptionDose(
            *,
            Medicines(*)
          )
      `);

    //if there is an error retrieving the data from the database trigger the alert bar
    if (error) {
      triggerAlert("Erro a carregar as prescrições salvas", "error");
      console.log(prescriptions);
      return;
    }

    //convert the data fetched from the database into nested objects and store them in the state array
    const savedPrescriptions: SavedPrescription[] = prescriptions.map(
      (prescription) => {
        let prescriptionObject: Prescription = emptyPrescription; //create empty prescription

        //add all of the doses to the empty object
        prescription.PrescriptionDose.forEach((dose: any) => {
          //create new dose object
          const doseObject: MedicineDosage = {
            medicine: dose.Medicines,
            customTitle: dose.customTitle,
            customDescription: dose.customDescription,
          };

          //add dose to the prescription object
          prescriptionObject = {
            ...prescriptionObject,
            [doseObject.medicine.type]: [
              ...prescriptionObject[doseObject.medicine.type],
              doseObject,
            ],
          };
        });

        //wrap the Prescription object in a SavedSavedPrescription object to include the name, age and weight information
        const savedPrescription: SavedPrescription = {
          id: prescription.id,
          name: prescription.prescriptionName,
          prescription: prescriptionObject,
        };

        return savedPrescription;
      }
    );

    setSavedPrescriptions(savedPrescriptions);
  };

  /**
   * Retrieve the list of treatment plan models saved by the user
   */
  const loadSavedModels = async () => {
    const {data: models, error} = await supabase.from("Models").select("*"); //row level security ensures that only rows created by user are returned without any need for filtering
    console.log(models);
    if (error){
      triggerAlert("Erro a carregar os modelos salvos", "error");
      return;
    }

    setSavedModels(models);
  }

  useEffect(() => {
    onPageLoad();
  }, []);

  /**
   * Check if medicine is in the currentPrescription being currently created
   * @param medicine
   * @returns true if medicine is in the current currentPrescription and false otherwise
   */
  const isInPrescription = (medicine: Medicine) => {
    return currentPrescription[medicine.type].some(
      (el) => el.medicine.id === medicine.id
    );
  };

  /**
   * Add / remove medicine from the list in the current currentPrescription
   * @param medicine the medicine being toggled
   */
  const toggleMedicine = (medicine: Medicine) => {
    setCurrentPrescription((prevPrescription) => {
      if (
        prevPrescription[medicine.type].some(
          (el) => el.medicine.id === medicine.id
        )
      ) {
        return {
          ...prevPrescription,
          [medicine.type]: prevPrescription[medicine.type].filter(
            (el) => el.medicine.id !== medicine.id
          ),
        };
      }

      const newDose: MedicineDosage = {
        medicine: medicine,
        customDescription: medicine.description,
        customTitle: formatTitle(medicine.title),
      };

      return {
        ...prevPrescription,
        [medicine.type]: [...prevPrescription[medicine.type], newDose],
      };
    });
  };

  /**
   * Align the title content by adding the necessary number of '-' characters for padding
   * @param title the title string getting aligned
   * @returns the aligned title string
   */
  const formatTitle = (title: string) => {
    title = title.replace("/(-*)/g", "-"); //replace multiple dashes with a single dash
    const length = title.length;
    title = title.replace("-", "-".repeat(Math.max(1, 70 - length)));
    return title;
  };

  /**
   * Delete a prescription from the database
   */
  const deletePrescription = async (prescriptionId: number) => {
    setIsLoading(true);

    //send request to supabase database to delete the prescription
    const { error } = await supabase
      .from("Prescription")
      .delete()
      .eq("id", prescriptionId);

    if (error) {
      triggerAlert("Erro ao apagar a prescrição", "error");
      setIsLoading(false);
      return;
    }

    //delete prescription from front-end
    setSavedPrescriptions((prev) =>
      prev.filter((presc) => presc.id !== prescriptionId)
    );

    triggerAlert("Prescrição apagada com sucesso", "success");
    setIsLoading(false);
  };

  /**
   * Delete a saved model from the database
   * @param id 
   */
  const deleteModel = async (modelId: number) => {
    setIsLoading(true);

    const { error } = await supabase
      .from("Models")
      .delete()
      .eq("id", modelId);

    if (error){
      triggerAlert("Erro ao apagar a prescrição", "error");
      setIsLoading(false);
      return;
    }

    setSavedModels((prev) => 
      prev.filter((model) => model.id !== modelId)
    );

    triggerAlert("Modelo apagado com sucesso", "success");
    setIsLoading(false);
  }

  /**
   * Log the user out
   */
  const logOut = async () => {
    setIsLoading(true);

    //log the logout operation in the database for analytics purposes
    await supabase.from("ActivityLog").insert({ action: "Fez log out" });
    await supabase.auth.signOut();
    router.push("/");
  };

  
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

      <div
        className="w-full pb-5 md:h-screen md:overflow-y-hidden pt-5"
        data-theme="light"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p">
          <div className="col-span-1 rounded-box p-2 shadow">
            {/* Tab buttons on the left section */}
            <div className="flex flex-row flex-wrap justify-center">
              <div className="m-1">
                <button
                  className={`btn ${
                    tab !== Section.NewPrescription
                      ? "btn-outline"
                      : "btn-neutral"
                  } w-full`}
                  onClick={() => {
                    setTab(Section.NewPrescription);
                  }}
                >
                  Prescrição
                </button>
              </div>

              <div className="m-1">
                <button
                  className={`btn ${
                    tab !== Section.SavedPrescriptions
                      ? "btn-outline"
                      : "btn-neutral"
                  } w-full`}
                  onClick={() => {
                    setTab(Section.SavedPrescriptions);
                  }}
                >
                  Minhas Prescrições
                </button>
              </div>

              <div className="m-1">
                <button
                  className={`btn ${
                    tab !== Section.Models ? "btn-outline" : "btn-neutral"
                  } w-full`}
                  onClick={() => setTab(Section.Models)}
                >
                  Modelos
                </button>
              </div>
            </div>

            <div className="p-5">
              <label className="input input-bordered flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-4 h-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  className="grow"
                  placeholder="Search"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>

              {/* If user is creating new currentPrescription just show the list of available medicines */}
              {tab === Section.NewPrescription && (
                <>
                  <div>
                    <ul className="menu mt-4 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-96 md:h-[62vh]">
                      {medicineList
                        .filter((el) =>
                          el.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((el, index) => (
                          <li key={index} className="block relative group">
                            <span
                              className={
                                isInPrescription(el) ? "text-red-500" : ""
                              }
                              onClick={() => toggleMedicine(el)}
                            >
                              {el.name}
                            </span>
                            <button
                              className="absolute right-0 top-0 h-full flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() =>
                                router.push(`medicine/edit/${el.id}`)
                              }
                            >
                              <svg
                                width="24px"
                                height="24px"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                color="#000000"
                              >
                                <path
                                  d="M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942"
                                  stroke="#000000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </svg>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="pt-5 text-center">
                    <button
                      className="btn btn-outline w-32"
                      onClick={() => router.push("medicine/new")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 opacity-70"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5h-5a1 1 0 110-2h5v-5a1 1 0 011-1z"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}

              {/* If user wants to load an existing currentPrescription show the list of existing prescriptions */}
              {tab === Section.SavedPrescriptions && (
                <div>
                  <ul className="menu mt-4 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-96 md:h-[62vh]">
                    {savedPrescriptions
                      .filter((el) =>
                        el.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                      .map((el, index) => {
                        return (
                          <li key={index} className="block relative group">
                            <span
                              onClick={() => {
                                //set the current prescription
                                setCurrentPrescription(el.prescription);

                                //navigate to the prescription editing section
                                setTab(Section.NewPrescription);
                              }}
                            >
                              {el.name}
                            </span>

                            <button
                              className="absolute right-0 top-0 h-full flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => deletePrescription(el.id)}
                            >
                              <svg
                                width="24px"
                                height="24px"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                color="#FF0000"
                              >
                                <path
                                  d="M3 6H5H21"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M7 6V4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H15C15.5304 2 16.0391 2.21071 16.4142 2.58579C16.7893 2.96086 17 3.46957 17 4V6M19 6V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H7C6.46957 20 5.96086 19.7893 5.58579 19.4142C5.21071 19.0391 5 18.5304 5 18V6H19Z"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11V17"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 11V17"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              {/* Models section */}
              {tab === Section.Models && (
                <div>
                    <ul className="menu mt-4 grid grid-cols-1 auto-rows-min overflow-y-scroll w-full bg-base-100 text-base-content border border-black h-96 md:h-[62vh]">
                      {savedModels
                        .filter((el) =>
                          el.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((el, index) => (
                          <li key={index} className="block relative group">
                            <span
                              onClick={() => setCurrentModel(el)}
                            >
                              {el.name}
                            </span>

                            <button
                              className="absolute right-0 top-0 h-full flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => deleteModel(el.id)}
                            >
                              <svg
                                width="24px"
                                height="24px"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                color="#FF0000"
                              >
                                <path
                                  d="M3 6H5H21"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M7 6V4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H15C15.5304 2 16.0391 2.21071 16.4142 2.58579C16.7893 2.96086 17 3.46957 17 4V6M19 6V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H7C6.46957 20 5.96086 19.7893 5.58579 19.4142C5.21071 19.0391 5 18.5304 5 18V6H19Z"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11V17"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M14 11V17"
                                  stroke="#FF0000"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3">
            {/* Show formated prescription div it the user is creating a new prescription or editing a saved one */}
            {(tab === Section.NewPrescription || tab === Section.SavedPrescriptions) && (
                <PrescriptionDisplay
                  currentPrescription={currentPrescription}
                  setCurrentPrescription={setCurrentPrescription}
                  loadSavedPrescriptions={loadSavedPrescriptions}
                  setIsLoading={setIsLoading}
                  triggerAlert={triggerAlert}
                  toggleMedicine={toggleMedicine}
                  isUpperCase={isUpperCase}
                  setIsUpperCase={setIsUpperCase}
                />
            )}

            {tab === Section.Models && 
                <ModelDisplay 
                  currentModel={currentModel}
                  setCurrentModel={setCurrentModel}
                  loadSavedModels={loadSavedModels}
                  setIsLoading={setIsLoading}
                  triggerAlert={triggerAlert}
                  isUpperCase={isUpperCase}
                  setIsUpperCase={setIsUpperCase}
                />
            }

            <div className="text-right">
              <button
                className="btn btn-outline btn-error mt-5 px-10 mr-5"
                onClick={logOut}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
