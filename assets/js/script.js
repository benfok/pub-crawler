let searchEntry = document.getElementById('city-search-input');
let searchResults = document.getElementById('cities-list');
let routeList = document.querySelector('.route-list');
let chosenLocation;
let mapStartLat; 
let mapStartLong;
// let marker;
let map = undefined;
let source = turf.featureCollection([]);
let apiKeyMap = 'pk.eyJ1IjoiYmVuZm9rIiwiYSI6ImNrejBibzE4bDFhbzgyd213YXE3Ynp1MjAifQ.fbuWSwdUyN9SNuaJS_KLnw';
let markerCounter = 0;
let savedRoutes = [];
let mapReady = false;

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

    
    let renderMap = function (){
        if (!chosenLocation) {
            return;
        }
        routeList.innerHTML = '';
        markerCounter = 0;
        mapReady = false;
        getPubs()
    };

    // when location is selected, run get breweries API
    let localeSelect = function(){
        let locales = document.querySelectorAll('.locations')
    
        locales.forEach(function(locale){
            locale.addEventListener('click', function(){
            clearSearch();
            chosenLocation = locale;
            renderMap();
            });
        });
    };

    // return closest breweries to location selected - 20 results by default
    let getPubs = function(){
        let apiKey = 'ec770931d96f478da03865c1cf963f8b';
        mapStartLat = chosenLocation.dataset.lat;
        mapStartLong = chosenLocation.dataset.long;
        let types = 'catering.pub,catering.bar,catering.biergarten';
        let limit = 25;
        let radius = 5000;
        let apiUrl = `https://api.geoapify.com/v2/places?categories=${types}&filter=circle:${mapStartLong},${mapStartLat},${radius}&bias=proximity:${mapStartLong},${mapStartLat}&limit=${limit}&apiKey=${apiKey}`;
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
                loadMap(data);
                })
            .catch(function (error) {
                // need to change alert for something else
                console.log(error);
                alert('Unable to connect');
            });
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
let loadMap = function(data){
    //Removes the instructions from layout
    let instructions = document.querySelector('#instructions-area');
    instructions.setAttribute('class', 'hidden');
    //Replaces the instructions with the map
    let theMap = document.querySelector('#map');
    theMap.classList.remove('hidden');
    // remove old map if existing
    if(map !== undefined) {
        document.getElementById('map').innerHTML = '';
        map = undefined;
    }

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
        let placeId = data.features[i].properties.place_id;
        // add data for creating <li> elements as a data attribute for the marker popup
        let listEL = `<li class="brewery-list" data-lat="${lat}" data-long="${long}" data-id="${placeId}"><span class="brewery-name">${data.features[i].properties.name}</span><br/><span class="brewery-address">${data.features[i].properties.street}</span></li>`;
        // create element to be added to DOM for marker pop up upon click
        let div = window.document.createElement('div');
            div.dataset.listEl = listEL;
            div.dataset.id = placeId; 
            div.innerHTML = `<strong>${data.features[i].properties.name}</strong><br/><button class="add-route-btn" onclick="saveToRoute()">Add to Route</button>`;
        // create markers, set popups
            let marker = new mapboxgl.Marker({ 'color': '#000000'})
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
        mapReady = true;
    });
};

// function called by clicking button within map
let saveToRoute = function () {
    if (markerCounter < 10) {
        let button = document.querySelector('.add-route-btn');
        let ul = document.getElementById('route-ul');
        let li = button.parentElement.dataset.listEl;
        ul.insertAdjacentHTML('beforeend', li);
        // console.log(routeList);
        markerCounter++;
        // console.log(markerCounter);
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
    if (markerCounter < 2) {
        return;
    }
    let profile = 'mapbox/walking';
    let coordinates = '';
        for (i=0; i < routeList.children.length; i++) {
            coordinates += `${routeList.children[i].dataset.long},${routeList.children[i].dataset.lat};`;
        };
        // remove the ; from the end of the coordinates string
        slicedCoords = coordinates.slice(0, -1);
    let apiUrl = `https://api.mapbox.com/optimized-trips/v1/${profile}/${slicedCoords}?geometries=geojson&overview=full&roundtrip=true&source=any&destination=any&access_token=${apiKeyMap}`;
    runRouteApi(apiUrl);
};

// runs the MapBox Route Optimization API
let runRouteApi = function (apiUrl) {
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
    renderMap();
});

// get search history upon page load
window.addEventListener('load', function() {
    getSavedRoutes();
});

//  get saved items
let getSavedRoutes = function(){
    // check that localStorage exists and if not show message to user within Search History section
    if (!localStorage.getItem('PubCrawler-SavedRoutes')) {
        document.getElementById('saved-routes').innerHTML = `<li class="saved-list">No Saved Data</li>`;
        return;
    }
    // retrieve and parse data into savedRoutes array
    let data = localStorage.getItem('PubCrawler-SavedRoutes');
    savedRoutes = JSON.parse(data);
    // render search history
    renderSavedList(savedRoutes);
};

// render saved route list from local storage
let renderSavedList = function(routes){
    // located the ul element and clear it
    let ul = document.getElementById('saved-routes');
    ul.innerHTML = '';
    // loop through the saved routes array and create li items that store the needed information to restore the route
    for(i=0; i < routes.length; i++){
        let li = document.createElement('li');
        li.textContent = routes[i].name;
        li.className = 'saved-list';
        li.dataset.location = routes[i].location;
        li.dataset.route = routes[i].route;
        // render li items to the list
        ul.insertAdjacentElement('beforeend', li);
    }
    // console.log(ul.innerHTML);
    // activate event listeners on the items and run restore route function if clicked
    let savedRoutesListItems = document.querySelectorAll('.saved-list');
    savedRoutesListItems.forEach(function(route){
        route.addEventListener('click', function(){
        restoreRoute(route);
        });
    });
};


// code in progress:
let markerColorSave = function () {
    let markersArray = [];
    for (i = 0; i < map._markers.length; i++){
            if (map._markers[i]._color !== '#000000') {
                markersArray.push(map._markers[i]._popup._content.children[0].dataset.id);
            };
    
    };
};

// event listener for save route button
document.getElementById('save-route').addEventListener('click', function(event){
    event.preventDefault();
    let routeName = document.getElementById('save').value;
    // make sure a route name is entered
    if (!routeName) {
        alert('Enter a name');
        return;
    }
    // ready saved route for storage
    let item = {
        name: routeName,
        location: chosenLocation.outerHTML,
        route: routeList.innerHTML
    };
    savedRoutes.push(item);
    // add to storage
    localStorage.setItem('PubCrawler-SavedRoutes', JSON.stringify(savedRoutes));
    renderSavedList(savedRoutes);
});

let restoreRoute = function(route){
    let parser = new DOMParser();
    let locData = parser.parseFromString(route.dataset.location, 'text/html');
    chosenLocation = locData.children[0].children[1].children[0];
    renderMap();
    let routeData = route.dataset.route;
    routeList.innerHTML = routeData;
    markerCounter = routeList.children.length;
    //Adds saved route name to title at top
    let savedRouteName = document.querySelector('#route-title');
    savedRouteName.textContent = route.textContent;
    let mapHeader = document.querySelector('#map-header');
    mapHeader.classList.remove('hidden');
    // the rendering of the saved route requires the map to be ready and loaded. As this can take > 1 second, the setTimeout function ensure that this code waits 2 seconds before initially running, and checks if the map is ready before executing. The function reruns every second after the first try. As this function would just continue to loop, if the fail count reaches 10 it will stop.
    let failCount = 0;
    let recreateRoute = function (){
        if (failCount > 10) {
            alert('Unable to load saved route');
            return; 
        } else if (!mapReady) {
                failCount++
                setTimeout(function(){
                recreateRoute();
            }, 1000);
        } else {createRoute();}
    };
    setTimeout(function(){
        recreateRoute();
    }, 2000);
};

