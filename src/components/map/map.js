import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import {getCenter} from 'ol/extent.js';
import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import {Fill, Style } from 'ol/style.js';
import 'ol/ol.css';

import mapStyling from './styling';
import mapLayers from './layers';
import api from '../api/api';

const styling = new mapStyling();
const layers = new mapLayers();

class areaSelected {
    zoom = 0;
    name = '';
}

class MapComponent extends Component 
{
  constructor(props) 
  {
    super(props);
   
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

    const LmMap = new OlLayerTile(
      {
      source: new OlSourceWMTS(
        {
          url: layers.layer,
          layer: 'topowebb_nedtonad',
          format: 'image/png',
          matrixSet: '3857',
          tileGrid: layers.tileGrid3857,
          version: '1.0',
          tited: true,
          style: 'default',
          crossOrigin: 'anonymous'
        }
      ),
      name: 'Karta',
      zIndex: 0
    });

    const groundLayers = [ LmMap ];
    this.topLayers = 
    [ 
      layers.Heatmap, 
      layers.municipality, 
      layers.municipalitySelected, 
      layers.county, 
      layers.countySelected, 
      layers.selected,
      layers.hover 
    ];

    layers.Heatmap.getSource().on('addfeature', function(event) 
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
    const heatmap = this.findLayerByValue('name', 'heatmap');

    if(level === 'municipality')
    {
      //console.log('swiching to municipality level');
      kommun.setStyle(styling.default);
      kommunVald.setStyle(styling.default);
      lan.setStyle(styling.clean);
      lanVald.setStyle(styling.clean);
      heatmap.setVisible(false);
    } 
    else if(level === 'heatmap')
    {
      //console.log('swiching to heatmap')
      lan.setStyle(styling.clean);
      lanVald.setStyle(styling.clean);
      kommun.setStyle(styling.clean);
      kommunVald.setStyle(styling.clean);
      heatmap.setVisible(true);
    
    }
    else
    {
      //console.log('swiching to county level');
      kommun.setStyle(styling.clean);
      kommunVald.setStyle(styling.clean);
      lan.setStyle(styling.default);
      lanVald.setStyle(styling.default);
      heatmap.setVisible(styling.clean);
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

  findFeature(featureName, layers = ['county', 'municipality'])
  {
    let found = {};
    layers.forEach(layerName => {
      let layer = this.findLayerByValue('name', layerName);
      layer.getSource().forEachFeature(function(feature)
      {
        if(found.feature) return;
        if(feature.get('name') === featureName) 
        {
          found = {
            feature: feature,
            level: layerName
          }
        }
      });
    });
    return found;

  }

  async loadValues(area, zoomResult = true) 
  {
    const resp = await api(this.state.q);
    let marks = [];
    let found = false;
    const total = resp.data.results.total;
    const parent = this;
    resp.data.results[area].forEach(fetchedRow => {
        found = this.findFeature(fetchedRow.name, [area])
        if(found.feature)
        {
          marks.push({
            feature: found.feature,
            text: fetchedRow.value.toString(),
            color: parent.colorCodeValue(total,fetchedRow.value.toString())
          });
        }
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

  handleChange(e) 
  {
    this.setState({ q: this.jobTechVaribles.getAttribute('data-location') });
    let found = {};
    found = this.findFeature(this.state.q);
    if(found.feature)
    {
      if(this.state.level === 'county') this.toggleLevel('municipality');
      this.addSelect(found.feature, found.level);
    } 
    else
    {
      console.log('can not find : ' + this.state.q);
    }
  }

  globalJobTechVariables()
  {
    this.jobTechVaribles = document.getElementById('jobTechVaribles');
    if(!this.jobTechVaribles) {
      let jobTechVaribles = document.createElement("div");
      jobTechVaribles.setAttribute('id','jobTechVaribles');
      this.jobTechVaribles = document.body.appendChild(jobTechVaribles);
    }

    this.handleChange = this.handleChange.bind(this);
    document.body.addEventListener('change', this.handleChange);
  }

  componentDidMount() 
  {
    this.globalJobTechVariables();
    const parent = this;
    const map = this.olmap;
    let hovered;

    map.setTarget('map');
    setTimeout(() => this.loadValues('county'), 2000);		

    map.on('moveend', (evt) => 
    {
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
          this.removeMark('', 'municipalitySelected');
          this.selected.municipality = new areaSelected();
          if(this.selected.county.name.length > 0)
          {
            this.setState({ q: this.selected.county.name });
          }
          parent.toggleLevel('county');

        }

    });

    map.on('pointermove', function(evt) 
    {
      if(evt.dragging) return;

      let pixel = map.getEventPixel(evt.originalEvent);
      let feature = map.forEachFeatureAtPixel(pixel, function(feature) 
      {
        if(parent.state.level === 'county' && feature.get('admin_level') === '4') {
          return feature;
        }
        if(parent.state.level === 'municipality' && feature.get('admin_level') === '7') {
          return feature;
        }

      });

      if (feature !== hovered) 
      {
        if (hovered)
        {
          layers.hover.getSource().removeFeature(hovered);
        }
        if (feature) 
        {
          feature = feature.clone();
          feature.setStyle(function(feature) 
          {
            styling.label.getText().setText(feature.get('name'));
            return [styling.label,styling.highlight];
          });
          layers.hover.getSource().addFeature(feature);
        }
        hovered = feature;
      }

    });

    map.on('click', function(evt) 
    {
      let found = false;
      map.forEachFeatureAtPixel(evt.pixel, function(feature) 
      {
        //if(found) return;
        if(feature !== undefined)
        {
          // admin_level 4 = county
          if(
              parent.selected.county.name !== feature.get('name') && 
              feature.get('admin_level') === '4' 
            ){
            if(parent.state.level === 'county')
            {
              parent.addSelect(feature, 'county');
              parent.toggleLevel('municipality');
              found = true;
            }
            else
            {
              // if we select a municipality from other county, we select that county when zooming out
              parent.addSelect(feature, 'county', false);
            }

          };

          // admin_level 7 = municipality
          if(
              parent.selected.municipality.name !== feature.get('name') && 
              feature.get('admin_level') === '7' &&
              parent.state.level === 'municipality' &&
              found !== true     
            ){
            //console.log([ feature.get('admin_level'), feature.get('name')]);
            parent.addSelect(feature, 'municipality');
            found = true;

          };
        
        }
      });

    });

  }

  shouldComponentUpdate(nextProps, nextState) 
  {
    if(this.jobTechVaribles)
    {
      if(this.jobTechVaribles.getAttribute('data-location') !== this.state.q)
      {
        this.jobTechVaribles.setAttribute('data-location', this.state.q);
      }
    }

    let center = this.olmap.getView().getCenter();
    let zoom = this.olmap.getView().getZoom();
    if(center === nextState.center && zoom === nextState.zoom) return false;
    return true;
  }
  
  addSelect(feature,type, selectIt = true) {

    feature = feature.clone();
    const selectedLayer = this.findLayerByValue('name', 'selected');
    if(this.selected[type].name.length > 0)
    {
      //select one county or municipality at the time
      this.removeMark(this.selected[type].name, 'selected');
    }
    selectedLayer.getSource().addFeature(feature);
    this.selected[type].name = feature.get('name');
    if(selectIt) this.selected[type].zoom = this.state.zoom;
    if(this.selected['municipality'].zoom === undefined) 
    {
      this.selected['municipality'].zoom = this.state.zoom;
    }
    feature.setId(this.selected[type].name);
    if(selectIt) 
    {
      this.toggleLayer(selectedLayer, true);
      let extent = feature.getGeometry().getExtent();
      this.setState(
        { 
          q: feature.get('name'),
          center: getCenter(extent), 
          extent: extent 
        }
      );
    }
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

    if(options.clear) selectedLayer.getSource().clear();
    let feature = {};
    marks.forEach(function(mark){
      feature = mark.feature.clone();
      selectedLayer.getSource().addFeature(feature);

      feature.setStyle(function() 
      {
        let fill = new Style({
          fill: new Fill({
            color: mark.color
          })
        });
        styling.label.getText().setText(mark.text);
        return [styling.circle,styling.label,fill];
      });
    });

    this.toggleLayer(selectedLayer, true);
    let extent = [];
    if(options.layerExtent) extent = selectedLayer.getSource().getExtent();
    if(!options.layerExtent) extent = feature.getGeometry().getExtent();
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
    if(featureName === '')
    {
      selectedLayer.getSource().clear();
    }
    else
    {
      const feature = selectedLayer.getSource().getFeatureById(featureName);
      selectedLayer.getSource().removeFeature(feature);
    }
  }

  findLayerByValue(key, name)
  {
    let found = {};
    this.topLayers.forEach((layer) => 
    {
      if(layer.get(key) === name) found = layer; 
    });
    return found;
  }

  toggleLayer(layer, value='') 
  {
    if(Number.isInteger(layer)) layer = this.topLayers[layer];
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
        </div>
      </div>
    );
  }
}
/*  links to toggle layers

      <ul>
        {this.topLayers.map((layer, i) => {     
          return (<li key={i}><a href="#"  onClick={e => this.toggleLayer(i)}>{layer.get('name')}</a></li>) 
        })}
      </ul>

*/ 
export default MapComponent;