var _ = require('lodash');
var d3 = require('d3');
var fs = require('fs');
var topojson = require('topojson');
var DistrictFinder = require('./DistrictFinder.js');

// To use require() with a json file, the extension must be .json
var wat = require('../topojson/wat_prettify.json');

DistrictFinder.init(function() {
  var districts = topojson.feature(wat, wat.objects.wat).features
    .map(function(d){
      var coords = d.geometry.coordinates;
      return DistrictFinder.getDistrictByLatLon(coords[1], coords[0]);
    });

  console.log('total', districts.length);

  var count = _(districts)
    .groupBy(function(d){return d;})
    .mapValues(function(values) { return values.length })
    .toPairs()
    .value()

  var string = d3.csv.formatRows(count);
  fs.writeFileSync(__dirname + '/../tmp/wat.csv', string);
});
