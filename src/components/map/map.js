import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import {getCenter} from 'ol/extent.js';
import OlLayerTile from "ol/layer/Tile";
import OlSourceWMTS from "ol/source/WMTS";
import {Fill, Style } from 'ol/style.js';
import 'ol/ol.css';
import './custom.css';

import mapStyling from './styling';
import mapLayers from './layers';
import api from '../api/api';
import {
  colorCodeValue, 
  capitalize,
  areaSelected, 
  isElementResized,
  globalDivElement
} from './helpers'

const styling = new mapStyling();
const layers = new mapLayers();

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
      location: '',
      level: 'county',
      total: 0,
      height: '400px',
      width: 'auto'
    };

    if(this.props.height !== undefined){
      this.state.height = this.props.height;
    }
    if(this.props.width !== undefined){
      this.state.width = this.props.width;
    }

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
      layers.heatmap, 
      layers.municipality, 
      layers.municipalitySelected, 
      layers.county, 
      layers.countySelected, 
      layers.selected,
      layers.hover 
    ];
    /*
    layers.heatmap.getSource().on('addfeature', function(event) 
      {

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
        event.feature.set('weight', Math.random());  // set weight on point 0 -> 1
      }
    );
    */

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
    const duration = 1000;
    const map = this.olmap;
    if(this.state.extent.length === 4) 
    {
      map.getView().fit(
        this.state.extent, 
        {
          'size': map.getSize(), 
          'duration': duration
        } 
      );
      this.setState({ extent: ''});
    }
    else 
    {
      map.getView().animate(
        {
          center: this.state.center,
          zoom: this.state.zoom,
          duration: duration
        }
      );
    }
  }
  
  toggleLevel(level = 'county')
  {
    this.setState({ level: level });
    if(level === 'municipality')
    {
      //console.log('swiching to municipality level');
      layers.municipality.setStyle(styling.default);
      layers.municipalitySelected.setVisible(true);
      layers.county.setStyle(styling.clean);
      layers.countySelected.setVisible(false);
      layers.heatmap.setVisible(false);
      layers.selected.setVisible(true);
    } 
    else if(level === 'heatmap')
    {
      //console.log('swiching to heatmap')
      layers.county.setStyle(styling.clean);
      layers.countySelected.setVisible(false);
      layers.municipality.setStyle(styling.clean);
      layers.municipalitySelected.setVisible(false);
      layers.heatmap.setVisible(true);
      layers.hover.getSource().clear();
      layers.selected.setVisible(false);
    
    }
    else 
    {
      //console.log('swiching to county level');    
      //console.log('unselect municipality');
      this.removeMark(this.selected.municipality.name, 'selected');
      this.removeMark('', 'municipalitySelected');
      this.selected.municipality = new areaSelected();
      if(this.selected.county.name.length > 0)
      {
        let found = this.findFeature(this.selected.county.name, ['county']);
        if(found.feature) this.addSelect(found.feature,found.level,false);
        this.setState({ location: this.selected.county.name });
      }
      layers.municipality.setStyle(styling.clean);
      layers.municipalitySelected.setVisible(false);
      layers.county.setStyle(styling.default);
      layers.countySelected.setVisible(true);
      layers.heatmap.setVisible(false);
      layers.selected.setVisible(true);
    }

  }

  findFeature(featureName, layers = ['county', 'municipality'])
  {
    let found = {};
    layers.forEach(layerName => {
      let layer = this.findLayerByValue('name', layerName);
      layer.getSource().forEachFeature(function(feature)
      {
        if(found.feature) return;
        if(
          feature.get('name') === featureName || 
          feature.get('short_name') === featureName
          )  
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

  findFeatures(array, area = this.state.level)
  {
    let marks = [];
    let found = false;
    array.forEach(fetchedRow => {
      found = this.findFeature(fetchedRow.name, [area] )
      if(found.feature)
      {
        marks.push({
          feature: found.feature,
          text: fetchedRow.value.toString(),
          color: colorCodeValue(fetchedRow.value.toString())
        });
      }
    });
    if(marks.length) {
      this.addMarks(
        marks, 
        { 
          layerExtent: true, 
          layer: area + 'Selected',
          clear: true
        }
      );
    }

  }

  async loadValues(area) 
  {
    const resp = await api(this.state.q);
    if(resp.data.result !== undefined && resp.data.result[area] !== undefined)
    {
      this.setState({ total: resp.data.results.total });
      this.findFeatures(resp.data.results[area]);
    }
  }

  handleChange() 
  {
    const jtv = this.jobTechVaribles;
    if(
      jtv.getAttribute('data-location') !== undefined &&
      this.state.location !== jtv.getAttribute('data-location')
      )
    {
      let found = {};
      found = this.findFeature(jtv.getAttribute('data-location'));
      if(found.feature)
      {
        this.setState({ location: jtv.getAttribute('data-location') });
        if(this.state.level === 'county') this.toggleLevel('municipality');
        this.addSelect(found.feature, found.level);
      } 
      else
      {
        console.log('can not find : ' + this.state.location);
      }
    }
    if(
      jtv.getAttribute('data-q') !== undefined &&
      this.state.q !== jtv.getAttribute('data-q')
      )
    {
      this.setState({ q: jtv.getAttribute('data-q') });
      this.loadValues(this.state.level);
    }
    if(
      jtv.getAttribute('data-mode') !== undefined &&
      ( 
        jtv.getAttribute('data-mode') === 'heatmap' ||
        jtv.getAttribute('data-mode') === 'county' ||
        jtv.getAttribute('data-mode') === 'municipality'
      ))
    {
      this.toggleLevel(jtv.getAttribute('data-mode'));
    }
    if(
      jtv.getAttribute('data-zoom') !== undefined &&
      jtv.getAttribute('data-zoom') !== this.olmap.zoom
      )
    {
      this.setState({ zoom: jtv.getAttribute('data-zoom') });
    }
  }

  componentDidMount() 
  {
    if(isElementResized("map")) this.olmap.updateSize();
    this.jobTechVaribles = globalDivElement('jobTechVaribles');

    this.handleChange = this.handleChange.bind(this);
    document.body.addEventListener('change', this.handleChange);
    this.handleChange();
    
    if(
      this.jobTechVaribles.getAttribute('mode') === 'heatmap' ||
      this.props.mode === 'heatmap'
      ){
        this.toggleLevel('heatmap');
      } 
    const that = this;
    const map = this.olmap;
    let hovered;

    map.setTarget('map');

    map.on('rendercomplete', (evt) => 
    {
      let zoom = map.getView().getZoom();
      that.setState({ zoom });
    });

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
          that.toggleLevel('county');

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
          that.toggleLevel('county');

        }

    });

    map.on('pointermove', function(evt) 
    {
      if(evt.dragging) return;

      let pixel = map.getEventPixel(evt.originalEvent);
      let feature = map.forEachFeatureAtPixel(pixel, function(feature) 
      {
        if(that.state.level === 'county' && feature.get('admin_level') === '4') {
          return feature;
        }
        if(that.state.level === 'municipality' && feature.get('admin_level') === '7') {
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
            styling.labelLower.getText().setText(feature.get('name'));
            return [styling.labelLower,styling.highlight];
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
          if(feature.get('admin_level') === '4' )
          {
            if(that.state.level === 'county')
            {
              that.addSelect(feature, 'county');
              that.toggleLevel('municipality');
              found = true;
            }
            else
            {
              // if we select a municipality from other county, we select that county when zooming out
              if(that.selected.county.name !== feature.get('name'))
              {
                that.addSelect(feature, 'county', false);
              }
            }

          };

          // admin_level 7 = municipality
          if(
              that.selected.municipality.name !== feature.get('name') && 
              feature.get('admin_level') === '7' &&
              that.state.level === 'municipality' &&
              found !== true     
            ){
            //console.log([ feature.get('admin_level'), feature.get('name')]);
            that.addSelect(feature, 'municipality');
            found = true;

          };
        
        }
      });

    });

  }

  shouldComponentUpdate(nextProps, nextState) 
  {
    if(nextState.level !== "heatmap")
    {
      const that = this;
      setTimeout(function(){
        if(isElementResized("map"))
        {
          that.olmap.updateSize();
        }
      },300);
    }
    if(nextProps.MapData)
    {
      if(nextProps.mapData.total !== this.state.total)
      {
        nextState.total = nextProps.mapData.total ;
        this.findFeatures(this.props.MapData.result);
      }
    }

    if(
      nextProps.location !== undefined &&  
      nextProps.location !== this.state.location
      )
    {
      nextState.location = nextProps.location;
      //console.log('finding location : ' + nextProps.location);
      if(nextProps.location.length < 2)
      {

        this.olmap.getView().animate(
          {
            center: [
              process.env.REACT_APP_MAP_START_LON , 
              process.env.REACT_APP_MAP_START_LAT 
            ],
            zoom: process.env.REACT_APP_MAP_START_ZOOM,
            duration: 1000
          }
        );
  
        this.selected = 
        {
          county: new areaSelected(),
          municipality: new areaSelected()
        };
        this.removeMark('','selected');

      }
      let found = this.findFeature(nextProps.location);
      if(found.feature) 
      {
        //console.log(['location found', found]);
        nextState.extent = found.feature.getGeometry().getExtent();
        this.addSelect(found.feature, found.level);

      }
    }

    if(this.jobTechVaribles)
    {
      // If the jobTechVaribles is not the same as the map, update them
      const jvt = this.jobTechVaribles;
      if(jvt.getAttribute('data-location') !== nextState.location)
      {
        jvt.setAttribute('data-location', nextState.location);
      }
      if(jvt.getAttribute('data-q') !== nextState.q)
      {
        jvt.setAttribute('data-q', nextState.q);
      }
      if(jvt.getAttribute('data-zoom') !== nextState.zoom)
      {
        jvt.setAttribute('data-zoom', nextState.zoom);
      }
    }

    if(
      nextState.location !== undefined && 
      nextState.location !== null  && 
      nextState.location !== "null"  && 
      nextState.location !== this.state.location &&
      nextState.location.length > 1)
    {
      //Pass location out of comp this.props.setLocationAndFetch(nextState.location);
    }

    if(nextState.level !== this.state.level) return true;

    return false;
  }
  
  addSelect(feature,type, selectIt = true) {
    if(this.selected[type].name.length > 0 &&
      feature.get('name') !== this.selected[type].name)
    {
      //select one county or municipality at the time
      this.removeMark(this.selected[type].name, 'selected');
    }
    feature = feature.clone();
    layers.selected.getSource().addFeature(feature);

    if(type === 'county')
    {
      this.selected[type].name = feature.get('name');
    }
    else 
    {    
      feature.setStyle([
        styling.highlight, 
        styling.selected
      ]);
      this.selected[type].name = feature.get('short_name');
    }
    if(selectIt) this.selected[type].zoom = this.state.zoom;
    if(this.selected['municipality'].zoom === undefined) 
    {
      this.selected['municipality'].zoom = this.state.zoom;
    }
    feature.setId(this.selected[type].name);
    if(selectIt) 
    {
      this.toggleLevel(type);
      let extent = feature.getGeometry().getExtent();
      this.setState(
        { 
          location: feature.get('name'),
          center: getCenter(extent), 
          extent: extent 
        }
      );
    }
    this.updateMap();

  }

  addMarks(marks, opt) 
  {
    const standardsOpt = {
      layerExtent: false,
      layer: '',
      clear: false,
      zoomResult: false,
    } 
    let options = Object.assign(standardsOpt, opt);
    if(this.state.level === 'county') options.zoomResult = true;
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
        styling.labelUpper.getText().setText(mark.text);
        return [styling.circle,styling.labelUpper,fill];
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
    let areaLevelIsCounty = true;
    if (this.state.level  !== 'county') areaLevelIsCounty = false;
    return (
        <div id="map" style={{ width: this.state.width, height: this.state.height }}>
          <ul>
            <li>
              <button 
                className={`ui button ${areaLevelIsCounty ? 'selected' : ''}` } 
                onClick={e => this.toggleLevel('county')}>
                  Län
              </button>
            </li>
            <li>
              <button 
                className={`ui button ${areaLevelIsCounty ? '' : 'selected'}` } 
                onClick={e => this.toggleLevel('municipality')}>
                  Kommun
              </button>
            </li>
          </ul>
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