import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadAll } from './utils/storage';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, MIN_WIDTH, MIN_HEIGHT, COLOR_THEMES, APP_NAME } from './utils/constants';
import { useAutoSave } from './hooks/useSave';
import Card from './components/Card';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import ArrowLayer from './components/ArrowLayer';
import './styles/app.css';

const COLOR_KEYS = Object.keys(COLOR_THEMES);
const SIDEBAR_WIDTH = 220;

// arrowMode states:
//   false       — off
//   'selecting' — waiting for user to click a SOURCE card
//   'drawing'   — source chosen, waiting for TARGET card click

export default function App() {
  const initial = useMemo(() => loadAll(), []);
  const [pages, setPages] = useState(initial.pages);
  const [activePageId, setActivePageId] = useState(initial.activePageId);
  const [isDark, setIsDark] = useState(initial.theme === 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [arrowMode, setArrowMode] = useState(false); // false | 'selecting' | 'drawing'
  const [arrowFromId, setArrowFromId] = useState(null);
  const [selectedArrowId, setSelectedArrowId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [shortcutToast, setShortcutToast] = useState(null);
  const canvasRef = useRef(null);
  const addCardInProgressRef = useRef(false);

  // Keep activePageId in a ref so setCards/setArrows closures never go stale
  const activePageIdRef = useRef(activePageId);
  activePageIdRef.current = activePageId;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const page = pages.find(p => p.id === activePageId);
    document.title = page ? `${page.name} — ${APP_NAME}` : APP_NAME;
  }, [activePageId, pages]);

  useEffect(() => {
    const h = () => { const m = window.innerWidth < 768; setIsMobile(m); if (m) setSidebarCollapsed(true); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const activePage = useMemo(() => {
    const page = pages.find(p => p.id === activePageId);
    // If active page not found, use first page
    if (!page && pages.length > 0) {
      setActivePageId(pages[0].id);
      return pages[0];
    }
    return page;
  }, [pages, activePageId]);

  const cards = activePage?.cards || [];
  const arrows = activePage?.arrows || [];
  const snapEnabled = activePage?.snapEnabled || false;

  const allData = useMemo(() => ({ pages, activePageId, theme: isDark ? 'dark' : 'light' }), [pages, activePageId, isDark]);
  const saveStatus = useAutoSave(allData);

  const updatePage = useCallback((id, patch) => {
    if (!id || !patch) return;

    setPages(prev => prev.map(p => {
      if (p.id !== id) return p;

      const sanitized = { ...patch };

      // Validate name
      if (typeof sanitized.name === 'string') {
        sanitized.name = sanitized.name.slice(0, 50).trim() || p.name;
      }

      // Validate icon
      if (typeof sanitized.icon === 'string') {
        sanitized.icon = sanitized.icon.slice(0, 10);
      }

      return { ...p, ...sanitized };
    }));
  }, []);

  // setCards and setArrows use the ref, so they never close over stale activePageId
  const setCards = useCallback((updater) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageIdRef.current) return p;
      const next = typeof updater === 'function' ? updater(p.cards) : updater;
      return { ...p, cards: next };
    }));
  }, []); // stable forever

  const setArrows = useCallback((updater) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePageIdRef.current) return p;
      const next = typeof updater === 'function' ? updater(p.arrows || []) : updater;
      return { ...p, arrows: next };
    }));
  }, []); // stable forever

  const maxZ = useMemo(() => cards.reduce((m, c) => Math.max(m, c.zIndex || 1), 1), [cards]);

  const addCard = useCallback(() => {
    // Prevent rapid duplicate card creation
    if (addCardInProgressRef.current) return;
    addCardInProgressRef.current = true;

    setTimeout(() => {
      addCardInProgressRef.current = false;
    }, 300);

    const colorIdx = cards.length % COLOR_KEYS.length;
    const canvasW = Math.max(800, window.innerWidth - (sidebarCollapsed ? 0 : SIDEBAR_WIDTH));
    const cols = Math.max(1, Math.floor((canvasW - 80) / (DEFAULT_WIDTH + 24)));

    const x = Math.min(60 + (cards.length % cols) * (DEFAULT_WIDTH + 24), canvasW - DEFAULT_WIDTH - 40);
    const y = 76 + Math.floor(cards.length / cols) * (DEFAULT_HEIGHT + 24);

    const card = {
      id: uuidv4(),
      title: 'New idea',
      body: '',
      color: COLOR_KEYS[colorIdx],
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      zIndex: maxZ + 1,
      createdAt: new Date().toISOString(),
    };
    setCards(prev => [...prev, card]);
  }, [cards, maxZ, setCards, sidebarCollapsed]);

  const updateCard = useCallback((id, patch) => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;

      // Validate and sanitize patch data
      const sanitized = { ...patch };

      // Ensure position is within reasonable bounds
      if (typeof sanitized.x === 'number') {
        sanitized.x = Math.max(0, Math.min(sanitized.x, 10000));
      }
      if (typeof sanitized.y === 'number') {
        sanitized.y = Math.max(0, Math.min(sanitized.y, 10000));
      }

      // Ensure dimensions are within reasonable bounds
      if (typeof sanitized.width === 'number') {
        sanitized.width = Math.max(MIN_WIDTH, Math.min(sanitized.width, 2000));
      }
      if (typeof sanitized.height === 'number') {
        sanitized.height = Math.max(MIN_HEIGHT, Math.min(sanitized.height, 2000));
      }

      // Validate title
      if (typeof sanitized.title === 'string') {
        sanitized.title = sanitized.title.slice(0, 100);
      }

      // Validate body (limit HTML size)
      if (typeof sanitized.body === 'string' && sanitized.body.length > 50000) {
        console.warn('Card body too large, truncating');
        sanitized.body = sanitized.body.slice(0, 50000);
      }

      return { ...c, ...sanitized };
    }));
  }, [setCards]);

  const deleteCard = useCallback((id) => {
    if (!id) return;
    setCards(prev => prev.filter(c => c.id !== id));
    // Clean up all arrows connected to this card
    setArrows(prev => prev.filter(a => a.fromId !== id && a.toId !== id));
    // Clear arrow selection if needed
    setSelectedArrowId(prev => prev === id ? null : prev);
  }, [setCards, setArrows]);

  const bringToFront = useCallback((id) => {
    setCards(prev => {
      const curMax = prev.reduce((m, c) => Math.max(m, c.zIndex || 1), 1);
      const card = prev.find(c => c.id === id);
      // Only update if not already at front
      if (card && card.zIndex < curMax) {
        return prev.map(c => c.id === id ? { ...c, zIndex: curMax + 1 } : c);
      }
      return prev;
    });
  }, [setCards]);

  // ─── Arrow logic ─────────────────────────────────────────────────────────
  const cancelArrow = useCallback(() => {
    setArrowMode(false);
    setArrowFromId(null);
  }, []);

  // Called when a card is clicked
  const handleCardClickInArrowMode = useCallback((cardId) => {
    if (arrowMode === 'selecting') {
      // First click: set this as the source
      const cardExists = cards.some(c => c.id === cardId);
      if (!cardExists) {
        console.warn('Invalid card selected for arrow source');
        return;
      }
      setArrowFromId(cardId);
      setArrowMode('drawing');
    } else if (arrowMode === 'drawing') {
      // Second click: set this as the target and draw the arrow
      if (arrowFromId && cardId !== arrowFromId) {
        const fromExists = cards.some(c => c.id === arrowFromId);
        const toExists = cards.some(c => c.id === cardId);

        if (!fromExists || !toExists) {
          console.warn('Invalid card IDs for arrow creation');
          cancelArrow();
          return;
        }

        setArrows(prev => {
          const exists = prev.some(a => a.fromId === arrowFromId && a.toId === cardId);
          if (exists) return prev;
          const newArrow = { id: uuidv4(), fromId: arrowFromId, toId: cardId, style: 'solid' };
          return [...prev, newArrow];
        });
      }
      cancelArrow();
    }
  }, [arrowMode, arrowFromId, cards, setArrows, cancelArrow]);

  const deleteArrow = useCallback((id) => {
    setArrows(prev => prev.filter(a => a.id !== id));
    setSelectedArrowId(null);
  }, [setArrows]);

  // Track mouse for live preview line
  useEffect(() => {
    if (arrowMode !== 'drawing') return;
    const h = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [arrowMode]);

  const handleCanvasClick = useCallback((e) => {
    // Only handle clicks directly on canvas, not on cards
    const isCard = e.target.closest('.card');
    const isCardButton = e.target.closest('.card-btn');
    const isColorPicker = e.target.closest('[data-color-picker]');

    // If clicking on card or card elements, don't handle
    if (isCard || isCardButton || isColorPicker) {
      return;
    }

    if (arrowMode) {
      cancelArrow();
      return;
    }
    setSelectedArrowId(null);
  }, [arrowMode, cancelArrow]);


  const showShortcutToast = (message) => {
    setShortcutToast(message);
    setTimeout(() => setShortcutToast(null), 2000);
  };

  // ─── Page management ─────────────────────────────────────────────────────
  const addPage = useCallback(() => {
    const id = 'page-' + Date.now();
    const newPage = {
      id,
      name: 'New Board',
      icon: '📋',
      cards: [],
      arrows: [],
      snapEnabled: false,
      createdAt: new Date().toISOString()
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(id);
  }, []);

  const deletePage = useCallback((id) => {
    setPages(prev => {
      if (prev.length <= 1) {
        console.warn('Cannot delete the last page');
        return prev; // Always keep at least one page
      }

      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) return prev;

      if (activePageId === id) {
        // Switch to the first remaining page
        const newActivePage = next[0];
        if (newActivePage) {
          setActivePageId(newActivePage.id);
        }
      }
      return next;
    });
  }, [activePageId]);

  const renamePage = useCallback((id, name) => updatePage(id, { name }), [updatePage]);
  const changePageIcon = useCallback((id, icon) => updatePage(id, { icon }), [updatePage]);
  const toggleSnap = useCallback(() => {
    updatePage(activePageId, { snapEnabled: !snapEnabled });
  }, [activePageId, snapEnabled, updatePage]);

  // Keyboard shortcuts - must be after addCard, addPage, cancelArrow are defined
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        cancelArrow();
        setSelectedArrowId(null);
      }
      // Ctrl/Cmd + K: New Card
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        addCard();
        showShortcutToast('✨ New card created');
      }
      // Ctrl/Cmd + B: New Board
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        addPage();
        showShortcutToast('📋 New board created');
      }
      // Ctrl/Cmd + /: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setSidebarCollapsed(v => !v);
        showShortcutToast('🔀 Sidebar toggled');
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cancelArrow, addCard, addPage]);

  const visibleCards = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return cards;
    const q = searchTerm.toLowerCase().trim();
    return cards.filter(c => {
      try {
        const title = (c.title || '').toLowerCase();
        const body = (c.body || '').replace(/<[^>]*>/g, '').toLowerCase();
        return title.includes(q) || body.includes(q);
      } catch (err) {
        console.warn('Error filtering card:', err);
        return false;
      }
    });
  }, [cards, searchTerm]);

  // When a search is active, only show arrows where BOTH endpoint cards are visible.
  // This keeps the canvas clean — no floating arrows pointing to hidden cards.
  const visibleArrows = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return arrows;
    const visibleIds = new Set(visibleCards.map(c => c.id));
    return arrows.filter(a => visibleIds.has(a.fromId) && visibleIds.has(a.toId));
  }, [arrows, visibleCards, searchTerm]);

  const canvasHeight = useMemo(() => {
    if (isMobile) return 'auto';
    return Math.max(window.innerHeight - 56, cards.reduce((m, c) => Math.max(m, (c.y || 0) + (c.height || DEFAULT_HEIGHT) + 120), window.innerHeight - 56));
  }, [cards, isMobile]);

  const fromCard = cards.find(c => c.id === arrowFromId);
  const drawingArrow = arrowMode === 'drawing' && fromCard ? {
    from: { x: fromCard.x + fromCard.width / 2, y: fromCard.y + fromCard.height / 2 },
    to: mousePos,
  } : null;

  const left = isMobile ? 0 : (sidebarCollapsed ? 0 : SIDEBAR_WIDTH);
  const canvasBg = isDark ? '#000000' : '#f5f5f7';
  const emptyTextColor = isDark ? '#86868b' : '#86868b';
  const emptyTitleColor = isDark ? '#f5f5f7' : '#1d1d1f';

  // Toast message for arrow mode
  const arrowToast = arrowMode === 'selecting'
    ? '① Click the SOURCE card to start the arrow'
    : arrowMode === 'drawing'
    ? '② Click the TARGET card to complete the connection'
    : null;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif',
      minHeight: '100vh',
      background: canvasBg,
      letterSpacing: '-0.01em',
    }}>
      {/* Sidebar - now always renders but hides on mobile when collapsed */}
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => {
          setActivePageId(id);
          setSearchTerm('');
          cancelArrow();
          // Auto-close sidebar on mobile after selection
          if (isMobile) setSidebarCollapsed(true);
        }}
        onAddPage={addPage}
        onRenamePage={renamePage}
        onDeletePage={deletePage}
        onChangeIcon={changePageIcon}
        collapsed={sidebarCollapsed}
        isDark={isDark}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
      />

      <Toolbar
        onAddCard={addCard} snapEnabled={snapEnabled} onToggleSnap={toggleSnap}
        searchTerm={searchTerm} onSearch={setSearchTerm} saveStatus={saveStatus}
        isMobile={isMobile} cardCount={cards.length}
        arrowMode={!!arrowMode}
        onToggleArrowMode={() => arrowMode ? cancelArrow() : setArrowMode('selecting')}
        sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        activePage={activePage} isDark={isDark} onToggleTheme={() => setIsDark(v => !v)}
      />

      {snapEnabled && !isMobile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'} 1.8px, transparent 1.8px)`,
          backgroundSize: '24px 24px', backgroundPosition: `${left}px 56px`,
          opacity: 1,
        }} />
      )}

      <div ref={canvasRef} className="canvas" onClick={handleCanvasClick}
        style={{
          marginTop: 56, marginLeft: left, transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          minHeight: isMobile ? 'auto' : canvasHeight,
          padding: isMobile ? '16px 14px' : 0,
          display: isMobile ? 'flex' : 'block',
          flexDirection: isMobile ? 'column' : undefined,
          gap: isMobile ? 16 : undefined,
          cursor: arrowMode ? 'crosshair' : 'default',
          userSelect: arrowMode ? 'none' : 'auto',
        }}
      >
        {!isMobile && (
          <ArrowLayer arrows={visibleArrows} cards={cards}
            selectedArrowId={selectedArrowId} onSelectArrow={setSelectedArrowId}
            onDeleteArrow={deleteArrow} drawingArrow={drawingArrow} isDark={isDark} />
        )}

        {/* Step-by-step arrow toast */}
        {arrowToast && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff', padding: '14px 28px', borderRadius: 60,
            fontSize: 13.5, fontWeight: 500, zIndex: 9999,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: 12,
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
            </svg>
            {arrowToast}
            <span onClick={cancelArrow} style={{
              marginLeft: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 6,
              padding: '3px 10px', fontSize: 11.5, cursor: 'pointer', fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            >Esc</span>
          </div>
        )}

        {/* Shortcut toast notification */}
        {shortcutToast && (
          <div style={{
            position: 'fixed', top: 80, right: 20, zIndex: 9999,
            background: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 12, padding: '12px 20px',
            fontSize: 13, fontWeight: 500,
            color: isDark ? '#f5f5f7' : '#1d1d1f',
            boxShadow: isDark
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(0,0,0,0.1)',
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {shortcutToast}
          </div>
        )}

        {/* Empty state */}
        {visibleCards.length === 0 && (
          <div style={{
            position: isMobile ? 'relative' : 'absolute',
            top: isMobile ? 0 : '36%', left: isMobile ? 0 : '50%',
            transform: isMobile ? 'none' : 'translate(-50%,-50%)',
            textAlign: 'center', padding: '56px 28px',
          }}>
            {searchTerm ? (
              <>
                <div style={{
                  fontSize: 48,
                  marginBottom: 16,
                  opacity: 0.25,
                  filter: 'grayscale(100%)',
                }}>🔍</div>
                <div style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: emptyTitleColor,
                  letterSpacing: '-0.3px',
                  marginBottom: 6,
                }}>No results for "{searchTerm}"</div>
                <div style={{
                  fontSize: 13.5,
                  color: emptyTextColor,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}>Try different keywords</div>
              </>
            ) : (
              <>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: 36,
                  boxShadow: '0 12px 40px rgba(99,102,241,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                  animation: 'fadeIn 0.5s ease-out',
                }}>⚡</div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: emptyTitleColor,
                  marginBottom: 10,
                  letterSpacing: '-0.5px',
                }}>Empty canvas</div>
                <div style={{
                  fontSize: 14.5,
                  color: emptyTextColor,
                  marginBottom: 28,
                  lineHeight: 1.6,
                  maxWidth: 340,
                  margin: '0 auto 28px',
                }}>
                  Capture ideas, connect thoughts,<br />and think visually.
                </div>
                <button onClick={addCard} style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '-0.2px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.4), 0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.08)';
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'translateY(0) scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                >+ Create first card</button>
              </>
            )}
          </div>
        )}

        {visibleCards.map(card => (
          <Card key={card.id} card={card}
            onUpdate={updateCard} onDelete={deleteCard} onBringToFront={bringToFront}
            snapEnabled={snapEnabled} isMobile={isMobile}
            searchTerm={searchTerm} isDark={isDark}
            arrowMode={arrowMode}
            onCardClickInArrowMode={handleCardClickInArrowMode}
            isArrowSource={arrowFromId === card.id}
            isArrowTarget={arrowMode === 'drawing' && card.id !== arrowFromId}
          />
        ))}
      </div>
    </div>
  );
}
