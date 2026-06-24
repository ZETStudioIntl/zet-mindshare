import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const SceneNavigatorPanel = () => {
  const {
    isMobile, screenplayMode,
    document: doc, currentPage, changePage,
    canvasElements, canvasContainerRef,
    showSceneNavigator, setShowSceneNavigator,
  } = useContext(EditorStateContext);

  if (!screenplayMode || !showSceneNavigator) return null;

  const scenes = [];
  (doc?.pages || []).forEach((page, pageIdx) => {
    const elements = pageIdx === currentPage ? canvasElements : (page.elements || []);
    elements.forEach(el => {
      if (el.scriptElement === 'sceneheading' && (el.content || el.htmlContent)) {
        const raw = el.content || el.htmlContent?.replace(/<[^>]+>/g, '') || '';
        scenes.push({ pageIdx, elId: el.id, elY: el.y, title: raw.trim() || '(Başlıksız Sahne)' });
      }
    });
  });

  const handleSceneClick = (pageIdx, elY) => {
    changePage(pageIdx);
    setTimeout(() => {
      if (canvasContainerRef?.current) {
        canvasContainerRef.current.scrollTop = Math.max(0, elY - 40);
      }
    }, 60);
  };

  const totalPages = doc?.pages?.length || 1;

  return (
    <DraggablePanel title="Sahne Gezgini" onClose={() => setShowSceneNavigator(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 120 }}>
      <div style={{ width: 220, maxHeight: 360, display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center mb-2 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
          <span>{scenes.length} sahne</span>
          <span>≈ {totalPages} dk</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {scenes.length === 0 ? (
            <div className="text-xs text-center py-4" style={{ color: 'var(--zet-text-muted)' }}>
              Henüz sahne başlığı yok.<br />Bir metin ekleyip tipini<br />"Sahne Başlığı" olarak seçin.
            </div>
          ) : scenes.map((scene, i) => (
            <button
              key={`${scene.pageIdx}-${scene.elId}`}
              onClick={() => handleSceneClick(scene.pageIdx, scene.elY)}
              className="w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 hover:opacity-80 transition-opacity"
              style={{
                background: scene.pageIdx === currentPage ? 'var(--zet-primary)' : 'var(--zet-bg)',
                color: scene.pageIdx === currentPage ? '#fff' : 'var(--zet-text)',
              }}
            >
              <span className="opacity-60 mr-1.5">{i + 1}.</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{scene.title.length > 28 ? scene.title.slice(0, 28) + '…' : scene.title}</span>
              <span className="ml-1 opacity-50" style={{ fontSize: 10 }}>s.{scene.pageIdx + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </DraggablePanel>
  );
};

export default SceneNavigatorPanel;
