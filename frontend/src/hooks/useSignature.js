import { useState, useRef } from 'react';

export const useSignature = ({ canvasElements, setCanvasElements, handleSaveHistory, currentColor }) => {
  const [signatureData, setSignatureData] = useState(null);
  const signatureCanvasRef = useRef(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePoints, setSignaturePoints] = useState([]);
  const [showSignature, setShowSignature] = useState(false);

  const clearSignature = () => {
    setSignaturePoints([]);
    setSignatureData(null);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSignatureMouseDown = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawingSignature(true);
    setSignaturePoints([{ x, y }]);
  };

  const handleSignatureMouseMove = (e) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...signaturePoints, { x, y }];
    setSignaturePoints(newPoints);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor || '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (signaturePoints.length > 0) {
      const lastPoint = signaturePoints[signaturePoints.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleSignatureMouseUp = () => {
    setIsDrawingSignature(false);
    const canvas = signatureCanvasRef.current;
    if (canvas && signaturePoints.length > 2) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const addSignatureToCanvas = (src) => {
    const imgSrc = src || signatureData;
    if (!imgSrc) return;
    const newEl = { id: `el_${Date.now()}`, type: 'image', x: 100, y: 100, width: 200, height: 80, src: imgSrc };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    handleSaveHistory(updated);
    setShowSignature(false);
    clearSignature();
  };

  const handleSignaturePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = img.width;
        tmpCanvas.height = img.height;
        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) d[i + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
        addSignatureToCanvas(tmpCanvas.toDataURL('image/png'));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return {
    signatureData, setSignatureData,
    signatureCanvasRef,
    isDrawingSignature, setIsDrawingSignature,
    signaturePoints, setSignaturePoints,
    showSignature, setShowSignature,
    clearSignature,
    handleSignatureMouseDown,
    handleSignatureMouseMove,
    handleSignatureMouseUp,
    addSignatureToCanvas,
    handleSignaturePhotoUpload,
  };
};
