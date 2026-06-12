import { useRef, useCallback, useEffect } from 'react';
import { GRID_SIZE } from '../utils/constants';

/**
 * Drag hook — fully ref-based so event listeners are stable across renders.
 * onMove/onResize and snapEnabled are read via refs, never stale.
 */
export function useDrag({ onMove, snapEnabled }) {
  const moveRef = useRef(onMove);
  const snapRef = useRef(snapEnabled);
  const cleanupRef = useRef(null);

  moveRef.current = onMove;
  snapRef.current = snapEnabled;

  const state = useRef({ active: false, startMx: 0, startMy: 0, startCx: 0, startCy: 0 });

  const onMouseDown = useCallback((e, cardX, cardY) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    state.current = { active: true, startMx: e.clientX, startMy: e.clientY, startCx: cardX, startCy: cardY };

    function move(ev) {
      if (!state.current.active) return;
      const { startMx, startMy, startCx, startCy } = state.current;
      let nx = startCx + (ev.clientX - startMx);
      let ny = startCy + (ev.clientY - startMy);
      if (snapRef.current) {
        nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
        ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
      }
      moveRef.current(Math.max(0, nx), Math.max(0, ny));
    }

    function up() {
      state.current.active = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      cleanupRef.current = null;
    }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);

    // Store cleanup function for component unmount
    cleanupRef.current = up;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return onMouseDown;
}

export function useResize({ onResize, snapEnabled }) {
  const resizeRef = useRef(onResize);
  const snapRef = useRef(snapEnabled);
  const cleanupRef = useRef(null);

  resizeRef.current = onResize;
  snapRef.current = snapEnabled;

  const state = useRef({ active: false, startMx: 0, startMy: 0, startW: 0, startH: 0 });

  const onMouseDown = useCallback((e, currentW, currentH) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    state.current = { active: true, startMx: e.clientX, startMy: e.clientY, startW: currentW, startH: currentH };

    function move(ev) {
      if (!state.current.active) return;
      const { startMx, startMy, startW, startH } = state.current;
      let nw = startW + (ev.clientX - startMx);
      let nh = startH + (ev.clientY - startMy);
      if (snapRef.current) {
        nw = Math.round(nw / GRID_SIZE) * GRID_SIZE;
        nh = Math.round(nh / GRID_SIZE) * GRID_SIZE;
      }
      resizeRef.current(nw, nh);
    }

    function up() {
      state.current.active = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      cleanupRef.current = null;
    }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);

    // Store cleanup function for component unmount
    cleanupRef.current = up;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return onMouseDown;
}
