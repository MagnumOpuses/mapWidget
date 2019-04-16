import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import OlGridWMTS from "ol/tilegrid/WMTS";
import OlHeatmapLayer from "ol/layer/Heatmap";
import OlVectorLayer from 'ol/layer/Vector.js';
import OlVectorSource from "ol/source/Vector";
import {GeoJSON} from 'ol/format';
import {Fill, Stroke, Style, Text} from 'ol/style.js';
import 'ol/ol.css';

class MapComponent extends Component {
  constructor(props) {
    super(props);

    let blur = 10;
    let radius = 5;
    this.state = { center: [1692777, 8226038], zoom: 5 };
    
    const layer = 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/e8b5802b-17ee-310c-a4ad-d8c1955fb315/';
    const tileGrid3857 = new OlGridWMTS({
      tileSize: 256,
      extent: [-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789],
      resolutions: [156543.0339280410, 78271.51696402048, 39135.75848201023, 19567.87924100512, 9783.939620502561, 4891.969810251280, 2445.984905125640, 1222.992452562820, 611.4962262814100, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879],
      matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    });

    const LmMap = new OlLayerTile({
      source: new OlSourceWMTS({
        url: layer,
        layer: 'topowebb_nedtonad',
        format: 'image/png',
        matrixSet: '3857',
        tileGrid: tileGrid3857,
        version: '1.0',
        tited: true,
        style: 'default',
        crossOrigin: 'anonymous'
      }),
      name: 'Karta'
    });

    const Heatmap = new OlHeatmapLayer({
      source: new OlVectorSource({
        url: '/smallGeo.json',
        format: new GeoJSON(),
      }),
      name: 'framtid',
      blur: parseInt(blur),
      radius: parseInt(radius),
      opacity: 0.8,
      gradient: ['#BDBDBD', '#BDBDBD', '#A6F3ED', '#A6F3ED', '#02DECC'], //['#D9FAF7', '#D9FAF7', '#A6F3ED', '#50E8DB', '#02DECC'], //
    });

    const kommunerLayer = new OlVectorLayer({
      source: new OlVectorSource({
        url: '/kommuner-kustlinjer.geo.json',
        format: new GeoJSON()
      }),
      name: 'Kommuner',
      style: function(feature) {
        style.getText().setText(feature.get('name'));
        return style;
      }
    });

    const laenLayer = new OlVectorLayer({
      source: new OlVectorSource({
        url: '/laen-kustlinjer.geo.json',
        format: new GeoJSON()
      }),
      name: 'Län'
      /*
      style: function(feature) {
        style.getText().setText(feature.get('name'));
        return style;
      }
      */
    });
    const groundLayers = [ LmMap ];
    this.topLayers = [ Heatmap, kommunerLayer, laenLayer ];




    Heatmap.getSource().on('addfeature', function(event) {
      /*
      var level = event.feature.get('level');
      switch(level) {
        case 'high':
          level = 1;
          break;
        case 'medium':
          level = .5;
          break;
        default:
          level = .1;
        break;
      }
      */
      event.feature.set('weight', Math.random());  // set weight on point 0 -> 1
    });

    this.olmap = new OlMap({
      target: null,
      layers: [...groundLayers, ...this.topLayers],
      view: new OlView({
        center: this.state.center,
        zoom: this.state.zoom
      })
    });

  }

  updateMap() {
    this.olmap.getView().setCenter(this.state.center);
    this.olmap.getView().setZoom(this.state.zoom);
  }

  componentDidMount() {
    const map = this.olmap;
    map.setTarget('map');

    // Listen to map changes
    map.on('moveend', (evt) => {
      let center = map.getView().getCenter();
      let zoom = map.getView().getZoom();
      this.setState({ center, zoom });
    });

    map.on('pointermove', function(evt) {
      if (evt.dragging) {
        return;
      }
      let pixel = map.getEventPixel(evt.originalEvent);
      displayFeatureInfo(pixel);
    });

    map.on('click', function(evt) {
      displayFeatureInfo(evt.pixel, 'selected');
    });

    let hover;
    let selected;

    const displayFeatureInfo = function(pixel,type = 'hover') {
      const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
      });
      /*
      var info = document.getElementById('info');
      if (feature) {
        info.innerHTML = feature.getId() + ': ' + feature.get('name');
      } else {
        info.innerHTML = '&nbsp;';
      }
      */
            
      if(type == 'selected')
      {
        if (feature !== selected) {
          if (selected) {
            selectedOverlay.getSource().removeFeature(selected);
          }
          if (feature) {
            selectedOverlay.getSource().addFeature(feature);
          }
          selected = feature;
        }
      }
      else 
      {
        if (feature !== hover) {
          if (hover) {
            hoverOverlay.getSource().removeFeature(hover);
          }
          if (feature) {
            hoverOverlay.getSource().addFeature(feature);
          }
          hover = feature;
        }
      }


    };

    const hoverOverlay = new OlVectorLayer({
      source: new OlVectorSource(),
      map: this.olmap,
      style: function(feature) {
        highlightStyle.getText().setText(feature.get('name'));
        return highlightStyle;
      }
    });
    const selectedOverlay = new OlVectorLayer({
      source: new OlVectorSource(),
      map: this.olmap,
      style: function(feature) {
        selectedStyle.getText().setText(feature.get('name'));
        return selectedStyle;
      }
    });
  
  }

  shouldComponentUpdate(nextProps, nextState) {
    let center = this.olmap.getView().getCenter();
    let zoom = this.olmap.getView().getZoom();
    if (center === nextState.center && zoom === nextState.zoom) return false;
    return true;
  }

  toggleLayer(index) {
    const layer = this.topLayers[index];
    layer.setVisible(!layer.getVisible());
  }

  userAction() {
    //window.MyVars = "New value";
    this.setState({ center: [2005777, 8226038], zoom: 8 });
  }

  render() {
    this.updateMap(); // Update map on render?
    return (
      <div>
        <div id="map" style={{ width: "100%", height: "100%" }}>
          <ul>
          {this.topLayers.map((layer, i) => {     
            return (<li><a href="#" onClick={e => this.toggleLayer(i)}>{layer.get('name')}</a></li>) 
          })}
          </ul>
        </div>
        <button onClick={e => this.userAction()}>Move it, move it</button>
      </div>
    );
  }
}

export default MapComponent;

var style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    })
  })
});

var highlightStyle = new Style({
  stroke: new Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new Fill({
    color: 'rgba(255,0,0,0.1)'
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#f00',
      width: 3
    })
  })
});

var selectedStyle = new Style({
  stroke: new Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new Fill({
    color: 'rgba(200,200,200,0.6)'
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#f00',
      width: 3
    })
  })
});