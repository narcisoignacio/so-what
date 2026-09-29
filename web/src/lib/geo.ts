// Grid-index cell size in degrees (spec §6.1). Must equal pipeline/grid.py and meta.cell_size_deg.
const CELL_SIZE_DEG = 0.01;

interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface CellRange {
  rowMin: number;
  rowMax: number;
  colMin: number;
  colMax: number;
}

/**
 * Computes the grid cell range enclosing a bounding box.
 * Uses Math.floor to correctly handle negative coordinates (spec §6.1).
 */
function cellRange(boundingBox: BoundingBox): CellRange {
  return {
    rowMin: Math.floor(boundingBox.south / CELL_SIZE_DEG),
    rowMax: Math.floor(boundingBox.north / CELL_SIZE_DEG),
    colMin: Math.floor(boundingBox.west / CELL_SIZE_DEG),
    colMax: Math.floor(boundingBox.east / CELL_SIZE_DEG),
  };
}

export { CELL_SIZE_DEG, cellRange, type BoundingBox, type CellRange };
