// Import tile result processing function
import {
    combineAndDisplayTileResults
} from './vector-functions.js';

/**
 * Calculates the approximate area of a polygon using the shoelace formula.
 * @param {Array} coords - Array of [x, y] coordinates
 * @returns {number} - Polygon area
 */
function calculatePolygonArea(coords) {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
    }
    return Math.abs(area) / 2;
}

/**
 * Calculates the quality score of a contour based on various metrics
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {number} - Quality score (higher is better)
 */
function calculateContourQuality(contour) {
    if (contour.length < 3) return 0;
    
    const area = calculatePolygonArea(contour);
    const perimeter = calculatePerimeter(contour);
    const complexity = contour.length;
    
    // Calculate compactness (area to perimeter ratio)
    const compactness = area / (perimeter * perimeter);
    
    // Calculate smoothness (fewer sharp angles = smoother)
    const smoothness = calculateSmoothness(contour);
    
    // Combine metrics with weights
    const qualityScore = (
        area * 0.4 +           // Larger areas usually better
        compactness * 1000 +   // More compact shapes preferred
        smoothness * 0.3 +     // Smoother shapes preferred
        Math.min(complexity / 10, 5) // Reasonable complexity preferred
    );
    
    return qualityScore;
}

/**
 * Calculates the perimeter of a polygon
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {number} - Perimeter length
 */
function calculatePerimeter(contour) {
    if (contour.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < contour.length; i++) {
        const current = contour[i];
        const next = contour[(i + 1) % contour.length];
        const dx = next[0] - current[0];
        const dy = next[1] - current[1];
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
}

/**
 * Calculates the smoothness of a contour (lower values = smoother)
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {number} - Smoothness score
 */
function calculateSmoothness(contour) {
    if (contour.length < 3) return 0;
    
    let totalAngleVariation = 0;
    for (let i = 0; i < contour.length; i++) {
        const prev = contour[(i - 1 + contour.length) % contour.length];
        const curr = contour[i];
        const next = contour[(i + 1) % contour.length];
        
        // Calculate angle at current point
        const angle1 = Math.atan2(curr[1] - prev[1], curr[0] - prev[0]);
        const angle2 = Math.atan2(next[1] - curr[1], next[0] - curr[0]);
        
        let angleDiff = angle2 - angle1;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        totalAngleVariation += Math.abs(angleDiff);
    }
    
    return 1 / (1 + totalAngleVariation); // Invert so higher = smoother
}

/**
 * Helper function to check if a point is inside a polygon
 * @param {Array} point - [x, y] coordinates
 * @param {Array} polygon - Array of [x, y] coordinates representing polygon vertices
 * @returns {boolean} - True if point is inside polygon
 */
function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Helper function to check if two polygons overlap
 * @param {Array} poly1 - First polygon vertices
 * @param {Array} poly2 - Second polygon vertices
 * @returns {boolean} - True if polygons overlap
 */
function polygonsOverlap(poly1, poly2) {
    // Check if any vertex of poly1 is inside poly2
    for (let point of poly1) {
        if (pointInPolygon(point, poly2)) {
            return true;
        }
    }
    
    // Check if any vertex of poly2 is inside poly1
    for (let point of poly2) {
        if (pointInPolygon(point, poly1)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Helper function to merge overlapping contours
 * @param {Array} contours - Array of contour arrays
 * @param {number} tileIndex - Tile index for logging
 * @returns {Array} - Array of merged contours
 */
function mergeOverlappingContours(contours, tileIndex) {
    if (contours.length <= 1) {
        return contours;
    }
    
    console.log(`Tile ${tileIndex}: Starting overlap merge for ${contours.length} contours`);
    
    let merged = [];
    let processed = new Set();
    
    for (let i = 0; i < contours.length; i++) {
        if (processed.has(i)) continue;
        
        let currentContour = contours[i];
        let overlappingIndices = [i];
        
        // Find all contours that overlap with current contour
        for (let j = i + 1; j < contours.length; j++) {
            if (processed.has(j)) continue;
            
            if (polygonsOverlap(currentContour, contours[j])) {
                overlappingIndices.push(j);
                console.log(`Tile ${tileIndex}: Found overlap between contours ${i} and ${j}`);
            }
        }
        
        // If we found overlaps, merge them
        if (overlappingIndices.length > 1) {
            console.log(`Tile ${tileIndex}: Merging ${overlappingIndices.length} overlapping contours`);
            
            // Simple merge approach: create convex hull of all points
            let allPoints = [];
            for (let idx of overlappingIndices) {
                allPoints.push(...contours[idx]);
                processed.add(idx);
            }
            
            // Create convex hull
            const mergedContour = convexHull(allPoints);
            merged.push(mergedContour);
            
            console.log(`Tile ${tileIndex}: Merged contour has ${mergedContour.length} points`);
        } else {
            // No overlaps, keep original contour
            merged.push(currentContour);
            processed.add(i);
        }
    }
    
    console.log(`Tile ${tileIndex}: Merge complete: ${contours.length} → ${merged.length} contours`);
    return merged;
}

/**
 * Helper function to compute convex hull using Graham scan
 * @param {Array} points - Array of [x, y] coordinates
 * @returns {Array} - Array of vertices forming convex hull
 */
function convexHull(points) {
    if (points.length <= 3) {
        return points;
    }
    
    // Remove duplicate points
    const uniquePoints = [];
    const seen = new Set();
    for (let point of points) {
        const key = `${point[0]},${point[1]}`;
        if (!seen.has(key)) {
            uniquePoints.push(point);
            seen.add(key);
        }
    }
    
    if (uniquePoints.length <= 3) {
        return uniquePoints;
    }
    
    // Find the bottom-most point (and left-most in case of tie)
    let start = uniquePoints[0];
    for (let i = 1; i < uniquePoints.length; i++) {
        if (uniquePoints[i][1] < start[1] ||
            (uniquePoints[i][1] === start[1] && uniquePoints[i][0] < start[0])) {
            start = uniquePoints[i];
        }
    }
    
    // Sort points by polar angle with respect to start point
    const others = uniquePoints.filter(p => p !== start);
    others.sort((a, b) => {
        const angleA = Math.atan2(a[1] - start[1], a[0] - start[0]);
        const angleB = Math.atan2(b[1] - start[1], b[0] - start[0]);
        return angleA - angleB;
    });
    
    // Build convex hull
    const hull = [start];
    for (let point of others) {
        // Remove points that create clockwise turn
        while (hull.length > 1 && crossProduct(hull[hull.length-2], hull[hull.length-1], point) <= 0) {
            hull.pop();
        }
        hull.push(point);
    }
    
    return hull;
}

/**
 * Helper function to compute cross product for convex hull
 * @param {Array} o - Origin point [x, y]
 * @param {Array} a - Point A [x, y]
 * @param {Array} b - Point B [x, y]
 * @returns {number} - Cross product
 */
function crossProduct(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/**
 * Creates OGC-valid geometries from contours using max combination logic
 * @param {Array} contours - Array of contour arrays
 * @param {number} tileIndex - Tile index for logging
 * @returns {Array} - Array of OGC-valid geometry contours
 */
function createOGCValidGeometries(contours, tileIndex) {
    if (!contours || contours.length === 0) {
        return [];
    }
    
    console.log(`Tile ${tileIndex}: Creating OGC-valid geometries from ${contours.length} contours`);
    
    const validGeometries = [];
    
    contours.forEach((contour, idx) => {
        try {
            // Step 1: Filter out very small contours (noise)
            const area = calculatePolygonArea(contour);
            if (area < 10) {
                console.log(`Tile ${tileIndex}: Contour ${idx} too small (area: ${area.toFixed(2)}), skipping`);
                return;
            }
            
            // Step 2: Ensure proper closure (OGC requirement)
            let validContour = ensureProperClosure(contour);
            
            // Step 3: Remove duplicate consecutive points
            validContour = removeDuplicatePoints(validContour);
            
            // Step 4: Ensure minimum number of points for a valid polygon
            if (validContour.length < 4) { // Need at least 4 points (including closure)
                console.log(`Tile ${tileIndex}: Contour ${idx} has insufficient points (${validContour.length}), skipping`);
                return;
            }
            
            // Step 5: Ensure counter-clockwise winding (OGC standard for exterior rings)
            validContour = ensureCounterClockwiseWinding(validContour);
            
            // Step 6: Apply Douglas-Peucker simplification to reduce complexity while maintaining shape
            validContour = simplifyContour(validContour, 0.5); // 0.5 pixel tolerance
            
            // Step 7: Final validation
            if (isValidOGCPolygon(validContour)) {
                validGeometries.push(validContour);
                console.log(`Tile ${tileIndex}: Contour ${idx} validated as OGC-compliant (${validContour.length} points, area: ${area.toFixed(2)})`);
            } else {
                console.warn(`Tile ${tileIndex}: Contour ${idx} failed OGC validation, skipping`);
            }
            
        } catch (error) {
            console.error(`Tile ${tileIndex}: Error processing contour ${idx}:`, error);
        }
    });
    
    console.log(`Tile ${tileIndex}: Created ${validGeometries.length} OGC-valid geometries from ${contours.length} input contours`);
    return validGeometries;
}

/**
 * Ensures polygon is properly closed (first point equals last point)
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {Array} - Properly closed contour
 */
function ensureProperClosure(contour) {
    if (contour.length < 3) return contour;
    
    const first = contour[0];
    const last = contour[contour.length - 1];
    
    // Check if already closed
    if (first[0] === last[0] && first[1] === last[1]) {
        return contour;
    }
    
    // Add closing point
    return [...contour, [first[0], first[1]]];
}

/**
 * Removes duplicate consecutive points
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {Array} - Contour without duplicates
 */
function removeDuplicatePoints(contour) {
    if (contour.length < 2) return contour;
    
    const cleaned = [contour[0]];
    
    for (let i = 1; i < contour.length; i++) {
        const prev = contour[i - 1];
        const curr = contour[i];
        
        // Only add if different from previous point
        if (prev[0] !== curr[0] || prev[1] !== curr[1]) {
            cleaned.push(curr);
        }
    }
    
    return cleaned;
}

/**
 * Ensures counter-clockwise winding order for exterior rings
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {Array} - Contour with correct winding
 */
function ensureCounterClockwiseWinding(contour) {
    if (contour.length < 3) return contour;
    
    // Calculate signed area to determine winding order
    let signedArea = 0;
    for (let i = 0; i < contour.length - 1; i++) {
        const curr = contour[i];
        const next = contour[i + 1];
        signedArea += (next[0] - curr[0]) * (next[1] + curr[1]);
    }
    
    // If positive, it's clockwise, so reverse it
    if (signedArea > 0) {
        return [...contour].reverse();
    }
    
    return contour;
}

/**
 * Simplifies contour using Douglas-Peucker algorithm
 * @param {Array} contour - Array of [x, y] coordinates
 * @param {number} tolerance - Simplification tolerance
 * @returns {Array} - Simplified contour
 */
function simplifyContour(contour, tolerance) {
    if (contour.length <= 2) return contour;
    
    // Douglas-Peucker simplification
    function douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        // Find the point with maximum distance from line segment
        let maxDistance = 0;
        let maxIndex = 0;
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // If max distance is greater than tolerance, recursively simplify
        if (maxDistance > tolerance) {
            const leftResults = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const rightResults = douglasPeucker(points.slice(maxIndex), tolerance);
            
            // Combine results (remove duplicate middle point)
            return leftResults.slice(0, -1).concat(rightResults);
        } else {
            // Return simplified line segment
            return [firstPoint, lastPoint];
        }
    }
    
    // Apply simplification but preserve closure
    const isClosed = contour[0][0] === contour[contour.length - 1][0] &&
                     contour[0][1] === contour[contour.length - 1][1];
    
    let simplified;
    if (isClosed) {
        // Remove last point before simplification, add it back after
        const openContour = contour.slice(0, -1);
        simplified = douglasPeucker(openContour, tolerance);
        simplified.push([simplified[0][0], simplified[0][1]]); // Re-close
    } else {
        simplified = douglasPeucker(contour, tolerance);
    }
    
    return simplified;
}

/**
 * Calculates perpendicular distance from point to line segment
 * @param {Array} point - [x, y] coordinates
 * @param {Array} lineStart - [x, y] coordinates
 * @param {Array} lineEnd - [x, y] coordinates
 * @returns {number} - Perpendicular distance
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
        // Line segment is a point
        return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Validates if contour forms a valid OGC polygon
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {boolean} - True if valid
 */
function isValidOGCPolygon(contour) {
    // Must have at least 4 points (including closure)
    if (contour.length < 4) return false;
    
    // Must be closed
    const first = contour[0];
    const last = contour[contour.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return false;
    
    // Must have non-zero area
    const area = calculatePolygonArea(contour);
    if (area < 1) return false;
    
    // Check for self-intersection (basic check)
    if (hasSelfIntersection(contour)) return false;
    
    return true;
}

/**
 * Basic check for self-intersection in polygon
 * @param {Array} contour - Array of [x, y] coordinates
 * @returns {boolean} - True if self-intersecting
 */
function hasSelfIntersection(contour) {
    // Simple check: if any three consecutive points are collinear, it might indicate issues
    for (let i = 0; i < contour.length - 2; i++) {
        const p1 = contour[i];
        const p2 = contour[i + 1];
        const p3 = contour[i + 2];
        
        // Check if points are too close (potential degenerate case)
        const dist1 = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
        const dist2 = Math.sqrt((p3[0] - p2[0]) ** 2 + (p3[1] - p2[1]) ** 2);
        
        if (dist1 < 0.1 || dist2 < 0.1) {
            return true; // Too close, potential issue
        }
    }
    
    return false;
}

// Global tile configuration
export let tileConfig = {
    count: 1,
    rows: 1,
    cols: 1,
    label: "1 tile (1x1)"
};

/**
 * Wrapper function to update the global tileConfig using the updateTileConfig function
 * @param {number} tileCount - The number of tiles to configure
 * @returns {Object} The updated tile configuration object
 */
export function updateTileConfigWrapper(tileCount) {
    const newConfig = updateTileConfig(tileCount);
    if (newConfig) {
        tileConfig = newConfig;
    }
    return tileConfig;
}

/**
 * Updates the tile configuration based on the specified tile count
 * @param {number} tileCount - The number of tiles to configure
 * @returns {Object} The updated tile configuration object
 */
export function updateTileConfig(tileCount) {
    // Define optimal grid configurations for different tile counts
    const tileConfigs = {
        1: { rows: 1, cols: 1, label: "1 tile (1x1)" },
        6: { rows: 2, cols: 3, label: "6 tiles (2x3)" },
        12: { rows: 3, cols: 4, label: "12 tiles (3x4)" },
        20: { rows: 4, cols: 5, label: "20 tiles (4x5)" },
        24: { rows: 4, cols: 6, label: "24 tiles (4x6)" },
        30: { rows: 5, cols: 6, label: "30 tiles (5x6)" },
        42: { rows: 6, cols: 7, label: "42 tiles (6x7)" }
    };
    
    if (tileConfigs[tileCount]) {
        return {
            count: tileCount,
            rows: tileConfigs[tileCount].rows,
            cols: tileConfigs[tileCount].cols,
            label: tileConfigs[tileCount].label
        };
    } else {
        console.error(`Unknown tile count: ${tileCount}`);
        return null;
    }
}

/**
 * Processes an image by dividing it into tiles and processing each tile separately
 * @param {Blob} imageBlob - The image blob to process
 * @param {string} selection - The object selection string for processing
 * @param {Array} mapBounds - The geographic bounds of the map [[NW], [SE]]
 * @param {string} object - The object type being processed
 * @param {Object} tileConfig - The tile configuration object
 * @param {Function} setButtonLoadingState - Function to manage button loading state
 * @param {Object} upscalingConfig - The upscaling configuration object
 */
export async function processTiledImage(imageBlob, selection, mapBounds, object, tileConfig, setButtonLoadingState, upscalingConfig = {scale: 1, label: 'x1'}) {
    console.log(`Starting tiled image processing with ${tileConfig.label}...`);
    
    // Create image element to get dimensions
    const img = new Image();
    img.onload = async function() {
        const imageWidth = img.width;
        const imageHeight = img.height;
        console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);
        
        // Use dynamic tile configuration
        const tilesX = tileConfig.cols;
        const tilesY = tileConfig.rows;
        const tileWidth = Math.floor(imageWidth / tilesX);
        const tileHeight = Math.floor(imageHeight / tilesY);
        
        console.log(`Tile grid: ${tilesX}x${tilesY} = ${tileConfig.count} tiles`);
        console.log(`Tile dimensions: ${tileWidth}x${tileHeight}`);
        
        // Create canvas for tile extraction
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Determine batch size based on total tile count to prevent GPU memory overload
        const batchSize = tileConfig.count > 20 ? 4 : tileConfig.count > 10 ? 6 : tileConfig.count;
        console.log(`Processing tiles in batches of ${batchSize} to prevent GPU memory issues`);
        
        // Prepare all tile data first
        const tileData = [];
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const tileIndex = y * tilesX + x;
                
                // Calculate tile bounds in pixel space
                const startX = x * tileWidth;
                const startY = y * tileHeight;
                const endX = Math.min(startX + tileWidth, imageWidth);
                const endY = Math.min(startY + tileHeight, imageHeight);
                const actualTileWidth = endX - startX;
                const actualTileHeight = endY - startY;
                
                // Calculate tile bounds in geographic space
                const tileBounds = calculateTileBounds(mapBounds, startX, startY, endX, endY, imageWidth, imageHeight);
                
                tileData.push({
                    tileIndex,
                    startX, startY, endX, endY,
                    actualTileWidth, actualTileHeight,
                    tileBounds
                });
            }
        }
        
        // Process tiles in batches
        const allTileResults = [];
        for (let batchStart = 0; batchStart < tileData.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, tileData.length);
            const batch = tileData.slice(batchStart, batchEnd);
            
            console.log(`Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(tileData.length / batchSize)}: tiles ${batchStart} to ${batchEnd - 1}`);
            
            // Process current batch
            const batchPromises = batch.map(tile => {
                return new Promise((resolve) => {
                    // Extract tile from image
                    canvas.width = tile.actualTileWidth;
                    canvas.height = tile.actualTileHeight;
                    ctx.drawImage(img, tile.startX, tile.startY, tile.actualTileWidth, tile.actualTileHeight, 0, 0, tile.actualTileWidth, tile.actualTileHeight);
                    
                    // Convert tile to blob and process
                    canvas.toBlob(function(tileBlob) {
                        processSingleTile(tileBlob, selection, tile.tileBounds, [tile.actualTileHeight, tile.actualTileWidth], tile.tileIndex, upscalingConfig)
                            .then(resolve)
                            .catch(error => {
                                console.error(`Error processing tile ${tile.tileIndex}:`, error);
                                resolve(null);
                            });
                    }, 'image/png');
                });
            });
            
            // Wait for current batch to complete
            const batchResults = await Promise.all(batchPromises);
            allTileResults.push(...batchResults);
            
            // Small delay between batches to allow GPU memory to clear
            if (batchEnd < tileData.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`All ${tileData.length} tiles processed. Combining results...`);
        combineAndDisplayTileResults(allTileResults, object, tileConfig, setButtonLoadingState);
    };
    
    img.src = URL.createObjectURL(imageBlob);
}

/**
 * Calculates the geographic bounds for a specific tile
 * @param {Array} globalMapBounds - The global map bounds [[NW], [SE]]
 * @param {number} startX - Start X pixel coordinate
 * @param {number} startY - Start Y pixel coordinate
 * @param {number} endX - End X pixel coordinate
 * @param {number} endY - End Y pixel coordinate
 * @param {number} imageWidth - Total image width in pixels
 * @param {number} imageHeight - Total image height in pixels
 * @returns {Array} Tile bounds [[NW], [SE]]
 */
export function calculateTileBounds(globalMapBounds, startX, startY, endX, endY, imageWidth, imageHeight) {
    const NW = globalMapBounds[0];
    const SE = globalMapBounds[1];
    
    const mapWidth = SE[0] - NW[0];
    const mapHeight = NW[1] - SE[1];
    
    const tileNW_X = NW[0] + (startX / imageWidth) * mapWidth;
    const tileNW_Y = NW[1] - (startY / imageHeight) * mapHeight;
    const tileSE_X = NW[0] + (endX / imageWidth) * mapWidth;
    const tileSE_Y = NW[1] - (endY / imageHeight) * mapHeight;
    
    return [[tileNW_X, tileNW_Y], [tileSE_X, tileSE_Y]];
}

/**
 * Processes a single tile by sending it to the backend API
 * NEW LOGIC: Backend handles all multi-scale processing and mask combination
 * @param {Blob} tileBlob - The tile image blob
 * @param {string} selection - The object selection string
 * @param {Array} tileBounds - The geographic bounds of the tile
 * @param {Array} tileDims - The tile dimensions [height, width]
 * @param {number} tileIndex - The index of the tile
 * @param {Object} upscalingConfig - The upscaling configuration object
 * @returns {Promise} Promise resolving to tile processing result
 */
export async function processSingleTile(tileBlob, selection, tileBounds, tileDims, tileIndex, upscalingConfig = {scale: 1, label: 'x1'}) {
    const scale = upscalingConfig.scale;
    
    console.log(`🚀 Processing tile ${tileIndex} with NEW MASK LOGIC (scale: ${scale})`);
    
    if (scale >= 2) {
        console.log(`🔄 Tile ${tileIndex}: Backend will handle multi-scale processing for scale ${scale}`);
    } else {
        console.log(`🔄 Tile ${tileIndex}: Backend will handle single-scale processing for scale ${scale}`);
    }
    
    // Send tile to backend - backend now handles all multi-scale processing
    const result = await processTileAtScale(tileBlob, selection, tileBounds, tileDims, tileIndex, upscalingConfig);
    
    if (result && result.data) {
        console.log(`✅ Tile ${tileIndex}: Backend processing complete`, {
            hasOutline: !!(result.data.outline && result.data.outline.length > 0),
            outlineCount: result.data.outline ? result.data.outline.length : 0,
            multiScale: result.data.multiScale || false,
            maskCombination: result.data.maskCombination || false,
            coordinatesTransformed: result.data.coordinates_transformed || false
        });
        
        return {
            tileIndex: tileIndex,
            data: result.data
        };
    } else {
        console.error(`❌ Tile ${tileIndex}: Backend processing failed`);
        return null;
    }
}

/**
 * Processes a tile at a single specific scale
 * @param {Blob} tileBlob - The tile image blob
 * @param {string} selection - The object selection string
 * @param {Array} tileBounds - The geographic bounds of the tile
 * @param {Array} tileDims - The tile dimensions [height, width]
 * @param {number} tileIndex - The index of the tile
 * @param {Object} scaleConfig - The scale configuration object
 * @returns {Promise} Promise resolving to single-scale processing result
 */
async function processTileAtScale(tileBlob, selection, tileBounds, tileDims, tileIndex, scaleConfig) {
    const formData = new FormData();
    formData.append('selection', selection);
    formData.append('mapExtent', JSON.stringify(tileBounds));
    formData.append('imageData', tileBlob, `tile-${tileIndex}-scale-${scaleConfig.scale}.png`);
    formData.append('tileInfo', JSON.stringify({
        index: tileIndex,
        tileDims: tileDims,
        scaleInfo: scaleConfig
    }));
    
    // Add upscaling configuration
    formData.append('upscalingConfig', JSON.stringify(scaleConfig));
    
    // Get RunPod API key from the interface and include it in the request
    const runpodApiKey = document.getElementById('runpod-api-key')?.value?.trim();
    if (runpodApiKey) {
        formData.append('runpodApiKey', runpodApiKey);
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/receive', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.message === 'Successfully retrieved outline' && data.outline) {
            return {
                tileIndex: tileIndex,
                data: data
            };
        } else if (data.error) {
            console.error(`Tile ${tileIndex} scale ${scaleConfig.scale} error:`, data.error);
            return null;
        }
    } catch (error) {
        console.error(`Network error for tile ${tileIndex} scale ${scaleConfig.scale}:`, error);
        return null;
    }
}

// Note: Multi-scale combination logic removed - now handled entirely by the backend
// The backend performs all mask processing, concatenation, and contour extraction
