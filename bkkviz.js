var map = L.map('map', {
  center: [13.736717, 101],
  zoom: 10,
  layers: new L.StamenTileLayer('toner-lite'),
  scrollWheelZoom: false
}).on('viewreset', reset);
map.keyboard.disable();

var popup = d3.select('#popup').append('div')
  .attr('class', 'popupContent')
  .classed('hidden', true);

function showPopup(x, y, text) {
  if(text) {
    popup.html(text);
  }
  popup.style('left', x + 16 + 'px');
  popup.style('top', y - 16 + 'px');
  popup.classed('hidden', false);
}

function hidePopup() {
  popup.classed('hidden', true);
}

var svg = d3.select(map.getPanes().overlayPane).append('svg')
  .attr('width', 300)
  .attr('height', 300);
var layer = svg.append('g')
  .attr('class', 'leaflet-zoom-hide');

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

function projectCoordinate(c) {
  var point = map.latLngToLayerPoint(new L.LatLng(c[0], c[1]));
  return [point.x, point.y];
}

var transform = d3.geo.transform({point: projectPoint});
var path = d3.geo.path().projection(transform);
var districts;
var districtPaths, marketPoints;

function reset() {
  var bounds = path.bounds(districts);
  var topLeft = bounds[0];
  var bottomRight = bounds[1];

  svg.attr('width', bottomRight[0] - topLeft[0])
    .attr('height', bottomRight[1] - topLeft[1])
    .style('left', topLeft[0] + 'px')
    .style('top', topLeft[1] + 'px');

  layer.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');
  update();
}

function update() {
  districtPaths.attr('d', path);
}

d3.json('bkkviz.json', function(error, topo) {
  if (error) throw error;

  districts = topojson.feature(topo, topo.objects.district);

  districtPaths = layer.selectAll('.district')
    .data(districts.features)
    .enter()
      .append('path')
    .attr('class', 'district')
    .on('wheel', function(d,i) {
      hidePopup();
    })
    .on('mouseover', (d,i) => {
      var ev = d3.event;
      showPopup(ev.pageX, ev.pageY, d.properties.dname);
    })
    .on('mouseout', function(d,i) {
      hidePopup();
    })
    .on('mousemove', function(d,i) {
      var ev = d3.event;
      showPopup(ev.pageX, ev.pageY);
    });

  reset();
  initWaypoints();
});

// Waypoints
function initWaypoints() {
  new Waypoint({
    element: document.getElementById('cover'),
    handler: function(direction) {
      districtPaths.classed('hidden', false);
    },
    offset: '-50%'
  });

  new Waypoint({
    element: document.getElementById('market-vs-mall-0'),
    handler: function(direction) {
      districtPaths.classed('hidden', true);
    },
    offset: '50%'
  });
}
