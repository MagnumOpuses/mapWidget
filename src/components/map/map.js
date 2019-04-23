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
import {Fill, Stroke, Style, Text} from 'ol/style.js';
import 'ol/ol.css';

class MapComponent extends Component 
{
  constructor(props) 
  {
    super(props);

    let blur = 10;
    let radius = 5;
    this.state = 
    { 
      center: [1692777, 8226038], 
      zoom: 5 , 
      extent: []
    };
    this.selected = 
    {
      lan: {
        zoom: 0,
        name: '',
  
      },
      kommun: {
        zoom: 0,
        name: '',
      }
    };
    
    const layer = 'https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/token/e8b5802b-17ee-310c-a4ad-d8c1955fb315/';
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
        name: 'framtid',
        visible: false,
        zIndex: 10,
        blur: parseInt(blur),
        radius: parseInt(radius),
        opacity: 0.8,
        gradient: ['#BDBDBD', '#BDBDBD', '#A6F3ED', '#A6F3ED', '#02DECC'], //['#D9FAF7', '#D9FAF7', '#A6F3ED', '#50E8DB', '#02DECC'], //
      }
    );

    const laenLayer = new OlVectorLayer(
      {
        source: new OlVectorSource(
          {
            url: '/laen-kustlinjer.geo.json',
            format: new GeoJSON()
          }),
        name: 'Län',
        zIndex: 20
        /*
        style: function(feature) {
          style.getText().setText(feature.get('name'));
          return style;
        }
        */
      }
    );

    const kommunerLayer = new OlVectorLayer(
      {
        source: new OlVectorSource(
          {
            url: '/kommuner-kustlinjer.geo.json',
            format: new GeoJSON()
          }
        ),
        name: 'Kommuner',
        zIndex: 30,
        visible: false,
        style: function(feature) 
        {
          style.getText().setText(feature.get('name'));
          return style;
        }
      }
    );

    const selectedOverlay = new OlVectorLayer(
      {
      source: new OlVectorSource(),
      map: this.olmap,
      name: 'selected',
      zIndex: 1,
      visible: false,
      style: function(feature) 
      {
        selectedStyle.getText().setText(feature.get('name'));
        return selectedStyle;
      }
    });


    const groundLayers = [ LmMap ];
    this.topLayers = [ selectedOverlay, Heatmap, kommunerLayer, laenLayer ];

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
            zoom: this.state.zoom
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
  
  toggleLevel(level)
  {
    const k = this.findLayerByValue('name', 'Kommuner');
    const l = this.findLayerByValue('name', 'Län');

    if(level === 'Kommun')
    {
      k.setVisible(true);
      l.setVisible(false);
      //console.log('swiched to kommun level');
    } 
    else
    {
      k.setVisible(false);
      l.setVisible(true);
      //console.log('swiched to län level');

    }
  }

  componentDidMount() 
  {
    const parent = this;
    const map = this.olmap;
    map.setTarget('map');

    // Listen to map changes
    map.on('moveend', (evt) => 
    {
      let center = map.getView().getCenter();
      let zoom = map.getView().getZoom();
      this.setState({ center, zoom });
      // remove selected on zoom out
        if(this.selected.lan.zoom !== 0 && this.selected.lan.zoom > this.state.zoom +1 ) {
          //console.log('unselect län');

          this.removeMark('lan');
          this.selected.lan = 
          {
            zoom: 0,
            name: '',
          }
          parent.toggleLevel();
        }
        if(this.selected.kommun.zoom !== 0 && this.selected.kommun.zoom > this.state.zoom) {
          //console.log('unselect kommun');

          this.removeMark('kommun');
          this.selected.kommun = 
          {
            zoom: 0,
            name: '',
          }
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

          //TODO: add number from external source to selection
          // admin_level 4 = län
          if(parent.selected.lan.feature !== feature && feature.get('admin_level') == 4){
            parent.toggleLevel('Kommun');
            setTimeout(function(){ parent.selected.lan.zoom = parent.state.zoom }, 1300);
            parent.addMark(feature, feature.get('name'),'lan');
          };
          // admin_level 7 = kommun
          if(parent.selected.kommun.feature !== feature && feature.get('admin_level') == 7){
            setTimeout(function(){ parent.selected.kommun.zoom = parent.state.zoom }, 1300);
            parent.addMark(feature, feature.get('name'),'kommun');
          };
        
        }
      });

    });

    let hover;
    const hoverFunc = function(pixel,type = 'hover') 
    {
      const feature = map.forEachFeatureAtPixel(pixel, function(feature) 
      {
        return feature;
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
      zIndex:1,
      style: function(feature) 
      {
        highlightStyle.getText().setText(feature.get('name'));
        return highlightStyle;
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

  addMark(feature, text, id='selected', layerExtent = false) 
  {
    const selectedLayer = this.findLayerByValue('name', 'selected');
    selectedLayer.getSource().addFeature(feature);
    this.toggleLayer(selectedLayer, true);
    let extent = [];
    if (layerExtent) 
    {
      extent = selectedLayer.getSource().getExtent();
    }
    if(!layerExtent)
    {
      extent = feature.getGeometry().getExtent();
    }

    this.setState(
      { 
        center: getCenter(extent), 
        extent: extent 
      }
    );

    feature.setStyle(function(feature) 
    {
      selectedStyle.getText().setText(text);
      return selectedStyle;
    });
    feature.setId(id);

    this.selected.name = feature.get('name');
  }

  removeMark(featureName, option) 
  {
    const selectedLayer = this.findLayerByValue('name', 'selected');
    const feature = selectedLayer.getSource().getFeatureById(featureName);
    feature.setStyle(style);
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

var style = new Style(
  {
  fill: new Fill(
    {
      color: 'rgba(255, 255, 255, 0.2)'
    }
  ),
  stroke: new Stroke(
    {
      color: '#319FD3',
      width: 1
    }
  ),
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

var highlightStyle = new Style(
  {
  stroke: new Stroke(
    {
      color: '#f00',
      width: 4
    }
  ),
  fill: new Fill(
    {
      color: 'rgba(255,0,0,0.5)'
    }
  ),
  text: new Text(
    {
    font: 'bold 12px Calibri,sans-serif',
    fill: new Fill(
      {
        color: '#000'
      }
    )
  })
});

var selectedStyle = new Style(
  {
  stroke: new Stroke(
    {
      color: '#0f0',
      width: 5
    }
  ),
  fill: new Fill(
    {
      color: 'rgba(0,200,0,0.6)'
    }
  ),
  text: new Text(
    {
      font: 'bold 16px Calibri,sans-serif',
      fill: new Fill(
        {
          color: '#000'
        }
      ),
      stroke: new Stroke(
        {
          color: '#fff',
          width: 1
        }
      )
    }
  )
});