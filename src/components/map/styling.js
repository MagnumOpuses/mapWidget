import {Fill, Stroke, Style, Text, Circle as CircleStyle,} from 'ol/style.js';

class mapstyling 
{
  circle = new Style({
    image: new CircleStyle({
      radius: 12,
      stroke: new Stroke(
        {
          color: '#000',
          width: 1
        }
      ),
      fill: new Fill({
        color: '#FFF'
      })
    }),
    geometry: function(feature){
      let retPoint;
      if (feature.getGeometry().getType() === 'MultiPolygon') {
        retPoint =  feature.getGeometry().getPolygon(0).getInteriorPoint();
      } else if (feature.getGeometry().getType() === 'Polygon') {
        retPoint = feature.getGeometry().getInteriorPoint();
      }
      return retPoint;
    }
  })

  label = new Style({
    geometry: function(feature){
      let retPoint;
      if (feature.getGeometry().getType() === 'MultiPolygon') {
        retPoint =  feature.getGeometry().getPolygon(0);
      } else if (feature.getGeometry().getType() === 'Polygon') {
        retPoint = feature.getGeometry();
      }
      return retPoint;
    },
    text: new Text(
      {
      font: 'bold 12px Calibri,sans-serif',
      overflow: true,
      placement : "point",
      fill: new Fill(
        {
          color: '#000'
        }
      ),
      stroke: new Stroke(
        {
          color: '#ccc',
          width: 2
        }
      )
      })
  });

  default = new Style(
    {
    fill: new Fill(
      {
        color: 'rgba(236,241,240, 0.4)'
      }
    ),
    stroke: new Stroke(
      {
        color: '#333',
        width: 1
      }
    )
  });

  highlight = new Style(
    {
    stroke: new Stroke(
      {
        color: '#000',
        width: 2
      }
    ),
    fill: new Fill(
      {
        color: 'rgba(255,249,224,0.5)'
      }
    ),
    text: new Text(
      {
      font: 'bold 12px Calibri,sans-serif',
      overflow: true,
      fill: new Fill(
        {
          color: '#000'
        }
      ),
    })
  });

  selected = new Style(
    {
    stroke: new Stroke(
      {
        color: '#333',
        width: 5
      }
    ),
    fill: new Fill(
      {
        color: 'rgba(236,241,240, 0.4)'
      }
    )
  });
}

export default mapstyling;