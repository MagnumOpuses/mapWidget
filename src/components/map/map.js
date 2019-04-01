import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import OlGridWMTS from "ol/tilegrid/WMTS";
import OlHeatmapLayer from "ol/layer/Heatmap";
import OlVector from "ol/source/Vector";
import {GeoJSON} from 'ol/format';
import 'ol/ol.css';

class MapComponent extends Component {
  constructor(props) {
    super(props);

    let blur = 10;
    let radius = 4;

    this.state = { center: [1692777, 8226038], zoom: 5 };
    
    const layer = "https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/e8b5802b-17ee-310c-a4ad-d8c1955fb315/";
    const tileGrid3857 = new OlGridWMTS({
      tileSize: 256,
      extent: [-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789],
      resolutions: [156543.0339280410, 78271.51696402048, 39135.75848201023, 19567.87924100512, 9783.939620502561, 4891.969810251280, 2445.984905125640, 1222.992452562820, 611.4962262814100, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879],
      matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
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
      })
    });

    var vector = new OlHeatmapLayer({
      source: new OlVector({
        url: 'https://geo.riksarkivet.se:8443/geoserver/TORA/ows?service=WFS&version=1.1.1&request=GetFeature&typeName=TORA:hsu-full&CQL_FILTER=preflabel%20ILIKE%20%27%25torp%25%27&outputFormat=application/json',
        format: new GeoJSON(),
      }),
      blur: parseInt(blur),
      radius: parseInt(radius),
      opacity: 0.8,
      gradient: ['#D9FAF7', '#D9FAF7', '#A6F3ED', '#50E8DB', '#02DECC'], //['#00f', '#0ff', '#0f0', '#ff0', '#f00']
    });

    this.olmap = new OlMap({
      target: null,
      layers: [ LmMap, vector ],
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
    this.olmap.setTarget("map");

    // Listen to map changes
    this.olmap.on("moveend", () => {
      let center = this.olmap.getView().getCenter();
      let zoom = this.olmap.getView().getZoom();
      this.setState({ center, zoom });
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    let center = this.olmap.getView().getCenter();
    let zoom = this.olmap.getView().getZoom();
    if (center === nextState.center && zoom === nextState.zoom) return false;
    return true;
  }

  userAction() {
    this.setState({ center: [2005777, 8226038], zoom: 8 });
  }

  render() {
    this.updateMap(); // Update map on render?
    return (
      <div>
        <div id="map" style={{ width: "100%", height: "100%" }}></div>
        <button onClick={e => this.userAction()}>Move it, move it</button>
      </div>
    );
  }
}

export default MapComponent;
