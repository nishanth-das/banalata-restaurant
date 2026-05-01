// lib/imageProcessor.js

/**
 * Processes an image file: crops it to a square and compresses it to WebP.
 * @param {File} file - The original image file from input
 * @returns {Promise<Blob>} - The processed WebP blob
 */
export async function processMenuImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // We want a square crop for the bento cards
        const size = 800; // High enough quality for retina displays
        canvas.width = size;
        canvas.height = size;

        // Calculate crop (center cover)
        const minSide = Math.min(img.width, img.height);
        const sourceX = (img.width - minSide) / 2;
        const sourceY = (img.height - minSide) / 2;

        // Draw to canvas
        ctx.drawImage(
          img,
          sourceX, sourceY, minSide, minSide, // Source
          0, 0, size, size // Destination
        );

        // Convert to WebP with 0.8 quality (perfect balance)
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/webp",
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
