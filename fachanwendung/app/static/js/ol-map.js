// Using the bundled version of OpenLayers

// ===========================================
// BASE LAYER DEFINITIONS
// ===========================================

// Google Satellite Layer
const googleSatelliteLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 19,
    crossOrigin: 'anonymous'
  }),
  visible: true,
  name: 'Google Satellite'
});

// ArcGIS Wayback XYZ Layers - Using consistent Wayback service URLs
const waybackLayers = {
 '2025': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/25285/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2025 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2025'
  }),
  '2024': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/39767/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2024 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2024'
  }),
  '2023': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/47963/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2023 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'October 2023'
  }),
  '2022': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/13851/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2022 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'June 2022'
  }),
  '2021': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/8432/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2021 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'October 2021'
  }),
  '2020': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/9549/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2020 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'December 2020'
  }),
  '2018': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/14829/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2018 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2018'
  }),
  '2014': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3026/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2014 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2014'
  }),
  '2019': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/16681/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2019 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2019'
  }),
  '2017': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3319/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2017 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2017'
  }),
  '2016': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/5097/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2016 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2016'
  }),
  '2015': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/24007/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2015 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2015'
  })
};

// Store all base layers for easy access
window.baseLayers = {
  'google': googleSatelliteLayer,
  ...waybackLayers
};

// Layer switching function with enhanced debugging
window.switchBaseLayer = function (layerKey) {
  console.log(`🔄 Switching to layer: ${layerKey}`);

  // Hide all base layers
  Object.values(window.baseLayers).forEach(layer => {
    layer.setVisible(false);
  });

  // Show selected layer
  if (window.baseLayers[layerKey]) {
    const selectedLayer = window.baseLayers[layerKey];
    selectedLayer.setVisible(true);

    // Get layer details for debugging
    const layerName = selectedLayer.get('name');
    const source = selectedLayer.getSource();
    const urls = source.getUrls ? source.getUrls() : [source.getUrl && source.getUrl()];

    console.log(`✅ Switched to base layer: ${layerName}`);
    console.log(`📍 Layer source URLs:`, urls);

    // Force refresh of tiles to ensure new layer loads
    source.refresh();

    // Add tile load event listeners for debugging
    source.on('tileloadstart', function (event) {
      console.log(`📥 ${layerKey}: Tile load started:`, event.tile.getTileCoord());
    });

    source.on('tileloadend', function (event) {
      console.log(`📦 ${layerKey}: Tile loaded successfully:`, event.tile.getTileCoord());
    });

    source.on('tileloaderror', function (event) {
      console.error(`❌ ${layerKey}: Tile load error:`, event.tile.getTileCoord(), event);
    });

  } else {
    console.error(`❌ Base layer '${layerKey}' not found`);
    console.log('Available layers:', Object.keys(window.baseLayers));
  }
};

// Function to test a sample tile URL manually
window.testWaybackURL = function (year) {
  const testCoords = { z: 10, x: 512, y: 512 }; // Example coordinates
  const baseUrl = 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile';

  // Use actual wayback release dates
  const waybackDates = {
    '2023': '2023-10-25',
    '2022': '2022-06-22',
    '2021': '2021-10-13',
    '2020': '2020-12-04',
    '2018': '2018-02-05',
    '2014': '2014-02-20'
  };

  const date = waybackDates[year] || `${year}-12-31`;
  const testUrl = `${baseUrl}/${testCoords.z}/${testCoords.y}/${testCoords.x}?time=${date}`;

  console.log(`🧪 Testing Wayback URL for ${year} (${date}):`, testUrl);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    console.log(`✅ ${year}: Tile loaded successfully - ${this.width}x${this.height}`);
  };
  img.onerror = function (e) {
    console.error(`❌ ${year}: Tile failed to load:`, e);
  };
  img.src = testUrl;
};

// Function to compare tile URLs between layers
window.compareLayers = function () {
  console.log('🔍 Comparing layer configurations:');
  Object.entries(waybackLayers).forEach(([key, layer]) => {
    const source = layer.getSource();
    const url = source.getUrl && source.getUrl();
    console.log(`${key}: ${url}`);
  });
};

// Create base layers array for map initialization
const allBaseLayers = [googleSatelliteLayer, ...Object.values(waybackLayers)];

window.map = new ol.Map({
  layers: [
    ...allBaseLayers,
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


const farmlandSource = new ol.source.Vector({});
window.farmlandLayer = new ol.layer.Vector({
  source: farmlandSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(218, 165, 32, 0.4)' }),
    stroke: new ol.style.Stroke({ color: '#DAA520', width: 2 })
  })
});
map.addLayer(farmlandLayer);


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

// ===========================================
// LAYER SWITCHING CONTROL
// ===========================================

// Toggle function for layer switcher (called from HTML)
window.toggleLayerSwitcher = function () {
  const content = document.getElementById('layer-switcher-content');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    console.log('Layer switcher toggled:', !isVisible ? 'opened' : 'closed');
  }
};

console.log('Layer switcher control initialized in HTML template');

// ===========================================
// ADDITIONAL HELPER FUNCTIONS
// ===========================================

// Function to get current active base layer
window.getCurrentBaseLayer = function () {
  const activeLayer = Object.entries(window.baseLayers).find(([key, layer]) => layer.getVisible());
  return activeLayer ? { key: activeLayer[0], layer: activeLayer[1], name: activeLayer[1].get('name') } : null;
};

// Function to set layer opacity
window.setBaseLayerOpacity = function (opacity) {
  Object.values(window.baseLayers).forEach(layer => {
    layer.setOpacity(opacity);
  });
};

// Function to switch to a specific Wayback time period
window.switchToWaybackTime = function (timeString) {
  const yearMatch = timeString.match(/\d{4}/);
  if (yearMatch) {
    const year = yearMatch[0];
    if (window.baseLayers[year]) {
      window.switchBaseLayer(year);
    } else {
      console.warn(`No Wayback layer available for year: ${year}`);
    }
  }
};

// Console helper for easy layer switching and debugging
console.log('🌍 ArcGIS Wayback Integration loaded successfully!');
console.log('📋 Available commands:');
console.log('Layer Switching:');
console.log('- switchBaseLayer("google") - Switch to Google Satellite');
console.log('- switchBaseLayer("current") - Switch to current ArcGIS imagery');
console.log('- switchBaseLayer("2025") - Switch to 2025');
console.log('- switchBaseLayer("2024") - Switch to 2024');
console.log('- switchBaseLayer("2023") - Switch to October 2023');
console.log('- switchBaseLayer("2022") - Switch to June 2022');
console.log('- switchBaseLayer("2021") - Switch to October 2021');
console.log('- switchBaseLayer("2020") - Switch to December 2020');
console.log('- switchBaseLayer("2019") - Switch to 2019');
console.log('- switchBaseLayer("2018") - Switch to February 2018');
console.log('- switchBaseLayer("2017") - Switch to 2017');
console.log('- switchBaseLayer("2016") - Switch to 2016');
console.log('- switchBaseLayer("2015") - Switch to 2015');
console.log('- switchBaseLayer("2014") - Switch to February 2014');
console.log('');
console.log('Debugging & Verification:');
console.log('- getCurrentBaseLayer() - Get current active base layer');
console.log('- setBaseLayerOpacity(0.5) - Set opacity of base layers');
console.log('- testWaybackURL("2020") - Test if a specific year\'s tiles load');
console.log('- compareLayers() - Compare all layer configurations');
console.log('');
console.log('💡 To verify layers are different:');
console.log('1. Switch to different years and check console for tile URLs');
console.log('2. Use testWaybackURL() to verify individual years load');
console.log('3. Look for tile load/error messages when switching layers');
