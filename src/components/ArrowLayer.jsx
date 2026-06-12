import { useMemo, useState } from 'react';

function getCardEdgePoint(card, targetX, targetY) {
  if (!card || typeof card.x !== 'number' || typeof card.y !== 'number') {
    console.warn('Invalid card data for edge point calculation');
    return { x: targetX, y: targetY };
  }

  const cx = card.x + (card.width || 0) / 2;
  const cy = card.y + (card.height || 0) / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  const angle = Math.atan2(dy, dx);
  const hw = (card.width || 0) / 2;
  const hh = (card.height || 0) / 2;
  const absCos = Math.abs(Math.cos(angle));
  const absSin = Math.abs(Math.sin(angle));
  const t = (hw * absSin <= hh * absCos)
    ? hw / (absCos || 0.001)
    : hh / (absSin || 0.001);
  return { x: cx + Math.cos(angle) * t, y: cy + Math.sin(angle) * t };
}

function CurvedArrow({ arrow, fromCard, toCard, isSelected, onClick, onDelete, isDark }) {
  const [hovered, setHovered] = useState(false);

  const path = useMemo(() => {
    if (!fromCard || !toCard) return null;
    // Calculate center points
    const fromCenter = { x: fromCard.x + fromCard.width / 2, y: fromCard.y + fromCard.height / 2 };
    const toCenter = { x: toCard.x + toCard.width / 2, y: toCard.y + toCard.height / 2 };

    // Get edge points: from-card edge pointing TO target center, to-card edge pointing FROM source center
    const from = getCardEdgePoint(fromCard, toCenter.x, toCenter.y);
    const to = getCardEdgePoint(toCard, fromCenter.x, fromCenter.y);

    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const curve = Math.min(len * 0.28, 72);
    return {
      from, to,
      cx: mx - (dy / len) * curve,
      cy: my + (dx / len) * curve,
    };
  }, [fromCard, toCard]);

  if (!path) return null;
  const { from, to, cx, cy } = path;

  const activeColor = '#6366f1';
  const defaultColor = isDark ? '#4a4a62' : '#cbd5e1';
  const color = (isSelected || hovered) ? activeColor : defaultColor;
  const deleteCircleBg = isDark ? '#1e1e28' : 'white';

  // Midpoint on the quadratic bezier at t=0.5
  const mid = {
    x: 0.25 * from.x + 0.5 * cx + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * cy + 0.25 * to.y,
  };

  return (
    <g onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ cursor: 'pointer' }}>
      {/* Fat invisible hit area */}
      <path d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`} fill="none" stroke="transparent" strokeWidth={18} />
      {/* Visible arrow path */}
      <path
        d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
        fill="none" stroke={color}
        strokeWidth={isSelected || hovered ? 2.5 : 1.8}
        markerEnd={`url(#ah-${isSelected || hovered ? 'active' : 'default'})`}
        style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
      />
      {/* Delete button on hover/select */}
      {(isSelected || hovered) && (
        <g onClick={e => { e.stopPropagation(); onDelete(arrow.id); }} style={{ cursor: 'pointer' }}>
          <circle cx={mid.x} cy={mid.y} r={11} fill={deleteCircleBg} stroke={color} strokeWidth={1.5} />
          <line x1={mid.x - 4} y1={mid.y - 4} x2={mid.x + 4} y2={mid.y + 4} stroke={color} strokeWidth={2} strokeLinecap="round" />
          <line x1={mid.x + 4} y1={mid.y - 4} x2={mid.x - 4} y2={mid.y + 4} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

export default function ArrowLayer({ arrows, cards, selectedArrowId, onSelectArrow, onDeleteArrow, drawingArrow, isDark }) {
  const cardMap = useMemo(() => {
    const m = {};
    cards.forEach(c => { m[c.id] = c; });
    return m;
  }, [cards]);


  const activeColor = '#6366f1';
  const defaultColor = isDark ? '#4a4a62' : '#cbd5e1';

  return (
    <svg style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 5, overflow: 'visible',
    }}>
      <defs>
        <marker id="ah-default" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
          <path d="M0,0.5 L0,6.5 L8,3.5 z" fill={defaultColor} />
        </marker>
        <marker id="ah-active" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
          <path d="M0,0.5 L0,6.5 L8,3.5 z" fill={activeColor} />
        </marker>
      </defs>
      <g style={{ pointerEvents: 'all' }}>
        {arrows.map(arrow => {
          const fromCard = cardMap[arrow.fromId];
          const toCard = cardMap[arrow.toId];

          // Skip rendering if either card is missing
          if (!fromCard || !toCard) {
            return null;
          }

          return (
            <CurvedArrow
              key={arrow.id} arrow={arrow}
              fromCard={fromCard} toCard={toCard}
              isSelected={selectedArrowId === arrow.id}
              onClick={e => { e.stopPropagation(); onSelectArrow(arrow.id); }}
              onDelete={onDeleteArrow}
              isDark={isDark}
            />
          );
        })}
        {/* Live drawing preview */}
        {drawingArrow && (
          <path
            d={`M ${drawingArrow.from.x} ${drawingArrow.from.y} L ${drawingArrow.to.x} ${drawingArrow.to.y}`}
            fill="none" stroke={activeColor} strokeWidth={2} strokeDasharray="7 4"
            markerEnd="url(#ah-active)"
          />
        )}
      </g>
    </svg>
  );
}
