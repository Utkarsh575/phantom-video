import html2canvas from "html2canvas";

export async function captureComponentAsImage(
  elementId: string
): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  element.style.width = "500px";
  element.style.height = "500px";
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    width: 500,
    height: 500,
    scale: window.devicePixelRatio, 
  });
  element.style.width = "50px";
  element.style.height = "50px";
  // Convert the canvas to a Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create blob from canvas"));
      }
    });
  });
}
