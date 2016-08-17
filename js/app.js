var _allSearchTypes = [];
var _allResultLists = ko.observableArray([]);
var _addressInput = document.getElementById('pac-input');
var _geocoder;
var infowindow;
var _markers = [];
var map;
var pos;

function geocodeAddress(placeType) {
  _geocoder.geocode({'address': _addressInput}, function(results, status) {
    if (status === 'OK') {
      map.setCenter(results[0].geometry.location);
      infowindow = new google.maps.InfoWindow();
      var service = new google.maps.places.PlacesService(map);
      pos = results[0].geometry.location.toJSON();

      service.nearbySearch({
        location: results[0].geometry.location,
        radius: 500,
        type: placeType,
      }, function(results, status) {
        processResults(results, status, placeType);
      });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}


function searchCurrentMapArea(placeType) {
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: map.getCenter(),
    radius: 500,
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
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
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
}


function processResults(results, status, placeType) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    // TODO: Is ranking this way necessary?
    var rankedResult = results.sort(function(a, b){return b.rating-a.rating});
    renderResults(rankedResult, placeType);
    storePlaceDetails(rankedResult, placeType);
  }
}


function storePlaceDetails(results, placeType) {
  var newResultsList = new resultsList();
  newResultsList.typeName = placeType;

  for (var i = 0; i < results.length; i++) {
    var place = results[i];
    var item = {
      name: place.name,
      rating: place.rating,
      address: place.vicinity,
      icon: place.icon,
      id: place.place_id,
      hours: ''
    };
    newResultsList.resultItemList.push(item);
  }
  //console.log("hours:" + item.hours);
  var index = _allResultLists.push(newResultsList) - 1;
  console.log(newResultsList.typeName);

  //getDetialedHours(index);
}


function getDetialedHours(index) {
  var results = _allResultLists()[index].resultItemList();
  var service = new google.maps.places.PlacesService(map);
  for (var i = 0; i < results.length; i++) {
    var place = results[i];
    var request = { reference: place.id };
    // Because many places don't have Google Map getDetials service.
    // Choose to use places' common information except hours.
    service.getDetails(request, function(placeDetails, status) {
      console.log(status);
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          _allResultLists()[index].resultItemList[i].hours = placeDetails.opening_hours.weekday_text;
        }
      }
    });
  }
}


function renderResults(results, placeType) {
  for (var i = 0; i < results.length; i++) {
    createMarker(results[i], placeType, i*100, String(i+1));
    // TODO: Enable more search result rendering
    if (i > 7) {
      break;
    }
  }
}


function createMarker(place, placeType, timeout, ranking) {
  window.setTimeout(function() {
    var placeLoc = place.geometry.location;
    var image = {
      url: place.icon,
      size: new google.maps.Size(70, 70),
      scaledSize: new google.maps.Size(20, 20),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 0)
    };
    var url = 'img/'+ placeType + '.png';

    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      // label: (place.rating > 0 ? String(place.rating) : "?"),
      // label: (ranking < 10 ? ranking : ""),
      position: place.geometry.location,
      animation: google.maps.Animation.DROP
    });

    _markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
    });
  }, timeout);
}


var ViewModel = function() {
  var self = this;
  self.inputAddress = ko.observable("Toronto, ON, Canada");
  self.searchType = ko.observableArray([]);
  self.allResultLists = _allResultLists();
  self.searchTemperature = ko.observable();
  self.description = ko.observable();
  self.weatherIcon = ko.observable();

  self.updateAddressAndType = function() {
    console.log(self.searchType());
    removeAllMarkers();
    for (var i=0 ; i<_allResultLists().length ; i++) {
      _allResultLists()[i] = null;
    }
    _allResultLists().length = 0;
    _addressInput = self.inputAddress();
    _allSearchTypes = self.searchType();
    var forecastUrl = "https://api.forecast.io/forecast/6bff14d01f94dbf252e20a2715e03f52/"+pos.lat+ "," + pos.lng;

    $.getJSON(forecastUrl, function(data) {
      self.searchTemperature(data.currently.temperature);
      self.description(data.currently.icon);
      var skycons = new Skycons({"color": "#3385ff"});
      skycons.add("weather-icon", data.currently.icon);
      skycons.play();
    }).error(function(e) {
      console.log("weather error!!");
      console.log(e);
    });

    for (var i=0; i < self.searchType().length; i++) {
      geocodeAddress(self.searchType()[i]);
    }
  }

  self.searchMap = function() {
    removeAllMarkers();
    for (var i=0 ; i<_allResultLists().length ; i++) {
      _allResultLists()[i] = null;
    }
    _allResultLists().length = 0;

    for (var i=0; i < self.searchType().length; i++) {
      searchCurrentMapArea(self.searchType()[i]);
    }
  }
};

function removeAllMarkers() {
  setMapOnAllMarkers(null);
  _markers = [];
}

function setMapOnAllMarkers(map) {
  for (var i = 0; i < _markers.length; i++) {
    _markers[i].setMap(map);
  }
}

var placeItem = function(data) {
  this.name = ko.observable(data.name);
  this.rating = ko.observable(data.rating);
  this.address = ko.observable(data.address);
  this.hours = ko.observable(data.hours);
  this.icon = ko.observable(data.icon);
  this.id = "";
};

var resultsList = function(data) {
  this.typeName = ko.observable();
  this.resultItemList = ko.observableArray([]);
};

ko.applyBindings(new ViewModel);
