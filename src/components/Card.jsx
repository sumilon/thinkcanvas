import { useState, useRef, useCallback, useEffect } from 'react';
import { COLOR_THEMES, MIN_WIDTH, MIN_HEIGHT, resolveTheme } from '../utils/constants';
import { useDrag, useResize } from '../hooks/useDrag';
import RichEditor from './RichEditor';

export default function Card({
  card, onUpdate, onDelete, onBringToFront,
  snapEnabled, isMobile, searchTerm, isDark,
  arrowMode, onCardClickInArrowMode, isArrowSource, isArrowTarget,
}) {
  // Safe fallbacks for card properties
  if (!card || !card.id) {
    console.error('Card component received invalid card prop:', card);
    return null;
  }

  const [editingTitle, setEditingTitle] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ left: 'auto', right: 0 });
  const titleInputRef = useRef(null);
  const colorPickerRef = useRef(null);
  const colorButtonRef = useRef(null);
  const theme = resolveTheme(card.color, isDark);

  useEffect(() => {
    if (!showColorPicker) return;
    const h = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        // Small delay to allow button click to register
        setTimeout(() => setShowColorPicker(false), 10);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showColorPicker]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select(); }
  }, [editingTitle]);

  const handleMove = useCallback((x, y) => onUpdate(card.id, { x, y }), [card.id, onUpdate]);
  const handleResize = useCallback((w, h) => onUpdate(card.id, { width: Math.max(MIN_WIDTH, w), height: Math.max(MIN_HEIGHT, h) }), [card.id, onUpdate]);

  const onDragStart = useDrag({ onMove: handleMove, snapEnabled });
  const onResizeStart = useResize({ onResize: handleResize, snapEnabled });

  const highlightText = (text) => {
    if (!searchTerm || !text) return text;
    const esc = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${esc})`, 'gi');
    return text.split(regex).map((p, i) => regex.test(p) ? <mark key={i}>{p}</mark> : p);
  };

  const inArrowMode = !!arrowMode;
  const cardStyle = isMobile
    ? { width: '100%', position: 'relative' }
    : {
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: card.width,
        minHeight: card.height,
        zIndex: card.zIndex || 1,
      };

  // Visual state for arrow interactions
  let arrowRingColor = null;
  if (isArrowSource) arrowRingColor = '#10b981'; // green = source selected
  if (isArrowTarget) arrowRingColor = '#6366f1';  // indigo = potential target

  return (
    <div
      className={`card${inArrowMode ? ' card--arrow-mode' : ''}`}
      onMouseDown={(e) => {
        // In arrow mode, prevent any default behavior
        if (inArrowMode) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        // Normal mode: bring to front
        onBringToFront(card.id);
      }}
      onClick={(e) => {
        if (inArrowMode) {
          // Critical: Stop all propagation and prevent default
          e.stopPropagation();
          e.preventDefault();
          onCardClickInArrowMode(card.id);
        }
      }}
      style={{
        ...cardStyle,
        background: theme.bg,
        border: `1px solid ${arrowRingColor || theme.border}`,
        borderRadius: 18,
        display: 'flex', flexDirection: 'column',
        boxShadow: arrowRingColor
          ? `0 0 0 3px ${arrowRingColor}33, 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)`
          : isDark
            ? '0 4px 12px rgba(0,0,0,0.5), 0 12px 32px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.03)'
            : '0 2px 8px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.02)',
        overflow: 'visible',
        transition: 'box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: inArrowMode ? 'crosshair' : 'default',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="card-drag-handle"
        style={{
          background: theme.headerBg,
          borderBottom: `1px solid ${theme.border}`,
          borderRadius: '17px 17px 0 0',
          padding: '11px 12px 11px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: inArrowMode ? 'crosshair' : (isMobile ? 'default' : 'grab'),
          userSelect: 'none', minHeight: 46,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onMouseDown={isMobile ? undefined : (e) => {
          // Don't allow dragging in arrow mode
          if (inArrowMode) return;
          if (e.target.closest('button') || e.target.closest('input')) return;
          onDragStart(e, card.x, card.y);
        }}
      >
        {/* Grip dots */}
        {!isMobile && !inArrowMode && (
          <svg width="9" height="16" viewBox="0 0 9 16" style={{ flexShrink: 0, opacity: 0.18 }}>
            {[0,6].map(x => [0,6,12].map(y => <circle key={`${x}${y}`} cx={x+2.5} cy={y+2} r="1.6" fill={theme.accent} />))}
          </svg>
        )}

        {/* Arrow mode indicator */}
        {inArrowMode && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: isArrowSource ? '#10b981' : arrowRingColor || theme.border,
            border: `2px solid ${isArrowSource ? '#059669' : arrowRingColor || theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isArrowSource && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>}
          </div>
        )}

        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleInputRef}
            defaultValue={card.title}
            onBlur={e => {
              const trimmed = e.target.value.trim();
              const newTitle = trimmed && trimmed.length <= 100 ? trimmed : card.title || 'Untitled';
              onUpdate(card.id, { title: newTitle });
              setEditingTitle(false);
            }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
            maxLength={100}
            style={{
              flex: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
              border: `2px solid ${theme.accent}`, borderRadius: 8, outline: 'none',
              fontWeight: 600, fontSize: 14, color: theme.text,
              fontFamily: 'inherit', padding: '5px 10px',
              letterSpacing: '-0.2px',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontWeight: 600,
              fontSize: 14,
              color: theme.text,
              cursor: 'text',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.2px',
            }}
            onClick={() => !inArrowMode && setEditingTitle(true)}
            title="Click to rename"
          >
            {highlightText(card.title) || <span style={{ opacity: 0.35, fontWeight: 500 }}>Untitled</span>}
          </span>
        )}

        {/* Action buttons — hidden in arrow mode */}
        {!inArrowMode && (
          <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {/* Color */}
            <div ref={colorPickerRef} style={{ position: 'relative' }}>
              <button
                ref={colorButtonRef}
                className="card-btn"
                onClick={(e) => {
                  if (!showColorPicker) {
                    // Calculate position to avoid viewport overflow
                    const buttonRect = e.currentTarget.getBoundingClientRect();
                    const pickerWidth = 176;
                    const windowWidth = window.innerWidth;
                    const margin = 20; // Minimum margin from screen edge

                    // Check if picker would overflow on the right
                    const spaceOnRight = windowWidth - buttonRect.right;

                    if (spaceOnRight < pickerWidth + margin) {
                      // Not enough space on right, position on left
                      setColorPickerPosition({ right: 'auto', left: 0 });
                    } else {
                      // Enough space on right, use default positioning
                      setColorPickerPosition({ left: 'auto', right: 0 });
                    }
                  }
                  setShowColorPicker(v => !v);
                }}
                title="Change colour"
                style={{ color: theme.accent }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.9">
                  <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65A2.5 2.5 0 0 1 14.5 15H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/>
                  <circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/>
                  <circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/>
                </svg>
              </button>
              {showColorPicker && (
                <div data-color-picker="true" style={{
                  position: 'absolute',
                  top: '100%',
                  ...colorPickerPosition,
                  marginTop: 6,
                  zIndex: 10000,
                  background: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 16,
                  padding: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gap: 10,
                  width: 176,
                  boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)'
                    : '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                  pointerEvents: 'all',
                }}>
                  {Object.entries(COLOR_THEMES).map(([key, t]) => {
                    const tt = isDark ? t.dark : t.light;
                    return (
                      <button key={key} title={t.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(card.id, { color: key });
                          setShowColorPicker(false);
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: tt.bg,
                          border: card.color === key ? `2.5px solid ${tt.accent}` : `1px solid ${tt.border}`,
                          cursor: 'pointer',
                          transform: card.color === key ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border 0.15s',
                          boxShadow: card.color === key
                            ? `0 4px 12px ${tt.accent}44, 0 2px 6px rgba(0,0,0,0.1)`
                            : '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={e => card.color !== key && (e.currentTarget.style.transform = 'scale(1.08)')}
                        onMouseLeave={e => card.color !== key && (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            {/* Delete */}
            {showDeleteConfirm ? (
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginLeft: 2 }}>
                <span style={{ fontSize: 10.5, color: theme.text, opacity: 0.6, whiteSpace: 'nowrap' }}>Delete?</span>
                <button className="card-btn" onClick={() => onDelete(card.id)} style={{ color: '#ef4444', fontWeight: 700, fontSize: 11 }}>Yes</button>
                <button className="card-btn" onClick={() => setShowDeleteConfirm(false)} style={{ color: theme.text, fontSize: 11 }}>No</button>
              </div>
            ) : (
              <button className="card-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete card" style={{ color: theme.accent }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6"/>
                  <path d="M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '10px 14px 12px', flex: 1, minHeight: 75 }}>
        <RichEditor
          key={card.id} content={card.body}
          onChange={(html) => onUpdate(card.id, { body: html })}
          cardColor={theme} isDark={isDark}
        />
      </div>

      {/* ── Footer ── */}
      {card.createdAt && !isMobile && (
        <div style={{
          padding: '0 14px 10px',
          fontSize: 10.5,
          color: theme.text,
          opacity: 0.3,
          display: 'flex',
          justifyContent: 'space-between',
          letterSpacing: '0.02em',
        }}>
          <span>{new Date(card.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span>↘ resize</span>
        </div>
      )}

      {/* ── Resize handle ── */}
      {!isMobile && (
        <div className="resize-handle"
          onMouseDown={(e) => onResizeStart(e, card.width, card.height)}
          style={{
            position: 'absolute',
            bottom: 5,
            right: 5,
            width: 20,
            height: 20,
            cursor: 'se-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.25,
            color: theme.accent,
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="9" y1="2" x2="2" y2="9"/><line x1="9" y1="5.5" x2="5.5" y2="9"/>
          </svg>
        </div>
      )}
    </div>
  );
}
