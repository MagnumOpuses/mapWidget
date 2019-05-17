import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MapComponent from './components/map/map';
import * as serviceWorker from './serviceWorker';

let mapData = {
  result: [
    { 
      "name": 'Stockholms län',
      "value": 50
    }
  ],
  total: 111

}


ReactDOM.render(<MapComponent mapData={mapData}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
