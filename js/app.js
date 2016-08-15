var _allSearchTypes = [];
var _allResultLists = ko.observableArray([]);
var _address;
var _geocoder;
var infowindow;
var _markers = [];

function geocodeAddress(placeType, resultsMap) {

  // var address = document.getElementById('address').value;
  _geocoder.geocode({'address': _address}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      infowindow = new google.maps.InfoWindow();
      var service = new google.maps.places.PlacesService(map);
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


function initMap() {
  var pyrmont = {lat: -33.867, lng: 151.195};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15
  });

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
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
    var rankedResult = results.sort(function(a, b){return b.rating-a.rating});
    renderResults(results, placeType);
    console.log("got results")

    var newResultsList = new resultsList();
    newResultsList.typeName = placeType;
    for (var i = 0; i < rankedResult.length; i++) {
      newResultsList.resultItemList.push({name: rankedResult[i].name, rating: rankedResult[i].rating});
    }
    _allResultLists.push(newResultsList);
    console.log(newResultsList.typeName);

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
    // var image = {
    //   url: 'img/'+ placeType + '.png',
    //   // This marker is 20 pixels wide by 32 pixels high.
    //   size: new google.maps.Size(20, 32),
    //   // The origin for this image is (0, 0).
    //   origin: new google.maps.Point(0, 0),
    //   // The anchor for this image is the base of the flagpole at (0, 32).
    //   anchor: new google.maps.Point(0, 32)
    // };
    var url = 'img/'+ placeType + '.png';

    var marker = new google.maps.Marker({
      map: map,
      icon: url,
      // label: (place.rating > 0 ? String(place.rating) : "?"),
      // label: (ranking < 10 ? ranking : ""),
      label: placeType,
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

  self.updateAddressAndType = function() {
    console.log(self.searchType());
    removeAllMarkers();
    _allResultLists().length = 0;
    _address = self.inputAddress();

    for (var i=0; i < self.searchType().length; i++) {
      geocodeAddress(self.searchType()[i], map);
    }
  }

  self.toggleSearchType = function(data, event) {
    var type = event.target.value;
    var i = self.searchType().indexOf(type);
    if (i == -1) {
      self.searchType().push(type);
    } else {
      self.searchType().splice(i, 1);
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

var mapItem = function(data) {
  this.name = ko.observable(data.name);
  this.rating = ko.observable(data.rating);
};

var resultsList = function(data) {
  this.typeName = ko.observable();
  this.resultItemList = ko.observableArray([]);
};

ko.applyBindings(new ViewModel);
