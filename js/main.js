// Add all scripts to the JS folder
/* Map of GeoJSON data from MegaCities.geojson */
//declare vars in global scope
var map;
var dataStats = {};  
var all = true
var five = false
var ten = false
var forty = false


//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [37, -98],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
        maxZoom: 6,
        minZoom: 3
    }).addTo(map);
    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain_lines/{z}/{x}/{y}{r}.png', {
	    minZoom: 3,
    	maxZoom: 6,
	    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

       //call getData function
    getData();
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 4;
    //Flannery Appearance Compensation formula (my minimum value = 1)
    var radius = 1.0083 * Math.pow(attValue,0.5715) * minRadius
    
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];

    //create marker options
    var options = {
        weight: .75,
        opacity: 1,
        fillOpacity: 0.75,
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    if (attValue >= 1) {
        options.radius = calcPropRadius(attValue);
        options.fillColor = "#009900";
        options.color = "#000"

    } else {
        options.radius = calcPropRadius(1);
        options.fillColor = "#fff";
        options.color = "#000"

    };


    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var popupContent = createPopupContent(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });
    
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
    
};

//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Create sequence controls
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            //add label
            container.insertAdjacentHTML('beforeend', '<h3>Sequence by month</h3> </button>'); 
            
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">');
            container.querySelector(".range-slider").max = 11;
            container.querySelector(".range-slider").min = 0;
            container.querySelector(".range-slider").value = 0;
            container.querySelector(".range-slider").step = 1;

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward"><img src="img/forward.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    //click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
    
        step.addEventListener("click", function(){
        var index = document.querySelector('.range-slider').value;
            
        //Step 6: increment or decrement depending on button clicked
        if (step.id == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
        } else if (step.id == 'reverse'){
           index--;
           //Step 7: if past the first attribute, wrap around to last attribute
           index = index < 0 ? 11 : index;
       };
            
        //Step 8: update slider
        document.querySelector('.range-slider').value = index;
        updatePropSymbols(attributes[index]);        
        })
        
    
    })
            
    //input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        var index = this.value;
        updatePropSymbols(attributes[index]);    
    });

};                        

//create filter controls
function filterControls(attributes){
    var FiltControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'filter-container');

            //add label
            container.insertAdjacentHTML('beforeend', '<h3>Filter by number of Earthquakes</h3> </button>'); 

            //add filter buttons
            container.insertAdjacentHTML('beforeend', '<button class="freq" id="all"> <h4> <span class="filt1"><img src="img/click_.png"></span> all counts </h4> </button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="freq" id="5"> <h4> <span class="filt2"><img src="img/unclick_.png"></span> 5 or more  </h4> </button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="freq" id="10"> <h4> <span class="filt3"><img src="img/unclick_.png"></span> 10 or more </h4> </button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="freq" id="40"> <h4> <span class="filt4"><img src="img/unclick_.png"></span> 40 or more </h4> </button>'); 


            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new FiltControl());

    //click listener for buttons
    document.querySelectorAll('.freq').forEach(function(step){
    
        step.addEventListener("click", function(){
            
        //adjust filtering/resymbolization
        if (step.id == 'all'){
            all = true,
            five = false,
            ten = false,
            forty = false,
            document.querySelector("span.filt1").innerHTML =  '<img src="img/click_.png">',
            document.querySelector("span.filt2").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt3").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt4").innerHTML =  '<img src="img/unclick_.png">'

        } else if (step.id == '5'){
            all = false,
            five = true,
            ten = false,
            forty = false,
            document.querySelector("span.filt1").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt2").innerHTML =  '<img src="img/click_.png">',
            document.querySelector("span.filt3").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt4").innerHTML =  '<img src="img/unclick_.png">'

        } else if (step.id == '10'){
            all = false,
            five = false,
            ten = true,
            forty = false,
            document.querySelector("span.filt1").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt2").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt3").innerHTML =  '<img src="img/click_.png">',
            document.querySelector("span.filt4").innerHTML =  '<img src="img/unclick_.png">'

        } else if (step.id == '40'){
            all = false,
            five = false,
            ten = false,
            forty = true,
            document.querySelector("span.filt1").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt2").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt3").innerHTML =  '<img src="img/unclick_.png">',
            document.querySelector("span.filt4").innerHTML =  '<img src="img/click_.png">'
        };
        console.log(all, five, ten, forty);
        updatePropSymbols(attributes[document.querySelector('.range-slider').value])
        });

    })
};

//update the proportional symbols
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        //had to emit "&& layer.feature.properties[attribute]" because several of my values were needed to be zero
        if (layer.feature){
            //access feature properties
            var props = layer.feature.properties;


            //update each feature's symbol based on new attribute values
            if (all == true){
                if (props[attribute] >= 1) {
                    layer.setRadius(calcPropRadius(props[attribute])).setStyle({fillColor: "#009900"}).setStyle({color: "#000"}).setStyle({opacity: 1}).setStyle({fillOpacity: .75});
                } else {
                    layer.setRadius(calcPropRadius(1)).setStyle({fillColor: "#fff"}).setStyle({color: "#000"}).setStyle({opacity: 1}).setStyle({fillOpacity: .75});            };
    
            } else if (five == true) {
                if (props[attribute] >= 5) {
                    layer.setRadius(calcPropRadius(props[attribute])).setStyle({fillColor: "#009900"}).setStyle({color: "#000"}).setStyle({opacity: 1}).setStyle({fillOpacity: .75});
                } else {
                    layer.setRadius(calcPropRadius(1)).setStyle({opacity: 0}).setStyle({fillOpacity: 0});            };
                
            } else if (ten == true){
                if (props[attribute] >= 10) {
                    layer.setRadius(calcPropRadius(props[attribute])).setStyle({fillColor: "#009900"}).setStyle({color: "#000"}).setStyle({opacity: 1}).setStyle({fillOpacity: .75});
                } else {
                    layer.setRadius(calcPropRadius(1)).setStyle({opacity: 0}).setStyle({fillOpacity: 0});            };
                
            } else if (forty == true){
                if (props[attribute] >= 40) {
                    layer.setRadius(calcPropRadius(props[attribute])).setStyle({fillColor: "#009900"}).setStyle({color: "#000"}).setStyle({opacity: 1}).setStyle({fillOpacity: .75});
                } else {
                    layer.setRadius(calcPropRadius(1)).setStyle({opacity: 0}).setStyle({fillOpacity: 0});            };
                
            };


            //update popup content     
            var popupContent = createPopupContent(props, attribute);        
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
    document.querySelector("span.month").innerHTML = attribute.split("_")[1];

};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("mon_") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//generate popup content
function createPopupContent(properties, attribute){
    //add city to popup content string
    var popupContent = "<p><b>State:</b> " + properties.name + "</p>";

    //add formatted attribute to panel content string
    var month = attribute.split("_")[1];
    popupContent += "<p><b>Earthquakes during " + month + " 2023:</b> " + properties[attribute] + "</p>";

    return popupContent;
};

//calculate max/mean values
function calcStats(data){
    //create empty array to store all data values
    var allValues = []; 
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    //loop through each city
    for(var state of data.features){
        //loop through each year
        for(var month = 0; month <= 11; month+=1){
              //get population for current year
              var value = state.properties["mon_"+ String(months[month])];
              //add value to array (ignoring all 0 values)
              if (value > 0){
                allValues.push(value);
              }
            };
    }
    //get max, mean stats for our array (not calculating min, because actual min = 0; but I need min to act as 1 for legend)
    dataStats.min = 1;
    
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/allValues.length;
};

//construct legend
function createLegend(){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particSular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.innerHTML = '<h2 class="temporalLegend">2.5+ magnitude earthquakes in <span class="month">January</span> 2023</h2>';

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="130px">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];
            //Step 2: loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){

                //Step 3: assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);
                //console.log(radius);
                var cy = 110 - radius;  

                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#009900" fill-opacity="0.8" stroke="#000000" cx="65"/>';  
        
                //evenly space out labels            
                var textY = i * 40 + 25;         

                //text string            
                svg += '<text class = "circleText" id="' + circles[i] + '-text" x="125" y="' + textY + '">' + Math.round(dataStats[circles[i]]) + '</text>';

            };  
            
            //add zero value to legend
            var rad = calcPropRadius(1)
            cy_ = 129 - rad
            svg += '<circle class="legend-circle" id="zero" r="' + rad + '"cy="' + cy_ + '" fill="#fff" fill-opacity="0.8" stroke="#000000" cx="65"/>';  
            svg += '<text class = "circleText" id="zero -text" x="125" y="129">Zero</text>';


            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.innerHTML += svg;

            return container;
            
        }
    });

    //create title
    var Title = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function () {
            var titleContainer = L.DomUtil.create('div', 'titleBox');
            titleContainer.innerHTML = '<h1 class="title">2.5+ Magnitude Earthquakes per US Contiguous State by Month in 2023</h1>';
        
            return titleContainer;

        }

    });

    map.addControl(new Title());
    map.addControl(new LegendControl());
};

//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/EQdata.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
           var attributes = processData(json);
           createPropSymbols(json, attributes);
           createSequenceControls(attributes);
           calcStats(json);
           createLegend();
           filterControls(attributes)
        })
};

document.addEventListener('DOMContentLoaded',createMap);
