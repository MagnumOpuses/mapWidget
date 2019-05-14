import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import OlGridWMTS from "ol/tilegrid/WMTS";
import OlHeatmapLayer from "ol/layer/Heatmap";
import OlVectorLayer from 'ol/layer/Vector.js';
import OlVectorSource from "ol/source/Vector";
import {GeoJSON} from 'ol/format';

import mapstyling from './styling';

class mapLayers 
{
  constructor() {
    
    this.blur = 10;
    this.radius = 5;
  
    this.layer = 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/' + process.env.REACT_APP_LMTOKEN + '/';
    this.tileGrid3857 = new OlGridWMTS(
      {
        tileSize: 256,
        extent: [-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789],
        resolutions: [156543.0339280410, 78271.51696402048, 39135.75848201023, 19567.87924100512, 9783.939620502561, 4891.969810251280, 2445.984905125640, 1222.992452562820, 611.4962262814100, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15]
      }
    ); 

  }
  
  LmMap = new OlLayerTile(
    {
    source: new OlSourceWMTS(
      {
        url: this.layer,
        layer: 'topowebb_nedtonad',
        format: 'image/png',
        matrixSet: '3857',
        tileGrid: this.tileGrid3857,
        version: '1.0',
        tited: true,
        style: 'default',
        crossOrigin: 'anonymous'
      }
    ),
    name: 'Karta',
    zIndex: 0
  });

  Heatmap = new OlHeatmapLayer(
    {
      source: new OlVectorSource(
        {
          url: '/smallGeo.json',
          format: new GeoJSON(),
        }),
      name: 'heatmap',
      visible: false,
      zIndex: 10,
      blur: parseInt(this.blur),
      radius: parseInt(this.radius),
      opacity: 0.8,
      gradient: [
        process.env.REACT_APP_COLOR1,
        process.env.REACT_APP_COLOR2,
        process.env.REACT_APP_COLOR3,
        process.env.REACT_APP_COLOR4,
      ], //['#D9FAF7', '#D9FAF7', '#A6F3ED', '#50E8DB', '#02DECC'], //
    }
  );

  county = new OlVectorLayer(
    {
      source: new OlVectorSource(
        {
          url: '/laen-kustlinjer.geo.json',
          format: new GeoJSON()
        }),
      name: 'county',
      style: mapstyling.default,
      zIndex: 20
    }
  );

  countySelected = new OlVectorLayer(
    {
      source: new OlVectorSource(),
      name: 'countySelected',
      zIndex: 21,
      style: mapstyling.selected,

    }
  );

  municipality = new OlVectorLayer(
    {
      source: new OlVectorSource(
        {
          url: '/kommuner-kustlinjer.geo.json',
          format: new GeoJSON()
        }
      ),
      name: 'municipality',
      style: mapstyling.default,
      zIndex: 30,
      visible: false,
    }
  );

  municipalitySelected = new OlVectorLayer(
    {
      source: new OlVectorSource(),
      name: 'municipalitySelected',
      zIndex: 31,
      visible: false,
      style: mapstyling.selected,

    }
  );

  selected = new OlVectorLayer(
    {
      source: new OlVectorSource(),
      name: 'selected',
      zIndex: 5,
      visible: false,
      style: mapstyling.selected
    }
  );

}
export default mapLayers;