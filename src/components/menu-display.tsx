
"use client";

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MenuDisplay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);

  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument('/menu.pdf');
    loadingTask.promise.then((pdf: pdfjsLib.PDFDocumentProxy) => {
      setPdfDoc(pdf);
    });
  }, []);

  useEffect(() => {
    if (pdfDoc !== null) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum]);

  const renderPage = (num: number) => {
    setPageRendering(true);

    pdfDoc?.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (canvas && context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        page.render(renderContext);
        setPageRendering(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-auto flex justify-center">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default MenuDisplay;


