/**
 * Vector Layers Module for GeoPixel Application
 * 
 * This module contains all vector layer definitions organized by category:
 * - Transportation layers
 * - Infrastructure layers  
 * - Natural features layers
 * - Vegetation layers
 * - Urban features layers
 * - Geological layers
 * - Environmental layers
 * - Agriculture layers
 */

// Import geometry utilities for overlap calculations
import { calculateLayerOverlap } from './geometry-utils.js';

// ===========================================
// TRANSPORTATION LAYERS
// ===========================================

// Vehicles - Red tones
const carSource = new ol.source.Vector({});
export const carLayer = new ol.layer.Vector({
  source: carSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#cc0000', width: 2 })
  })
});

const truckSource = new ol.source.Vector({});
export const truckLayer = new ol.layer.Vector({
  source: truckSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 69, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF4500', width: 2 })
  })
});




const trainSource = new ol.source.Vector({});
export const trainLayer = new ol.layer.Vector({
  source: trainSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 0, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#660066', width: 3 })
  })
});

const aircraftSource = new ol.source.Vector({});
export const aircraftLayer = new ol.layer.Vector({
  source: aircraftSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 200, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#0099cc', width: 2 })
  })
});

const shipSource = new ol.source.Vector({});
export const shipLayer = new ol.layer.Vector({
  source: shipSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 200, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#000099', width: 2 })
  })
});


// ===========================================
// INFRASTRUCTURE LAYERS
// ===========================================

// Buildings - Grey/Brown tones
const buildingSource = new ol.source.Vector({});
export const buildingLayer = new ol.layer.Vector({
  source: buildingSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(64, 64, 64, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#404040', width: 2 })
  })
});

const houseSource = new ol.source.Vector({});
export const houseLayer = new ol.layer.Vector({
  source: houseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});


const factorySource = new ol.source.Vector({});
export const factoryLayer = new ol.layer.Vector({
  source: factorySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808000', width: 2 })
  })
});

const warehouseSource = new ol.source.Vector({});
export const warehouseLayer = new ol.layer.Vector({
  source: warehouseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 160, 160, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0A0A0', width: 2 })
  })
});


const hospitalSource = new ol.source.Vector({});
export const hospitalLayer = new ol.layer.Vector({
  source: hospitalSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 20, 147, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF1493', width: 2 })
  })
});

const bridgeSource = new ol.source.Vector({});
export const bridgeLayer = new ol.layer.Vector({
  source: bridgeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(169, 169, 169, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A9A9A9', width: 3 })
  })
});

const roadSource = new ol.source.Vector({});
export const roadLayer = new ol.layer.Vector({
  source: roadSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(47, 79, 79, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#2F4F4F', width: 2 })
  })
});

const highwaySource = new ol.source.Vector({});
export const highwayLayer = new ol.layer.Vector({
  source: highwaySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(25, 25, 112, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#191970', width: 3 })
  })
});

const runwaySource = new ol.source.Vector({});
export const runwayLayer = new ol.layer.Vector({
  source: runwaySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(105, 105, 105, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#696969', width: 3 })
  })
});

const parkingLotSource = new ol.source.Vector({});
export const parkingLotLayer = new ol.layer.Vector({
  source: parkingLotSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(192, 192, 192, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#C0C0C0', width: 2 })
  })
});

const solarPanelSource = new ol.source.Vector({});
export const solarPanelLayer = new ol.layer.Vector({
  source: solarPanelSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 140, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF8C00', width: 2 })
  })
});

const windTurbineSource = new ol.source.Vector({});
export const windTurbineLayer = new ol.layer.Vector({
  source: windTurbineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(220, 220, 220, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DCDCDC', width: 2 })
  })
});

// ===========================================
// NATURAL FEATURES LAYERS
// ===========================================

// Water bodies - Blue tones
const riverSource = new ol.source.Vector({});
export const riverLayer = new ol.layer.Vector({
  source: riverSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#0000FF', width: 2 })
  })
});

const lakeSource = new ol.source.Vector({});
export const lakeLayer = new ol.layer.Vector({
  source: lakeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 191, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00BFFF', width: 2 })
  })
});

const oceanSource = new ol.source.Vector({});
export const oceanLayer = new ol.layer.Vector({
  source: oceanSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 139, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00008B', width: 2 })
  })
});



const wetlandSource = new ol.source.Vector({});
export const wetlandLayer = new ol.layer.Vector({
  source: wetlandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 100, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#006400', width: 2 })
  })
});

// Terrain features - Earth tones
const mountainSource = new ol.source.Vector({});
export const mountainLayer = new ol.layer.Vector({
  source: mountainSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 3 })
  })
});

const hillSource = new ol.source.Vector({});
export const hillLayer = new ol.layer.Vector({
  source: hillSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(210, 180, 140, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#D2B48C', width: 2 })
  })
});

const valleySource = new ol.source.Vector({});
export const valleyLayer = new ol.layer.Vector({
  source: valleySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(107, 142, 35, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#6B8E23', width: 2 })
  })
});

const canyonSource = new ol.source.Vector({});
export const canyonLayer = new ol.layer.Vector({
  source: canyonSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 82, 45, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0522D', width: 3 })
  })
});

const beachSource = new ol.source.Vector({});
export const beachLayer = new ol.layer.Vector({
  source: beachSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(238, 203, 173, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#EECBAD', width: 2 })
  })
});

const coastlineSource = new ol.source.Vector({});
export const coastlineLayer = new ol.layer.Vector({
  source: coastlineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(70, 130, 180, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#4682B4', width: 2 })
  })
});

const islandSource = new ol.source.Vector({});
export const islandLayer = new ol.layer.Vector({
  source: islandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(244, 164, 96, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#F4A460', width: 2 })
  })
});

// ===========================================
// VEGETATION LAYERS
// ===========================================

// Forest and Trees - Green tones
const forestSource = new ol.source.Vector({});
export const forestLayer = new ol.layer.Vector({
  source: forestSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(34, 139, 34, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#228B22', width: 2 })
  })
});

const treeSource = new ol.source.Vector({});
export const treeLayer = new ol.layer.Vector({
  source: treeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#008000', width: 2 })
  })
});

const grassSource = new ol.source.Vector({});
export const grassLayer = new ol.layer.Vector({
  source: grassSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(124, 252, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#7CFC00', width: 2 })
  })
});


const farmlandSource = new ol.source.Vector({});
export const farmlandLayer = new ol.layer.Vector({
  source: farmlandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(218, 165, 32, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DAA520', width: 2 })
  })
});


const vineyardSource = new ol.source.Vector({});
export const vineyardLayer = new ol.layer.Vector({
  source: vineyardSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 0, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#800080', width: 2 })
  })
});

const parkSource = new ol.source.Vector({});
export const parkLayer = new ol.layer.Vector({
  source: parkSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(144, 238, 144, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#90EE90', width: 2 })
  })
});

const gardenSource = new ol.source.Vector({});
export const gardenLayer = new ol.layer.Vector({
  source: gardenSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(152, 251, 152, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#98FB98', width: 2 })
  })
});


const pastureSource = new ol.source.Vector({});
export const pastureLayer = new ol.layer.Vector({
  source: pastureSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(173, 255, 47, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#ADFF2F', width: 2 })
  })
});

// ===========================================
// URBAN FEATURES LAYERS
// ===========================================

const urbanAreaSource = new ol.source.Vector({});
export const urbanAreaLayer = new ol.layer.Vector({
  source: urbanAreaSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(105, 105, 105, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#696969', width: 2 })
  })
});

const residentialSource = new ol.source.Vector({});
export const residentialLayer = new ol.layer.Vector({
  source: residentialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 182, 193, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFB6C1', width: 2 })
  })
});

const commercialSource = new ol.source.Vector({});
export const commercialLayer = new ol.layer.Vector({
  source: commercialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 20, 147, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF1493', width: 2 })
  })
});

const industrialSource = new ol.source.Vector({});
export const industrialLayer = new ol.layer.Vector({
  source: industrialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808000', width: 2 })
  })
});

const constructionSiteSource = new ol.source.Vector({});
export const constructionSiteLayer = new ol.layer.Vector({
  source: constructionSiteSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 165, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFA500', width: 2 })
  })
});

const stadiumSource = new ol.source.Vector({});
export const stadiumLayer = new ol.layer.Vector({
  source: stadiumSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 255, 127, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00FF7F', width: 2 })
  })
});

const sportsFieldSource = new ol.source.Vector({});
export const sportsFieldLayer = new ol.layer.Vector({
  source: sportsFieldSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 250, 154, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00FA9A', width: 2 })
  })
});

const golfCourseSource = new ol.source.Vector({});
export const golfCourseLayer = new ol.layer.Vector({
  source: golfCourseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(127, 255, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#7FFF00', width: 2 })
  })
});

const cemeterySource = new ol.source.Vector({});
export const cemeteryLayer = new ol.layer.Vector({
  source: cemeterySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(169, 169, 169, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A9A9A9', width: 2 })
  })
});

// ===========================================
// GEOLOGICAL LAYERS
// ===========================================

const rockFormationSource = new ol.source.Vector({});
export const rockFormationLayer = new ol.layer.Vector({
  source: rockFormationSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808080', width: 2 })
  })
});

const sandSource = new ol.source.Vector({});
export const sandLayer = new ol.layer.Vector({
  source: sandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 218, 185, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFDAB9', width: 2 })
  })
});

const desertSource = new ol.source.Vector({});
export const desertLayer = new ol.layer.Vector({
  source: desertSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(238, 203, 173, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#EECBAD', width: 2 })
  })
});

const quarrySource = new ol.source.Vector({});
export const quarryLayer = new ol.layer.Vector({
  source: quarrySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 82, 45, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0522D', width: 2 })
  })
});

const mineSource = new ol.source.Vector({});
export const mineLayer = new ol.layer.Vector({
  source: mineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});

const landslideSource = new ol.source.Vector({});
export const landslideLayer = new ol.layer.Vector({
  source: landslideSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(205, 92, 92, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#CD5C5C', width: 2 })
  })
});

const erosionSource = new ol.source.Vector({});
export const erosionLayer = new ol.layer.Vector({
  source: erosionSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(188, 143, 143, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#BC8F8F', width: 2 })
  })
});

// ===========================================
// ENVIRONMENTAL LAYERS
// ===========================================

const fireSource = new ol.source.Vector({});
export const fireLayer = new ol.layer.Vector({
  source: fireSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.6)' }),
    stroke: new ol.style.Stroke({ color: '#FF0000', width: 2 })
  })
});

const floodSource = new ol.source.Vector({});
export const floodLayer = new ol.layer.Vector({
  source: floodSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(30, 144, 255, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#1E90FF', width: 2 })
  })
});

const snowSource = new ol.source.Vector({});
export const snowLayer = new ol.layer.Vector({
  source: snowSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 250, 250, 0.6)' }),
    stroke: new ol.style.Stroke({ color: '#FFFAFA', width: 2 })
  })
});

const iceSource = new ol.source.Vector({});
export const iceLayer = new ol.layer.Vector({
  source: iceSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(176, 224, 230, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#B0E0E6', width: 2 })
  })
});



const smokeSource = new ol.source.Vector({});
export const smokeLayer = new ol.layer.Vector({
  source: smokeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 128, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#808080', width: 2 })
  })
});


// ===========================================
// AGRICULTURE LAYERS
// ===========================================

const greenhouseSource = new ol.source.Vector({});
export const greenhouseLayer = new ol.layer.Vector({
  source: greenhouseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(240, 248, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#F0F8FF', width: 2 })
  })
});

const barnSource = new ol.source.Vector({});
export const barnLayer = new ol.layer.Vector({
  source: barnSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});

const siloSource = new ol.source.Vector({});
export const siloLayer = new ol.layer.Vector({
  source: siloSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(192, 192, 192, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#C0C0C0', width: 2 })
  })
});


const livestockSource = new ol.source.Vector({});
export const livestockLayer = new ol.layer.Vector({
  source: livestockSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(210, 180, 140, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#D2B48C', width: 2 })
  })
});

// ===========================================
// LAYER COLLECTIONS AND UTILITIES
// ===========================================

// Export all layers organized by category
export const transportationLayers = {
  carLayer,
  truckLayer,
  trainLayer,
  aircraftLayer,
  shipLayer
};

export const infrastructureLayers = {
  buildingLayer,
  houseLayer,
  factoryLayer,
  warehouseLayer,
  hospitalLayer,
  bridgeLayer,
  roadLayer,
  highwayLayer,
  runwayLayer,
  parkingLotLayer,
  solarPanelLayer,
  windTurbineLayer
};

export const naturalFeaturesLayers = {
  riverLayer,
  lakeLayer,
  oceanLayer,
  wetlandLayer,
  mountainLayer,
  hillLayer,
  valleyLayer,
  canyonLayer,
  beachLayer,
  coastlineLayer,
  islandLayer
};

export const vegetationLayers = {
  forestLayer,
  treeLayer,
  grassLayer,
  farmlandLayer,
  vineyardLayer,
  parkLayer,
  gardenLayer,
  pastureLayer
};

export const urbanFeaturesLayers = {
  urbanAreaLayer,
  residentialLayer,
  commercialLayer,
  industrialLayer,
  constructionSiteLayer,
  stadiumLayer,
  sportsFieldLayer,
  golfCourseLayer,
  cemeteryLayer
};

export const geologicalLayers = {
  rockFormationLayer,
  sandLayer,
  desertLayer,
  quarryLayer,
  mineLayer,
  landslideLayer,
  erosionLayer
};

export const environmentalLayers = {
  fireLayer,
  floodLayer,
  snowLayer,
  iceLayer,
  smokeLayer
};

export const agricultureLayers = {
  greenhouseLayer,
  barnLayer,
  siloLayer,
  livestockLayer
};

// Export all layers as a single collection
export const allVectorLayers = {
  ...transportationLayers,
  ...infrastructureLayers,
  ...naturalFeaturesLayers,
  ...vegetationLayers,
  ...urbanFeaturesLayers,
  ...geologicalLayers,
  ...environmentalLayers,
  ...agricultureLayers
};

// Get all layers as array for easy map addition
export const getAllVectorLayersArray = () => {
  return Object.values(allVectorLayers);
};

// Helper function to get layer by name
export const getLayerByName = (layerName) => {
  return allVectorLayers[layerName];
};

// ===========================================
// LAYER STATISTICS FUNCTIONALITY
// ===========================================

// Function to get individual geometry count for a single layer
export const getLayerFeatureCount = (layer) => {
  if (!layer || !layer.getSource) {
    return 0;
  }
  const source = layer.getSource();
  const features = source.getFeatures ? source.getFeatures() : [];
  
  let totalGeometries = 0;
  
  features.forEach(feature => {
    const geometry = feature.getGeometry();
    if (geometry) {
      const geometryType = geometry.getType();
      
      // Count individual geometries within MultiPolygon and MultiLineString
      if (geometryType === 'MultiPolygon') {
        const polygons = geometry.getPolygons();
        totalGeometries += polygons.length;
      } else if (geometryType === 'MultiLineString') {
        const lineStrings = geometry.getLineStrings();
        totalGeometries += lineStrings.length;
      } else if (geometryType === 'MultiPoint') {
        const points = geometry.getPoints();
        totalGeometries += points.length;
      } else if (geometryType === 'GeometryCollection') {
        const geometries = geometry.getGeometries();
        totalGeometries += geometries.length;
      } else {
        // Single geometry types (Polygon, LineString, Point, etc.)
        totalGeometries += 1;
      }
    }
  });
  
  return totalGeometries;
};

// Function to get statistics for all layers organized by category
export const getLayerStatistics = () => {
  const stats = {
    transportation: {},
    infrastructure: {},
    naturalFeatures: {},
    vegetation: {},
    urbanFeatures: {},
    geological: {},
    environmental: {},
    agriculture: {},
    total: 0
  };

  // Transportation layers statistics
  Object.entries(transportationLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.transportation[layerName] = count;
    stats.total += count;
  });

  // Infrastructure layers statistics
  Object.entries(infrastructureLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.infrastructure[layerName] = count;
    stats.total += count;
  });

  // Natural features layers statistics
  Object.entries(naturalFeaturesLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.naturalFeatures[layerName] = count;
    stats.total += count;
  });

  // Vegetation layers statistics
  Object.entries(vegetationLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.vegetation[layerName] = count;
    stats.total += count;
  });

  // Urban features layers statistics
  Object.entries(urbanFeaturesLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.urbanFeatures[layerName] = count;
    stats.total += count;
  });

  // Geological layers statistics
  Object.entries(geologicalLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.geological[layerName] = count;
    stats.total += count;
  });

  // Environmental layers statistics
  Object.entries(environmentalLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.environmental[layerName] = count;
    stats.total += count;
  });

  // Agriculture layers statistics
  Object.entries(agricultureLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.agriculture[layerName] = count;
    stats.total += count;
  });

  return stats;
};

// Function to format layer name for display
const formatLayerName = (layerName) => {
  // Remove 'Layer' suffix and convert camelCase to readable format
  return layerName
    .replace(/Layer$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Function to generate HTML for statistics display
export const generateStatsHTML = () => {
  const stats = getLayerStatistics();
  
  let html = `<div class="stats-summary">
    <h3>Total Objects: ${stats.total}</h3>
    <div class="stats-actions">
      <button id="layer-overlap-analysis-btn" class="stats-action-btn">Layer Overlap Analysis</button>
    </div>
  </div>`;

  const categories = [
    { key: 'transportation', name: 'Transportation', data: stats.transportation },
    { key: 'infrastructure', name: 'Infrastructure', data: stats.infrastructure },
    { key: 'naturalFeatures', name: 'Natural Features', data: stats.naturalFeatures },
    { key: 'vegetation', name: 'Vegetation', data: stats.vegetation },
    { key: 'urbanFeatures', name: 'Urban Features', data: stats.urbanFeatures },
    { key: 'geological', name: 'Geological', data: stats.geological },
    { key: 'environmental', name: 'Environmental', data: stats.environmental },
    { key: 'agriculture', name: 'Agriculture', data: stats.agriculture }
  ];

  categories.forEach(category => {
    const categoryTotal = Object.values(category.data).reduce((sum, count) => sum + count, 0);
    
    if (categoryTotal > 0) {
      html += `<div class="stats-category">
        <h4>${category.name} (${categoryTotal} objects)</h4>
        <div class="stats-layers">`;
      
      Object.entries(category.data).forEach(([layerName, count]) => {
        if (count > 0) {
          html += `<div class="stats-layer">
            <span class="layer-name">${formatLayerName(layerName)}:</span>
            <span class="layer-count">${count}</span>
          </div>`;
        }
      });
      
      html += `</div></div>`;
    }
  });

  if (stats.total === 0) {
    html += `<div class="stats-empty">
      <p>No objects found in any layer. Draw some features to see statistics!</p>
    </div>`;
  }

  return html;
};

// Function to show the statistics modal
export const showLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');
  
  if (modal && content) {
    content.innerHTML = generateStatsHTML();
    modal.style.display = 'block';
    
    // Add event listener for overlap analysis button
    const overlapBtn = document.getElementById('layer-overlap-analysis-btn');
    if (overlapBtn) {
      overlapBtn.addEventListener('click', () => {
        showLayerOverlapAnalysis();
      });
    }
  }
};

// Function to hide the statistics modal
export const hideLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// ===========================================
// LAYER OVERLAP ANALYSIS FUNCTIONALITY
// ===========================================

// Function to get all layers that have features (for dropdown selection)
export const getLayersWithFeatures = () => {
  const layersWithFeatures = [];
  
  Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    if (count > 0) {
      layersWithFeatures.push({
        name: layerName,
        displayName: formatLayerName(layerName),
        layer: layer,
        featureCount: count
      });
    }
  });
  
  return layersWithFeatures.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Function to generate HTML for layer selection dropdowns
export const generateLayerSelectionHTML = () => {
  const layersWithFeatures = getLayersWithFeatures();
  
  if (layersWithFeatures.length < 2) {
    return `<div class="overlap-error">
      <p>At least 2 layers with features are required for overlap analysis.</p>
      <p>Current layers with features: ${layersWithFeatures.length}</p>
      <p>Draw some features on different layers to analyze overlaps!</p>
    </div>`;
  }
  
  let optionsHTML = '<option value="">Select a layer...</option>';
  layersWithFeatures.forEach(layerInfo => {
    optionsHTML += `<option value="${layerInfo.name}">${layerInfo.displayName} (${layerInfo.featureCount} objects)</option>`;
  });
  
  return `<div class="overlap-selection">
    <h3>Layer Overlap Analysis</h3>
    <p>Select two layers to analyze their overlapping areas:</p>
    
    <div class="layer-selection-row">
      <label for="layer1-select">First Layer:</label>
      <select id="layer1-select" class="layer-select">
        ${optionsHTML}
      </select>
    </div>
    
    <div class="layer-selection-row">
      <label for="layer2-select">Second Layer:</label>
      <select id="layer2-select" class="layer-select">
        ${optionsHTML}
      </select>
    </div>
    
    <div class="overlap-controls">
      <button id="calculate-overlap-btn" class="overlap-btn" disabled>Calculate Overlap</button>
      <button id="back-to-stats-btn" class="overlap-btn secondary">Back to Layer Stats</button>
    </div>
    
    <div id="overlap-results" class="overlap-results" style="display: none;"></div>
  </div>`;
};

// Function to generate HTML for overlap results
export const generateOverlapResultsHTML = (overlapData, layer1Name, layer2Name) => {
  const layer1DisplayName = formatLayerName(layer1Name);
  const layer2DisplayName = formatLayerName(layer2Name);
  
  // Format area values with appropriate units
  const formatArea = (area) => {
    if (area > 1000000) {
      return `${(area / 1000000).toFixed(2)} km²`;
    } else if (area > 10000) {
      return `${(area / 10000).toFixed(2)} hectares`;
    } else {
      return `${area.toFixed(2)} m²`;
    }
  };
  
  // Format percentage with one decimal place
  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };
  
  let html = `<div class="overlap-results-content">
    <h4>Overlap Analysis Results</h4>
    <div class="overlap-summary">
      <div class="overlap-layers">
        <strong>${layer1DisplayName}</strong> vs <strong>${layer2DisplayName}</strong>
      </div>
    </div>
    
    <div class="overlap-stats">
      <div class="overlap-stat-group">
        <h5>Layer Areas</h5>
        <div class="stat-row">
          <span class="stat-label">${layer1DisplayName}:</span>
          <span class="stat-value">${formatArea(overlapData.layer1Area)}</span>
          <span class="stat-detail">(${overlapData.layer1PolygonCount} polygons)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer2DisplayName}:</span>
          <span class="stat-value">${formatArea(overlapData.layer2Area)}</span>
          <span class="stat-detail">(${overlapData.layer2PolygonCount} polygons)</span>
        </div>
      </div>
      
      <div class="overlap-stat-group">
        <h5>Intersection Analysis</h5>
        <div class="stat-row highlight">
          <span class="stat-label">Overlapping Area:</span>
          <span class="stat-value">${formatArea(overlapData.intersectionArea)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer1DisplayName} Overlap:</span>
          <span class="stat-value">${formatPercentage(overlapData.layer1OverlapPercentage)}</span>
          <span class="stat-detail">of layer area overlaps</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer2DisplayName} Overlap:</span>
          <span class="stat-value">${formatPercentage(overlapData.layer2OverlapPercentage)}</span>
          <span class="stat-detail">of layer area overlaps</span>
        </div>
      </div>`;
  
  // Add interpretation of results
  if (overlapData.intersectionArea === 0) {
    html += `<div class="overlap-interpretation">
      <h5>Interpretation</h5>
      <p class="no-overlap">No overlap detected between the selected layers.</p>
    </div>`;
  } else {
    const maxOverlap = Math.max(overlapData.layer1OverlapPercentage, overlapData.layer2OverlapPercentage);
    let interpretation = '';
    
    if (maxOverlap < 5) {
      interpretation = 'Very minimal overlap between layers.';
    } else if (maxOverlap < 20) {
      interpretation = 'Small overlap between layers.';
    } else if (maxOverlap < 50) {
      interpretation = 'Moderate overlap between layers.';
    } else if (maxOverlap < 80) {
      interpretation = 'Significant overlap between layers.';
    } else {
      interpretation = 'Extensive overlap between layers.';
    }
    
    html += `<div class="overlap-interpretation">
      <h5>Interpretation</h5>
      <p class="overlap-description">${interpretation}</p>
    </div>`;
  }
  
  html += `</div>
    
    <div class="overlap-actions">
      <button id="new-overlap-analysis-btn" class="overlap-btn">Analyze Different Layers</button>
      <button id="back-to-stats-from-results-btn" class="overlap-btn secondary">Back to Layer Stats</button>
    </div>
  </div>`;
  
  return html;
};

// Function to perform overlap analysis between two layers
export const performOverlapAnalysis = (layer1Name, layer2Name) => {
  const layer1 = allVectorLayers[layer1Name];
  const layer2 = allVectorLayers[layer2Name];
  
  if (!layer1 || !layer2) {
    console.error('One or both layers not found:', layer1Name, layer2Name);
    return null;
  }
  
  console.log(`Performing overlap analysis between ${layer1Name} and ${layer2Name}...`);
  
  // Calculate overlap using the geometry utilities
  const overlapData = calculateLayerOverlap(layer1, layer2);
  
  return overlapData;
};

// Function to show the layer overlap analysis interface
export const showLayerOverlapAnalysis = () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');
  
  if (modal && content) {
    content.innerHTML = generateLayerSelectionHTML();
    modal.style.display = 'block';
    
    // Add event listeners for the interface
    setupOverlapAnalysisEventListeners();
  }
};

// Function to setup event listeners for overlap analysis interface
const setupOverlapAnalysisEventListeners = () => {
  const layer1Select = document.getElementById('layer1-select');
  const layer2Select = document.getElementById('layer2-select');
  const calculateBtn = document.getElementById('calculate-overlap-btn');
  const backToStatsBtn = document.getElementById('back-to-stats-btn');
  
  // Function to check if both layers are selected and different
  const checkSelectionValidity = () => {
    const layer1Value = layer1Select?.value;
    const layer2Value = layer2Select?.value;
    const isValid = layer1Value && layer2Value && layer1Value !== layer2Value;
    
    if (calculateBtn) {
      calculateBtn.disabled = !isValid;
    }
  };
  
  // Add event listeners for dropdown changes
  if (layer1Select) {
    layer1Select.addEventListener('change', checkSelectionValidity);
  }
  
  if (layer2Select) {
    layer2Select.addEventListener('change', checkSelectionValidity);
  }
  
  // Add event listener for calculate button
  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const layer1Name = layer1Select.value;
      const layer2Name = layer2Select.value;
      
      if (layer1Name && layer2Name && layer1Name !== layer2Name) {
        // Show loading state
        calculateBtn.textContent = 'Calculating...';
        calculateBtn.disabled = true;
        
        // Perform the analysis
        setTimeout(() => {
          const overlapData = performOverlapAnalysis(layer1Name, layer2Name);
          
          if (overlapData) {
            // Show results
            const resultsDiv = document.getElementById('overlap-results');
            if (resultsDiv) {
              resultsDiv.innerHTML = generateOverlapResultsHTML(overlapData, layer1Name, layer2Name);
              resultsDiv.style.display = 'block';
              
              // Setup event listeners for result actions
              setupOverlapResultsEventListeners();
            }
          }
          
          // Reset button state
          calculateBtn.textContent = 'Calculate Overlap';
          calculateBtn.disabled = false;
        }, 100); // Small delay to show loading state
      }
    });
  }
  
  // Add event listener for back to stats button
  if (backToStatsBtn) {
    backToStatsBtn.addEventListener('click', () => {
      showLayerStatsModal();
    });
  }
};

// Function to setup event listeners for overlap results
const setupOverlapResultsEventListeners = () => {
  const newAnalysisBtn = document.getElementById('new-overlap-analysis-btn');
  const backToStatsBtn = document.getElementById('back-to-stats-from-results-btn');
  
  if (newAnalysisBtn) {
    newAnalysisBtn.addEventListener('click', () => {
      showLayerOverlapAnalysis();
    });
  }
  
  if (backToStatsBtn) {
    backToStatsBtn.addEventListener('click', () => {
      showLayerStatsModal();
    });
  }
};

// Expose overlap analysis function to window for manual testing
window.showLayerOverlapAnalysis = showLayerOverlapAnalysis;

// ===========================================
// LAYER SWITCHER FUNCTIONALITY
// ===========================================

/**
 * Toggle function for layer switcher (called from HTML)
 * Shows/hides the layer switcher content panel
 */
export function toggleLayerSwitcher() {
  const content = document.getElementById('layer-switcher-content');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    console.log('Layer switcher toggled:', !isVisible ? 'opened' : 'closed');
  }
}