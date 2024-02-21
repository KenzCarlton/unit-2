//L.map creates a map object; setView assigns opening location and zoom to map
var map = L.map('map').setView([51.505, -0.09], 13);

//L.tilelayer adds a tile layer; .addTo actually adds the object to the map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//L.marker creates a marker object at the given coordinates
var marker = L.marker([51.5, -0.09]).addTo(map);

//L.circle creates a circular object at the given coordinates with the given radius
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

//L.polygon creates a polygonal object with the given coordinates as corners
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//.bindPopup assigns a popup to an object; .openPopup opens the popup upon starting the map
//3 popups (click object on map to show)
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

//.setLatLng sets the lat/long coordinates for an object
//.setContent assigns the HTML content fo the overlay
//.openOn assigns the overlay to the given map
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

//onMapClick activates when the mouse is clicked
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

//.on adds a listener to the given event type
map.on('click', onMapClick);

//L.popup creats a popup
var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick);