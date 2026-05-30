import { useState, useRef } from 'react';

export const useSignature = ({ canvasElements, setCanvasElements, handleSaveHistory, currentColor }) => {
  const [signatureData, setSignatureData] = useState(null);
  const signatureCanvasRef = useRef(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePoints, setSignaturePoints] = useState([]);
  const [showSignature, setShowSignature] = useState(false);
  const [sigPhotoRaw, setSigPhotoRaw] = useState(null);
  const [sigPhotoThreshold, setSigPhotoThreshold] = useState(200);

  const clearSignature = () => {
    setSignaturePoints([]);
    setSignatureData(null);
    setSigPhotoRaw(null);
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

  const processAndPreviewPhoto = (rawDataUrl, threshold) => {
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
        const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (luma > threshold) {
          // Soft edge: smooth transition over 20 luma units near the threshold
          d[i + 3] = Math.round(Math.max(0, (threshold - luma + 20) / 20) * d[i + 3]);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const processed = tmpCanvas.toDataURL('image/png');

      // Show preview in the signature canvas
      const sigCanvas = signatureCanvasRef.current;
      if (sigCanvas) {
        const sigCtx = sigCanvas.getContext('2d');
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        const preview = new Image();
        preview.onload = () => {
          const scale = Math.min(sigCanvas.width / preview.width, sigCanvas.height / preview.height);
          const w = preview.width * scale;
          const h = preview.height * scale;
          sigCtx.drawImage(preview, (sigCanvas.width - w) / 2, (sigCanvas.height - h) / 2, w, h);
        };
        preview.src = processed;
      }
      setSignatureData(processed);
    };
    img.src = rawDataUrl;
  };

  const handleSignaturePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSigPhotoRaw(ev.target.result);
      processAndPreviewPhoto(ev.target.result, sigPhotoThreshold);
    };
    reader.readAsDataURL(file);
  };

  const handleSigPhotoThresholdChange = (val) => {
    setSigPhotoThreshold(val);
    if (sigPhotoRaw) processAndPreviewPhoto(sigPhotoRaw, val);
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
    sigPhotoRaw, sigPhotoThreshold, handleSigPhotoThresholdChange,
  };
};
