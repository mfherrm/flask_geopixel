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

const busSource = new ol.source.Vector({});
export const busLayer = new ol.layer.Vector({
  source: busSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 165, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFA500', width: 2 })
  })
});

const motorcycleSource = new ol.source.Vector({});
export const motorcycleLayer = new ol.layer.Vector({
  source: motorcycleSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(220, 20, 60, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DC143C', width: 2 })
  })
});

const bicycleSource = new ol.source.Vector({});
export const bicycleLayer = new ol.layer.Vector({
  source: bicycleSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 192, 203, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFC0CB', width: 2 })
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

const boatSource = new ol.source.Vector({});
export const boatLayer = new ol.layer.Vector({
  source: boatSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(70, 130, 180, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#4682B4', width: 2 })
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

const skyscraperSource = new ol.source.Vector({});
export const skyscraperLayer = new ol.layer.Vector({
  source: skyscraperSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(112, 128, 144, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#708090', width: 3 })
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

const schoolSource = new ol.source.Vector({});
export const schoolLayer = new ol.layer.Vector({
  source: schoolSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFFF00', width: 2 })
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

const streamSource = new ol.source.Vector({});
export const streamLayer = new ol.layer.Vector({
  source: streamSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(135, 206, 235, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#87CEEB', width: 2 })
  })
});

const pondSource = new ol.source.Vector({});
export const pondLayer = new ol.layer.Vector({
  source: pondSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(72, 209, 204, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#48D1CC', width: 2 })
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

const cropFieldSource = new ol.source.Vector({});
export const cropFieldLayer = new ol.layer.Vector({
  source: cropFieldSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 215, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFD700', width: 2 })
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

const orchardSource = new ol.source.Vector({});
export const orchardLayer = new ol.layer.Vector({
  source: orchardSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(154, 205, 50, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#9ACD32', width: 2 })
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

const shrubSource = new ol.source.Vector({});
export const shrubLayer = new ol.layer.Vector({
  source: shrubSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(107, 142, 35, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#6B8E23', width: 2 })
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

const cloudSource = new ol.source.Vector({});
export const cloudLayer = new ol.layer.Vector({
  source: cloudSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.6)' }),
    stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 })
  })
});

const shadowSource = new ol.source.Vector({});
export const shadowLayer = new ol.layer.Vector({
  source: shadowSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#000000', width: 2 })
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

const pollutionSource = new ol.source.Vector({});
export const pollutionLayer = new ol.layer.Vector({
  source: pollutionSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
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

const irrigationSource = new ol.source.Vector({});
export const irrigationLayer = new ol.layer.Vector({
  source: irrigationSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(65, 105, 225, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#4169E1', width: 2 })
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
  busLayer,
  motorcycleLayer,
  bicycleLayer,
  trainLayer,
  aircraftLayer,
  shipLayer,
  boatLayer
};

export const infrastructureLayers = {
  buildingLayer,
  houseLayer,
  skyscraperLayer,
  factoryLayer,
  warehouseLayer,
  schoolLayer,
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
  streamLayer,
  pondLayer,
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
  cropFieldLayer,
  farmlandLayer,
  orchardLayer,
  vineyardLayer,
  parkLayer,
  gardenLayer,
  shrubLayer,
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
  cloudLayer,
  shadowLayer,
  smokeLayer,
  pollutionLayer
};

export const agricultureLayers = {
  greenhouseLayer,
  barnLayer,
  siloLayer,
  irrigationLayer,
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
  }
};

// Function to hide the statistics modal
export const hideLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Test function to add sample data for demonstration
export const addSampleData = () => {
  console.log('Adding sample data for Layer Statistics demonstration...');
  
  // Add sample polygons to car layer
  const carPolygon1 = new ol.Feature({
    geometry: new ol.geom.Polygon([[[932000, 6275000], [932100, 6275000], [932100, 6275100], [932000, 6275100], [932000, 6275000]]])
  });
  const carPolygon2 = new ol.Feature({
    geometry: new ol.geom.Polygon([[[932200, 6275000], [932300, 6275000], [932300, 6275100], [932200, 6275100], [932200, 6275000]]])
  });
  carLayer.getSource().addFeatures([carPolygon1, carPolygon2]);
  
  // Add sample MultiPolygon to building layer (this will count as 3 individual geometries)
  const multiPolygonGeometry = new ol.geom.MultiPolygon([
    [[[932000, 6275200], [932050, 6275200], [932050, 6275250], [932000, 6275250], [932000, 6275200]]],
    [[[932100, 6275200], [932150, 6275200], [932150, 6275250], [932100, 6275250], [932100, 6275200]]],
    [[[932200, 6275200], [932250, 6275200], [932250, 6275250], [932200, 6275250], [932200, 6275200]]]
  ]);
  const buildingMultiPolygon = new ol.Feature({
    geometry: multiPolygonGeometry
  });
  buildingLayer.getSource().addFeature(buildingMultiPolygon);
  
  // Add sample points to tree layer
  const tree1 = new ol.Feature({
    geometry: new ol.geom.Point([932050, 6275300])
  });
  const tree2 = new ol.Feature({
    geometry: new ol.geom.Point([932150, 6275300])
  });
  const tree3 = new ol.Feature({
    geometry: new ol.geom.Point([932250, 6275300])
  });
  treeLayer.getSource().addFeatures([tree1, tree2, tree3]);
  
  console.log('Sample data added:');
  console.log('- 2 car polygons');
  console.log('- 1 MultiPolygon building (contains 3 individual polygons)');
  console.log('- 3 tree points');
  console.log('Total expected geometries: 8');
};

// Expose test function to window for manual testing
window.addSampleLayerData = addSampleData;