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
    
    // Ultra-conservative distance threshold for combining masks (in map units - meters for EPSG:3857)
    const COMBINE_THRESHOLD = 1; // 1 meter - only combine extremely close masks
    
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
                    // Extremely restrictive area check: only combine if masks have nearly identical areas
                    const area1 = calculatePolygonArea(currentGeom.coordinates);
                    const area2 = calculatePolygonArea(otherGeom.coordinates);
                    const areaRatio = Math.max(area1, area2) / Math.min(area1, area2);
                    
                    // Ultra-strict size check: masks must be very similar in size
                    const minArea = Math.min(area1, area2);
                    const maxAllowedAreaRatio = minArea < 50 ? 1.2 : 1.3; // Almost identical for any size
                    
                    // Additional check: masks must be of reasonable minimum size to be combined
                    const MIN_COMBINABLE_AREA = 10; // Don't combine very tiny masks
                    
                    if (areaRatio <= maxAllowedAreaRatio && minArea >= MIN_COMBINABLE_AREA) {
                        // Final ultra-strict check: distance must be less than 20% of the smallest mask's "radius"
                        const avgRadius = Math.sqrt(minArea / Math.PI); // Approximate radius if it were circular
                        const maxDistanceForSize = avgRadius * 0.1; // Only 10% of radius
                        
                        if (distance <= Math.max(COMBINE_THRESHOLD, maxDistanceForSize)) {
                            console.log(`Combining masks from tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} (distance: ${distance.toFixed(2)}m, area ratio: ${areaRatio.toFixed(2)}, min area: ${minArea.toFixed(0)}, max dist for size: ${maxDistanceForSize.toFixed(2)}m)`);
                            tilesToCombine.push(j);
                            processed.add(j);
                        } else {
                            console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - distance too large relative to mask size: ${distance.toFixed(2)}m (max for this size: ${maxDistanceForSize.toFixed(2)}m)`);
                        }
                    } else if (minArea < MIN_COMBINABLE_AREA) {
                        console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - masks too small to combine: ${minArea.toFixed(0)} (min: ${MIN_COMBINABLE_AREA})`);
                    } else {
                        console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - area ratio too large: ${areaRatio.toFixed(2)} (max allowed: ${maxAllowedAreaRatio.toFixed(1)})`);
                    }
                } else {
                    console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - distance too large: ${distance.toFixed(2)}m (max: ${COMBINE_THRESHOLD}m)`);
                }
            }
        }
        
        // Combine the masks if we have multiple tiles to combine
        if (tilesToCombine.length > 1) {
            const masksToCombine = tilesToCombine.map(idx => geometries[idx].coordinates);
            const combinedMask = combineMasks(masksToCombine);
            
            // Check if any of the combined masks have holes and preserve them
            const allHoles = [];
            tilesToCombine.forEach(idx => {
                if (geometries[idx].holes) {
                    allHoles.push(...geometries[idx].holes);
                }
            });
            
            const result = {
                coordinates: combinedMask,
                combinedFromTiles: tilesToCombine.map(idx => geometries[idx].tileIndex)
            };
            
            if (allHoles.length > 0) {
                result.holes = allHoles;
            }
            
            combinedGeometries.push(result);
        } else {
            // Keep original mask with all its properties (including holes if any)
            const result = {
                coordinates: currentGeom.coordinates,
                originalTile: currentGeom.tileIndex
            };
            
            if (currentGeom.holes) {
                result.holes = currentGeom.holes;
            }
            
            combinedGeometries.push(result);
        }
    }
    
    console.log(`Mask combining complete: ${geometries.length} → ${combinedGeometries.length} geometries`);
    return combinedGeometries;
}

/**
 * Checks if a point is inside a polygon using the ray casting algorithm.
 *
 * @param {Array} point - Point coordinates [x, y]
 * @param {Array} polygon - Array of polygon vertices [[x, y], ...]
 * @returns {boolean} - True if point is inside polygon
 */
export function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    
    return inside;
}

/**
 * Checks if one polygon is entirely contained within another polygon.
 *
 * @param {Array} innerPoly - Inner polygon coordinates
 * @param {Array} outerPoly - Outer polygon coordinates
 * @returns {boolean} - True if inner polygon is entirely contained within outer polygon
 */
export function isPolygonContained(innerPoly, outerPoly) {
    // Check if all vertices of the inner polygon are inside the outer polygon
    for (let i = 0; i < innerPoly.length - 1; i++) { // -1 to skip the closing point
        if (!pointInPolygon(innerPoly[i], outerPoly)) {
            return false;
        }
    }
    
    // Also check if polygons are not identical (same coordinates)
    if (innerPoly.length === outerPoly.length) {
        let identical = true;
        for (let i = 0; i < innerPoly.length; i++) {
            if (Math.abs(innerPoly[i][0] - outerPoly[i][0]) > 1 ||
                Math.abs(innerPoly[i][1] - outerPoly[i][1]) > 1) {
                identical = false;
                break;
            }
        }
        if (identical) return false; // Don't consider identical polygons as contained
    }
    
    return true;
}

/**
 * Merges masks that are entirely contained within other masks of the same layer.
 * Creates MultiPolygon features where inner polygons become holes in outer polygons.
 *
 * @param {Array} geometries - Array of geometry objects
 * @returns {Array} - Array of merged geometries with containment resolved
 */
export function mergeContainedMasks(geometries) {
    console.log(`Starting containment analysis for ${geometries.length} geometries...`);
    
    const mergedGeometries = [];
    const processed = new Set();
    
    for (let i = 0; i < geometries.length; i++) {
        if (processed.has(i)) continue;
        
        const outerGeom = geometries[i];
        const containedMasks = [];
        
        // Find all masks contained within this one
        for (let j = 0; j < geometries.length; j++) {
            if (i === j || processed.has(j)) continue;
            
            const innerGeom = geometries[j];
            
            if (isPolygonContained(innerGeom.coordinates, outerGeom.coordinates)) {
                console.log(`Found contained mask: geometry ${j} is contained within geometry ${i}`);
                containedMasks.push(j);
                processed.add(j);
            }
        }
        
        if (containedMasks.length > 0) {
            // Create a MultiPolygon with the outer polygon and inner polygons as holes
            const outerRing = outerGeom.coordinates;
            const holes = containedMasks.map(idx => geometries[idx].coordinates);
            
            mergedGeometries.push({
                coordinates: outerRing, // Keep the outer boundary as the main shape
                holes: holes, // Store holes separately for proper GeoJSON formatting
                containedMasks: containedMasks.map(idx => ({
                    originalIndex: idx,
                    coordinates: geometries[idx].coordinates
                })),
                originalIndex: i,
                tileIndex: outerGeom.tileIndex, // Preserve tileIndex for neighboring mask combining
                contourIndex: outerGeom.contourIndex,
                processed: outerGeom.processed
            });
            
            console.log(`Merged geometry ${i} with ${containedMasks.length} contained masks`);
        } else {
            // No contained masks, keep original with all original properties
            mergedGeometries.push({
                ...outerGeom, // Preserve all original properties including tileIndex
                originalIndex: i
            });
        }
        
        processed.add(i);
    }
    
    console.log(`Containment merging complete: ${geometries.length} → ${mergedGeometries.length} geometries`);
    return mergedGeometries;
}

/**
 * Enhanced combining function that first merges contained masks, then combines neighboring masks.
 *
 * @param {Array} geometries - Array of geometry objects with tile information
 * @param {Object} tileConfig - Tile configuration object with cols property
 * @returns {Array} - Array of combined geometries with containment resolved
 */
export function combineAndMergeAllMasks(geometries, tileConfig) {
    console.log(`Starting comprehensive mask processing for ${geometries.length} geometries...`);
    
    // Step 1: Merge contained masks within the same layer
    const containmentMerged = mergeContainedMasks(geometries);
    
    // Step 2: Combine neighboring masks from different tiles
    const finalGeometries = combineNeighboringMasks(containmentMerged, tileConfig);
    
    console.log(`Comprehensive mask processing complete: ${geometries.length} → ${finalGeometries.length} geometries`);
    return finalGeometries;
}

/**
 * Calculates the bounding box of a polygon.
 *
 * @param {Array} coords - Array of [x, y] coordinates
 * @returns {Object} - Bounding box with minX, minY, maxX, maxY properties
 */
export function getPolygonBoundingBox(coords) {
    if (coords.length === 0) return null;
    
    let minX = coords[0][0];
    let maxX = coords[0][0];
    let minY = coords[0][1];
    let maxY = coords[0][1];
    
    for (let i = 1; i < coords.length; i++) {
        minX = Math.min(minX, coords[i][0]);
        maxX = Math.max(maxX, coords[i][0]);
        minY = Math.min(minY, coords[i][1]);
        maxY = Math.max(maxY, coords[i][1]);
    }
    
    return { minX, minY, maxX, maxY };
}

/**
 * Calculates the intersection area between two polygons using bounding box approximation.
 * This is a simplified approach that provides a reasonable estimate for overlap calculations.
 *
 * @param {Array} poly1 - First polygon coordinates
 * @param {Array} poly2 - Second polygon coordinates
 * @returns {number} - Estimated intersection area
 */
export function calculatePolygonIntersectionArea(poly1, poly2) {
    // Get bounding boxes for both polygons
    const bbox1 = getPolygonBoundingBox(poly1);
    const bbox2 = getPolygonBoundingBox(poly2);
    
    if (!bbox1 || !bbox2) return 0;
    
    // Calculate bounding box intersection
    const intersectionMinX = Math.max(bbox1.minX, bbox2.minX);
    const intersectionMinY = Math.max(bbox1.minY, bbox2.minY);
    const intersectionMaxX = Math.min(bbox1.maxX, bbox2.maxX);
    const intersectionMaxY = Math.min(bbox1.maxY, bbox2.maxY);
    
    // Check if bounding boxes actually intersect
    if (intersectionMinX >= intersectionMaxX || intersectionMinY >= intersectionMaxY) {
        return 0; // No intersection
    }
    
    // Calculate bounding box intersection area
    const bboxIntersectionArea = (intersectionMaxX - intersectionMinX) * (intersectionMaxY - intersectionMinY);
    
    // For a more accurate estimate, we'll use a sampling approach
    // Sample points within the intersection bounding box and check if they're in both polygons
    const samplePoints = 100; // Number of sample points
    const stepX = (intersectionMaxX - intersectionMinX) / Math.sqrt(samplePoints);
    const stepY = (intersectionMaxY - intersectionMinY) / Math.sqrt(samplePoints);
    
    let pointsInBoth = 0;
    let totalSamplePoints = 0;
    
    for (let x = intersectionMinX + stepX / 2; x < intersectionMaxX; x += stepX) {
        for (let y = intersectionMinY + stepY / 2; y < intersectionMaxY; y += stepY) {
            totalSamplePoints++;
            if (pointInPolygon([x, y], poly1) && pointInPolygon([x, y], poly2)) {
                pointsInBoth++;
            }
        }
    }
    
    // Estimate intersection area based on sample ratio
    if (totalSamplePoints === 0) return 0;
    const intersectionRatio = pointsInBoth / totalSamplePoints;
    const estimatedIntersectionArea = bboxIntersectionArea * intersectionRatio;
    
    return estimatedIntersectionArea;
}

/**
 * Extracts polygon coordinates from a feature, handling both simple polygons and MultiPolygons.
 *
 * @param {Object} feature - OpenLayers feature
 * @returns {Array} - Array of polygon coordinate arrays
 */
export function extractPolygonCoordinates(feature) {
    const geometry = feature.getGeometry();
    const geometryType = geometry.getType();
    
    if (geometryType === 'Polygon') {
        return [geometry.getCoordinates()[0]]; // Return exterior ring only
    } else if (geometryType === 'MultiPolygon') {
        const coordinates = geometry.getCoordinates();
        const polygons = [];
        
        for (let i = 0; i < coordinates.length; i++) {
            polygons.push(coordinates[i][0]); // Get exterior ring of each polygon
        }
        
        return polygons;
    }
    
    return [];
}

/**
 * Calculates overlap statistics between two layers.
 *
 * @param {Object} layer1 - First OpenLayers vector layer
 * @param {Object} layer2 - Second OpenLayers vector layer
 * @returns {Object} - Overlap statistics including areas and percentages
 */
export function calculateLayerOverlap(layer1, layer2) {
    console.log('Calculating overlap between layers...');
    
    const features1 = layer1.getSource().getFeatures();
    const features2 = layer2.getSource().getFeatures();
    
    if (features1.length === 0 || features2.length === 0) {
        return {
            layer1Area: 0,
            layer2Area: 0,
            intersectionArea: 0,
            layer1OverlapPercentage: 0,
            layer2OverlapPercentage: 0,
            overallOverlapPercentage: 0
        };
    }
    
    // Extract all polygons from both layers
    const polygons1 = [];
    const polygons2 = [];
    
    features1.forEach(feature => {
        const coords = extractPolygonCoordinates(feature);
        polygons1.push(...coords);
    });
    
    features2.forEach(feature => {
        const coords = extractPolygonCoordinates(feature);
        polygons2.push(...coords);
    });
    
    // Calculate total areas for each layer
    let layer1TotalArea = 0;
    polygons1.forEach(poly => {
        layer1TotalArea += calculatePolygonArea(poly);
    });
    
    let layer2TotalArea = 0;
    polygons2.forEach(poly => {
        layer2TotalArea += calculatePolygonArea(poly);
    });
    
    // Calculate intersection area between all polygon pairs
    let totalIntersectionArea = 0;
    
    for (let i = 0; i < polygons1.length; i++) {
        for (let j = 0; j < polygons2.length; j++) {
            const intersectionArea = calculatePolygonIntersectionArea(polygons1[i], polygons2[j]);
            totalIntersectionArea += intersectionArea;
        }
    }
    
    // Calculate overlap percentages
    const layer1OverlapPercentage = layer1TotalArea > 0 ? (totalIntersectionArea / layer1TotalArea) * 100 : 0;
    const layer2OverlapPercentage = layer2TotalArea > 0 ? (totalIntersectionArea / layer2TotalArea) * 100 : 0;
    const overallOverlapPercentage = (layer1TotalArea + layer2TotalArea) > 0 ?
        (totalIntersectionArea / Math.min(layer1TotalArea, layer2TotalArea)) * 100 : 0;
    
    console.log(`Overlap calculation complete:
        Layer 1 area: ${layer1TotalArea.toFixed(2)} sq units
        Layer 2 area: ${layer2TotalArea.toFixed(2)} sq units
        Intersection area: ${totalIntersectionArea.toFixed(2)} sq units
        Layer 1 overlap: ${layer1OverlapPercentage.toFixed(2)}%
        Layer 2 overlap: ${layer2OverlapPercentage.toFixed(2)}%`);
    
    return {
        layer1Area: layer1TotalArea,
        layer2Area: layer2TotalArea,
        intersectionArea: totalIntersectionArea,
        layer1OverlapPercentage: layer1OverlapPercentage,
        layer2OverlapPercentage: layer2OverlapPercentage,
        overallOverlapPercentage: overallOverlapPercentage,
        layer1PolygonCount: polygons1.length,
        layer2PolygonCount: polygons2.length
    };
}

/**
 * Helper function to append features to a layer.
 * Handles both single feature and array of features.
 *
 * @param {ol.Feature|Array<ol.Feature>} features - Single feature or array of features to add
 * @param {ol.layer.Vector} layer - Target layer to add features to
 * @returns {ol.Feature|Array<ol.Feature>} - The original features parameter
 */
export function addRectangleToLayer(features, layer) {
  // Handle both single feature and array of features
  const featureArray = Array.isArray(features) ? features : [features];

  featureArray.forEach(feature => {
    feature.setStyle(layer.getStyle());
    layer.getSource().addFeature(feature);
  });

  return features;
}