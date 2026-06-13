import { useMemo, useState } from 'react';

function getCardEdgePoint(card, targetX, targetY) {
  if (!card || typeof card.x !== 'number' || typeof card.y !== 'number') {
    return { x: targetX, y: targetY };
  }
  const cx = card.x + (card.width || 300) / 2;
  const cy = card.y + (card.height || 210) / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  const angle = Math.atan2(dy, dx);
  const hw = (card.width || 300) / 2;
  const hh = (card.height || 210) / 2;
  const absCos = Math.abs(Math.cos(angle));
  const absSin = Math.abs(Math.sin(angle));
  const t = (hw * absSin <= hh * absCos)
    ? hw / (absCos || 0.001)
    : hh / (absSin || 0.001);
  return { x: cx + Math.cos(angle) * t, y: cy + Math.sin(angle) * t };
}

/** Compute the arrowhead triangle points at the tip of a quadratic bezier */
function arrowheadPoints(cx, cy, tx, ty, size = 11) {
  // Direction: from control point toward tip
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular
  const px = -uy;
  const py = ux;
  // Pull tip back slightly so arrowhead sits on the line end
  const tip = { x: tx, y: ty };
  const base = { x: tx - ux * size, y: ty - uy * size };
  return [
    tip,
    { x: base.x + px * size * 0.42, y: base.y + py * size * 0.42 },
    { x: base.x - px * size * 0.42, y: base.y - py * size * 0.42 },
  ];
}

function CurvedArrow({ arrow, fromCard, toCard, isSelected, onClick, onDelete, isDark }) {
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(() => {
    if (!fromCard || !toCard) return null;

    const fromCenter = {
      x: fromCard.x + (fromCard.width || 300) / 2,
      y: fromCard.y + (fromCard.height || 210) / 2,
    };
    const toCenter = {
      x: toCard.x + (toCard.width || 300) / 2,
      y: toCard.y + (toCard.height || 210) / 2,
    };

    const from = getCardEdgePoint(fromCard, toCenter.x, toCenter.y);
    const to   = getCardEdgePoint(toCard, fromCenter.x, fromCenter.y);

    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const curve = Math.min(len * 0.28, 72);

    const cpx = mx - (dy / len) * curve;
    const cpy = my + (dx / len) * curve;

    // Midpoint on quadratic bezier at t=0.5
    const mid = {
      x: 0.25 * from.x + 0.5 * cpx + 0.25 * to.x,
      y: 0.25 * from.y + 0.5 * cpy + 0.25 * to.y,
    };

    // Point just before tip (t=0.92) used as direction reference for arrowhead
    const t = 0.92;
    const nearTip = {
      x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cpx + t * t * to.x,
      y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cpy + t * t * to.y,
    };

    const head = arrowheadPoints(nearTip.x, nearTip.y, to.x, to.y, 11);

    return { from, to, cpx, cpy, mid, head };
  }, [fromCard, toCard]);

  if (!geometry) return null;

  const { from, to, cpx, cpy, mid, head } = geometry;

  const activeColor = '#6366f1';
  const defaultColor = isDark ? '#6b6b8a' : '#94a3b8';
  const color = (isSelected || hovered) ? activeColor : defaultColor;
  const deleteCircleBg = isDark ? '#1e1e28' : '#ffffff';

  const headPts = head.map(p => `${p.x},${p.y}`).join(' ');
  const strokeW = (isSelected || hovered) ? 2.5 : 1.8;

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Fat invisible hit area */}
      <path
        d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
        fill="none" stroke="transparent" strokeWidth={18}
      />
      {/* Visible curved line */}
      <path
        d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
      />
      {/* Inline arrowhead — never clipped by overflow rules */}
      <polygon
        points={headPts}
        fill={color}
        style={{ transition: 'fill 0.15s' }}
      />

      {/* Delete button shown on hover / select */}
      {(isSelected || hovered) && (
        <g
          onClick={e => { e.stopPropagation(); onDelete(arrow.id); }}
          style={{ cursor: 'pointer' }}
        >
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

  // Size the SVG to cover all card positions so nothing is clipped
  const svgSize = useMemo(() => {
    if (!cards.length) return { width: '100%', height: '100%' };
    const maxX = cards.reduce((acc, c) => Math.max(acc, (c.x || 0) + (c.width  || 300) + 120), window.innerWidth);
    const maxY = cards.reduce((acc, c) => Math.max(acc, (c.y || 0) + (c.height || 210) + 120), window.innerHeight);
    return { width: maxX, height: maxY };
  }, [cards]);

  const activeColor = '#6366f1';

  // Arrowhead for the live-drawing preview line
  function previewHead() {
    if (!drawingArrow) return null;
    const { from, to } = drawingArrow;
    const pts = arrowheadPoints(
      from.x + (to.x - from.x) * 0.85,
      from.y + (to.y - from.y) * 0.85,
      to.x, to.y, 10
    );
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgSize.width,
        height: svgSize.height,
        minWidth: '100%',
        minHeight: '100%',
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'visible',
      }}
    >
      {/* No <defs> / marker needed — arrowheads are inline polygons */}
      <g style={{ pointerEvents: 'all' }}>
        {arrows.map(arrow => {
          const fromCard = cardMap[arrow.fromId];
          const toCard   = cardMap[arrow.toId];
          if (!fromCard || !toCard) return null;
          return (
            <CurvedArrow
              key={arrow.id}
              arrow={arrow}
              fromCard={fromCard}
              toCard={toCard}
              isSelected={selectedArrowId === arrow.id}
              onClick={e => { e.stopPropagation(); onSelectArrow(arrow.id); }}
              onDelete={onDeleteArrow}
              isDark={isDark}
            />
          );
        })}

        {/* Live preview while user is picking the target */}
        {drawingArrow && (() => {
          const { from, to } = drawingArrow;
          const headPts = previewHead();
          return (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                stroke={activeColor}
                strokeWidth={2}
                strokeDasharray="7 4"
                strokeLinecap="round"
              />
              {headPts && (
                <polygon points={headPts} fill={activeColor} opacity={0.85} />
              )}
            </g>
          );
        })()}
      </g>
    </svg>
  );
}
