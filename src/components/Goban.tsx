import React, { useMemo, useState } from 'react';
import {
  BoardAnnotation,
  BoardSize,
  CellState,
  Group,
  Point,
  StoneColor,
  TerritoryEstimate,
  VisualizerSettings,
} from '../types/go';
import {
  formatCoordinate,
  getAllGroups,
  getGroupAt,
  getStarPoints,
  pointKey,
  pointsEqual,
  validateMove,
} from '../engine/goEngine';
import { AlertTriangle, Check, Eye, Sparkles, X } from 'lucide-react';

interface GobanProps {
  board: CellState[][];
  playerColor: StoneColor;
  onPlaceStone: (point: Point) => void;
  visualizer: VisualizerSettings;
  lastMove?: Point | null;
  coachHintPoint?: Point | null;
  annotations?: BoardAnnotation[];
  territoryEstimate?: TerritoryEstimate;
  disabled?: boolean;
  previousBoardHashes?: Set<string>;
}

export const Goban: React.FC<GobanProps> = ({
  board,
  playerColor,
  onPlaceStone,
  visualizer,
  lastMove,
  coachHintPoint,
  annotations = [],
  territoryEstimate,
  disabled = false,
  previousBoardHashes,
}) => {
  const size = board.length as BoardSize;
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [selectedStonePoint, setSelectedStonePoint] = useState<Point | null>(null);
  const [pendingTouchPoint, setPendingTouchPoint] = useState<Point | null>(null);

  // SVG coordinate system constants
  const padding = 44;
  const cellSize = size === 7 ? 64 : size === 9 ? 54 : size === 13 ? 40 : 28;
  const svgSize = padding * 2 + cellSize * (size - 1);
  const stoneRadius = cellSize * 0.44;

  const toXY = (pt: Point) => ({
    x: padding + pt.col * cellSize,
    y: padding + pt.row * cellSize,
  });

  const letters = 'ABCDEFGHJKLMNOPQRST';

  // Compute all current groups on the board
  const groups = useMemo(() => getAllGroups(board), [board]);

  // Map each occupied cell to its group
  const stoneToGroup = useMemo(() => {
    const map = new Map<string, Group>();
    for (const g of groups) {
      for (const s of g.stones) {
        map.set(pointKey(s), g);
      }
    }
    return map;
  }, [groups]);

  // Active point being previewed (either desktop hover or mobile tap-preview)
  const activePreviewPoint = pendingTouchPoint || hoveredPoint;

  // If hovering or selecting an occupied stone, highlight its group and liberties
  const inspectedGroup: Group | null = useMemo(() => {
    const target = hoveredPoint || selectedStonePoint;
    if (target && board[target.row]?.[target.col] !== null) {
      return stoneToGroup.get(pointKey(target)) || null;
    }
    return null;
  }, [hoveredPoint, selectedStonePoint, board, stoneToGroup]);

  // Simulate the move if hovering/previewing an empty intersection
  const moveSimulation = useMemo(() => {
    if (!activePreviewPoint || disabled) return null;
    if (board[activePreviewPoint.row]?.[activePreviewPoint.col] !== null) return null;
    const res = validateMove(board, activePreviewPoint, playerColor, previousBoardHashes);
    let simulatedGroup: Group | null = null;
    if (res.valid && res.resultingBoard) {
      simulatedGroup = getGroupAt(res.resultingBoard, activePreviewPoint);
    }
    return {
      point: activePreviewPoint,
      validation: res,
      simulatedGroup,
    };
  }, [activePreviewPoint, board, playerColor, disabled, previousBoardHashes]);

  const starPoints = useMemo(() => getStarPoints(size), [size]);

  const getLibertyColor = (count: number) => {
    if (count === 1) return '#ef4444'; // Red (Atari!)
    if (count === 2) return '#f59e0b'; // Amber (Warning)
    return '#10b981'; // Emerald (Healthy)
  };

  const handleIntersectionInteraction = (
    pt: Point,
    e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>
  ) => {
    const isTouch = 'touches' in e || (e.nativeEvent as PointerEvent)?.pointerType === 'touch';

    // If clicking an existing stone, inspect its group & liberties!
    if (board[pt.row][pt.col] !== null) {
      setPendingTouchPoint(null);
      setSelectedStonePoint((prev) => (pointsEqual(prev, pt) ? null : pt));
      return;
    }

    if (disabled) return;

    // On mobile touch (or when touchConfirmMode is enabled or board >= 13),
    // first tap previews the stone and liberties; second tap on the same spot places it.
    if (isTouch || visualizer.touchConfirmMode) {
      if (pointsEqual(pendingTouchPoint, pt)) {
        setPendingTouchPoint(null);
        setSelectedStonePoint(null);
        onPlaceStone(pt);
      } else {
        setPendingTouchPoint(pt);
        setSelectedStonePoint(null);
      }
    } else {
      setPendingTouchPoint(null);
      setSelectedStonePoint(null);
      onPlaceStone(pt);
    }
  };

  // Compute orthogonal group connection bridges
  const groupBridges = useMemo(() => {
    if (!visualizer.showGroupConnections && !inspectedGroup) return [];
    const bridges: {
      from: Point;
      to: Point;
      color: StoneColor;
      liberties: number;
      isInspected: boolean;
    }[] = [];

    for (const grp of groups) {
      const isInspected = inspectedGroup?.id === grp.id;
      if (!visualizer.showGroupConnections && !isInspected) continue;

      const stoneSet = new Set(grp.stones.map(pointKey));
      for (const s of grp.stones) {
        // Right neighbor
        const right = { row: s.row, col: s.col + 1 };
        if (stoneSet.has(pointKey(right))) {
          bridges.push({
            from: s,
            to: right,
            color: grp.color,
            liberties: grp.liberties.length,
            isInspected,
          });
        }
        // Bottom neighbor
        const down = { row: s.row + 1, col: s.col };
        if (stoneSet.has(pointKey(down))) {
          bridges.push({
            from: s,
            to: down,
            color: grp.color,
            liberties: grp.liberties.length,
            isInspected,
          });
        }
      }
    }
    return bridges;
  }, [groups, visualizer.showGroupConnections, inspectedGroup]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Live Inspector / Simulation Banner above the board */}
      <div className="w-full max-w-[540px] mb-2 min-h-[42px] flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm shadow-inner">
        {moveSimulation ? (
          moveSimulation.validation.valid ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-amber-300">
                Preview {formatCoordinate(moveSimulation.point, size)}:
              </span>
              {moveSimulation.validation.capturedStones &&
              moveSimulation.validation.capturedStones.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Captures {moveSimulation.validation.capturedStones.length} stone
                  {moveSimulation.validation.capturedStones.length > 1 ? 's' : ''}!
                </span>
              ) : null}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                  moveSimulation.validation.putsSelfInAtari
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                Resulting Group: {moveSimulation.validation.resultingGroupLiberties}{' '}
                {moveSimulation.validation.resultingGroupLiberties === 1
                  ? 'liberty (Self-Atari!)'
                  : 'liberties (breaths)'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-300 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{moveSimulation.validation.reason}</span>
            </div>
          )
        ) : inspectedGroup ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full inline-block ${
                  inspectedGroup.color === 'B'
                    ? 'bg-slate-950 border border-slate-400'
                    : 'bg-white border border-slate-300'
                }`}
              />
              <span className="font-semibold text-slate-200">
                {inspectedGroup.color === 'B' ? 'Black' : 'White'} Group (
                {inspectedGroup.stones.length} stone
                {inspectedGroup.stones.length > 1 ? 's' : ''})
              </span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${getLibertyColor(inspectedGroup.liberties.length)}25`,
                color: getLibertyColor(inspectedGroup.liberties.length),
                border: `1px solid ${getLibertyColor(inspectedGroup.liberties.length)}60`,
              }}
            >
              {inspectedGroup.liberties.length === 1
                ? 'ATARI! 1 Liberty (Breath) Left'
                : `${inspectedGroup.liberties.length} Liberties (Breaths)`}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Tap or hover any stone to inspect its connected group & liberties
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Responsive Board Container */}
      <div className="relative w-full max-w-[540px] aspect-square rounded-2xl p-1.5 sm:p-2.5 bg-gradient-to-br from-[#dcb35c] via-[#d2a44c] to-[#be8e38] shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)] border-2 border-[#a47728]">
        {/* Subtle wood grain texture overlay */}
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full touch-manipulation block"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* 3D Black Stone Gradient */}
            <radialGradient id="blackStoneGrad" cx="32%" cy="30%" r="68%">
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="45%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>

            {/* 3D White Clam-Shell Stone Gradient */}
            <radialGradient id="whiteStoneGrad" cx="32%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>

            {/* Drop shadow for stones */}
            <filter id="stoneShadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Coordinate Labels along all 4 edges */}
          {Array.from({ length: size }).map((_, idx) => {
            const pos = padding + idx * cellSize;
            const colLetter = letters[idx];
            const rowLabel = `${size - idx}`;
            return (
              <g key={`coord-${idx}`} className="fill-[#4a3210] font-bold" style={{ fontSize: Math.max(10, cellSize * 0.24) }}>
                {/* Top & Bottom column letters */}
                <text x={pos} y={padding * 0.42} textAnchor="middle" dominantBaseline="central">
                  {colLetter}
                </text>
                <text
                  x={pos}
                  y={svgSize - padding * 0.42}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {colLetter}
                </text>
                {/* Left & Right row numbers */}
                <text x={padding * 0.4} y={pos} textAnchor="middle" dominantBaseline="central">
                  {rowLabel}
                </text>
                <text
                  x={svgSize - padding * 0.4}
                  y={pos}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {rowLabel}
                </text>
              </g>
            );
          })}

          {/* Goban Grid Lines */}
          <g stroke="#3d280a" opacity="0.85">
            {Array.from({ length: size }).map((_, i) => {
              const offset = padding + i * cellSize;
              const isOuter = i === 0 || i === size - 1;
              return (
                <React.Fragment key={`line-${i}`}>
                  <line
                    x1={padding}
                    y1={offset}
                    x2={svgSize - padding}
                    y2={offset}
                    strokeWidth={isOuter ? 2.2 : 1.3}
                  />
                  <line
                    x1={offset}
                    y1={padding}
                    x2={offset}
                    y2={svgSize - padding}
                    strokeWidth={isOuter ? 2.2 : 1.3}
                  />
                </React.Fragment>
              );
            })}
          </g>

          {/* Star Points (Hoshi) */}
          {starPoints.map((pt) => {
            const { x, y } = toXY(pt);
            return (
              <circle
                key={`star-${pt.row}-${pt.col}`}
                cx={x}
                cy={y}
                r={Math.max(3, cellSize * 0.09)}
                fill="#3d280a"
              />
            );
          })}

          {/* Territory & Influence Map Overlay */}
          {visualizer.showTerritoryMap &&
            territoryEstimate &&
            territoryEstimate.ownerMap.map((rowArr, r) =>
              rowArr.map((owner, c) => {
                if (!owner || owner === 'neutral' || board[r][c] !== null) return null;
                const { x, y } = toXY({ row: r, col: c });
                const boxSize = cellSize * 0.34;
                return (
                  <rect
                    key={`terr-${r}-${c}`}
                    x={x - boxSize / 2}
                    y={y - boxSize / 2}
                    width={boxSize}
                    height={boxSize}
                    rx={3}
                    fill={owner === 'B' ? '#0f172a' : '#ffffff'}
                    stroke={owner === 'B' ? '#94a3b8' : '#334155'}
                    strokeWidth={1.5}
                    opacity={0.82}
                  />
                );
              })
            )}

          {/* Live Liberty Breathing Lines & Dots */}
          {groups.map((grp) => {
            const isInspected = inspectedGroup?.id === grp.id;
            const isAtari = grp.liberties.length === 1;
            const shouldShow =
              visualizer.showLibertyDots ||
              isInspected ||
              (visualizer.showAtariWarnings && isAtari);

            if (!shouldShow) return null;

            const libColor = getLibertyColor(grp.liberties.length);

            return (
              <g key={`libs-${grp.id}`}>
                {/* Subtle breathing lines from each liberty to adjacent stones of this group */}
                {grp.liberties.map((lib) => {
                  const libXY = toXY(lib);
                  // Find closest stone in this group to draw a breathing connector
                  const adjacentGroupStones = grp.stones.filter(
                    (s) => Math.abs(s.row - lib.row) + Math.abs(s.col - lib.col) === 1
                  );

                  return (
                    <React.Fragment key={`lib-${grp.id}-${lib.row}-${lib.col}`}>
                      {(isInspected || isAtari) &&
                        adjacentGroupStones.map((s) => {
                          const sXY = toXY(s);
                          return (
                            <line
                              key={`bline-${s.row}-${s.col}-${lib.row}-${lib.col}`}
                              x1={sXY.x}
                              y1={sXY.y}
                              x2={libXY.x}
                              y2={libXY.y}
                              stroke={libColor}
                              strokeWidth={isInspected ? 3 : 2.2}
                              strokeDasharray="4 3"
                              opacity={isInspected ? 0.95 : 0.75}
                            />
                          );
                        })}
                      <circle
                        cx={libXY.x}
                        cy={libXY.y}
                        r={
                          isInspected
                            ? cellSize * 0.16
                            : isAtari
                            ? cellSize * 0.15
                            : cellSize * 0.11
                        }
                        fill={libColor}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        opacity={isInspected || isAtari ? 0.95 : 0.72}
                      />
                    </React.Fragment>
                  );
                })}
              </g>
            );
          })}

          {/* Simulated Move Liberty Dots when hovering/previewing an empty point */}
          {visualizer.showMovePreview &&
            moveSimulation?.simulatedGroup &&
            moveSimulation.simulatedGroup.liberties.map((lib) => {
              const { x, y } = toXY(lib);
              const simLibCount = moveSimulation.simulatedGroup!.liberties.length;
              return (
                <circle
                  key={`simlib-${lib.row}-${lib.col}`}
                  cx={x}
                  cy={y}
                  r={cellSize * 0.14}
                  fill={getLibertyColor(simLibCount)}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              );
            })}

          {/* Group Connection Bridges (rendered right under the stones so connected groups look linked!) */}
          {groupBridges.map((b, i) => {
            const p1 = toXY(b.from);
            const p2 = toXY(b.to);
            const bridgeColor = getLibertyColor(b.liberties);
            return (
              <g key={`bridge-${i}`}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={b.color === 'B' ? '#1e293b' : '#f8fafc'}
                  strokeWidth={stoneRadius * 0.62}
                  strokeLinecap="round"
                  opacity={0.92}
                />
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={bridgeColor}
                  strokeWidth={b.isInspected ? stoneRadius * 0.28 : stoneRadius * 0.18}
                  strokeLinecap="round"
                  opacity={0.95}
                />
              </g>
            );
          })}

          {/* Placed Stones */}
          {board.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              if (!cell) return null;
              const pt = { row: r, col: c };
              const { x, y } = toXY(pt);
              const grp = stoneToGroup.get(pointKey(pt));
              const libCount = grp ? grp.liberties.length : 0;
              const isAtari = libCount === 1;
              const isInspected = inspectedGroup?.id === grp?.id;
              const isLastMove = pointsEqual(lastMove, pt);
              const willBeCapturedByPreview =
                moveSimulation?.validation.capturedStones?.some((cap) =>
                  pointsEqual(cap, pt)
                ) || false;

              return (
                <g key={`stone-${r}-${c}`} className="transition-transform duration-150">
                  {/* Pulsing crimson halo when in Atari */}
                  {visualizer.showAtariWarnings && isAtari && (
                    <circle
                      cx={x}
                      cy={y}
                      r={stoneRadius * 1.18}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={3}
                       opacity={0.9}
                      className="animate-pulse"
                    />
                  )}

                  {/* Highlight ring when group is inspected */}
                  {isInspected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={stoneRadius * 1.14}
                      fill="none"
                      stroke={getLibertyColor(libCount)}
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Main 3D Stone Body */}
                  <circle
                    cx={x}
                    cy={y}
                    r={stoneRadius}
                    fill={cell === 'B' ? 'url(#blackStoneGrad)' : 'url(#whiteStoneGrad)'}
                    stroke={cell === 'B' ? '#0f172a' : '#94a3b8'}
                    strokeWidth={1}
                    filter="url(#stoneShadow)"
                  />

                  {/* Last Move Marker */}
                  {isLastMove && (
                    <circle
                      cx={x}
                      cy={y}
                      r={stoneRadius * 0.34}
                      fill="none"
                      stroke={cell === 'B' ? '#fbbf24' : '#d97706'}
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Liberty count badge on the first stone of each group when Liberty Visualizer is on */}
                  {(visualizer.showLibertyDots || isInspected || (visualizer.showAtariWarnings && isAtari)) &&
                    grp &&
                    pointsEqual(grp.stones[0], pt) && (
                      <g transform={`translate(${x + stoneRadius * 0.65}, ${y - stoneRadius * 0.65})`}>
                        <circle
                          r={Math.max(8, stoneRadius * 0.42)}
                          fill={getLibertyColor(libCount)}
                          stroke="#0f172a"
                          strokeWidth={1.2}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontWeight="bold"
                          fontSize={Math.max(9, stoneRadius * 0.46)}
                        >
                          {libCount}
                        </text>
                      </g>
                    )}

                  {/* Preview Capture Crosshair if hovering a capturing move */}
                  {willBeCapturedByPreview && (
                    <g stroke="#10b981" strokeWidth={2.5}>
                      <circle
                        cx={x}
                        cy={y}
                        r={stoneRadius * 0.85}
                        fill="none"
                        strokeDasharray="3 2"
                      />
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Lesson Annotations & Target Markers */}
          {annotations.map((ann, i) => {
            if (board[ann.point.row]?.[ann.point.col] !== null) return null;
            const { x, y } = toXY(ann.point);
            const color =
              ann.type === 'target'
                ? '#10b981'
                : ann.type === 'eye'
                ? '#38bdf8'
                : ann.type === 'danger' || ann.type === 'forbidden'
                ? '#ef4444'
                : '#f59e0b';

            return (
              <g key={`ann-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={stoneRadius * 0.72}
                  fill={`${color}35`}
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray={ann.type === 'eye' ? '4 2' : undefined}
                />
                {ann.label && (
                  <g transform={`translate(${x}, ${y - stoneRadius * 1.15})`}>
                    <rect
                      x={-34}
                      y={-11}
                      width={68}
                      height={20}
                      rx={6}
                      fill="#0f172a"
                      stroke={color}
                      strokeWidth={1.2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#f8fafc"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {ann.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Coach Hint Highlight */}
          {coachHintPoint && board[coachHintPoint.row]?.[coachHintPoint.col] === null && (
            <g>
              <circle
                cx={toXY(coachHintPoint).x}
                cy={toXY(coachHintPoint).y}
                r={stoneRadius * 0.88}
                fill="rgba(245, 158, 11, 0.28)"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 3"
              />
              <circle
                cx={toXY(coachHintPoint).x}
                cy={toXY(coachHintPoint).y}
                r={stoneRadius * 0.32}
                fill="#f59e0b"
              />
            </g>
          )}

          {/* Ghost Preview Stone (Hover or Mobile Touch Preview) */}
          {activePreviewPoint &&
            board[activePreviewPoint.row]?.[activePreviewPoint.col] === null &&
            !disabled && (
              <g pointerEvents="none">
                {moveSimulation?.validation.valid ? (
                  <>
                    <circle
                      cx={toXY(activePreviewPoint).x}
                      cy={toXY(activePreviewPoint).y}
                      r={stoneRadius}
                      fill={
                        playerColor === 'B'
                          ? 'url(#blackStoneGrad)'
                          : 'url(#whiteStoneGrad)'
                      }
                      opacity={0.62}
                      stroke={
                        moveSimulation.validation.putsSelfInAtari
                          ? '#ef4444'
                          : '#10b981'
                      }
                      strokeWidth={2.5}
                    />
                    {pendingTouchPoint && (
                      <circle
                        cx={toXY(activePreviewPoint).x}
                        cy={toXY(activePreviewPoint).y}
                        r={stoneRadius * 1.24}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        strokeDasharray="4 3"
                      />
                    )}
                  </>
                ) : (
                  /* Forbidden Move (Suicide or Ko) Red X Marker */
                  <g
                    transform={`translate(${toXY(activePreviewPoint).x}, ${
                      toXY(activePreviewPoint).y
                    })`}
                  >
                    <circle
                      r={stoneRadius * 0.78}
                      fill="rgba(239, 68, 68, 0.25)"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                    />
                    <line
                      x1={-stoneRadius * 0.4}
                      y1={-stoneRadius * 0.4}
                      x2={stoneRadius * 0.4}
                      y2={stoneRadius * 0.4}
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={stoneRadius * 0.4}
                      y1={-stoneRadius * 0.4}
                      x2={-stoneRadius * 0.4}
                      y2={stoneRadius * 0.4}
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )}

          {/* Invisible Touch / Click Hit Targets for Every Intersection */}
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((__, c) => {
              const pt = { row: r, col: c };
              const { x, y } = toXY(pt);
              return (
                <rect
                  key={`hit-${r}-${c}`}
                  x={x - cellSize / 2}
                  y={y - cellSize / 2}
                  width={cellSize}
                  height={cellSize}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onClick={(e) => handleIntersectionInteraction(pt, e)}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Mobile Tap-to-Confirm Action Bar (Appears when a touch user taps an empty spot) */}
      {pendingTouchPoint && (
        <div className="w-full max-w-[540px] mt-2.5 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 animate-fade-in">
          <div className="text-xs sm:text-sm text-amber-200 font-medium">
            Selected{' '}
            <span className="font-bold text-white">
              {formatCoordinate(pendingTouchPoint, size)}
            </span>{' '}
            — tap again or confirm:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const pt = pendingTouchPoint;
                setPendingTouchPoint(null);
                onPlaceStone(pt);
              }}
              disabled={!moveSimulation?.validation.valid}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Place Stone
            </button>
            <button
              type="button"
              onClick={() => setPendingTouchPoint(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
