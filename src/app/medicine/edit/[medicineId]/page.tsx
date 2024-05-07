"use client";

import Alert from "@/app/alert/alert";
import { useAlert } from "@/app/alert/useAlert";
import { emptyMedicine, Medicine, Prescription } from "@/app/dashboard/types";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Params {
  medicineId: string;
}

interface RouteParams {
  params: Params;
}

function EditMedicine({ params: { medicineId } }: RouteParams) {
  const [medicineData, setMedicineData] = useState<Medicine>(emptyMedicine);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    loadMedicineData();
  }, []);

  /**
   * Fetch the information of the medicine being edited from the database
   */
  const loadMedicineData = async () => {
    const { error, data } = await supabase
      .from("Medicines")
      .select("*")
      .eq("id", parseInt(medicineId))
      .single();

    if (error) {
      triggerAlert("Erro ao carregar o medicamento", "error");
      console.log(error.message);
      setIsLoading(false);
      return;
    }

    setMedicineData(data);
    setIsLoading(false);
  };

  /**
   * Update the database information of the medicine edited
   */
  const saveChanges = async () => {
    setIsLoading(true);

    //check if none of the input fields were left empty
    for (const key of Object.keys(medicineData)) {
      if (medicineData[key as keyof Medicine].toString().length == 0) {
        setIsLoading(false);
        triggerAlert("Deixou um ou mais campos por preencher", "error");
        return;
      }
    }

    const { error } = await supabase
      .from("Medicines")
      .update(medicineData)
      .eq("id", parseInt(medicineId));

    if (error) {
      triggerAlert("Erro ao salvar as mudanças", "error");
      setIsLoading(false);
      console.log(error.message);
      return;
    }

    triggerAlert("Mudanças salvas com sucesso", "success");
    setIsLoading(false);
  };

  /**
   * Delete the medicine from the database
   */
  const deleteMedicine = async () => {
    setIsLoading(true);

    const { error } = await supabase
      .from("Medicines")
      .delete()
      .eq("id", parseInt(medicineId));

    if (error) {
      triggerAlert("Erro ao apagar medicamento", "error");
      setIsLoading(false);
      console.log(error.message);
      return;
    }

    //redirect user back to dashboard if medicine is deleted successfully
    setIsLoading(false);
    router.push("/dashboard");
  };

  //show loading indicator
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

        <div className="p-5">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">
              Editor de medicamentos
            </h1>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label
                  htmlFor="nome"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Nome e concentração
                </label>
                <input
                  type="text"
                  id="nome"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Dipirona 500mg/ml"
                  value={medicineData.name}
                  onChange={(e) =>
                    setMedicineData({ ...medicineData, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="titulo"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Apresentação
                </label>
                <input
                  type="text"
                  id="titulo"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Dipirona 500mg/mL - 10 comprimidos"
                  value={medicineData.title}
                  onChange={(e) =>
                    setMedicineData({ ...medicineData, title: e.target.value })
                  }
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="descricao"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Forma de administração
                </label>
                <textarea
                  id="descricao"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Exemplo: Tomar 1 comprimido de 8/8 horas por 3 dias"
                  value={medicineData.description}
                  onChange={(e) =>
                    setMedicineData({
                      ...medicineData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="tipo"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Tipo
                </label>
                <select
                  id="tipo"
                  className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  value={medicineData.type}
                  onChange={(e) =>
                    setMedicineData({
                      ...medicineData,
                      type: e.target.value as keyof Prescription,
                    })
                  }
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
                  className="btn btn-primary"
                  type="submit"
                  onClick={saveChanges}
                >
                  Salvar mudanças
                </button>
                <button
                  className="btn btn-error"
                  type="button"
                  onClick={deleteMedicine}
                >
                  Apagar medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditMedicine;
