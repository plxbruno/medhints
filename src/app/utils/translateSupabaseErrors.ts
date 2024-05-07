/**
 * Utility function to translate supabase error messages to Portuguese
 */

export const translate = (msg: string) => {
    //hard-coded translations for common error messages
    switch (msg){
        case "Password should be at least 6 characters.":
            return "A palavra de passe tem de ter pelo menos 6 caracteres";
        case "Unable to validate email address: invalid format":
            return "Email inválido";
        case "Invalid login credentials":
            return "Detalhes incorretos";
        default:
            return "Erro durante of processo de autenticação";
    }
}

export const translateType = (type: string) => {
    switch (type){
        case "oral":
            return "oral";
        case "injectable":
            return "injetável";
        case "topic":
            return "Tópico";
        case "topicOftamologic":
            return "Tópico Oftamológico";
        case "topicOtologic":
            return "Tópico Otológico";
        case "nasal":
            return "Nasal";
        case "inhalational":
            return "Inalatório";
        default:
            return type;
    }
}