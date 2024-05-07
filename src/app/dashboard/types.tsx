/**
 * Medicine type
 */
export interface Medicine {
    id: number;
    name: string;
    type: keyof Prescription;
    title: string;
    description: string;
};

export const emptyMedicine: Medicine = {
   id: -1, 
   name: '', 
   type: 'oral', 
   title: '', 
   description: ''
};


/**
 * Medicine dose type
 */
export interface MedicineDosage {
    medicine: Medicine;
    customTitle: string;
    customDescription: string;
};


/**
 * Prescription type
 */
export interface Prescription {
    oral: MedicineDosage[];
    injectable: MedicineDosage[];
    topic: MedicineDosage[];
    topicOftamologic: MedicineDosage[];
    topicOtologic: MedicineDosage[];
    nasal: MedicineDosage[];
    inhalational: MedicineDosage[];
};

export const emptyPrescription: Prescription = {
    oral: [],
    injectable: [],
    topic: [],
    topicOftamologic: [],
    topicOtologic: [],
    nasal: [],
    inhalational: []
};


/**
 * Saved Prescription type
 */
export interface SavedPrescription {
    id: number;
    prescription: Prescription;
    name: string;
};


/**
 * Treatment model (free text format) type
 */
export interface Model {
    id: number;
    owner: string;
    content: string;
    name: string;
};

export const emptyModel: Model = {
    id: -1, 
    owner: '', 
    content: '', 
    name: ''
};


/**
 * Enum to store currently selected tab
 */
export enum Section {
    NewPrescription,
    SavedPrescriptions,
    Models,
};