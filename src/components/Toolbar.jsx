import { useState } from 'react';
import { APP_NAME } from '../utils/constants';

export default function Toolbar({
  onAddCard, snapEnabled, onToggleSnap,
  searchTerm, onSearch, saveStatus,
  isMobile, cardCount, arrowMode, onToggleArrowMode,
  sidebarCollapsed, onToggleSidebar, activePage,
  isDark, onToggleTheme,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const SIDEBAR_W = sidebarCollapsed ? 0 : 220;

  const dk = isDark;
  const toolbarBg = dk ? 'rgba(28,28,30,0.8)' : 'rgba(255,255,255,0.8)';
  const borderC = dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const textMuted = dk ? '#98989d' : '#86868b';
  const textPrimary = dk ? '#f5f5f7' : '#1d1d1f';
  const inputBg = dk ? 'rgba(28,28,30,0.7)' : 'rgba(245,245,247,0.9)';
  const inputBorder = dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const btnBorder = dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

  const IconBtn = ({ onClick, title, active, children, style = {} }) => (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
      fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500,
      background: active ? (dk ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent',
      color: active ? '#6366f1' : textMuted,
      border: `1px solid ${active ? (dk ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)') : btnBorder}`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      letterSpacing: '-0.1px',
      ...style,
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = dk ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = btnBorder;
      }
    }}
    >{children}</button>
  );

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: SIDEBAR_W, right: 0, zIndex: 800,
        background: toolbarBg,
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderBottom: `1px solid ${borderC}`,
        display: 'flex', alignItems: 'center',
        padding: '0 16px 0 12px', height: 56, gap: 10,
        fontFamily: 'inherit',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: dk
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} style={{
          width: 34, height: 34, borderRadius: 9,
          border: `1px solid ${btnBorder}`,
          background: 'transparent', cursor: 'pointer', color: textMuted,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
          e.currentTarget.style.borderColor = dk ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = btnBorder;
        }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>

        {/* Page breadcrumb */}
        {!isMobile && activePage && (
          <>
            <div style={{ width: 1, height: 20, background: borderC, flexShrink: 0 }} />
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: textPrimary,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px',
            }}>
              {activePage.icon} {activePage.name}
            </span>
          </>
        )}

        <div style={{ width: 1, height: 20, background: borderC, flexShrink: 0 }} />

        {/* Search */}
        <div style={{ position: 'relative', flex: isMobile ? 1 : '0 1 240px' }}>
          <svg style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            opacity: 0.4,
          }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search" placeholder="Search cards…"
            value={searchTerm} onChange={e => onSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              border: `1px solid ${inputBorder}`, borderRadius: 10,
              fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
              background: inputBg, color: textPrimary,
              transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '-0.1px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = inputBorder;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Card count */}
        {!isMobile && cardCount > 0 && (
          <span style={{
            fontSize: 12,
            color: textMuted,
            flexShrink: 0,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            {cardCount} {cardCount === 1 ? 'card' : 'cards'}
          </span>
        )}

        {/* Save status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
          color: saveStatus === 'saved' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : textMuted,
          opacity: saveStatus === 'idle' ? 0 : 1,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 60, flexShrink: 0,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {saveStatus === 'saving'
            ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#98989d', display: 'inline-block', animation: 'pulse 1.4s ease infinite' }} /> Saving</>
            : saveStatus === 'error'
            ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Error</>
            : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg> Saved</>
          }
        </div>

        {!isMobile && <>
          {/* Arrow connect */}
          <IconBtn
            onClick={onToggleArrowMode}
            active={arrowMode}
            title={arrowMode ? 'Click source card, then target card to connect · Esc to cancel' : 'Connect cards with arrows'}
            style={{
              background: arrowMode ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : undefined,
              color: arrowMode ? '#fff' : undefined,
              border: arrowMode ? '1px solid transparent' : undefined,
              boxShadow: arrowMode ? '0 4px 16px rgba(99,102,241,0.3)' : undefined,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
            </svg>
            {arrowMode ? 'Connecting…' : 'Connect'}
          </IconBtn>

          {/* Snap */}
          <IconBtn
            onClick={() => {
              onToggleSnap();
            }}
            active={snapEnabled}
            title={snapEnabled
              ? 'Snap to Grid: ON\n\nCards align to 24px grid for neat organization.\nClick to disable for free positioning.'
              : 'Snap to Grid: OFF\n\nCards can be positioned anywhere.\nClick to enable grid alignment (24px).'}
            style={{
              background: snapEnabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
              color: snapEnabled ? '#fff' : undefined,
              border: snapEnabled ? '1px solid transparent' : undefined,
              boxShadow: snapEnabled ? '0 4px 16px rgba(16,185,129,0.3)' : undefined,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16">
              {[2,6,10,14].flatMap(x => [2,6,10,14].map(y => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill="currentColor" opacity={snapEnabled ? 1 : 0.5}/>
              )))}
            </svg>
            {snapEnabled ? 'Grid: ON' : 'Grid'}
          </IconBtn>

          {/* Dark/Light toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${btnBorder}`,
              background: 'transparent', cursor: 'pointer', color: textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = dk ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = btnBorder;
            }}
          >
            {isDark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          {/* Help */}
          <button onClick={() => setShowHelp(v => !v)} title="Help & shortcuts"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${btnBorder}`,
              background: showHelp ? (dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
              if (!showHelp) {
                e.currentTarget.style.background = dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
              }
            }}
            onMouseLeave={e => {
              if (!showHelp) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >?</button>
        </>}

        {/* New Card */}
        <button
          onClick={onAddCard}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 13.5, padding: '8px 18px', borderRadius: 11, cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff', border: 'none',
            fontFamily: 'inherit', fontWeight: 600, flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.35), 0 2px 6px rgba(0,0,0,0.08)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '-0.2px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4), 0 4px 10px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35), 0 2px 6px rgba(0,0,0,0.08)';
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {!isMobile && 'New Card'}
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div onMouseLeave={() => setShowHelp(false)} style={{
          position: 'fixed', top: 70, right: 16, zIndex: 2000,
          background: dk ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: `1px solid ${dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 18, padding: '20px 22px', width: 310,
          boxShadow: dk
            ? '0 20px 60px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
          fontFamily: 'inherit',
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 16,
            color: textPrimary,
            letterSpacing: '-0.3px',
          }}>{APP_NAME} — Quick Reference</div>
          {[
            ['Ctrl/⌘ + K', 'Create new card'],
            ['Ctrl/⌘ + B', 'Create new board'],
            ['Ctrl/⌘ + /', 'Toggle sidebar'],
            ['Esc', 'Cancel arrow mode or close panels'],
            ['Click title', 'Rename the card'],
            ['Drag header', 'Move card on canvas'],
            ['Drag ↘ corner', 'Resize card'],
            ['🎨 palette', 'Pick from 8 colour themes'],
            ['Connect', 'Enter arrow mode, then click source → target'],
            ['Grid button', 'Toggle 24px grid snap for neat alignment'],
            ['Search', 'Filter cards across current board'],
            ['Double-click name', 'Rename a board in sidebar'],
            ['Click board icon', 'Change the board emoji'],
          ].map(([k, d]) => (
            <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 11, alignItems: 'flex-start' }}>
              <span style={{
                background: dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                borderRadius: 7,
                padding: '3px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                color: textPrimary,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}>{k}</span>
              <span style={{
                fontSize: 12.5,
                color: textMuted,
                lineHeight: 1.6,
                paddingTop: 2,
                letterSpacing: '-0.05em',
              }}>{d}</span>
            </div>
          ))}
          <div style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            fontSize: 11.5,
            color: textMuted,
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}>
            Everything saves automatically to your browser.
          </div>
        </div>
      )}
    </>
  );
}
