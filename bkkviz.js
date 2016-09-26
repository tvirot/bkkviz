var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
});

var map = L.map('map', {
  center: [13.736717, 101],
  zoom: 10,
  layers: new L.StamenTileLayer('toner-lite'),
  // layers: CartoDB_Positron,
  scrollWheelZoom: false
});

var svg = d3.select(map.getPanes().overlayPane).append('svg')
  .attr('width', 300)
  .attr('height', 300);

var layer = svg.append('g')
  .attr('class', 'leaflet-zoom-hide');

var popup = d3.select('#popup').append('div')
  .attr('class', 'popupContent')
  .classed('hidden', true);

d3.json('bkkviz.json', function(error, topo) {
  if (error) throw error;
  console.log(topo.objects);
  var district = topojson.feature(topo, topo.objects.district);
  var transform = d3.geo.transform({point: projectPoint});
  var path = d3.geo.path().projection(transform);

  var feature = layer.selectAll('.district')
    .data(district.features)
    .enter()
      .append('path')
    .attr('class', 'district')
    .on('mouseover', (d,i) => {
      popup.html(d.properties.dname);
      popup.classed('hidden', false);
      console.log(d);
    })
    .on('mouseout', (d,i) => {
      popup.classed('hidden', true);
    })
    .on('mousemove', (d,i) => {
      popup.style('left', d3.event.pageX + 16 + 'px');
      popup.style('top', d3.event.pageY - 16 + 'px');
    });

  map.on('viewreset', reset);
  reset();

  function reset() {
    var bounds = path.bounds(district);
    var topLeft = bounds[0];
    var bottomRight = bounds[1];

    svg.attr('width', bottomRight[0] - topLeft[0])
      .attr('height', bottomRight[1] - topLeft[1])
      .style('left', topLeft[0] + 'px')
      .style('top', topLeft[1] + 'px');

    layer.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

    feature.attr('d', path);
  }

  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
});
