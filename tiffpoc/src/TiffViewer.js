import React, { useEffect, useRef } from 'react';
import Tiff from 'tiff.js';

function TiffViewer({ fileUrl }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Load and render the TIFF file
    const fetchAndRenderTiff = async () => {
      try {
        // Fetch the TIFF file as an ArrayBuffer
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();

        // Create a new TIFF image
        const tiff = new Tiff({ buffer: arrayBuffer });

        // Get the first page (if it's a multipage TIFF) and draw it on the canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const width = tiff.width();
        const height = tiff.height();
        canvas.width = width;
        canvas.height = height;

        // Draw the TIFF image onto the canvas
        context.drawImage(tiff.toCanvas(), 0, 0);
      } catch (error) {
        console.error("Error displaying TIFF file:", error);
      }
    };

    fetchAndRenderTiff();
  }, [fileUrl]);

  return (
    <canvas ref={canvasRef} />
  );
}

export default TiffViewer;
