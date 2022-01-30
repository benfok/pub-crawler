let searchEntry = document.getElementById('city-search-input');
let searchResults = document.getElementById('cities-list');
let chosenLocale;
let chosenBrewery;
let mapStartLat; 
let mapStartLong;

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
            alert('Unable to connect to OpenWeatherMap.org');
        });
    };

    let renderResults = function(data){
        // clear the search results
        clearSearch();
        // if no results returned display a message
        let str = '';
        if (data.length === 0) {
            let listEl = `<li class="city-option locations">No Results - Please Search Again</li>`;
            str += listEl;
        // if results are displayed render them to the page and include the lat and long data to pass into the weather API call
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

    let clearSearch = function(){
    searchResults.innerHTML = '<li class="city-option my-location">Use My Current Location</li>';        
    };

    // when location is selected, run get breweries API
    let localeSelect = function(){
        let locales = document.querySelectorAll('.locations')
    
        locales.forEach(function(locale){
            locale.addEventListener('click', function(){
            chosenLocale = locale;
            // console.log(chosenLocale);
            clearSearch();
            getBreweries(chosenLocale);
            });
        });
    };

    let mapBrewery = function(){
        let clickedBrewery = document.querySelectorAll('.brewery-list');
        clickedBrewery.forEach(function(brewery){
            brewery.addEventListener('click', function(){
            chosenBrewery = brewery;
            // console.dir(chosenBrewery);
            mapStartLat = brewery.dataset.lat;
            mapStartLong = brewery.dataset.long;
            renderMap();
            });
        });
    };

    // return closest breweries to location selected - 20 results by default
    let getBreweries = function(locale){
        let lat = locale.dataset.lat;
        let long = locale.dataset.long;
        let apiUrl = `https://api.openbrewerydb.org/breweries?by_dist=${lat},${long};`;
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
                showBreweries(data);
                })
            .catch(function (error) {
                // need to change alert for something else
                alert('Unable to connect to OpenBrewerydb.com');
            });
        };

    // render the breweries to the page ordered by distance (default ascending)
    let showBreweries = function(data){
        let searchResults = document.getElementById('local-results-list');
        // clear the search results
        searchResults.innerHTML = '';
        // if no results returned display a message
        let str = '';
        if (data.length === 0) {
            let listEl = `<li class="brewery-list">No Results - Please Select A Different Location</li>`;
            str += listEl;
        // if results are displayed render them to the page and include the lat and long data to pass into the weather API call
        } else {
            for (i=0; i < data.length; i++) {
                let listEL = `<li class="brewery-list" data-lat="${data[i].latitude}" data-long="${data[i].longitude}"><span class="brewery-name">${data[i].name}</span><br/><span class="brewery-address">${data[i].street}</span></li>`;
                str += listEL;
            };
        }
        // add breweries as a list
        searchResults.innerHTML += str;
        // need to add function to activate event listeners on the newly created <li>s for mapping
        mapBrewery();
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
    let renderMap = function(){
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmVuZm9rIiwiYSI6ImNrejBibzE4bDFhbzgyd213YXE3Ynp1MjAifQ.fbuWSwdUyN9SNuaJS_KLnw';
    const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [mapStartLong, mapStartLat], // starting position [lng, lat]
    zoom: 17 // starting zoom
    });
    //ads controls to map
    map.addControl(new mapboxgl.NavigationControl());
};