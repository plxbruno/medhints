import React, { Dispatch, SetStateAction, useState } from "react";
import { emptyModel, Model } from "./types";
import { createClient } from "../utils/supabase/client";
import { printPDF } from "./utils";

interface Props {
  currentModel: Model;
  setCurrentModel: Dispatch<SetStateAction<Model>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  triggerAlert: any;
  loadSavedModels: any;
  isUpperCase: boolean;
  setIsUpperCase: any;
}

function ModelDisplay({
  currentModel,
  setCurrentModel,
  setIsLoading,
  triggerAlert,
  loadSavedModels,
  isUpperCase, 
  setIsUpperCase
}: Props) {
  const [isModalOpen, toggleModal] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("");
  const supabase = createClient();

  /**
   * Copy the contents of the current model to the clipboard
   */
  const copyModel = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    //use the Clipboard API to copy the text
    navigator.clipboard
      .writeText(isUpperCase ? currentModel.content.toUpperCase() : currentModel.content)
      .then(() => triggerAlert("Texto copiado com sucesso", "success"))
      .catch(() => {
        triggerAlert("Falha ao copiar o texto", "error");
        setIsLoading(false);
      });
  };

  /**
   * Save the current model to the database
   */
  const saveModel = async () => {
    toggleModal(false);
    setIsLoading(true);

    //add new model to the database
    const { error } = await supabase.from("Models").upsert(
      {
        name: modelName,
        content: currentModel.content,
      },
      {
        onConflict: "name",
      }
    );

    //check if there was an error with the operation
    if (error) {
      setIsLoading(false);
      triggerAlert("Erro ao salvar o modelo", "error");
      return;
    }

    //update the liast of saved models in the front-end
    await loadSavedModels();
    setIsLoading(false);
    triggerAlert("Modelo salvo com sucesso", "success");
  };

  return (
    <>
      {/* Pop-up to enter the name of the current model before saving */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4"
          data-theme="light"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="font-bold text-lg">Insira o nome do modelo</h3>
            <input
              type="text"
              className="input input-bordered w-full mt-4"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Nome"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="btn btn-outline"
                onClick={() => toggleModal(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => saveModel()}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-box p-4 shadow">
        <div>
          <textarea
            className={`border border-black p-5 h-[60vh] md:h-[75vh] overflow-y-scroll font-mono text-sm w-full textarea ${
              isUpperCase && "uppercase"
            }`}
            value={currentModel.content}
            onChange={(e) =>
              setCurrentModel({ ...currentModel, content: e.target.value })
            }
          ></textarea>

          <div className="mt-3 flex flex-col md:flex-row w-full gap-2">
            {/* Checkbox to allow user to make all of the prescription text upper case */}
            <div className="flex flex-row md:flex-col items-center">
              <label className="label cursor-pointer">
                <span className="label-text mr-2">Maiúsculas</span>
                <input
                  type="checkbox"
                  checked={isUpperCase}
                  onChange={(e) => setIsUpperCase(e.target.checked)}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            <button className="btn btn-outline" onClick={() => copyModel()}>
              Copiar
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setCurrentModel(emptyModel)}
            >
              Limpar
            </button>

            <button
              className="btn btn-outline"
              onClick={() => toggleModal(true)}
            >
              Salvar
            </button>

            <button
              className="btn btn-outline"
              onClick={async () => {
                setIsLoading(true);
                await printPDF(null, currentModel.content);
                setIsLoading(false);
              }}
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ModelDisplay;
