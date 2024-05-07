/**
 * Component to allow users to add a new medicine to the database
 */
"use client";
import React, { useEffect, useState } from "react";
import { Medicine, Prescription } from "../../dashboard/types";
import Alert from "../../alert/alert";
import { useAlert } from "../../alert/useAlert";
import { createClient } from "../../utils/supabase/client";
import { translate } from "../../utils/translateSupabaseErrors";
import { useRouter } from "next/navigation";

const initialState: Medicine = {
  id: 0,
  name: "",
  title: "",
  description: "",
  type: "oral",
};

function NewMedicine() {
  const [newMedicine, setNewMedicine] = useState<Medicine>(initialState);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    onPageLoad();
  }, []);

  /**
   * Check if user is has a valid session and redirect them to the landing page if they don't
   */
  const onPageLoad = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      router.push("/");
    }
    setIsPageLoading(false);
  };

  /**
   * Function to add new medicine to the database
   */
  const addMedicine = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsFormLoading(true);

    for (let key of Object.keys(newMedicine)) {
      if (
        key !== "id" &&
        (newMedicine[key as keyof Medicine] as string).length === 0
      ) {
        triggerAlert("Por favor, preencha todos os campos", "error");
        return;
      }
    }

    //remove id from the medicine object
    const newMedicineObj: any = { ...newMedicine };
    delete newMedicineObj["id"];
    const { error } = await supabase.from("Medicines").insert(newMedicineObj);

    if (error) {
      console.log(error);
      triggerAlert(translate(error.message), "error");
    } else {
      triggerAlert("Medicamento adicionado com sucesso", "success");
    }

    setIsFormLoading(false);
  };

  if (isPageLoading)
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

      <div data-theme="light" className="h-screen">
        <div className="p-5">
          <button
            className="btn btn-outline"
            onClick={() => router.push("/dashboard")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4 opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M8.707 3.293a1 1 0 0 1 0 1.414L6.414 7H14a1 1 0 1 1 0 2H6.414l2.293 2.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z"
              />
            </svg>
          </button>
        </div>

        <div className="w-full flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Novo medicamento
            </h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="nome"
                >
                  Nome e concentração
                </label>

                <input
                  type="text"
                  id="nome"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Dipirona 500mg/ml"
                  value={newMedicine.name}
                  onChange={(e) =>
                    setNewMedicine(() => {
                      return {
                        ...newMedicine,
                        name: e.target.value,
                      };
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="titulo"
                >
                  Apresentação
                </label>
                <input
                  type="text"
                  id="titulo"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Dipirona 500mg/ml - 10 comprimidos"
                  value={newMedicine.title}
                  onChange={(e) =>
                    setNewMedicine(() => {
                      return {
                        ...newMedicine,
                        title: e.target.value,
                      };
                    })
                  }
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="descricao"
                >
                  Forma de administração
                </label>
                <textarea
                  id="descricao"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Tomar 1 comprimido de 8/8 horas por 3 dias"
                  value={newMedicine.description}
                  onChange={(e) =>
                    setNewMedicine(() => {
                      return {
                        ...newMedicine,
                        description: e.target.value,
                      };
                    })
                  }
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="tipo"
                >
                  Tipo
                </label>
                <select
                  id="tipo"
                  className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  value={newMedicine.type}
                  onChange={(e) => {
                    setNewMedicine(() => {
                      return {
                        ...newMedicine,
                        type: e.target.value as keyof Prescription,
                      };
                    });
                  }}
                >
                  <option value="oral">Oral</option>
                  <option value="injectable">Injetável</option>
                  <option value="topic">Tópico</option>
                  <option value="topicOftamologic">Tópico oftamológico</option>
                  <option value="topicOtologic">Tópico otológico</option>
                  <option value="nasal">Nasal</option>
                  <option value="inhalational">Inalatório</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={() => addMedicine()}
                >
                  Adicionar
                </button>
              </div>

              {isFormLoading && (
                <div
                  className="flex items-center justify-center"
                  data-theme="light"
                >
                  <span className="loading loading-ring loading-lg text-center"></span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default NewMedicine;
