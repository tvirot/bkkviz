var DistrictFinder = require('./DistrictFinder.js');

DistrictFinder.init(function() {
  // test with Siam Paragon
  var district = DistrictFinder.getDistrictByLatLon(13.7468, 100.5353);
  console.log('district', district);
});