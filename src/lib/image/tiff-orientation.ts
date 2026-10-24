export function tiffOrientationMatrix(width: number, height: number, orientation: number): { width: number; height: number; matrix: [number, number, number, number, number, number] } {
  const matrices: Record<number, [number, number, number, number, number, number]> = {
    1: [1,0,0,1,0,0], 2: [-1,0,0,1,width,0], 3: [-1,0,0,-1,width,height], 4: [1,0,0,-1,0,height],
    5: [0,1,1,0,0,0], 6: [0,1,-1,0,height,0], 7: [0,-1,-1,0,height,width], 8: [0,-1,1,0,0,width],
  };
  if (!matrices[orientation]) throw new Error("Invalid TIFF orientation.");
  return { width: orientation >= 5 ? height : width, height: orientation >= 5 ? width : height, matrix: matrices[orientation] };
}
