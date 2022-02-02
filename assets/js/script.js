let searchEntry = document.getElementById('city-search-input');
let searchResults = document.getElementById('cities-list');
let routeList = document.querySelector('.route-list');
// let chosenPub; - may not need this
let chosenLocation;
let mapStartLat; 
let mapStartLong;
let marker;
let map;
let source = turf.featureCollection([]);
let apiKeyMap = 'pk.eyJ1IjoiYmVuZm9rIiwiYSI6ImNrejBibzE4bDFhbzgyd213YXE3Ynp1MjAifQ.fbuWSwdUyN9SNuaJS_KLnw';
let markerCounter = 0;

// function API call to return 5 search results for location entered
let getCities = function(searchEntry) {
    let apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${searchEntry}&limit=5&appid=feb08a39587f398b12842fe3303816d6`;
    // console.log(apiUrl);   
    fetch(apiUrl)
        .then(function(response){
            if (!response.ok) {
                // currently an alert - need to change this
                alert('Error: ' + response.statusText);
                } 
            return response.json();    
        })
        .then(function (data){
            // console.log(data);
            renderResults(data);
            })
        .catch(function (error) {
            // need to change alert for something else
            console.log(error);
            alert('Unable to connect to OpenWeatherMap.org');
        });
    };

    // render up to 5 locations to the user
    let renderResults = function(data){
        // clear the search results
        clearSearch();
        // if no results returned display a message
        let str = '';
        if (data.length === 0) {
            let listEl = `<li class="city-option locations">No Results - Please Search Again</li>`;
            str += listEl;
        // if results are displayed render them to the page and include the lat and long data to pass into the location API call
        } else {
            for (i=0; i < data.length; i++) {
                let listEL = `<li class="city-option locations" data-lat="${data[i].lat}" data-long="${data[i].lon}">${data[i].name}, ${data[i].state} (${data[i].country})</li>`;
                str += listEL;
            };
        }
        // add cities as a list
        searchResults.innerHTML += str;
        // activate event listeners on the newly created <li>s
        localeSelect();
    };

    // clear search results after selection
    let clearSearch = function(){
    searchResults.innerHTML = '<li class="city-option my-location">Use My Current Location</li>';        
    };

    // when location is selected, run get breweries API
    let localeSelect = function(){
        let locales = document.querySelectorAll('.locations')
    
        locales.forEach(function(locale){
            locale.addEventListener('click', function(){
            mapStartLat = locale.dataset.lat;
            mapStartLong = locale.dataset.long;
            clearSearch();
            chosenLocation = locale;
            getPubs(locale);
            });
        });
    };



    // map pub on click - possibly redundant code
    // let mapPub = function(){
    //     let clickedBrewery = document.querySelectorAll('.brewery-list');
    //     clickedBrewery.forEach(function(brewery){
    //         brewery.addEventListener('click', function(){
    //         chosenPub = brewery;
    //         console.dir(chosenPub);
    //         mapStartLat = brewery.dataset.lat;
    //         mapStartLong = brewery.dataset.long;
    //         renderMap();
    //         });
    //     });
    // };

    // return closest breweries to location selected - 20 results by default
    let getPubs = function(locale){
        let apiKey = 'ec770931d96f478da03865c1cf963f8b';
        let lat = locale.dataset.lat;
        let long = locale.dataset.long;
        let types = 'catering.pub,catering.bar,catering.biergarten';
        let limit = 25;
        let radius = 5000;
        let apiUrl = `https://api.geoapify.com/v2/places?categories=${types}&filter=circle:${long},${lat},${radius}&bias=proximity:${long},${lat}&limit=${limit}&apiKey=${apiKey}`;
        // console.log(apiUrl);   
        fetch(apiUrl)
            .then(function(response){
                if (!response.ok) {
                    // need to change alert for something else
                    alert('Error: ' + response.statusText);
                    } 
                return response.json();    
            })
            .then(function (data){
                // console.log(data);
                showPubs(data);
                renderMap(data);
                })
            .catch(function (error) {
                // need to change alert for something else
                console.log(error);
                alert('Unable to connect');
            });
        };

    // render the breweries to the page ordered by distance (default ascending)
    let showPubs = function(data){
        let searchResults = document.getElementById('local-results-list');
        // clear the search results
        searchResults.innerHTML = '';
        // if no results returned display a message
        let str = '';
        if (data.features.length === 0) {
            let listEl = `<li class="brewery-list">No Results - Please Select A Different Location</li>`;
            str += listEl;
        // if results are displayed render them to the page and include the lat and long data to pass into the weather API call
        } else {
            for (i=0; i < data.features.length; i++) {
                let listEL = `<li class="brewery-list" data-lat="${data.features[i].geometry.coordinates[1]}" data-long="${data.features[i].geometry.coordinates[0]}" data-id="${data.features[i].properties.place_id}"><span class="brewery-name">${data.features[i].properties.name}</span><br/><span class="brewery-address">${data.features[i].properties.street}</span></li>`;
                str += listEL;
            };
        }
        // add breweries as a list
        searchResults.innerHTML += str;
        // need to add function to activate event listeners on the newly created <li>s for mapping
        // mapPub();
    };

    // event listener for the search button
    document.getElementById('search-btn').addEventListener('click', function(event){
        event.preventDefault();
        // handle blank search
        if (searchEntry.value === '') {
            alert('Please enter a location into the search box');
        } else {
        // run API to return results
        getCities(searchEntry.value);
        }
    });

    // code for map display
let renderMap = function(data){
    // remove old map if existing
    document.getElementById('map').innerHTML = '';
    map = undefined;

    mapboxgl.accessToken = apiKeyMap;
    map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [mapStartLong, mapStartLat], // starting position [lng, lat]
        zoom: 13 // starting zoom
    });
    
    //adds controls to map
    map.addControl(new mapboxgl.NavigationControl());

    // adds markers with popups and buttons
    for (i = 0; i < data.features.length; i++) {
        let lat = data.features[i].geometry.coordinates[1];
        let long = data.features[i].geometry.coordinates[0];
        // add data for creating <li> elements as a data attribute
        let listEL = `<li class="brewery-list" data-lat="${data.features[i].geometry.coordinates[1]}" data-long="${data.features[i].geometry.coordinates[0]}" data-id="${data.features[i].properties.place_id}"><span class="brewery-name">${data.features[i].properties.name}</span><br/><span class="brewery-address">${data.features[i].properties.street}</span></li>`;
        // create element to be added to DOM for marker pop up upon click
        let div = window.document.createElement('div');
            div.dataset.listEl = listEL;
            div.innerHTML = `<strong>${data.features[i].properties.name}</strong><br/><button class="add-route-btn" onclick="saveToRoute()">Add to Route</button>`;
        // create markers, set popups
            marker = new mapboxgl.Marker({ 'color': '#000000'})
                .setLngLat([long, lat])
                .setPopup(new mapboxgl.Popup({className: 'popup'}).setDOMContent(div))
                .addTo(map);
        addEventButton();
    };

    map.on('load', function(){
        // creating source that will hold route data once passed
        map.addSource('route', {
            type: 'geojson',
            data: source
          });
          // adding layer to map to render route line
        map.addLayer(
        {
            id: 'routeline',
            type: 'line',
            source: 'route',
            layout: {
            'line-join': 'round',
            'line-cap': 'round'
            },
            paint: {
            'line-color': '#3887be',
            'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 22, 12]
            }
        },
        'waterway-label'
        );
        // adding directional arrows to route line
        map.addLayer(
            {
              id: 'routearrows',
              type: 'symbol',
              source: 'route',
              layout: {
                'symbol-placement': 'line',
                'text-field': '▶',
                'text-size': ['interpolate', ['linear'], ['zoom'], 12, 24, 22, 60],
                'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 12, 30, 22, 160],
                'text-keep-upright': false
              },
              paint: {
                'text-color': '#3887be',
                'text-halo-color': 'hsl(55, 11%, 96%)',
                'text-halo-width': 3
              }
            },
        );
        for (i=0; i<map._markers.length; i++){
            map._markers[i]._element.dataset.marker = i;
            map._markers[i]._popup._content.children[0].children[2].dataset.marker = i;
        };
    });
};

// function called by clicking button within map
let saveToRoute = function () {
    if (markerCounter < 10) {
        let button = document.querySelector('.add-route-btn');
        let ul = document.getElementById('route-ul');
        let li = button.parentElement.dataset.listEl;
        ul.insertAdjacentHTML('beforeend', li);
        markerCounter++;
    } else {
        alert('A maximum of 10 pubs are permitted per route. It is important to drink responsibly.');
    }
};

let addEventButton = function(){
    if (markerCounter < 10){
        for(i=0; i<map._markers.length; i++){
            let button = map._markers[i]._popup._content.children[0].children[2];
            button.addEventListener('click', function(event){
                let markerId = event.path[0].dataset.marker;
                let marker = document.querySelector(`[data-marker='${markerId}']`);
                // console.log(marker);
                marker.children[0].children[0].children[1].attributes[0].nodeValue = '#3FB1CE';
            });
        };       
    };
};

// adds the route to the map. Starting point is always the first pub, the rest of the route is optimized regarless of selection order
let createRoute = function () {
    let profile = 'mapbox/walking';
    let coordinates = '';
        for (i=0; i < routeList.children.length; i++) {
            coordinates += `${routeList.children[i].dataset.long},${routeList.children[i].dataset.lat};`;
        };
        // remove the ; from the end of the coordinates string
        slicedCoords = coordinates.slice(0, -1);
    let apiUrl = `https://api.mapbox.com/optimized-trips/v1/${profile}/${slicedCoords}?geometries=geojson&overview=full&roundtrip=true&source=any&destination=any&access_token=${apiKeyMap}`;
    // console.log(apiUrl);
    fetch(apiUrl)
    .then(function(response){
        if (!response.ok) {
            // need to change alert for something else
            alert('Error: ' + response.statusText);
            } 
        return response.json();    
    })
    .then(function (data){
        // console.log(data);
        let routeGeoJSON = turf.featureCollection([
            turf.feature(data.trips[0].geometry)
        ]);
        map.getSource('route').setData(routeGeoJSON);
        })
    .catch(function (error) {
        // need to change alert for something else
        console.log(error);
        alert('Unable to connect');
    });

};


// event listener for create route button
document.getElementById('create-route').addEventListener('click', function(event){
    event.preventDefault();
    createRoute();
});


// event listener for clear route button
document.getElementById('clear-route').addEventListener('click', function(event){
    event.preventDefault();
    getPubs(chosenLocation);
    routeList.innerHTML = '';
    markerCounter = 0;
});

// event listener for save route button
document.getElementById('save-route').addEventListener('click', function(event){
    event.preventDefault();
    let routeName = document.getElementById('save').value;
    // make sure a route name is entered
    if (!routeName) {
        alert('Enter a name');
    }
    // save route to local storage
    let savedRoute = [];
    savedRoute.push(routeName);
    savedRoute.push(chosenLocation.outerHTML);
    savedRoute.push(routeList.innerHTML);
    localStorage.setItem('PubCrawler-SavedRoutes', JSON.stringify(savedRoute));
    console.log(savedRoute);
});