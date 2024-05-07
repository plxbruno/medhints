import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { MedicineDosage, Prescription, emptyPrescription } from "./types";
import { translateType } from "../utils/translateSupabaseErrors";
import { collectText, printPDF } from "./utils";
import { createClient } from "../utils/supabase/client";
import { FaMinus } from "react-icons/fa6";

interface Props {
  currentPrescription: Prescription;
  setCurrentPrescription: Dispatch<SetStateAction<Prescription>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  triggerAlert: any;
  loadSavedPrescriptions: any;
  toggleMedicine: any;
  isUpperCase: boolean;
  setIsUpperCase: any;
}

function PrescriptionDisplay({
  currentPrescription,
  setCurrentPrescription,
  setIsLoading,
  triggerAlert,
  loadSavedPrescriptions,
  toggleMedicine, 
  isUpperCase, 
  setIsUpperCase
}: Props) {
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const [prescriptionName, setPrescriptionName] = useState<string>("");
  const [isModalOpen, toggleModal] = useState<boolean>(false);

  const supabase = createClient();

  /**
   * Update the medicine element internally when one of the medicine dose inputs is changed
   * @param event DOM event
   * @param type medicine type
   * @param index index of medicine in its medicine type list inside the currentPrescription
   * @param key the name of the input that was modified
   */
  const handleMedicineDosageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    type: keyof Prescription,
    index: number,
    key: keyof MedicineDosage
  ) => {
    const value = event.target.value;

    setCurrentPrescription((prevPrescription) => {
      const newMedicineList = [...prevPrescription[type]];
      const updatedMedicine = { ...newMedicineList[index], [key]: value };
      newMedicineList[index] = updatedMedicine;
      return { ...prevPrescription, [type]: newMedicineList };
    });
  };

  /**
   * Handle backspace event in the description input element, in order to treat Y/Y as an atomic unit
   * @param e The event object
   */
  const handleDescriptionKeyDown = (
    e: any,
    medType: string,
    medIndex: number
  ) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      const input = e.target;
      const val = input.value;
      const cursorPos = input.selectionStart;

      //regex to find blocks
      const regex = /(\d+|Y)\/(\d+|Y)/g;
      let match;

      //find all matches and determine if the cursor is at the start or end of a match
      while ((match = regex.exec(val)) !== null) {
        const [block, index] = [match[0], match.index];
        const blockEnd = index + block.length;

        //check if the cursor is at the start or end of a block
        if (
          (cursorPos === blockEnd && e.key === "Backspace") ||
          (cursorPos === index && e.key === "Delete")
        ) {
          e.preventDefault(); // Prevent default delete behavior
          const newValue = val.substring(0, index) + val.substring(blockEnd);

          //update the prescription state
          setCurrentPrescription((prevPrescription) => {
            const newMedicineList = [
              ...prevPrescription[medType as keyof Prescription],
            ];
            const updatedMedicine = {
              ...newMedicineList[medIndex],
              customDescription: newValue,
            };
            newMedicineList[medIndex] = updatedMedicine;
            return { ...prevPrescription, [medType]: newMedicineList };
          });

          setTimeout(() => input.setSelectionRange(index, index), 0);
          return;
        }
      }
    }
  };

  /**
   * Copy current currentPrescription to the clipboard
   */
  const copyPrescription = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (prescriptionRef.current) {
      //recursively traverse the dom structure to get all input nodes and their text values
      const textToCopy = collectText(prescriptionRef.current, isUpperCase);

      //use the Clipboard API to copy the text
      navigator.clipboard
        .writeText(textToCopy.trim())
        .then(() => triggerAlert("Texto copiado com sucesso", "success"))
        .catch(() => {
          triggerAlert("Falha ao copiar o texto", "error");
          setIsLoading(false);
        });
    }
  };

  /**
   * Save current currentPrescription to the database
   */
  const savePrescription = async () => {
    //save the current currentPrescription
    toggleModal(false);
    setIsLoading(true);

    //first add an entry to the Prescription table to create the currentPrescription object
    const { data: prescData, error: prescError } = await supabase
      .from("Prescription")
      .insert({
        prescriptionName,
      })
      .select()
      .single();

    if (prescError) {
      setIsLoading(false);
      triggerAlert("Erro ao salvar prescrição", "erro");
      console.log(prescError.message);
      return;
    }

    // then add the medicine doses to the PrescriptionDose table
    const { error: medError } = await supabase.from("PrescriptionDose").insert(
      Object.values(currentPrescription)
        .map((typeList) => {
          return typeList.map((dose: MedicineDosage) => {
            return {
              prescriptionId: prescData.id,
              medicineId: dose.medicine.id,
              customTitle: dose.customTitle,
              customDescription: dose.customDescription,
            };
          });
        })
        .flat()
    );

    if (medError) {
      triggerAlert("Error ao salvar prescrição", "erro");
      return;
    }

    //add the saved prescription to the front-end state
    await loadSavedPrescriptions();

    setIsLoading(false);
    triggerAlert("Prescrição salva com sucesso", "success");
  };

  /**
   * Handle the start of the drag action for a medicine element
   * @param e the drag event
   * @param category the category of the medicine being dragged
   * @param index the index of the medicine being dragged
   */
  const handleDragStart = (e: any, category: string, index: number) => {
    e.dataTransfer.setData("category", category);
    e.dataTransfer.setData("index", index);
  };

  /**
   * Handle the event where the medicine element gets dropped
   * @param e event triggered by the element over which the element being dragged is
   * @param category the type of the element where the drop occurs
   * @param dropIndex the index of the element where the drop occurs
   */
  const handleDragDrop = (e: any, category: string, dropIndex: number) => {
    e.preventDefault();
    const dragCategory = e.dataTransfer.getData("category");
    const dragIndex = parseInt(e.dataTransfer.getData("index"), 10);
    if (dragCategory !== category) return; //do not allow elements to be dragged to the lists of different medicine types

    const draggedItems = [...currentPrescription[dragCategory as keyof Prescription]];
    const draggedItem = draggedItems[dragIndex];
    
    //swap the positions of the dragged item and the target destination in the list of elements
    draggedItems[dragIndex] = draggedItems[dropIndex];
    draggedItems[dropIndex] = draggedItem;

    setCurrentPrescription((prevPrescription) => ({
      ...prevPrescription,
      [category]: draggedItems
    }));
  };


  return (
    <>
      {/* Pop-up to enter the name of the currentPrescription before saving */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4"
          data-theme="light"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="font-bold text-lg">Insira o nome da prescrição</h3>
            <input
              type="text"
              className="input input-bordered w-full mt-4"
              value={prescriptionName}
              onChange={(e) => setPrescriptionName(e.target.value)}
              placeholder="Nome"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="btn btn-outline"
                onClick={() => toggleModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => savePrescription()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-box p-4 shadow">
        <div>
          <div
            className={`border border-black p-5 h-[60vh] md:h-[75vh] overflow-x-scroll overflow-y-scroll font-mono text-sm ${
              isUpperCase && "uppercase"
            }`}
            ref={prescriptionRef}
          >
            {[
              "oral",
              "injectable",
              "topic",
              "topicOftamologic",
              "topicOtologic",
              "nasal",
              "inhalational",
            ].map(
              (type) =>
                currentPrescription[type as keyof Prescription].length > 0 && (
                  <div key={type} className="p-5">
                    <h2 className="text-xl">Uso {translateType(type)}</h2>

                    <ol className="ml-5 list-decimal pt-3">
                      {currentPrescription[type as keyof Prescription].map(
                        (el, index) => (
                          <li key={index} 
                              draggable 
                              onDragStart={(e) => handleDragStart(e, type, index)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDragDrop(e, type, index)}
                              className="mt-3 group">
                            <div className="pl-3" id="single-line">
                              <input
                                className={`w-full ${
                                  isUpperCase && "uppercase"
                                }`}
                                value={el.customTitle}
                                onChange={(e) => {
                                  handleMedicineDosageChange(
                                    e,
                                    type as keyof Prescription,
                                    index,
                                    "customTitle"
                                  );
                                }}
                              />

                              <input
                                className={`w-full ${
                                  isUpperCase && "uppercase"
                                } mt-1`}
                                value={el.customDescription}
                                onChange={(e) => {
                                  handleMedicineDosageChange(
                                    e,
                                    type as keyof Prescription,
                                    index,
                                    "customDescription"
                                  );
                                }}
                                onKeyDown={(e) =>
                                  handleDescriptionKeyDown(e, type, index)
                                }
                              />

                              <button
                                onClick={() => toggleMedicine(el.medicine)}
                                className="btn opacity-0 group-hover:opacity-100"
                              >
                                <FaMinus className="w-4" />
                              </button>
                            </div>
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )
            )}
          </div>

          <div className="mt-4 flex flex-col md:flex-row w-full gap-2">
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

            <button
              className="btn btn-outline"
              onClick={() => copyPrescription()}
            >
              Copiar
            </button>

            <button
              className="btn btn-outline"
              onClick={() => setCurrentPrescription(emptyPrescription)}
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
                await printPDF(prescriptionRef, null);
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

export default PrescriptionDisplay;
