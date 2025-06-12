/**
 * Geometry Utilities Module for GeoPixel Application
 * 
 * This module contains geometric calculation functions for:
 * - Polygon distance calculations
 * - Polygon area calculations
 * - Polygon orientation detection
 * - Cross product calculations
 * - Convex hull algorithms
 */

/**
 * Calculates the minimum distance between two polygons.
 *
 * @param {Array} poly1 - First polygon coordinates
 * @param {Array} poly2 - Second polygon coordinates
 * @returns {number} - Minimum distance between polygons
 */
export function calculatePolygonDistance(poly1, poly2) {
    let minDistance = Infinity;
    
    // Check distance between all points of both polygons
    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            const distance = Math.sqrt(
                Math.pow(poly1[i][0] - poly2[j][0], 2) +
                Math.pow(poly1[i][1] - poly2[j][1], 2)
            );
            minDistance = Math.min(minDistance, distance);
        }
    }
    
    return minDistance;
}

/**
 * Calculates the approximate area of a polygon using the shoelace formula.
 *
 * @param {Array} coords - Array of [x, y] coordinates
 * @returns {number} - Polygon area
 */
export function calculatePolygonArea(coords) {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
    }
    return Math.abs(area) / 2;
}

/**
 * Determines if a polygon is in clockwise order.
 * For the right-hand rule, exterior rings should be counterclockwise.
 *
 * @param {Array} coords - Array of coordinate pairs [x, y]
 * @returns {boolean} - True if clockwise, false if counterclockwise
 */
export function isPolygonClockwise(coords) {
    // Implementation of the Shoelace formula (also known as the surveyor's formula)
    // to calculate the signed area of the polygon
    let area = 0;

    // Need at least 3 points to form a polygon
    if (coords.length < 3) {
        return false;
    }

    for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i + 1][0] - coords[i][0]) * (coords[i + 1][1] + coords[i][1]);
    }

    // If the signed area is positive, the polygon is clockwise
    return area > 0;
}

/**
 * Calculates the cross product for three points to determine turn direction.
 *
 * @param {Array} O - First point [x, y]
 * @param {Array} A - Second point [x, y]
 * @param {Array} B - Third point [x, y]
 * @returns {number} - Cross product (positive for counter-clockwise, negative for clockwise)
 */
export function crossProduct(O, A, B) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

/**
 * Computes the convex hull of a set of points using Graham scan algorithm.
 *
 * @param {Array} points - Array of [x, y] coordinates
 * @returns {Array} - Convex hull as array of [x, y] coordinates
 */
export function convexHull(points) {
    if (points.length < 3) return points;
    
    // Remove duplicate points
    const uniquePoints = [];
    const seen = new Set();
    points.forEach(point => {
        const key = `${point[0]},${point[1]}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePoints.push(point);
        }
    });
    
    if (uniquePoints.length < 3) return uniquePoints;
    
    // Find the bottom-most point (and leftmost in case of tie)
    let start = 0;
    for (let i = 1; i < uniquePoints.length; i++) {
        if (uniquePoints[i][1] < uniquePoints[start][1] ||
            (uniquePoints[i][1] === uniquePoints[start][1] && uniquePoints[i][0] < uniquePoints[start][0])) {
            start = i;
        }
    }
    
    // Swap start point to beginning
    [uniquePoints[0], uniquePoints[start]] = [uniquePoints[start], uniquePoints[0]];
    
    // Sort points by polar angle with respect to start point
    const startPoint = uniquePoints[0];
    uniquePoints.slice(1).sort((a, b) => {
        const angleA = Math.atan2(a[1] - startPoint[1], a[0] - startPoint[0]);
        const angleB = Math.atan2(b[1] - startPoint[1], b[0] - startPoint[0]);
        if (angleA === angleB) {
            // If angles are equal, sort by distance
            const distA = Math.pow(a[0] - startPoint[0], 2) + Math.pow(a[1] - startPoint[1], 2);
            const distB = Math.pow(b[0] - startPoint[0], 2) + Math.pow(b[1] - startPoint[1], 2);
            return distA - distB;
        }
        return angleA - angleB;
    });
    
    // Build convex hull
    const hull = [uniquePoints[0], uniquePoints[1]];
    
    for (let i = 2; i < uniquePoints.length; i++) {
        // Remove points that make clockwise turn
        while (hull.length > 1 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], uniquePoints[i]) <= 0) {
            hull.pop();
        }
        hull.push(uniquePoints[i]);
    }
    
    // Close the polygon
    if (hull.length > 0 && JSON.stringify(hull[0]) !== JSON.stringify(hull[hull.length - 1])) {
        hull.push([...hull[0]]);
    }
    
    return hull;
}

/**
 * Combines multiple masks into a single unified mask.
 * Uses a conservative approach that preserves the original mask shapes.
 *
 * @param {Array} masks - Array of polygon coordinates to combine
 * @returns {Array} - Combined polygon coordinates
 */
export function combineMasks(masks) {
    if (masks.length === 1) {
        return masks[0];
    }
    
    // For now, use a simple approach: find the largest mask and merge smaller ones into it
    // This preserves the general shape better than convex hull
    let largestMask = masks[0];
    let largestArea = calculatePolygonArea(largestMask);
    
    for (let i = 1; i < masks.length; i++) {
        const area = calculatePolygonArea(masks[i]);
        if (area > largestArea) {
            largestMask = masks[i];
            largestArea = area;
        }
    }
    
    // Return the largest mask as the representative shape
    // In a more sophisticated implementation, we could use proper polygon union algorithms
    return largestMask;
}

/**
 * Determines if two tiles are direct neighbors (horizontally or vertically adjacent).
 * This is more conservative than diagonal neighbors.
 *
 * @param {number} tileIndex1 - First tile index
 * @param {number} tileIndex2 - Second tile index
 * @param {number} cols - Number of columns in tile grid
 * @returns {boolean} - True if tiles are direct neighbors
 */
export function areDirectNeighbors(tileIndex1, tileIndex2, cols) {
    // Convert tile indices to row, col coordinates
    const row1 = Math.floor(tileIndex1 / cols);
    const col1 = tileIndex1 % cols;
    const row2 = Math.floor(tileIndex2 / cols);
    const col2 = tileIndex2 % cols;
    
    // Check if tiles are directly adjacent (horizontally or vertically only)
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Determines if two tiles are neighbors in the grid.
 *
 * @param {number} tileIndex1 - First tile index
 * @param {number} tileIndex2 - Second tile index
 * @param {number} cols - Number of columns in tile grid
 * @param {number} rows - Number of rows in tile grid
 * @returns {boolean} - True if tiles are neighbors
 */
export function areNeighboringTiles(tileIndex1, tileIndex2, cols, rows) {
    // Convert tile indices to row, col coordinates
    const row1 = Math.floor(tileIndex1 / cols);
    const col1 = tileIndex1 % cols;
    const row2 = Math.floor(tileIndex2 / cols);
    const col2 = tileIndex2 % cols;
    
    // Check if tiles are adjacent (horizontally, vertically, or diagonally)
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Combines neighboring tile masks that are within a small threshold distance.
 * Only combines masks from different tiles and uses more conservative criteria.
 *
 * @param {Array} geometries - Array of geometry objects with tile information
 * @param {Object} tileConfig - Tile configuration object with cols property
 * @returns {Array} - Array of combined geometries
 */
export function combineNeighboringMasks(geometries, tileConfig) {
    console.log(`Starting mask combining for ${geometries.length} geometries...`);
    
    // More conservative distance threshold for combining masks (in map units - meters for EPSG:3857)
    const COMBINE_THRESHOLD = 25; // 25 meters - more conservative
    
    const combinedGeometries = [];
    const processed = new Set();
    
    for (let i = 0; i < geometries.length; i++) {
        if (processed.has(i)) continue;
        
        const currentGeom = geometries[i];
        const tilesToCombine = [i];
        processed.add(i);
        
        // Find neighboring tiles and check for close masks
        for (let j = i + 1; j < geometries.length; j++) {
            if (processed.has(j)) continue;
            
            const otherGeom = geometries[j];
            
            // Only combine masks from different tiles
            if (currentGeom.tileIndex === otherGeom.tileIndex) continue;
            
            // Check if tiles are neighbors (only direct neighbors, not diagonal)
            if (areDirectNeighbors(currentGeom.tileIndex, otherGeom.tileIndex, tileConfig.cols)) {
                // Check if masks are close enough and similar enough to combine
                const distance = calculatePolygonDistance(currentGeom.coordinates, otherGeom.coordinates);
                
                if (distance <= COMBINE_THRESHOLD) {
                    // Additional check: only combine if masks have similar areas (within 3x ratio)
                    const area1 = calculatePolygonArea(currentGeom.coordinates);
                    const area2 = calculatePolygonArea(otherGeom.coordinates);
                    const areaRatio = Math.max(area1, area2) / Math.min(area1, area2);
                    
                    if (areaRatio <= 3.0) {
                        console.log(`Combining masks from tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} (distance: ${distance.toFixed(2)}m, area ratio: ${areaRatio.toFixed(2)})`);
                        tilesToCombine.push(j);
                        processed.add(j);
                    } else {
                        console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - area ratio too large: ${areaRatio.toFixed(2)}`);
                    }
                }
            }
        }
        
        // Combine the masks if we have multiple tiles to combine
        if (tilesToCombine.length > 1) {
            const masksToCombine = tilesToCombine.map(idx => geometries[idx].coordinates);
            const combinedMask = combineMasks(masksToCombine);
            
            combinedGeometries.push({
                coordinates: combinedMask,
                combinedFromTiles: tilesToCombine.map(idx => geometries[idx].tileIndex)
            });
        } else {
            // Keep original mask
            combinedGeometries.push({
                coordinates: currentGeom.coordinates,
                originalTile: currentGeom.tileIndex
            });
        }
    }
    
    console.log(`Mask combining complete: ${geometries.length} → ${combinedGeometries.length} geometries`);
    return combinedGeometries;
}