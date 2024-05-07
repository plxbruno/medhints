import { RefObject } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Given a node, add all of the text inside it by recursively traversing through its children
 * For input elements, extracts the input text contained inside them
 * @param node the root node
 * @returns the text
 */
export const collectText = (node: ChildNode, isUppercase: boolean): string => {
  let textContent = "";

  //check if the node is an element
  if (node.nodeType === Node.ELEMENT_NODE) {
    //if the element is an input, add the value it is currently holding
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLSelectElement
    ) {
      textContent += node.value + '\n';
    } else if (node.nodeName !== 'BUTTON') { //ignore buttons 
      //if node is a li element in a ordered list, add the ordering number manually since it is not part of the text content
      if (
        node.nodeName === "LI" &&
        node.parentNode &&
        node.parentNode.nodeName === "OL"
      ) {
        const olElement = node.parentNode as HTMLOListElement;
        const index = Array.from(olElement.children).indexOf(node as HTMLLIElement) + 1; //get the order number of the node, given by its index plus 1
        textContent += `${index}. `;
      } 

      node.childNodes.forEach((child) => {
        textContent += collectText(child, isUppercase);
      });

      if (node.nodeName !== "DIV" && node.nodeName !== "OL") textContent += '\n'
      if (node.nodeName === 'H2') textContent += '\n'       //if element is a header, add an extra new line divider
    }

  } else if (node.nodeType === Node.TEXT_NODE) {
    // if the node is a raw text node, just add its contents (recursive base case)
    if (node.textContent) {
      textContent += node.textContent + " ";
    }
  }

  if (isUppercase) textContent = textContent.toUpperCase();

  return textContent.replaceAll("  ", " "); //remove double spaces and double line breaks
};

/**
 * Given a reference to a div, convert it to a pdf and add the option to print it
 * @param ref reference to the div with the content to be printed
 */
export const printPDF = async (ref: RefObject<HTMLDivElement> | null, textContent: string | null ) => {
  //generate pdf from reference to html div
  if (ref && ref.current){
    // clone div, in order to modify the target div for printing
    const clonedDiv = ref.current.cloneNode(true) as HTMLDivElement;
    clonedDiv.style.cssText =
      "color: black; border: none; height: 297mm; width: 210mm;"; //remove border and re-size to a4 page size

    // replace input elements with their text values
    const inputs = clonedDiv.querySelectorAll("input");
    inputs.forEach((input) => {
      const textSpan = document.createElement("span");
      textSpan.textContent = input.value || "0";
      textSpan.style.cssText = `min-width: ${input.offsetWidth}px; display: inline-block; color: black; border: none;`;
      input.parentNode?.replaceChild(textSpan, input);
    });

    document.body.appendChild(clonedDiv);

    // convert the cloned div to pdf
    const canvas = await html2canvas(clonedDiv, { scale: 5 });
    const pdf = new jsPDF("p", "mm", "a4");
    // adjust the sizing to make content fit in A4 page
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);

    // open pdf in new window with option to print
    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    var pdfWindow = window.open("");
    if (pdfWindow) {
      pdfWindow.document.write(
        `<html><head><title>Print PDF</title><style>body, html { margin: 0; padding: 0; border: none; outline: none; } iframe { width: 100%; height: 100%; border: none; outline: none; }</style></head><body><iframe src="${blobUrl}" frameborder="0"></iframe></body></html>`
      );

      pdfWindow.onload = () => {
        pdfWindow?.focus();
        pdfWindow?.print();
        pdfWindow?.document.close();
        pdfWindow?.close();
      };
    } else {
      console.log("Could not open pdf window");
    }

    document.body.removeChild(clonedDiv);

  //generate pdf from input string
  } else if (textContent) {
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.text(textContent, 10, 10);

    //generate data url for pdf
    const pdfUrl = pdf.output('bloburl');
    window.open(pdfUrl, '_blank');

  //invalid arguments (neither text content nor div reference are valid)
  } else {
    console.log("Could not get div reference");
  }
};
