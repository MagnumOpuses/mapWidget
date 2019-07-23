import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MapComponent from './components/map/map';
import * as serviceWorker from './serviceWorker';

let mapData = 
{
  result: 
  [
    { 
      "name": 'Stockholms län',
      "value": 50
    },
    { 
      "name": 'Nacka',
      "value": 25
    },
    {
      "name": "Botkyrka",
      "value": 25
    }
  ],
  total: 111
}

ReactDOM.render(
<MapComponent 
  //mapData={mapData}
  mode="heatmap"
  heatmapBlur="20"
  heatmapRadius="20"
  heatmapGradient="#00f, #0ff, #0f0, #ff0, #f00"
  heatmapSource="/map.geojson"
  />, 
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
