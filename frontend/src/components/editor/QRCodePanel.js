import React from 'react';
import { Plus } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

const QRCodePanel = ({ qrText, setQrText, createQRCode, isMobile, onClose }) => (
  <DraggablePanel title="QR Code" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
    <div className="w-56 space-y-3">
      <input type="text" value={qrText} onChange={e => setQrText(e.target.value)} placeholder="Enter text or URL" className="zet-input text-xs w-full" />
      <button onClick={createQRCode} disabled={!qrText.trim()} className="zet-btn w-full flex items-center justify-center gap-2 py-2">
        <Plus className="h-4 w-4" /> Generate QR
      </button>
    </div>
  </DraggablePanel>
);

export default QRCodePanel;
