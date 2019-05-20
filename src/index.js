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
      "name": 'Nacka kommun',
      "value": 50
    }
  ],
  total: 111
}
let mode = 'heatmap';


ReactDOM.render(<MapComponent mode={mode}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
