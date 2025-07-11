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


// ===========================================
// LAYER CONFIGURATION DICTIONARY
// ===========================================

// Layer configuration: layerName -> { fillColor, strokeColor, strokeWidth, category }
const layerConfigs = {
  // Transportation layers - Red tones
  'car': { fillColor: 'rgba(255, 0, 0, 0.4)', strokeColor: '#cc0000', strokeWidth: 2, category: 'transportation' },
  'truck': { fillColor: 'rgba(255, 69, 0, 0.4)', strokeColor: '#FF4500', strokeWidth: 2, category: 'transportation' },
  'train': { fillColor: 'rgba(128, 0, 128, 0.4)', strokeColor: '#660066', strokeWidth: 3, category: 'transportation' },
  'aircraft': { fillColor: 'rgba(0, 200, 255, 0.4)', strokeColor: '#0099cc', strokeWidth: 2, category: 'transportation' },
  'ship': { fillColor: 'rgba(0, 0, 200, 0.4)', strokeColor: '#000099', strokeWidth: 2, category: 'transportation' },
  
  // Infrastructure layers - Grey/Brown tones
  'building': { fillColor: 'rgba(64, 64, 64, 0.4)', strokeColor: '#404040', strokeWidth: 2, category: 'infrastructure' },
  'city': { fillColor: 'rgba(64, 64, 64, 0.4)', strokeColor: '#404040', strokeWidth: 2, category: 'infrastructure' },
  'house': { fillColor: 'rgba(139, 69, 19, 0.4)', strokeColor: '#8B4513', strokeWidth: 2, category: 'infrastructure' },
  'factory': { fillColor: 'rgba(128, 128, 0, 0.4)', strokeColor: '#808000', strokeWidth: 2, category: 'infrastructure' },
  'warehouse': { fillColor: 'rgba(160, 160, 160, 0.4)', strokeColor: '#A0A0A0', strokeWidth: 2, category: 'infrastructure' },
  'hospital': { fillColor: 'rgba(255, 20, 147, 0.4)', strokeColor: '#FF1493', strokeWidth: 2, category: 'infrastructure' },
  'bridge': { fillColor: 'rgba(169, 169, 169, 0.4)', strokeColor: '#A9A9A9', strokeWidth: 3, category: 'infrastructure' },
  'road': { fillColor: 'rgba(47, 79, 79, 0.4)', strokeColor: '#2F4F4F', strokeWidth: 2, category: 'infrastructure' },
  'highway': { fillColor: 'rgba(25, 25, 112, 0.4)', strokeColor: '#191970', strokeWidth: 3, category: 'infrastructure' },
  'runway': { fillColor: 'rgba(105, 105, 105, 0.4)', strokeColor: '#696969', strokeWidth: 3, category: 'infrastructure' },
  'parkingLot': { fillColor: 'rgba(192, 192, 192, 0.4)', strokeColor: '#C0C0C0', strokeWidth: 2, category: 'infrastructure' },
  'solarPanel': { fillColor: 'rgba(255, 140, 0, 0.4)', strokeColor: '#FF8C00', strokeWidth: 2, category: 'infrastructure' },
  'windTurbine': { fillColor: 'rgba(220, 220, 220, 0.4)', strokeColor: '#DCDCDC', strokeWidth: 2, category: 'infrastructure' },
  
  // Natural features layers - Blue tones
  'river': { fillColor: 'rgba(0, 0, 255, 0.4)', strokeColor: '#0000FF', strokeWidth: 2, category: 'naturalFeatures' },
  'lake': { fillColor: 'rgba(0, 191, 255, 0.4)', strokeColor: '#00BFFF', strokeWidth: 2, category: 'naturalFeatures' },
  'ocean': { fillColor: 'rgba(0, 0, 139, 0.4)', strokeColor: '#00008B', strokeWidth: 2, category: 'naturalFeatures' },
  'wetland': { fillColor: 'rgba(0, 100, 0, 0.4)', strokeColor: '#006400', strokeWidth: 2, category: 'naturalFeatures' },
  'mountain': { fillColor: 'rgba(139, 69, 19, 0.4)', strokeColor: '#8B4513', strokeWidth: 3, category: 'naturalFeatures' },
  'hill': { fillColor: 'rgba(210, 180, 140, 0.4)', strokeColor: '#D2B48C', strokeWidth: 2, category: 'naturalFeatures' },
  'valley': { fillColor: 'rgba(107, 142, 35, 0.4)', strokeColor: '#6B8E23', strokeWidth: 2, category: 'naturalFeatures' },
  'canyon': { fillColor: 'rgba(160, 82, 45, 0.4)', strokeColor: '#A0522D', strokeWidth: 3, category: 'naturalFeatures' },
  'beach': { fillColor: 'rgba(238, 203, 173, 0.4)', strokeColor: '#EECBAD', strokeWidth: 2, category: 'naturalFeatures' },
  'coastline': { fillColor: 'rgba(70, 130, 180, 0.4)', strokeColor: '#4682B4', strokeWidth: 2, category: 'naturalFeatures' },
  'island': { fillColor: 'rgba(244, 164, 96, 0.4)', strokeColor: '#F4A460', strokeWidth: 2, category: 'naturalFeatures' },
  
  // Vegetation layers - Green tones
  'forest': { fillColor: 'rgba(34, 139, 34, 0.4)', strokeColor: '#228B22', strokeWidth: 2, category: 'vegetation' },
  'tree': { fillColor: 'rgba(0, 128, 0, 0.4)', strokeColor: '#008000', strokeWidth: 2, category: 'vegetation' },
  'grass': { fillColor: 'rgba(124, 252, 0, 0.4)', strokeColor: '#7CFC00', strokeWidth: 2, category: 'vegetation' },
  'farmland': { fillColor: 'rgba(218, 165, 32, 0.4)', strokeColor: '#DAA520', strokeWidth: 2, category: 'vegetation' },
  'vineyard': { fillColor: 'rgba(128, 0, 128, 0.4)', strokeColor: '#800080', strokeWidth: 2, category: 'vegetation' },
  'park': { fillColor: 'rgba(144, 238, 144, 0.4)', strokeColor: '#90EE90', strokeWidth: 2, category: 'vegetation' },
  'garden': { fillColor: 'rgba(152, 251, 152, 0.4)', strokeColor: '#98FB98', strokeWidth: 2, category: 'vegetation' },
  'pasture': { fillColor: 'rgba(173, 255, 47, 0.4)', strokeColor: '#ADFF2F', strokeWidth: 2, category: 'vegetation' },
  
  // Urban features layers
  'urbanArea': { fillColor: 'rgba(105, 105, 105, 0.4)', strokeColor: '#696969', strokeWidth: 2, category: 'urbanFeatures' },
  'residential': { fillColor: 'rgba(255, 182, 193, 0.4)', strokeColor: '#FFB6C1', strokeWidth: 2, category: 'urbanFeatures' },
  'commercial': { fillColor: 'rgba(255, 20, 147, 0.4)', strokeColor: '#FF1493', strokeWidth: 2, category: 'urbanFeatures' },
  'industrial': { fillColor: 'rgba(128, 128, 0, 0.4)', strokeColor: '#808000', strokeWidth: 2, category: 'urbanFeatures' },
  'constructionSite': { fillColor: 'rgba(255, 165, 0, 0.4)', strokeColor: '#FFA500', strokeWidth: 2, category: 'urbanFeatures' },
  'stadium': { fillColor: 'rgba(0, 255, 127, 0.4)', strokeColor: '#00FF7F', strokeWidth: 2, category: 'urbanFeatures' },
  'sportsField': { fillColor: 'rgba(0, 250, 154, 0.4)', strokeColor: '#00FA9A', strokeWidth: 2, category: 'urbanFeatures' },
  'golfCourse': { fillColor: 'rgba(127, 255, 0, 0.4)', strokeColor: '#7FFF00', strokeWidth: 2, category: 'urbanFeatures' },
  'cemetery': { fillColor: 'rgba(169, 169, 169, 0.4)', strokeColor: '#A9A9A9', strokeWidth: 2, category: 'urbanFeatures' },
  
  // Geological layers
  'rockFormation': { fillColor: 'rgba(128, 128, 128, 0.4)', strokeColor: '#808080', strokeWidth: 2, category: 'geological' },
  'sand': { fillColor: 'rgba(255, 218, 185, 0.4)', strokeColor: '#FFDAB9', strokeWidth: 2, category: 'geological' },
  'desert': { fillColor: 'rgba(238, 203, 173, 0.4)', strokeColor: '#EECBAD', strokeWidth: 2, category: 'geological' },
  'quarry': { fillColor: 'rgba(160, 82, 45, 0.4)', strokeColor: '#A0522D', strokeWidth: 2, category: 'geological' },
  'mine': { fillColor: 'rgba(139, 69, 19, 0.4)', strokeColor: '#8B4513', strokeWidth: 2, category: 'geological' },
  'landslide': { fillColor: 'rgba(205, 92, 92, 0.4)', strokeColor: '#CD5C5C', strokeWidth: 2, category: 'geological' },
  'erosion': { fillColor: 'rgba(188, 143, 143, 0.4)', strokeColor: '#BC8F8F', strokeWidth: 2, category: 'geological' },
  
  // Environmental layers
  'fire': { fillColor: 'rgba(255, 0, 0, 0.6)', strokeColor: '#FF0000', strokeWidth: 2, category: 'environmental' },
  'flood': { fillColor: 'rgba(30, 144, 255, 0.5)', strokeColor: '#1E90FF', strokeWidth: 2, category: 'environmental' },
  'snow': { fillColor: 'rgba(255, 250, 250, 0.6)', strokeColor: '#FFFAFA', strokeWidth: 2, category: 'environmental' },
  'ice': { fillColor: 'rgba(176, 224, 230, 0.5)', strokeColor: '#B0E0E6', strokeWidth: 2, category: 'environmental' },
  'smoke': { fillColor: 'rgba(128, 128, 128, 0.5)', strokeColor: '#808080', strokeWidth: 2, category: 'environmental' },
  'shadow': { fillColor: 'rgba(0, 0, 0, 0.3)', strokeColor: '#000000', strokeWidth: 2, category: 'environmental' },
  
  // Agriculture layers
  'greenhouse': { fillColor: 'rgba(240, 248, 255, 0.4)', strokeColor: '#F0F8FF', strokeWidth: 2, category: 'agriculture' },
  'barn': { fillColor: 'rgba(139, 69, 19, 0.4)', strokeColor: '#8B4513', strokeWidth: 2, category: 'agriculture' },
  'silo': { fillColor: 'rgba(192, 192, 192, 0.4)', strokeColor: '#C0C0C0', strokeWidth: 2, category: 'agriculture' },
  'livestock': { fillColor: 'rgba(210, 180, 140, 0.4)', strokeColor: '#D2B48C', strokeWidth: 2, category: 'agriculture' },
  
  // Miscellaneous layers
  'misc': { fillColor: 'rgba(128, 128, 128, 0.5)', strokeColor: '#808080', strokeWidth: 2, category: 'miscellaneous' }
};

// ===========================================
// LAYER GENERATION USING FOR LOOP
// ===========================================

// Create layers dynamically from configuration
const vectorLayers = {};
const layerSources = {};

for (const [layerName, config] of Object.entries(layerConfigs)) {
  // Create source
  const source = new ol.source.Vector({});
  layerSources[layerName] = source;
  
  // Create layer
  const layer = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
      fill: new ol.style.Fill({ color: config.fillColor }),
      stroke: new ol.style.Stroke({ color: config.strokeColor, width: config.strokeWidth })
    })
  });
  
  vectorLayers[layerName] = layer;
}

// Export individual layers for backward compatibility
export const carLayer = vectorLayers.car;
export const truckLayer = vectorLayers.truck;
export const trainLayer = vectorLayers.train;
export const aircraftLayer = vectorLayers.aircraft;
export const shipLayer = vectorLayers.ship;

export const buildingLayer = vectorLayers.building;
export const cityLayer = vectorLayers.city;
export const houseLayer = vectorLayers.house;
export const factoryLayer = vectorLayers.factory;
export const warehouseLayer = vectorLayers.warehouse;
export const hospitalLayer = vectorLayers.hospital;
export const bridgeLayer = vectorLayers.bridge;
export const roadLayer = vectorLayers.road;
export const highwayLayer = vectorLayers.highway;
export const runwayLayer = vectorLayers.runway;
export const parkingLotLayer = vectorLayers.parkingLot;
export const solarPanelLayer = vectorLayers.solarPanel;
export const windTurbineLayer = vectorLayers.windTurbine;

export const riverLayer = vectorLayers.river;
export const lakeLayer = vectorLayers.lake;
export const oceanLayer = vectorLayers.ocean;
export const wetlandLayer = vectorLayers.wetland;
export const mountainLayer = vectorLayers.mountain;
export const hillLayer = vectorLayers.hill;
export const valleyLayer = vectorLayers.valley;
export const canyonLayer = vectorLayers.canyon;
export const beachLayer = vectorLayers.beach;
export const coastlineLayer = vectorLayers.coastline;
export const islandLayer = vectorLayers.island;

export const forestLayer = vectorLayers.forest;
export const treeLayer = vectorLayers.tree;
export const grassLayer = vectorLayers.grass;
export const farmlandLayer = vectorLayers.farmland;
export const vineyardLayer = vectorLayers.vineyard;
export const parkLayer = vectorLayers.park;
export const gardenLayer = vectorLayers.garden;
export const pastureLayer = vectorLayers.pasture;

export const urbanAreaLayer = vectorLayers.urbanArea;
export const residentialLayer = vectorLayers.residential;
export const commercialLayer = vectorLayers.commercial;
export const industrialLayer = vectorLayers.industrial;
export const constructionSiteLayer = vectorLayers.constructionSite;
export const stadiumLayer = vectorLayers.stadium;
export const sportsFieldLayer = vectorLayers.sportsField;
export const golfCourseLayer = vectorLayers.golfCourse;
export const cemeteryLayer = vectorLayers.cemetery;

export const rockFormationLayer = vectorLayers.rockFormation;
export const sandLayer = vectorLayers.sand;
export const desertLayer = vectorLayers.desert;
export const quarryLayer = vectorLayers.quarry;
export const mineLayer = vectorLayers.mine;
export const landslideLayer = vectorLayers.landslide;
export const erosionLayer = vectorLayers.erosion;

export const fireLayer = vectorLayers.fire;
export const floodLayer = vectorLayers.flood;
export const snowLayer = vectorLayers.snow;
export const iceLayer = vectorLayers.ice;
export const smokeLayer = vectorLayers.smoke;
export const shadowLayer = vectorLayers.shadow;

export const greenhouseLayer = vectorLayers.greenhouse;
export const barnLayer = vectorLayers.barn;
export const siloLayer = vectorLayers.silo;
export const livestockLayer = vectorLayers.livestock;

export const miscLayer = vectorLayers.misc;

// ===========================================
// LAYER COLLECTIONS AND UTILITIES
// ===========================================

// Helper function to get layers by category
const getLayersByCategory = (category) => {
  const categoryLayers = {};
  for (const [layerName, config] of Object.entries(layerConfigs)) {
    if (config.category === category) {
      categoryLayers[layerName + 'Layer'] = vectorLayers[layerName];
    }
  }
  return categoryLayers;
};

// Export all layers organized by category (dynamically generated)
export const transportationLayers = getLayersByCategory('transportation');
export const infrastructureLayers = getLayersByCategory('infrastructure');
export const naturalFeaturesLayers = getLayersByCategory('naturalFeatures');
export const vegetationLayers = getLayersByCategory('vegetation');
export const urbanFeaturesLayers = getLayersByCategory('urbanFeatures');
export const geologicalLayers = getLayersByCategory('geological');
export const environmentalLayers = getLayersByCategory('environmental');
export const agricultureLayers = getLayersByCategory('agriculture');
export const miscellaneousLayers = getLayersByCategory('miscellaneous');

// Export all layers as a single collection
export const allVectorLayers = {
  ...transportationLayers,
  ...infrastructureLayers,
  ...naturalFeaturesLayers,
  ...vegetationLayers,
  ...urbanFeaturesLayers,
  ...geologicalLayers,
  ...environmentalLayers,
  ...agricultureLayers,
  ...miscellaneousLayers
};

// Get all layers as array for easy map addition
export const getAllVectorLayersArray = () => {
  return Object.values(allVectorLayers);
};