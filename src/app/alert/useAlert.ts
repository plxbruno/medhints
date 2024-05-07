/**
 * Hook to manage the state of the alert component
 */
import { useState } from "react";

export const useAlert = () => {
    const [showAlert, setShowAlert] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState("");

    const triggerAlert = (msg: string, 
                          type: string, 
                          duration = 2000) => {
        setMessage(msg);
        setType(type);
        setShowAlert(true);

        setTimeout(() => setShowAlert(false), duration); //hide snackbar after <duration> ms
    }

    return { showAlert, message, type, triggerAlert };
}