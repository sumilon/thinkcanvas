import { useState, useEffect, useRef } from 'react';
import { APP_NAME } from '../utils/constants';

const PAGE_ICONS = ['💡','📋','🎯','🗂️','⭐','🔬','🚀','📊','🎨','📝','🔗','💎','🧩','🌿','🔥','🎪'];

export default function Sidebar({ pages, activePageId, onSelectPage, onAddPage, onRenamePage, onDeletePage, onChangeIcon, collapsed, isDark, onToggleSidebar }) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(null);
  const [iconPickerPosition, setIconPickerPosition] = useState({ top: 0, left: 0 });
  const iconPickerRef = useRef(null);
  const iconButtonRefs = useRef({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!showIconPicker) return;
    const h = (e) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target)) {
        setShowIconPicker(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showIconPicker]);

  const dk = isDark;
  const bg = dk ? '#1c1c1e' : '#f9f9fb';
  const borderC = dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const textPrimary = dk ? '#f5f5f7' : '#1d1d1f';
  const textMuted = dk ? '#98989d' : '#86868b';
  const activeBg = dk ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)';
  const activeBorder = dk ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)';
  const hoverBg = dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && !collapsed && (
        <div
          onClick={onToggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 899,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      <div style={{
        width: isMobile ? 220 : (collapsed ? 0 : 220),
        minWidth: isMobile ? 220 : (collapsed ? 0 : 220),
        height: '100vh',
        background: bg,
        borderRight: `1px solid ${borderC}`,
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile
          ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 900,
        boxShadow: dk ? '2px 0 12px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.04)',
        transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
      }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 16px', borderBottom: `1px solid ${borderC}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 65%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19,
            boxShadow: '0 4px 16px rgba(99,102,241,0.35), 0 2px 6px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 16.5,
              color: textPrimary,
              letterSpacing: '-0.6px',
              lineHeight: 1.2,
            }}>{APP_NAME}</div>
            <div style={{
              fontSize: 10.5,
              color: textMuted,
              marginTop: 2,
              letterSpacing: '0.3px',
              fontWeight: 500,
            }}>Think Visually</div>
          </div>
        </div>
      </div>

      {/* Boards label */}
      <div style={{
        padding: '16px 18px 7px',
        fontSize: 10.5,
        fontWeight: 700,
        color: textMuted,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>Boards</div>

      {/* Pages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {pages.map(page => (
          <div key={page.id} style={{ position: 'relative', marginBottom: 3 }}>
            <div
              onClick={() => onSelectPage(page.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 11, cursor: 'pointer',
                background: activePageId === page.id ? activeBg : 'transparent',
                border: `1px solid ${activePageId === page.id ? activeBorder : 'transparent'}`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => {
                if (activePageId !== page.id) e.currentTarget.style.background = hoverBg;
              }}
              onMouseLeave={e => {
                if (activePageId !== page.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                ref={el => iconButtonRefs.current[page.id] = el}
                style={{
                  fontSize: 16,
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (showIconPicker === page.id) {
                    setShowIconPicker(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const windowWidth = window.innerWidth;
                    const pickerHeight = 200;
                    // Actual picker width: 168px (content) + 24px (padding) + 2px (border) = 194px
                    const pickerWidth = 210;
                    const margin = 12; // Margin between icon and picker
                    const edgeMargin = 20; // Margin from screen edge for visibility
                    const shadowBuffer = 30; // Extra space for shadow and visual effects

                    // Calculate initial position to the right of the icon
                    let left = rect.right + margin;
                    let top = rect.top;

                    // Check if picker would overflow the right edge (including shadow)
                    if (left + pickerWidth + shadowBuffer > windowWidth - edgeMargin) {
                      // Try positioning to the left of the icon
                      left = rect.left - pickerWidth - margin;

                      // If still off screen on the left, position at right edge with safe margin
                      if (left < edgeMargin) {
                        left = windowWidth - pickerWidth - shadowBuffer - edgeMargin;
                      }
                    }

                    // Ensure picker has minimum margin from left edge
                    left = Math.max(edgeMargin, left);

                    // Ensure picker has maximum margin from right edge
                    left = Math.min(left, windowWidth - pickerWidth - shadowBuffer - edgeMargin);

                    // Vertical positioning with bounds checking
                    // Center-align with icon if possible
                    top = rect.top + (rect.height / 2) - (pickerHeight / 2);

                    // Ensure picker doesn't go below viewport
                    if (top + pickerHeight + shadowBuffer > windowHeight - edgeMargin) {
                      top = windowHeight - pickerHeight - shadowBuffer - edgeMargin;
                    }

                    // Ensure picker doesn't go above viewport
                    top = Math.max(edgeMargin, top);

                    setIconPickerPosition({
                      top: top,
                      left: left
                    });
                    setShowIconPicker(page.id);
                  }
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Change icon"
              >{page.icon || '📋'}</span>

              {editingId === page.id ? (
                <input
                  autoFocus value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => {
                    const trimmed = editingName.trim();
                    if (trimmed && trimmed.length <= 50) {
                      onRenamePage(editingId, trimmed);
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.target.blur();
                    if (e.key === 'Escape') { setEditingId(null); setEditingName(page.name); }
                  }}
                  onClick={e => e.stopPropagation()}
                  maxLength={50}
                  style={{
                    flex: 1,
                    background: dk ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                    border: '2px solid #6366f1',
                    borderRadius: 7,
                    outline: 'none',
                    fontSize: 13.5,
                    padding: '3px 8px',
                    color: textPrimary,
                    fontFamily: 'inherit',
                    minWidth: 0,
                    letterSpacing: '-0.1px',
                    fontWeight: 500,
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1, fontSize: 13.5,
                    fontWeight: activePageId === page.id ? 600 : 500,
                    color: activePageId === page.id ? '#6366f1' : textPrimary,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                    letterSpacing: '-0.1px',
                  }}
                  onDoubleClick={e => { e.stopPropagation(); setEditingId(page.id); setEditingName(page.name); }}
                >{page.name}</span>
              )}

              {activePageId === page.id && pages.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onDeletePage(page.id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: textMuted, padding: '0 2px', opacity: 0.6,
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.color = textMuted;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Delete board"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6"/>
                    <path d="M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New board button */}
      <div style={{ padding: '12px 10px 20px', flexShrink: 0, borderTop: `1px solid ${borderC}` }}>
        <button
          onClick={onAddPage}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '10px 12px', borderRadius: 11,
            border: `1.5px dashed ${dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
            background: 'transparent', cursor: 'pointer',
            color: textMuted, fontSize: 13.5, fontFamily: 'inherit',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 500,
            letterSpacing: '-0.1px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.borderStyle = 'solid';
            e.currentTarget.style.color = '#6366f1';
            e.currentTarget.style.background = dk ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
            e.currentTarget.style.borderStyle = 'dashed';
            e.currentTarget.style.color = textMuted;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Board
        </button>
      </div>
    </div>

    {/* Icon picker popup - rendered OUTSIDE sidebar to avoid clipping */}
    {showIconPicker && (
      <div ref={iconPickerRef} style={{
        position: 'fixed',
        top: iconPickerPosition.top,
        left: iconPickerPosition.left,
        zIndex: 99999,
        background: dk ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${borderC}`,
        borderRadius: 14,
        padding: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 6,
        boxShadow: dk
          ? '0 20px 60px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)',
        width: 186,
        pointerEvents: 'auto',
      }}>
        {PAGE_ICONS.map(icon => {
          const page = pages.find(p => p.id === showIconPicker);
          return (
            <button key={icon}
              onClick={() => { onChangeIcon(showIconPicker, icon); setShowIconPicker(null); }}
              style={{
                border: 'none', cursor: 'pointer', fontSize: 18, padding: 6, borderRadius: 8,
                background: page?.icon === icon ? (dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = page?.icon === icon
                ? (dk ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)')
                : (dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
              }
              onMouseLeave={e => e.currentTarget.style.background = page?.icon === icon
                ? (dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                : 'transparent'
              }
            >{icon}</button>
          );
        })}
      </div>
    )}
    </>
  );
}
