import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// ── Shared styles ─────────────────────────────────────────────────────────────

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '7px 12px',
  background: 'none', border: 'none',
  fontSize: 12, cursor: 'pointer',
  color: 'var(--zet-text, #e0e0e0)',
  textAlign: 'left', whiteSpace: 'nowrap',
};

// ── Custom Edge ───────────────────────────────────────────────────────────────

function MindmapEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style = {} }) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: '#6366f1', strokeWidth: 2, opacity: 0.7, ...style }} />
      <EdgeLabelRenderer>
        <button
          className="nodrag nopan"
          title="Bağlantıyı sil"
          style={{
            position: 'absolute',
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            width: 18, height: 18,
            background: 'var(--zet-bg-card, #16161e)',
            border: '1px solid #555', borderRadius: '50%',
            cursor: 'pointer', color: '#888', fontSize: 11,
            lineHeight: '17px', textAlign: 'center',
            pointerEvents: 'all',
          }}
          onClick={() => deleteElements({ edges: [{ id }] })}
        >×</button>
      </EdgeLabelRenderer>
    </>
  );
}

// ── Custom Node ───────────────────────────────────────────────────────────────

const BORDER_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#64748b'];
const HANDLE_STYLE = { width: 10, height: 10, border: '2px solid rgba(255,255,255,0.35)', borderRadius: '50%' };

function MindmapNoteNode({ id, data, selected }) {
  const { setNodes, deleteElements } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const editRef = useRef(null);
  const menuRef = useRef(null);
  const borderColor = data.borderColor || '#6366f1';

  useEffect(() => {
    if (!editing || !editRef.current) return;
    editRef.current.innerText = data.text || '';
    editRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editRef.current);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [editing]); // intentionally omit data.text — only set on enter

  useEffect(() => {
    if (!menuOpen && !showColors) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false); setShowColors(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, showColors]);

  const commitEdit = useCallback(() => {
    if (!editRef.current) { setEditing(false); return; }
    const newText = editRef.current.innerText || '';
    setEditing(false);
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, text: newText } } : n));
  }, [id, setNodes]);

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleColorPick = useCallback((color) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, borderColor: color } } : n));
    setShowColors(false); setMenuOpen(false);
  }, [id, setNodes]);

  return (
    <div
      onDoubleClick={() => { if (!editing) { setMenuOpen(false); setEditing(true); } }}
      style={{
        background: 'var(--zet-bg-card, #16161e)',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        minWidth: 130, maxWidth: 260,
        padding: '9px 30px 9px 12px',
        position: 'relative',
        boxShadow: selected
          ? `0 0 0 3px ${borderColor}44, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Connection handles on all 4 sides */}
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map(pos => (
        <Handle key={pos} type="source" position={pos} style={{ ...HANDLE_STYLE, background: borderColor }} />
      ))}

      {/* Text content */}
      {editing ? (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          className="nodrag nopan"
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') commitEdit();
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
          }}
          style={{
            outline: 'none', fontSize: 13, lineHeight: 1.55,
            color: 'var(--zet-text, #e0e0e0)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            minWidth: 80,
          }}
        />
      ) : (
        <div style={{
          fontSize: 13, lineHeight: 1.55,
          color: data.text ? 'var(--zet-text, #e0e0e0)' : 'rgba(180,180,210,0.3)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          userSelect: 'none', cursor: 'default',
        }}>
          {data.text || 'Çift tıkla — düzenle'}
        </div>
      )}

      {/* 3-dot menu trigger */}
      <button
        className="nodrag"
        onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); setShowColors(false); }}
        style={{
          position: 'absolute', top: 5, right: 5,
          background: 'none', border: 'none',
          cursor: 'pointer', color: 'rgba(180,180,210,0.5)',
          fontSize: 18, lineHeight: 1, padding: '0 2px',
        }}
      >⋮</button>

      {/* Dropdown */}
      {(menuOpen || showColors) && (
        <div ref={menuRef} className="nodrag nopan" style={{
          position: 'absolute', top: 28, right: 0,
          background: 'var(--zet-bg-card, #16161e)',
          border: '1px solid var(--zet-border, #2e2e40)',
          borderRadius: 8,
          boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          zIndex: 20, overflow: 'hidden',
          minWidth: showColors ? 160 : 152,
        }}>
          {showColors ? (
            <div style={{ padding: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {BORDER_COLORS.map(c => (
                  <button key={c} onClick={() => handleColorPick(c)} style={{
                    width: 22, height: 22, borderRadius: '50%', background: c,
                    border: borderColor === c ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', padding: 0,
                  }} />
                ))}
              </div>
              <button style={menuItemStyle} onClick={() => setShowColors(false)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Geri
              </button>
            </div>
          ) : (
            <>
              <button style={menuItemStyle} onClick={() => { setMenuOpen(false); setEditing(true); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Düzenle
              </button>
              <button style={menuItemStyle} onClick={() => setShowColors(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                Çerçeve Rengi
              </button>
              <div style={{ height: 1, background: 'var(--zet-border, #2e2e40)', margin: '2px 0' }} />
              <button style={{ ...menuItemStyle, color: '#ef4444' }} onClick={handleDelete}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></svg>
                Sil
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Stable references — must be outside component to prevent React Flow remounting nodes
const nodeTypes = { mindmapNote: MindmapNoteNode };
const edgeTypes = { mindmapEdge: MindmapEdge };

// ── Inner panel (inside ReactFlowProvider) ────────────────────────────────────

function MindmapPanelInner({ docId, initialData, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const saveTimerRef = useRef(null);
  const readyRef = useRef(false);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const doSave = useCallback(async () => {
    if (!readyRef.current || !docId) return;
    const data = { nodes: nodesRef.current, edges: edgesRef.current };
    onSave?.(data); // Update Editor.js state first so full-doc save always has latest mindmap
    try {
      await axios.put(`${API}/api/documents/${docId}`, { mindmap: data }, { withCredentials: true });
    } catch (e) {
      console.error('[Mindmap] kaydetme hatası:', e);
    }
  }, [docId, onSave]);

  // Initialize from saved data
  useEffect(() => {
    if (initialData?.nodes?.length) {
      setNodes(initialData.nodes);
      setEdges(initialData.edges || []);
      setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 80);
    }
    setTimeout(() => { readyRef.current = true; }, 250);
  }, []); // eslint-disable-line

  // Debounced auto-save on change
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 1500);
  }, [nodes, edges, doSave]);

  // Flush save on unmount (panel kapanınca beklemeden kaydet)
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      doSave();
    };
  }, [doSave]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'mindmapEdge' }, eds));
  }, [setEdges]);

  const addNote = useCallback(() => {
    const cx = window.innerWidth / 2 + (Math.random() * 80 - 40);
    const cy = window.innerHeight / 2 + (Math.random() * 80 - 40);
    const pos = screenToFlowPosition({ x: cx, y: cy });
    setNodes(nds => [...nds, {
      id: `mm_${Date.now()}`,
      type: 'mindmapNote',
      position: pos,
      data: { text: '', borderColor: BORDER_COLORS[nds.length % BORDER_COLORS.length] },
    }]);
  }, [screenToFlowPosition, setNodes]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'all',
      }}>
        <button onClick={addNote} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8,
          background: 'rgba(99,102,241,0.18)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#818cf8', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Not Ekle
        </button>
        <div style={{ fontSize: 11, color: 'rgba(180,180,210,0.4)', pointerEvents: 'none', userSelect: 'none' }}>
          Bağlantı: handle'dan sürükle
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode="loose"
        fitView
        minZoom={0.1}
        maxZoom={4}
        style={{ background: 'transparent' }}
      >
        <Background color="#2a2a3d" gap={28} size={1} />
        <Controls
          style={{
            background: 'var(--zet-bg-card, #16161e)',
            border: '1px solid var(--zet-border, #2e2e40)',
            borderRadius: 8,
          }}
        />
        <MiniMap
          nodeColor={n => n.data?.borderColor || '#6366f1'}
          style={{
            background: 'var(--zet-bg-card, #16161e)',
            border: '1px solid var(--zet-border, #2e2e40)',
            borderRadius: 8,
          }}
          maskColor="rgba(10,10,20,0.5)"
        />
      </ReactFlow>
    </div>
  );
}

// ── Overlay with resize ───────────────────────────────────────────────────────

export default function MindmapPanel({ docId, initialData, onClose, onSave }) {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [winRect, setWinRect] = useState(() => ({
    x: 120, y: 70,
    w: Math.max(500, window.innerWidth - 260),
    h: Math.max(380, window.innerHeight - 160),
  }));
  const resizeRef = useRef(null);
  const dragRef = useRef(null);

  const overlayStyle = isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: 9500, borderRadius: 0 }
    : {
        position: 'fixed',
        top: winRect.y, left: winRect.x,
        width: winRect.w, height: winRect.h,
        zIndex: 9500, borderRadius: 12,
        boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
        overflow: 'hidden',
      };

  // Resize corner handler
  const startResize = useCallback((e, corner) => {
    e.preventDefault(); e.stopPropagation();
    let rect = winRect;
    if (isFullscreen) {
      rect = { x: 120, y: 70, w: window.innerWidth - 260, h: window.innerHeight - 140 };
      setWinRect(rect);
      setIsFullscreen(false);
    }
    resizeRef.current = { corner, sx: e.clientX, sy: e.clientY, r: { ...rect } };
    const onMove = (ev) => {
      if (!resizeRef.current) return;
      const { corner: c, sx, sy, r } = resizeRef.current;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let { x, y, w, h } = r;
      if      (c === 'se') { w = Math.max(400, r.w + dx); h = Math.max(300, r.h + dy); }
      else if (c === 'sw') { w = Math.max(400, r.w - dx); h = Math.max(300, r.h + dy); x = r.x + dx; }
      else if (c === 'ne') { w = Math.max(400, r.w + dx); h = Math.max(300, r.h - dy); y = r.y + dy; }
      else if (c === 'nw') { w = Math.max(400, r.w - dx); h = Math.max(300, r.h - dy); x = r.x + dx; y = r.y + dy; }
      setWinRect({ x, y, w, h });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isFullscreen, winRect]);

  // Header drag to move (windowed mode only)
  const startDrag = useCallback((e) => {
    if (isFullscreen) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, r: { ...winRect } };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.sx, dy = ev.clientY - dragRef.current.sy;
      setWinRect(r => ({ ...r, x: dragRef.current.r.x + dx, y: dragRef.current.r.y + dy }));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isFullscreen, winRect]);

  const cornerPos = { nw: { top: 0, left: 0 }, ne: { top: 0, right: 0 }, sw: { bottom: 0, left: 0 }, se: { bottom: 0, right: 0 } };
  const cornerCursor = { nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize' };

  return (
    <div style={{
      ...overlayStyle,
      display: 'flex', flexDirection: 'column',
      background: 'var(--zet-bg, #0f0f17)',
      border: isFullscreen ? 'none' : '1px solid var(--zet-border, #2e2e40)',
    }}>
      {/* Header */}
      <div
        onMouseDown={startDrag}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px', flexShrink: 0,
          background: 'var(--zet-bg-card, #16161e)',
          borderBottom: '1px solid var(--zet-border, #2e2e40)',
          cursor: isFullscreen ? 'default' : 'move',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
            <circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="14" r="2"/>
            <circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
            <line x1="5" y1="7" x2="12" y2="12"/><line x1="19" y1="7" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="5" y2="17"/><line x1="12" y1="16" x2="19" y2="17"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--zet-text, #e0e0e0)' }}>Zihin Haritası</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Toggle fullscreen */}
          <button
            onClick={() => setIsFullscreen(p => !p)}
            title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isFullscreen
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>
            }
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            title="Kapat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* React Flow canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <MindmapPanelInner docId={docId} initialData={initialData} onSave={onSave} />
        </ReactFlowProvider>
      </div>

      {/* Corner resize handles (shown only in windowed mode) */}
      {!isFullscreen && ['nw', 'ne', 'sw', 'se'].map(c => (
        <div
          key={c}
          onMouseDown={e => startResize(e, c)}
          style={{
            position: 'absolute', width: 14, height: 14,
            cursor: cornerCursor[c], zIndex: 20,
            ...cornerPos[c],
          }}
        />
      ))}
    </div>
  );
}
