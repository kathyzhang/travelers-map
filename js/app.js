var _geocoder;
var infowindow;
var _markers = [];
var map;
var _pos;

var _DEGREE_CELSIUS = "\u2103";
var _DEGREE_FAHRENHEIT = "\u2109";


function geocodeAddress(placeType) {
  _geocoder.geocode({'address': _viewModel.inputAddress()}, function(results, status) {
    if (status === 'OK') {
      map.setCenter(results[0].geometry.location);
      infowindow = new google.maps.InfoWindow();
      var service = new google.maps.places.PlacesService(map);
      _pos = results[0].geometry.location.toJSON();
      service.nearbySearch({
        location: results[0].geometry.location,
        radius: 500,
        type: placeType,
      }, function(results, status) {
        console.log(results);
        processResults(results, status, placeType);
      });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}


function searchCurrentMapArea(placeType) {
  var service = new google.maps.places.PlacesService(map);
  var bounds = map.getBounds();
  var center = map.getCenter();
  var radius = 500;
  if (bounds && center) {
    var ne = bounds.getNorthEast();
    radius = google.maps.geometry.spherical.computeDistanceBetween(center, ne);
  }
  service.nearbySearch({
    location: map.getCenter(),
    radius: radius,
    type: placeType,
  }, function(results, status) {
    processResults(results, status, placeType);
  });
}


function initMap() {
  var pyrmont = {lat: -33.867, lng: 151.195};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15
  });

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      _pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(_pos);
      _viewModel.getWeather(_viewModel.localWeather);
    }, function() {
      console.log("error!kexin");
      //handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    console.log("error!kexin");
    //handleLocationError(true, infoWindow, map.getCenter());
  }
  _geocoder = new google.maps.Geocoder();

  updateInputAddressAndType();
}


function processResults(results, status, placeType) {
  if (results.length == 0) {
    _viewModel.errorMessage("No place found");
  }
  else {
    _viewModel.errorMessage("");
  }

  console.log(placeType + results.length);
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    // TODO: Is ranking this way necessary?
    var rankedResult = results.sort(function(a, b){return b.rating-a.rating});
    renderResults(rankedResult, placeType);
  }
}


function requestPlaceDetials(placeObserverble) {
  placeObserverble.hours("loading...");
  var service = new google.maps.places.PlacesService(map);
  var request = { placeId: placeObserverble.id() };
  // Because many places don't have Google Map getDetials service.
  // Choose to use places' common information except hours.
  service.getDetails(request, function(placeDetails, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK || placeDetails.opening_hours === undefined) {
      placeObserverble.hours(["Place detail unknown"]);
    }
    else {
      var hours = placeDetails.opening_hours.weekday_text;
      var website = placeDetails.website;
      placeObserverble.hours(hours);
      placeObserverble.website(website);
    }
  });
}


function renderResults(results, placeType) {

  for (var i = 0; i < results.length; i++) {
    var index = createMarker(results[i], placeType, i*100, String(i+1));
    var item = new placeItem(results[i]);
    item.markerIndex(index);
    _viewModel.resultItemList.push(item);
    // TODO: Enable more search result rendering
    // if (i > 7) {
    //   break;
    // }
  }
  _viewModel.resultItemDisplayed(_viewModel.resultItemList());
}


function createMarker(place, placeType, timeout, ranking) {
  var marker;
  var index;

  // var placeLoc = place.geometry.location;
  var image = {
    url: place.icon,
    size: new google.maps.Size(70, 70),
    scaledSize: new google.maps.Size(20, 20),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 0)
  };

  marker = new google.maps.Marker({
    map: map,
    //icon: image,
    // label: (place.rating > 0 ? String(place.rating) : "?"),
    // label: (ranking < 10 ? ranking : ""),
    position: place.geometry.location,
    animation: google.maps.Animation.DROP
  });

  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');

  index = _markers.push(marker)-1;
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
    toggleBounce(marker);
    console.log(place.geometry.location.toJSON());
  });

  return index;
}


function listItemClicked(place) {
  selectPlace(place);
  openInfoWindow(place);
}


function openInfoWindow(place) {
  var marker = _markers[place.markerIndex()];
  toggleBounce(marker);
  infowindow.setContent(place.name());
}


function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      marker.setAnimation(null);
    }, 750);
  }
  infowindow.open(map, marker);
}


function selectPlace(p) {
  if (_viewModel.placeSelected2()) {
    _viewModel.placeSelected1(_viewModel.placeSelected2());
    _viewModel.placeSelected2(p);
  }
  else {
    _viewModel.placeSelected2(p);
  }
}


function openSearch() {
  closeAllSideWindows();
  _viewModel.openSearchWindow(true);
}


function closeSearch() {
  _viewModel.openSearchWindow(false);
}

function openResults() {
  closeAllSideWindows();
  _viewModel.openResultWindow(true);
}


function closeResults() {
  _viewModel.openResultWindow(false);
}


function openWeather() {
  closeAllSideWindows();
  _viewModel.openWeatherWindow(true);
}


function closeWeather() {
  _viewModel.openWeatherWindow(false);
}


function openSaved() {
  closeAllSideWindows();
  _viewModel.openSavedWindow(true);
}

function closeSaved() {
  _viewModel.openSavedWindow(false);
}


function closeAllSideWindows() {
  _viewModel.openSearchWindow(false);
  _viewModel.openResultWindow(false);
  _viewModel.openWeatherWindow(false);
  _viewModel.openSavedWindow(false);
}

function resultItemFilterFunction(place) {
    return place.name().toLowerCase().includes(_viewModel.searchInput().toLowerCase());
}


function printPlaces() {
  var WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
  for (var i=0; i<_viewModel.savedPlaces().length; i++) {
    WinPrint.document.write("<img src='" + _viewModel.savedPlaces()[i].icon() + "' height='15' width='15'>");
    WinPrint.document.write("<span>" + _viewModel.savedPlaces()[i].name()  + "</span>");
    WinPrint.document.write("<div> Address: " + _viewModel.savedPlaces()[i].address()  + "</div>");
    WinPrint.document.write("<br>");
  }
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
}

var ViewModel = function() {
  var self = this;
  self.inputAddress = ko.observable("Toronto, ON, Canada");
  self.searchType = ko.observable('restaurant');
  self.resultItemList = ko.observableArray([]);
  self.resultItemFilterList = ko.observableArray([]);
  self.resultItemDisplayed = ko.observableArray([]);
  self.searchInput = ko.observable();
  self.skycons = new Skycons({"color": "#3385ff"});
  self.localWeather = new weatherItem("local-weather", false);
  self.pastWeather = new weatherItem("past-weather", true);
  self.placeSelected1 = ko.observable();
  self.placeSelected2 = ko.observable();
  self.routeResult = ko.observable();
  self.openSearchWindow = ko.observable(true);
  self.openResultWindow = ko.observable(false);
  self.openWeatherWindow = ko.observable(false);
  self.openSavedWindow = ko.observable(false);
  self.errorMessage = ko.observable();
  self.savedPlaces = ko.observableArray();

  self.searchMap = function() {
    removeAllMarkers();

    self.resultItemList().length = 0;

    searchCurrentMapArea(self.searchType());
  }

  self.getWeather = function(w) {
    var forecastUrl = "https://api.forecast.io/forecast/6bff14d01f94dbf252e20a2715e03f52/"+_pos.lat+ "," + _pos.lng;
    if (w.isTimeMachine) {
      forecastUrl = forecastUrl + "," + w.weatherTimeMachineTime();
    }

    $.ajax({
      url: forecastUrl,
      dataType: 'jsonp',
    }).done(function(data, status, xhr){
      if (status === 'success') {
        w.weatherAPICalls(xhr.getResponseHeader("X-Forecast-API-Calls"));
        console.log(w.weatherAPICalls());
        w.localTempF(data.currently.temperature);
        w.localTempC((w.localTempF() - 32) / 1.8);
        w.tempUnit = _DEGREE_FAHRENHEIT;
        w.localTempDisplay(w.localTempF().toFixed(0) + " " +  _DEGREE_FAHRENHEIT);
        var description = data.currently.icon.split("-").join(" ");
        w.description(description);
        w.timezone(data.timezone);

        self.skycons.add(w.weatherItemId(), data.currently.icon);
        self.skycons.play();
      }
      else {
        console.log(status);
        w.description('forecast.io weather loading error.');
      }
    }).error(function(e){
      console.log(status);
      w.description('forecast.io weather loading error.');
    });
  }

  self.getRoute = function() {
    if (self.placeSelected1() && self.placeSelected2()) {
      var routeUrl = "https://maps.googleapis.com/maps/api/directions/json?origin=place_id:"+ self.placeSelected1().id() + "&destination=place_id:" + self.placeSelected2().id() + "&mode=walking&key=AIzaSyC_G9M1jfplVlXowZkrok4p8Sr6om0pFmc";

      $.getJSON(routeUrl, function(data) {
        var route = "Distance: " + data.routes[0].legs[0].distance.text + " Duration: " + data.routes[0].legs[0].duration.text;
        self.routeResult(route);
        console.log(data);
      }).error(function(e) {
        self.routeResult("Sorry unable to get route.");
        console.log("route error");
      });
    }
    else {
      self.routeResult("Choose two places.");
    }
  }

  self.resultItemFilter = function() {
    self.resultItemFilterList(self.resultItemList().filter(resultItemFilterFunction));
    self.resultItemDisplayed(self.resultItemFilterList());
  }

  self.cancelFilter = function() {
    self.resultItemDisplayed(self.resultItemList());
  }
};


function updateInputAddressAndType() {
  removeAllMarkers();
  _viewModel.resultItemList().length = 0;

  if (_viewModel.searchType() == null) {
    alert("Please choose searching types.");
  }
  else {
    geocodeAddress(_viewModel.searchType());
  }

}


function updateAddress(data) {
  _viewModel.inputAddress(data);
  updateInputAddressAndType();
}


function getPlaceDetials(p) {
  if (p.hours() === undefined) {
    requestPlaceDetials(p);
  }
}


function FahToCelToggle(weather) {
  if (weather.tempUnit == _DEGREE_CELSIUS) {
    weather.tempUnit = _DEGREE_FAHRENHEIT;
    weather.localTempDisplay(weather.localTempF().toFixed(0) + " " + _DEGREE_FAHRENHEIT);
  }
  else {
    if (weather.tempUnit == _DEGREE_FAHRENHEIT) {
      weather.tempUnit = _DEGREE_CELSIUS;
      weather.localTempDisplay(weather.localTempC().toFixed(0) + " " + _DEGREE_CELSIUS);
    }
  }
}


function animateSkycons() {
  _viewModel.skycons.color = "#ff7733";
  _viewModel.skycons.pause();
  _viewModel.skycons.play(); // redraw canvas
  _viewModel.skycons.pause();
}


function stopAnimateSkycons() {
  _viewModel.skycons.play();
  _viewModel.skycons.color = "#3385ff";
}


function removeAllMarkers() {
  setMapOnAllMarkers(null);
  _markers = [];
}


function setMapOnAllMarkers(map) {
  for (var i = 0; i < _markers.length; i++) {
    _markers[i].setMap(map);
  }
}


function toggleSaveButton(item) {
  if (item.saved()) {
    item.saved(false);
    _viewModel.savedPlaces.remove(item);
  }
  else {
    item.saved(true);
    _viewModel.savedPlaces.push(item);
  }
}


var placeItem = function(data) {
  this.name = ko.observable(data.name);
  this.rating = ko.observable(data.rating);
  this.address = ko.observable(data.vicinity);
  this.hours = ko.observable();
  this.icon = ko.observable(data.icon);
  this.id = ko.observable(data.place_id)
  this.geometry = ko.observable(data.geometry);
  this.website = ko.observable(data.website);
  this.markerIndex = ko.observable();
  this.saved = ko.observable(false);
};


var weatherItem = function(id, isTimeMachine) {
  var self = this;
  self.localTempF = ko.observable();
  self.localTempC = ko.observable();
  self.localTempDisplay = ko.observable();
  self.description = ko.observable();
  self.weatherAPICalls = ko.observable();
  self.tempUnit;
  self.weatherItemId = ko.observable(id);
  self.timezone = ko.observable("Current Location");
  self.isTimeMachine = isTimeMachine;
  self.weatherTimeMachineTime = ko.observable("2013-05-06T12:00:00-0400");
}


var _viewModel = new ViewModel;
ko.applyBindings(_viewModel);
