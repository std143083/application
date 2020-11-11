import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import React from 'react';
import ReactDOM from 'react-dom'
import Firebase from "firebase";
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

//Create a map and assign it to the map div
var leafletMap = L.map('leafletMapid').setView([38, 25],7.4);
var poi =[]
// Initialize Firebase
const app = Firebase.initializeApp({
  apiKey: "AIzaSyBOzpkUDD61IxxhMLqK-jslH8-c5_u7ry4",
  authDomain: "sdy-ergasia1-meros4-map.firebaseapp.com",
  databaseURL: "https://sdy-ergasia1-meros4-map.firebaseio.com",
  projectId: "sdy-ergasia1-meros4-map",
  storageBucket: "sdy-ergasia1-meros4-map.appspot.com",
  messagingSenderId: "1001478847853",
  appId: "1:1001478847853:web:727e851f9acbc3ea7cae64"
});
const db = app.database();
db.ref().on('value', querySnapShot => {  
  let data = querySnapShot.val() ? querySnapShot.val() : null;
  if(data){
    poi=data[Object.keys(data)[0]].mappoints
    poi.forEach(point=>{
      L.marker([point.lat, point.lng]).addTo(leafletMap).on('click', () =>{
        ReactDOM.render(<MyForm name={point} onUpdateElement={(elem) =>{
          poi.forEach((item) => { 
            if(item.lat==elem.lat && item.lng==elem.lng) item.location=elem.location
          })
        }} />, document.getElementById('form'))
        document.getElementById('form').style.display = "block"
        document.getElementById('leafletMapid').style.opacity = 0.6
      })   
    })
  }
  leafletMap.locate();
  leafletMap.on('locationfound', (e)=>{
    leafletMap.setView([e.latitude,e.longitude],12)
    var radius = 10000;
    L.marker(e.latlng).addTo(leafletMap).on('click', (props) =>{
      poi.forEach((item) => {    
        if(JSON.stringify(item) === JSON.stringify(props.latlng)){
          ReactDOM.render(<MyForm name={item} onUpdateElement={(elem) =>{
            poi.forEach((item) => {
              if(item.lat==elem.lat && item.lng==elem.lng) item.location=elem.location
            })
          }} />, document.getElementById('form'))
          document.getElementById('form').style.display = "block"
          document.getElementById('leafletMapid').style.opacity = 0.6
        }
      })  
    })
    .bindPopup((props)=> {
      // console.log(props)
      props._latlng.location=''
      poi.push(props._latlng)
      return '<h3>Latitude:</h3>'+props._latlng.lat+'<h3>Longitude:</h3>'+props._latlng.lng
    })
    .openPopup()
    .unbindPopup();
    L.circle(e.latlng, radius).addTo(leafletMap);

    leafletMap.eachLayer((layer) => {
      if(layer._latlng){
        if(distance(layer._latlng.lat, layer._latlng.lng, e.latitude, e.longitude) >10) layer.remove()
      }      
    });
  });
});
// Haversine formula
function distance (lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}



//  Add a baselayer 
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 20
}).addTo(leafletMap);

    
// add a layer group, yet empty
var markersLayer = new L.LayerGroup();  
leafletMap.addLayer(markersLayer);

// click handler on map
leafletMap.on('click', function (e){
  if (window.getComputedStyle(document.getElementById("form")).display === "block") {
    document.getElementById('form').style.display = "none"
    document.getElementById('leafletMapid').style.opacity = 1
  } else {
    L.marker(e.latlng).addTo(leafletMap)
    .on('click', (props) =>{
      poi.forEach((item) => {    
        if(JSON.stringify(item) === JSON.stringify(props.latlng)){
          ReactDOM.render(<MyForm name={item} onUpdateElement={(elem) =>{
            poi.forEach((item) => {
              if(item.lat==elem.lat && item.lng==elem.lng) item.location=elem.location
            })
          }} />, document.getElementById('form'))
          document.getElementById('form').style.display = "block"
          document.getElementById('leafletMapid').style.opacity = 0.6
        }
      })  
    })
    .bindPopup((props)=> {
      // console.log(props)
      props._latlng.location=''
      poi.push(props._latlng)
      return '<h3>Latitude:</h3>'+props._latlng.lat+'<h3>Longitude:</h3>'+props._latlng.lng
    })
    .openPopup()
    .unbindPopup();
  }
 
});

// implemantation of search addresses
const searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    showPopup: true,
    style: 'bar',
    searchLabel: 'Εισάγετε Διεύθυνση',
    notFoundMessage:'Δεν βρέθηκε η τοποθεσία'
  });
leafletMap.addControl(searchControl);

// implementation of pop up form
class MyForm extends React.Component {

  constructor() {
    super();
    this.state = {element : {lat: '', lng: '', location: '' }}
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange = (e) =>{
    e.persist();
    this.setState(prevState => ({ ...prevState, element: { ...prevState.element, location: e.target.value}}))
    
  }
  saveToDatabase = ()=>{
    db.ref('/').remove()
    db.ref('/').push({mappoints: poi});
  }
  componentDidMount () {this.setState({element: this.props.name});}

  componentDidUpdate () {
    if(this.state.element.lat != this.props.name.lat && this.state.element.lng != this.props.name.lng) this.setState({element: this.props.name});
    this.props.onUpdateElement(this.state.element);
  }
  
  render() {
    return <div className="form-wrapper">
      <h3>Latitude:</h3>{this.state.element.lat}<h3>Longtitude:</h3>{this.state.element.lng}
      <form>
      <div className="form-element"><TextField id="standard-basic" label="Location" name="location" value={this.state.element.location} onChange={this.handleChange}/></div>
      <div className="form-element"><Button variant="contained" color="primary" onClick={this.saveToDatabase}> Save to database</Button></div>
      </form>
      </div>;
  }
}