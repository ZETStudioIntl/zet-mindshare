import React from 'react';
import { Plus, Upload, Wand2 } from 'lucide-react';
import axios from 'axios';
import { DraggablePanel } from './DraggablePanel';
import { CHART_TYPES } from '../../lib/editorConstants';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ChartPanel = ({
  editingChartId,
  chartType, setChartType,
  chartTitle, setChartTitle,
  chartLabels, setChartLabels,
  chartData, setChartData,
  chartColors, setChartColors,
  chartImage, setChartImage,
  gradientStart, gradientEnd, setGradientStart, setGradientEnd,
  createChart,
  isMobile, onClose,
}) => (
  <DraggablePanel title={editingChartId ? 'Grafiği Düzenle' : 'Chart'} onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
    <div className="w-80 space-y-3 max-h-[70vh] overflow-y-auto">
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Chart Type</label>
        <div className="grid grid-cols-3 gap-1">
          {CHART_TYPES.map(ct => (
            <button key={ct.id} onClick={() => setChartType(ct.id)} className={`p-2 rounded text-xs ${chartType === ct.id ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: chartType === ct.id ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{ct.name.split(' ')[0]}</button>
          ))}
        </div>
      </div>
      <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Title</label><input value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="zet-input text-xs w-full" placeholder="Chart Title" /></div>
      <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Labels (comma separated)</label><input value={chartLabels} onChange={e => setChartLabels(e.target.value)} className="zet-input text-xs w-full" placeholder="A,B,C,D" /></div>
      <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Values (comma separated)</label><input value={chartData} onChange={e => setChartData(e.target.value)} className="zet-input text-xs w-full" placeholder="10,20,30,40" /></div>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Column Colors</label>
        <div className="flex flex-wrap gap-1">
          {chartLabels.split(',').map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{i + 1}:</span>
              <input type="color" value={chartColors[i] || '#3b82f6'} onChange={e => { const c = [...chartColors]; c[i] = e.target.value; setChartColors(c); }} className="w-8 h-6 rounded cursor-pointer border-0" />
            </div>
          ))}
        </div>
      </div>
      {(chartType === 'bar' || chartType === 'pie') && (
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Background Image</label>
          <div className="flex gap-1">
            <button onClick={() => {
              const input = window.document.createElement('input');
              input.type = 'file'; input.accept = 'image/*';
              input.onchange = e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setChartImage(ev.target.result); r.readAsDataURL(f); } };
              input.click();
            }} className="zet-btn text-xs px-2 py-1 flex items-center gap-1"><Upload className="h-3 w-3" /> Image</button>
            <button onClick={async () => {
              const prompt = window.prompt('Describe the background image:');
              if (!prompt) return;
              try {
                const res = await axios.post(`${API}/zeta/generate-image`, { prompt }, { withCredentials: true });
                if (res.data.image_url) setChartImage(res.data.image_url);
              } catch (err) { console.error('AI Image failed:', err); }
            }} className="zet-btn text-xs px-2 py-1 flex items-center gap-1"><Wand2 className="h-3 w-3" /> AI Image</button>
            {chartImage && <button onClick={() => setChartImage(null)} className="text-xs px-2 py-1 text-red-400">Clear</button>}
          </div>
        </div>
      )}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--zet-text-muted)' }}>
          <input type="checkbox" checked={!!(gradientStart && gradientEnd)} onChange={e => { if (!e.target.checked) { setGradientStart(''); setGradientEnd(''); } }} className="rounded" />
          Gradient Kullan (Mevcut renk seçili)
        </label>
        {gradientStart && gradientEnd && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full h-6 rounded" style={{ background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` }} />
          </div>
        )}
      </div>
      <button onClick={createChart} className="zet-btn w-full flex items-center justify-center gap-2 py-2">
        <Plus className="h-4 w-4" /> {editingChartId ? 'Güncelle' : 'Create Chart'}
      </button>
    </div>
  </DraggablePanel>
);

export default ChartPanel;
