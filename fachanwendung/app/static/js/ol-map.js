// Using the bundled version of OpenLayers
window.map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        maxZoom: 19,
        crossOrigin: 'anonymous'
      })
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),

        url: '/static/geodata/deutschlandGeoJSON/4_kreise/2_hoch.geo.json',
      }),
      style: new ol.style.Style({
        //fill: new ol.style.Fill({
        //color: 'rgba(255, 0, 0, 0.05)'  // Semi-transparent red fill
        //}),
        stroke: new ol.style.Stroke({
          color: '#ff0000',  // Red outline
          width: 2
        })
      })
    })
  ],
  view: new ol.View({
    center: [927319.695213, 6277180.746092],
    zoom: 15,
    projection: 'EPSG:3857'
  }),
  target: 'OL-map',
});



// ===========================================
// TRANSPORTATION LAYERS
// ===========================================

// Vehicles - Red tones
const carSource = new ol.source.Vector({});
window.carLayer = new ol.layer.Vector({
  source: carSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#cc0000', width: 2 })
  })
});
map.addLayer(carLayer);

const truckSource = new ol.source.Vector({});
window.truckLayer = new ol.layer.Vector({
  source: truckSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(200, 0, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#990000', width: 2 })
  })
});
map.addLayer(truckLayer);

const busSource = new ol.source.Vector({});
window.busLayer = new ol.layer.Vector({
  source: busSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 100, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#cc6600', width: 2 })
  })
});
map.addLayer(busLayer);

const motorcycleSource = new ol.source.Vector({});
window.motorcycleLayer = new ol.layer.Vector({
  source: motorcycleSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 50, 50, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#cc3333', width: 2 })
  })
});
map.addLayer(motorcycleLayer);

const bicycleSource = new ol.source.Vector({});
window.bicycleLayer = new ol.layer.Vector({
  source: bicycleSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 150, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#cc9900', width: 2 })
  })
});
map.addLayer(bicycleLayer);

const trainSource = new ol.source.Vector({});
window.trainLayer = new ol.layer.Vector({
  source: trainSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 0, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#660066', width: 3 })
  })
});
map.addLayer(trainLayer);

const aircraftSource = new ol.source.Vector({});
window.aircraftLayer = new ol.layer.Vector({
  source: aircraftSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 200, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#0099cc', width: 2 })
  })
});
map.addLayer(aircraftLayer);

const shipSource = new ol.source.Vector({});
window.shipLayer = new ol.layer.Vector({
  source: shipSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 200, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#000099', width: 2 })
  })
});
map.addLayer(shipLayer);

const boatSource = new ol.source.Vector({});
window.boatLayer = new ol.layer.Vector({
  source: boatSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(100, 100, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#6666cc', width: 2 })
  })
});
map.addLayer(boatLayer);

// ===========================================
// INFRASTRUCTURE LAYERS
// ===========================================

// Buildings - Grey/Brown tones
const buildingSource = new ol.source.Vector({});
window.buildingLayer = new ol.layer.Vector({
  source: buildingSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(64, 64, 64, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#404040', width: 2 })
  })
});
map.addLayer(buildingLayer);

const houseSource = new ol.source.Vector({});
window.houseLayer = new ol.layer.Vector({
  source: houseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});
map.addLayer(houseLayer);

const skyscraperSource = new ol.source.Vector({});
window.skyscraperLayer = new ol.layer.Vector({
  source: skyscraperSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(105, 105, 105, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#696969', width: 3 })
  })
});
map.addLayer(skyscraperLayer);

const factorySource = new ol.source.Vector({});
window.factoryLayer = new ol.layer.Vector({
  source: factorySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808000', width: 2 })
  })
});
map.addLayer(factoryLayer);

const warehouseSource = new ol.source.Vector({});
window.warehouseLayer = new ol.layer.Vector({
  source: warehouseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 160, 160, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0A0A0', width: 2 })
  })
});
map.addLayer(warehouseLayer);

const schoolSource = new ol.source.Vector({});
window.schoolLayer = new ol.layer.Vector({
  source: schoolSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 215, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFD700', width: 2 })
  })
});
map.addLayer(schoolLayer);

const hospitalSource = new ol.source.Vector({});
window.hospitalLayer = new ol.layer.Vector({
  source: hospitalSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 20, 147, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF1493', width: 2 })
  })
});
map.addLayer(hospitalLayer);

const bridgeSource = new ol.source.Vector({});
window.bridgeLayer = new ol.layer.Vector({
  source: bridgeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(169, 169, 169, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A9A9A9', width: 3 })
  })
});
map.addLayer(bridgeLayer);

const roadSource = new ol.source.Vector({});
window.roadLayer = new ol.layer.Vector({
  source: roadSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(47, 79, 79, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#2F4F4F', width: 2 })
  })
});
map.addLayer(roadLayer);

const highwaySource = new ol.source.Vector({});
window.highwayLayer = new ol.layer.Vector({
  source: highwaySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(25, 25, 112, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#191970', width: 3 })
  })
});
map.addLayer(highwayLayer);

const runwaySource = new ol.source.Vector({});
window.runwayLayer = new ol.layer.Vector({
  source: runwaySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808080', width: 4 })
  })
});
map.addLayer(runwayLayer);

const parkingLotSource = new ol.source.Vector({});
window.parkingLotLayer = new ol.layer.Vector({
  source: parkingLotSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(192, 192, 192, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#C0C0C0', width: 2 })
  })
});
map.addLayer(parkingLotLayer);

const solarPanelSource = new ol.source.Vector({});
window.solarPanelLayer = new ol.layer.Vector({
  source: solarPanelSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 140, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF8C00', width: 2 })
  })
});
map.addLayer(solarPanelLayer);

const windTurbineSource = new ol.source.Vector({});
window.windTurbineLayer = new ol.layer.Vector({
  source: windTurbineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(220, 220, 220, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DCDCDC', width: 2 })
  })
});
map.addLayer(windTurbineLayer);

// ===========================================
// NATURAL FEATURES LAYERS
// ===========================================

// Water bodies - Blue tones
const riverSource = new ol.source.Vector({});
window.riverLayer = new ol.layer.Vector({
  source: riverSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#0000FF', width: 2 })
  })
});
map.addLayer(riverLayer);

const lakeSource = new ol.source.Vector({});
window.lakeLayer = new ol.layer.Vector({
  source: lakeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 191, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00BFFF', width: 2 })
  })
});
map.addLayer(lakeLayer);

const oceanSource = new ol.source.Vector({});
window.oceanLayer = new ol.layer.Vector({
  source: oceanSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 139, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00008B', width: 2 })
  })
});
map.addLayer(oceanLayer);

const streamSource = new ol.source.Vector({});
window.streamLayer = new ol.layer.Vector({
  source: streamSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(173, 216, 230, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#ADD8E6', width: 2 })
  })
});
map.addLayer(streamLayer);

const pondSource = new ol.source.Vector({});
window.pondLayer = new ol.layer.Vector({
  source: pondSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(135, 206, 250, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#87CEEB', width: 2 })
  })
});
map.addLayer(pondLayer);

const wetlandSource = new ol.source.Vector({});
window.wetlandLayer = new ol.layer.Vector({
  source: wetlandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 100, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#006400', width: 2 })
  })
});
map.addLayer(wetlandLayer);

// Terrain features - Earth tones
const mountainSource = new ol.source.Vector({});
window.mountainLayer = new ol.layer.Vector({
  source: mountainSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 3 })
  })
});
map.addLayer(mountainLayer);

const hillSource = new ol.source.Vector({});
window.hillLayer = new ol.layer.Vector({
  source: hillSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(210, 180, 140, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#D2B48C', width: 2 })
  })
});
map.addLayer(hillLayer);

const valleySource = new ol.source.Vector({});
window.valleyLayer = new ol.layer.Vector({
  source: valleySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(107, 142, 35, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#6B8E23', width: 2 })
  })
});
map.addLayer(valleyLayer);

const canyonSource = new ol.source.Vector({});
window.canyonLayer = new ol.layer.Vector({
  source: canyonSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 82, 45, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0522D', width: 3 })
  })
});
map.addLayer(canyonLayer);

const beachSource = new ol.source.Vector({});
window.beachLayer = new ol.layer.Vector({
  source: beachSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(238, 203, 173, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#EECBAD', width: 2 })
  })
});
map.addLayer(beachLayer);

const coastlineSource = new ol.source.Vector({});
window.coastlineLayer = new ol.layer.Vector({
  source: coastlineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(70, 130, 180, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#4682B4', width: 2 })
  })
});
map.addLayer(coastlineLayer);

const islandSource = new ol.source.Vector({});
window.islandLayer = new ol.layer.Vector({
  source: islandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(244, 164, 96, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#F4A460', width: 2 })
  })
});
map.addLayer(islandLayer);

// ===========================================
// VEGETATION LAYERS
// ===========================================

// Forest and Trees - Green tones
const forestSource = new ol.source.Vector({});
window.forestLayer = new ol.layer.Vector({
  source: forestSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(34, 139, 34, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#228B22', width: 2 })
  })
});
map.addLayer(forestLayer);

const treeSource = new ol.source.Vector({});
window.treeLayer = new ol.layer.Vector({
  source: treeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#008000', width: 2 })
  })
});
map.addLayer(treeLayer);

const grassSource = new ol.source.Vector({});
window.grassLayer = new ol.layer.Vector({
  source: grassSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(124, 252, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#7CFC00', width: 2 })
  })
});
map.addLayer(grassLayer);

const cropFieldSource = new ol.source.Vector({});
window.cropFieldLayer = new ol.layer.Vector({
  source: cropFieldSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 215, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFD700', width: 2 })
  })
});
map.addLayer(cropFieldLayer);

const farmlandSource = new ol.source.Vector({});
window.farmlandLayer = new ol.layer.Vector({
  source: farmlandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(218, 165, 32, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DAA520', width: 2 })
  })
});
map.addLayer(farmlandLayer);

const orchardSource = new ol.source.Vector({});
window.orchardLayer = new ol.layer.Vector({
  source: orchardSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(50, 205, 50, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#32CD32', width: 2 })
  })
});
map.addLayer(orchardLayer);

const vineyardSource = new ol.source.Vector({});
window.vineyardLayer = new ol.layer.Vector({
  source: vineyardSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 0, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#800080', width: 2 })
  })
});
map.addLayer(vineyardLayer);

const parkSource = new ol.source.Vector({});
window.parkLayer = new ol.layer.Vector({
  source: parkSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(144, 238, 144, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#90EE90', width: 2 })
  })
});
map.addLayer(parkLayer);

const gardenSource = new ol.source.Vector({});
window.gardenLayer = new ol.layer.Vector({
  source: gardenSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(152, 251, 152, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#98FB98', width: 2 })
  })
});
map.addLayer(gardenLayer);

const shrubSource = new ol.source.Vector({});
window.shrubLayer = new ol.layer.Vector({
  source: shrubSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(85, 107, 47, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#556B2F', width: 2 })
  })
});
map.addLayer(shrubLayer);

const pastureSource = new ol.source.Vector({});
window.pastureLayer = new ol.layer.Vector({
  source: pastureSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(173, 255, 47, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#ADFF2F', width: 2 })
  })
});
map.addLayer(pastureLayer);

// ===========================================
// URBAN FEATURES LAYERS
// ===========================================

const urbanAreaSource = new ol.source.Vector({});
window.urbanAreaLayer = new ol.layer.Vector({
  source: urbanAreaSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(105, 105, 105, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#696969', width: 2 })
  })
});
map.addLayer(urbanAreaLayer);

const residentialSource = new ol.source.Vector({});
window.residentialLayer = new ol.layer.Vector({
  source: residentialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 182, 193, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFB6C1', width: 2 })
  })
});
map.addLayer(residentialLayer);

const commercialSource = new ol.source.Vector({});
window.commercialLayer = new ol.layer.Vector({
  source: commercialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 20, 147, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FF1493', width: 2 })
  })
});
map.addLayer(commercialLayer);

const industrialSource = new ol.source.Vector({});
window.industrialLayer = new ol.layer.Vector({
  source: industrialSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808000', width: 2 })
  })
});
map.addLayer(industrialLayer);

const constructionSiteSource = new ol.source.Vector({});
window.constructionSiteLayer = new ol.layer.Vector({
  source: constructionSiteSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 165, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFA500', width: 2 })
  })
});
map.addLayer(constructionSiteLayer);

const stadiumSource = new ol.source.Vector({});
window.stadiumLayer = new ol.layer.Vector({
  source: stadiumSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 255, 127, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00FF7F', width: 2 })
  })
});
map.addLayer(stadiumLayer);

const sportsFieldSource = new ol.source.Vector({});
window.sportsFieldLayer = new ol.layer.Vector({
  source: sportsFieldSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 250, 154, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00FA9A', width: 2 })
  })
});
map.addLayer(sportsFieldLayer);

const golfCourseSource = new ol.source.Vector({});
window.golfCourseLayer = new ol.layer.Vector({
  source: golfCourseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(127, 255, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#7FFF00', width: 2 })
  })
});
map.addLayer(golfCourseLayer);

const cemeterySource = new ol.source.Vector({});
window.cemeteryLayer = new ol.layer.Vector({
  source: cemeterySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(169, 169, 169, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A9A9A9', width: 2 })
  })
});
map.addLayer(cemeteryLayer);

// ===========================================
// GEOLOGICAL LAYERS
// ===========================================

const rockFormationSource = new ol.source.Vector({});
window.rockFormationLayer = new ol.layer.Vector({
  source: rockFormationSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 128, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#808080', width: 2 })
  })
});
map.addLayer(rockFormationLayer);

const sandSource = new ol.source.Vector({});
window.sandLayer = new ol.layer.Vector({
  source: sandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 218, 185, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#FFDAB9', width: 2 })
  })
});
map.addLayer(sandLayer);

const desertSource = new ol.source.Vector({});
window.desertLayer = new ol.layer.Vector({
  source: desertSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(238, 203, 173, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#EECBAD', width: 2 })
  })
});
map.addLayer(desertLayer);

const quarrySource = new ol.source.Vector({});
window.quarryLayer = new ol.layer.Vector({
  source: quarrySource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(160, 82, 45, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#A0522D', width: 2 })
  })
});
map.addLayer(quarryLayer);

const mineSource = new ol.source.Vector({});
window.mineLayer = new ol.layer.Vector({
  source: mineSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});
map.addLayer(mineLayer);

const landslideSource = new ol.source.Vector({});
window.landslideLayer = new ol.layer.Vector({
  source: landslideSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(205, 92, 92, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#CD5C5C', width: 2 })
  })
});
map.addLayer(landslideLayer);

const erosionSource = new ol.source.Vector({});
window.erosionLayer = new ol.layer.Vector({
  source: erosionSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(188, 143, 143, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#BC8F8F', width: 2 })
  })
});
map.addLayer(erosionLayer);

// ===========================================
// ENVIRONMENTAL LAYERS
// ===========================================

const fireSource = new ol.source.Vector({});
window.fireLayer = new ol.layer.Vector({
  source: fireSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 69, 0, 0.6)' }),
    stroke: new ol.style.Stroke({ color: '#FF4500', width: 3 })
  })
});
map.addLayer(fireLayer);

const floodSource = new ol.source.Vector({});
window.floodLayer = new ol.layer.Vector({
  source: floodSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(30, 144, 255, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#1E90FF', width: 2 })
  })
});
map.addLayer(floodLayer);

const snowSource = new ol.source.Vector({});
window.snowLayer = new ol.layer.Vector({
  source: snowSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 250, 250, 0.6)' }),
    stroke: new ol.style.Stroke({ color: '#FFFAFA', width: 2 })
  })
});
map.addLayer(snowLayer);

const iceSource = new ol.source.Vector({});
window.iceLayer = new ol.layer.Vector({
  source: iceSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(176, 224, 230, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#B0E0E6', width: 2 })
  })
});
map.addLayer(iceLayer);

const cloudSource = new ol.source.Vector({});
window.cloudLayer = new ol.layer.Vector({
  source: cloudSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.3)' }),
    stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 })
  })
});
map.addLayer(cloudLayer);

const shadowSource = new ol.source.Vector({});
window.shadowLayer = new ol.layer.Vector({
  source: shadowSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#000000', width: 2 })
  })
});
map.addLayer(shadowLayer);

const smokeSource = new ol.source.Vector({});
window.smokeLayer = new ol.layer.Vector({
  source: smokeSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(128, 128, 128, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#808080', width: 2 })
  })
});
map.addLayer(smokeLayer);

const pollutionSource = new ol.source.Vector({});
window.pollutionLayer = new ol.layer.Vector({
  source: pollutionSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.5)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});
map.addLayer(pollutionLayer);

// ===========================================
// AGRICULTURE LAYERS
// ===========================================

const greenhouseSource = new ol.source.Vector({});
window.greenhouseLayer = new ol.layer.Vector({
  source: greenhouseSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(240, 248, 255, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#F0F8FF', width: 2 })
  })
});
map.addLayer(greenhouseLayer);

const barnSource = new ol.source.Vector({});
window.barnLayer = new ol.layer.Vector({
  source: barnSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(139, 69, 19, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#8B4513', width: 2 })
  })
});
map.addLayer(barnLayer);

const siloSource = new ol.source.Vector({});
window.siloLayer = new ol.layer.Vector({
  source: siloSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(192, 192, 192, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#C0C0C0', width: 2 })
  })
});
map.addLayer(siloLayer);

const irrigationSource = new ol.source.Vector({});
window.irrigationLayer = new ol.layer.Vector({
  source: irrigationSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(0, 206, 209, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#00CED1', width: 2 })
  })
});
map.addLayer(irrigationLayer);

const livestockSource = new ol.source.Vector({});
window.livestockLayer = new ol.layer.Vector({
  source: livestockSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(222, 184, 135, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DEB887', width: 2 })
  })
});
map.addLayer(livestockLayer);

// Helper functions to append features to rectangleLayer
window.addRectangleToLayer = function (features, layer) {
  // Handle both single feature and array of features
  const featureArray = Array.isArray(features) ? features : [features];
  
  featureArray.forEach(feature => {
    feature.setStyle(layer.getStyle());
    layer.getSource().addFeature(feature);
  });
  
  return features;
};

// Add another rectangle
//addRectangleToLayer(window.rectangleLayer, [[[930000, 6275000], [935000, 6275000], [935000, 6280000], [930000, 6280000], [930000, 6275000]]]);
