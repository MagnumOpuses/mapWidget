import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import {getCenter} from 'ol/extent.js';
import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import OlGridWMTS from "ol/tilegrid/WMTS";
import OlHeatmapLayer from "ol/layer/Heatmap";
import OlVectorLayer from 'ol/layer/Vector.js';
import OlVectorSource from "ol/source/Vector";
import {GeoJSON} from 'ol/format';
import {Fill, Style } from 'ol/style.js';
import 'ol/ol.css';

import mapstyling from './styling';
import api from '../api/api';

const styling = new mapstyling();

class areaSelected {
    zoom = 0;
    name = '';
}

class MapComponent extends Component 
{
  constructor(props) 
  {
    super(props);

    let blur = 10;
    let radius = 5;
    
    this.state = 
    { 
      center: [
        Number(process.env.REACT_APP_MAP_START_LON), 
        Number(process.env.REACT_APP_MAP_START_LAT)
      ], 
      zoom: Number(process.env.REACT_APP_MAP_START_ZOOM), 
      extent: [],
      q: '',
      level: 'county',
    };

    this.predefinedColor = 
    [
      process.env.REACT_APP_COLOR1,
      process.env.REACT_APP_COLOR2,
      process.env.REACT_APP_COLOR3,
      process.env.REACT_APP_COLOR4,
    ];

    this.selected = 
    {
      county: new areaSelected(),
      municipality: new areaSelected()
    };
    
    const layer = 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/' + process.env.REACT_APP_LMTOKEN + '/';
    const tileGrid3857 = new OlGridWMTS(
      {
        tileSize: 256,
        extent: [-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789],
        resolutions: [156543.0339280410, 78271.51696402048, 39135.75848201023, 19567.87924100512, 9783.939620502561, 4891.969810251280, 2445.984905125640, 1222.992452562820, 611.4962262814100, 305.7481131407048, 152.8740565703525, 76.43702828517624, 38.21851414258813, 19.10925707129406,9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879],
        matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }
    );

    const LmMap = new OlLayerTile(
      {
      source: new OlSourceWMTS(
        {
          url: layer,
          layer: 'topowebb_nedtonad',
          format: 'image/png',
          matrixSet: '3857',
          tileGrid: tileGrid3857,
          version: '1.0',
          tited: true,
          style: 'default',
          crossOrigin: 'anonymous'
        }
      ),
      name: 'Karta',
      zIndex: 0
    });

    const Heatmap = new OlHeatmapLayer(
      {
        source: new OlVectorSource(
          {
            url: '/smallGeo.json',
            format: new GeoJSON(),
          }),
        name: 'heatmap',
        visible: false,
        zIndex: 10,
        blur: parseInt(blur),
        radius: parseInt(radius),
        opacity: 0.8,
        gradient: this.predefinedColor.reverse(), //['#D9FAF7', '#D9FAF7', '#A6F3ED', '#50E8DB', '#02DECC'], //
      }
    );
    this.predefinedColor.reverse();

    const county = new OlVectorLayer(
      {
        source: new OlVectorSource(
          {
            url: '/laen-kustlinjer.geo.json',
            format: new GeoJSON()
          }),
        name: 'county',
        style: styling.default,
        zIndex: 20
      }
    );
    const countySelected = new OlVectorLayer(
      {
        source: new OlVectorSource(),
        name: 'countySelected',
        zIndex: 21,
        style: styling.selected,

      }
    );

    const municipality = new OlVectorLayer(
      {
        source: new OlVectorSource(
          {
            url: '/kommuner-kustlinjer.geo.json',
            format: new GeoJSON()
          }
        ),
        name: 'municipality',
        style: styling.default,
        zIndex: 30,
        visible: false,
      }
    );

    const municipalitySelected = new OlVectorLayer(
      {
        source: new OlVectorSource(),
        name: 'municipalitySelected',
        zIndex: 31,
        visible: false,
        style: styling.selected,

      }
    );

    const selected = new OlVectorLayer(
      {
        source: new OlVectorSource(),
        name: 'selected',
        zIndex: 5,
        visible: false,
        style: styling.selected
      }
    );

    const groundLayers = [ LmMap ];
    this.topLayers = [ Heatmap, municipality, municipalitySelected, county, countySelected, selected ];

    Heatmap.getSource().on('addfeature', function(event) 
      {
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
      }
    );

    this.olmap = new OlMap(
      {
        target: null,
        layers: [...groundLayers, ...this.topLayers],
        view: new OlView(
          {
            center: this.state.center,
            zoom: this.state.zoom,
            extent: [-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789],
            minZoom: 4.8
          })
      }
    );

  }

  updateMap() 
  {
    const map = this.olmap;
    if(this.state.extent.length === 4) 
    {
      map.getView().fit(
        this.state.extent, 
        {
          'size': map.getSize(), 
          'duration': 1000
        } 
      );
    }
    else 
    {
      map.getView().animate(
        {
          center: this.state.center,
          zoom: this.state.zoom,
          duration: 1000
        }
      );
  
    }
  }
  
  toggleLevel(level = 'county')
  {
    this.setState({ level: level });
    const kommun = this.findLayerByValue('name', 'municipality');
    const lan = this.findLayerByValue('name', 'county');
    const kommunVald = this.findLayerByValue('name', 'municipalitySelected');
    const lanVald = this.findLayerByValue('name', 'countySelected');

    if(level === 'municipality')
    {
      //console.log('swiching to municipality level');
      kommun.setVisible(true);
      kommunVald.setVisible(true);
      lan.setVisible(false);
      lanVald.setVisible(false);
    } 
    else
    {
      //console.log('swiching to county level');
      kommun.setVisible(false);
      kommunVald.setVisible(false);
      lan.setVisible(true);
      lanVald.setVisible(true);
    }

    setTimeout(() => this.loadValues(level,false), 2000);		
  }

  colorCodeValue(total, value)
  {
    const one4th = total / 4;
    let x = 3;
    if (value < (one4th * 3)) x = 2;
    if (value < (one4th * 2)) x = 1;
    if (value < one4th) x = 0;
    return this.predefinedColor[x];
  }

  async loadValues(area, zoomResult = true) 
  {
    const resp = await api(this.state.q);
    const layer = this.findLayerByValue('name', area);
    let marks = [];
    let found = false;
    const total = resp.data.results.total;
    const parent = this;
    resp.data.results[area].forEach(fetchedRow => {
      found = false;
      layer.getSource().forEachFeature(function(feature)
      {
        if(found) return;
        let name = feature.get('name');
        if(name === fetchedRow.name)
        {
          marks.push({
            feature: feature,
            text: fetchedRow.value.toString(),
            color: parent.colorCodeValue(total,fetchedRow.value.toString())
          });
          found = true;
          return;
        }
      });
      
    });
    if(marks.length) {
      this.addMarks(
        marks, 
        { 
          layerExtent: true, 
          layer: area + 'Selected',
          zoomResult: zoomResult
        }
      );
    }

  }

  componentDidMount() 
  {
    const parent = this;
    const map = this.olmap;
    map.setTarget('map');
    setTimeout(() => this.loadValues('county'), 2000);		

    // Listen to map changes
    map.on('moveend', (evt) => 
    {
      //console.log(this.state);
      //console.log(this.selected);
      let center = map.getView().getCenter();
      let zoom = map.getView().getZoom();
      this.setState({ center, zoom });
      // remove selected on zoom out
        if(this.selected.county.zoom !== 0 && this.selected.county.zoom > this.state.zoom) {
          //console.log('unselect county');
          this.removeMark(this.selected.county.name, 'selected');
          this.selected.county = new areaSelected();
          parent.toggleLevel('county');

        }
        if(this.selected.municipality.zoom !== 0 && this.selected.municipality.zoom > this.state.zoom) {
          //console.log('unselect municipality');

          this.removeMark(this.selected.municipality.name, 'selected');
          this.selected.municipality = new areaSelected();
          parent.toggleLevel('county');

        }

    });

    map.on('pointermove', function(evt) 
    {
      if (evt.dragging) 
      {
        return;
      }
      let pixel = map.getEventPixel(evt.originalEvent);
      hoverFunc(pixel);
    });

    map.on('click', function(evt) 
    {
      map.forEachFeatureAtPixel(evt.pixel, function(feature) 
      {
        if(feature !== undefined)
        {
          // admin_level 4 = county
          if(parent.selected.county.name !== feature.get('name') && feature.get('admin_level') === '4'){
            //console.log([ feature, feature.get('name') ]);
            parent.addSelect(feature, 'county');
            parent.toggleLevel('municipality');
          };
          // admin_level 7 = municipality
          if(parent.selected.municipality.name !== feature.get('name') && feature.get('admin_level') === '7'){
            //console.log([ feature.get('admin_level'), feature.get('name')]);
            parent.addSelect(feature, 'municipality');

          };
        
        }
      });

    });

    let hover;
    const hoverFunc = function(pixel,type = 'hover') 
    {
      const feature = map.forEachFeatureAtPixel(pixel, function(feature) 
      {
        if(parent.state.level === 'county' && feature.get('admin_level') === '4') {
          return feature;
        }
        if(parent.state.level === 'municipality' && feature.get('admin_level') === '7') {
          return feature;
        }

      });

      if (feature !== hover) 
      {
        if (hover)
        {
          hoverOverlay.getSource().removeFeature(hover);
        }
        if (feature) 
        {
          hoverOverlay.getSource().addFeature(feature);
        }
        hover = feature;
      }
    };

    const hoverOverlay = new OlVectorLayer(
      {
      source: new OlVectorSource(),
      map: this.olmap,
      zIndex: 50,
      style: function(feature) 
      {
        styling.label.getText().setText(feature.get('name'));
        return [styling.label,styling.highlight];
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) 
  {
    let center = this.olmap.getView().getCenter();
    let zoom = this.olmap.getView().getZoom();
    if (center === nextState.center && zoom === nextState.zoom) return false;
    return true;
  }
  
  addSelect(feature,type) {
    const selectedLayer = this.findLayerByValue('name', 'selected');
    if (this.selected[this.state.level].name.length > 0)
    {
      //select one county or municipality at the time
      this.removeMark(this.selected[this.state.level].name, 'selected');
    }
    feature.setStyle(styling.selected);
    selectedLayer.getSource().addFeature(feature);
    this.selected[type].name = feature.get('name');
    this.selected[type].zoom = this.state.zoom;
    if (this.selected['municipality'].zoom === undefined) 
    {
      this.selected['municipality'].zoom = this.state.zoom;
    }
    feature.setId(this.selected[type].name);
    this.toggleLayer(selectedLayer, true);
    let extent = feature.getGeometry().getExtent();

    this.setState(
      { 
        center: getCenter(extent), 
        extent: extent 
      }
    );
  }

  addMarks(marks, opt) 
  {
    const standardsOpt = {
      layerExtent: false,
      layer: '',
      id: 'selected',
      clear: false,
      zoomResult: false,
      bgColor: 'rgba(236,241,240, 0.4)'
    } 
    let options = Object.assign(standardsOpt, opt);
    const selectedLayer = this.findLayerByValue('name', options.layer);

    if(options.clear)
    {
      selectedLayer.getSource().clear();
    }
    let feature = {};
    marks.forEach(function(mark){
      feature = mark.feature.clone();
      selectedLayer.getSource().addFeature(feature);

      feature.setStyle(function(feature) 
      {
        let fill = new Style({
          fill: new Fill({
            color: mark.color
          })
        });
        styling.label.getText().setText(mark.text);
        return [styling.circle,styling.label,fill];
      });
      //console.log('styling...');
      //feature.setId(options.id);
  
    });

    this.toggleLayer(selectedLayer, true);
    let extent = [];
    if (options.layerExtent) 
    {
      //console.log('zoom to layer');
      extent = selectedLayer.getSource().getExtent();
    }
    if(!options.layerExtent)
    {
      //console.log('zoom to feature');
      extent = feature.getGeometry().getExtent();
    }
    if(options.zoomResult) {
      this.setState(
        { 
          center: getCenter(extent), 
          extent: extent 
        }
      );
    }

  }

  removeMark(featureName, layer) 
  {
    const selectedLayer = this.findLayerByValue('name', layer);
    const feature = selectedLayer.getSource().getFeatureById(featureName);
    // feature.setStyle(style);
    selectedLayer.getSource().removeFeature(feature);
  }

  findLayerByValue(key, name)
  {
    let found = {};
    this.topLayers.map((layer,i) => {
      if(layer.get(key) === name)
      {
        found =  layer;
      }
    });
    return found;
  }

  toggleLayer(layer, value='') 
  {
    if(Number.isInteger(layer))
    {
      layer = this.topLayers[layer];
      //console.log('layer toggle by index');
    }

    if(value.length < 1) 
    {
      layer.setVisible(!layer.getVisible());
      //console.log('layer vis toggled');
    }
    else 
    {
      layer.setVisible(value);
      //console.log('layer vis set to ' + value);
    }
  }

  render() 
  {
    this.updateMap(); // Update map on render?
    return (
      <div>
        <div id="map" style={{ width: "100%", height: "100%" }}>
          <ul>
          {this.topLayers.map((layer, i) => {     
            return (<li key={i}><a href="#"  onClick={e => this.toggleLayer(i)}>{layer.get('name')}</a></li>) 
          })}
          </ul>
        </div>
      </div>
    );
  }
}

export default MapComponent;