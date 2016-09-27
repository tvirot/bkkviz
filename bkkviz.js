var stamenLite = new L.StamenTileLayer('toner-lite');
var stamenLabels = new L.StamenTileLayer('toner-labels');
var map = L.map('map', {
  center: [13.736717, 101],
  zoom: 10,
  layers: [stamenLite],
  scrollWheelZoom: false
}).on('viewreset', reset);

map.keyboard.disable();

var overlayMaps = { 'Map': stamenLite, 'Labels': stamenLabels };
L.control.layers(overlayMaps).addTo(map);


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
  var point = map.latLngToLayerPoint(new L.LatLng(c[1], c[0]));
  return [point.x, point.y];
}

var transform = d3.geo.transform({point: projectPoint});
var path = d3.geo.path().projection(transform);
var districts;
var districtPaths, marketPoints;
var districtData, districtDataLookup;
var colorScales;
function r() {
  return Math.max((map.getZoom() - 10), 0) * 1.5 + 1;
}

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
  d3.selectAll('circle.point')
    .attr('r', r)
    .attr('cx', function(d){return projectCoordinate(d.geometry.coordinates)[0];})
    .attr('cy', function(d){return projectCoordinate(d.geometry.coordinates)[1];})
    .style('stroke-width', r() * 2);
}

d3.queue()
  .defer(d3.json, 'bkkviz.json')
  .defer(d3.csv, 'dataByDistrict.csv')
  .await(function(error, topo, csv) {
    if (error) throw error;

    districtData = csv.map(function(row){
      Object.keys(row)
        .filter(function(d){return d!=='district';})
        .forEach(function(key){
          row[key] = +row[key];
        })
      return row;
    });
    districtDataLookup = csv.reduce(function(acc, curr) {
      acc[curr.district] = curr;
      return acc;
    }, {});

    colorScales = Object.keys(districtData[0])
        .filter(function(d){return d!=='district';})
        .reduce(function(acc, curr){
          acc[curr] = d3.scale.quantize()
            .domain(d3.extent(districtData, function(d){return d[curr];}))
            .range(['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824']);
          return acc;
        }, {});

    districts = topojson.feature(topo, topo.objects.district);

    districtPaths = layer.append('g')
        .classed('district-layer', true)
      .selectAll('.district')
        .data(districts.features)
      .enter().append('path')
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

    // console.log('topo.objects', topo.objects);

    // draw bts stations
    drawPoints(
      layer.append('g').classed('bts-layer', true),
      topojson.feature(topo, topo.objects.bts_station).features
    );
    // draw mrt stations
    drawPoints(
      layer.append('g').classed('mrt-layer', true),
      topojson.feature(topo, topo.objects.mrt_station).features
    );
    // draw markets
    drawPoints(
      layer.append('g').classed('market-layer', true),
      topojson.feature(topo, topo.objects.market).features
    );
    // draw department stores
    drawPoints(
      layer.append('g').classed('department-store-layer', true),
      topojson.feature(topo, topo.objects.department_store).features
    );
    // draw golf courses
    drawPoints(
      layer.append('g').classed('golf-course-layer', true),
      topojson.feature(topo, topo.objects.golf_course).features
    );
    // draw universities
    drawPoints(
      layer.append('g').classed('university-layer', true),
      topojson.feature(topo, topo.objects.university).features
    );

    reset();
    initWaypoints();
  });

function drawPoints(container, features) {
  container
    .selectAll('.point')
      .data(features)
    .enter().append('circle')
      .classed('point', true)
      .classed('hidden', true) // Hide all points initially
      .attr('r', 0)
      .attr('cx', function(d){return projectCoordinate(d.geometry.coordinates)[0];})
      .attr('cy', function(d){return projectCoordinate(d.geometry.coordinates)[1];})
      .on('wheel', function(d,i) {
        hidePopup();
      })
      .on('mouseover', (d,i) => {
        console.log(d);
        var ev = d3.event;
        showPopup(ev.pageX, ev.pageY, d.properties.name || d.properties.mar_name);
      })
      .on('mouseout', function(d,i) {
        hidePopup();
      })
}

function hideAllPoints() {
  d3.selectAll('circle.point')
    .classed('hidden', true)
    .transition()
      .duration(100)
      .attr('r', 0)
}

function showDistricts() {
  d3.select('.district-layer')
    .classed('hidden', false)
    .transition()
      .style('opacity', 1)
}

function hideDistricts() {
  d3.select('.district-layer')
    .classed('hidden', true) // Need this to disable mouseover polygons
    .transition()
      .style('opacity', 0)
}

function colorDistrict(colorOrFunc) {
  districtPaths
    .transition()
    .duration(400)
    .style('fill', d3.functor(colorOrFunc));
}

// Waypoints
function initWaypoints() {
  new Waypoint({
    element: document.getElementById('cover'),
    handler: function(direction) {
      showDistricts();
      colorDistrict(null);
      hideAllPoints();
    },
    offset: '-1%'
  });

  new Waypoint({
    element: document.getElementById('transport-0'),
    handler: function(direction) {
      hideDistricts(); // Perhaps we shouldn't hide districts?
      hideAllPoints();
      d3.selectAll('.bts-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', 'red')
          .style('stroke', 'red');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('transport-1'),
    handler: function(direction) {
      hideDistricts();
      hideAllPoints();
      d3.selectAll('.bts-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', 'red')
          .style('stroke', 'red');
      d3.selectAll('.mrt-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', 'blue')
          .style('stroke', 'blue');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('market-vs-mall-0'),
    handler: function(direction) {
      hideDistricts();
      hideAllPoints();
      d3.selectAll('.market-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#444')
          .style('stroke', '#444');
      d3.selectAll('.department-store-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#444')
          .style('stroke', '#444');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('market-vs-mall-1'),
    handler: function(direction) {
      hideDistricts();
      hideAllPoints();
      d3.selectAll('.market-layer circle.point')
        .classed('hidden', false)
        .transition()
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#7743b2')
          .style('stroke', '#7743b2');
      d3.selectAll('.department-store-layer circle.point')
        .classed('hidden', false)
        .transition()
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', 'yellow')
          .style('stroke', 'yellow');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('golfcourse-vs-uni-0'),
    handler: function(direction) {
      hideDistricts();
      hideAllPoints();
      d3.selectAll('.golf-course-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#444')
          .style('stroke', '#444');
      d3.selectAll('.university-layer circle.point')
        .classed('hidden', false)
        .transition()
          .duration(500)
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#444')
          .style('stroke', '#444');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('golfcourse-vs-uni-1'),
    handler: function(direction) {
      hideDistricts();
      hideAllPoints();
      d3.selectAll('.golf-course-layer circle.point')
        .classed('hidden', false)
        .transition()
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', '#7743b2')
          .style('stroke', '#7743b2');
      d3.selectAll('.university-layer circle.point')
        .classed('hidden', false)
        .transition()
          .attr('r', r)
          .style('stroke-width', r() * 2)
          .style('fill', 'yellow')
          .style('stroke', 'yellow');
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('marriage'),
    handler: function(direction) {
      hideAllPoints();
      showDistricts();
      colorDistrict(function(d) {
        var district = d.properties.dname.replace('เขต', '');
        var data = districtDataLookup[district];
        if(data) return colorScales['สมรส'](data['สมรส']);
        return '#ccc';
      });
    },
    offset: '10%'
  });

  new Waypoint({
    element: document.getElementById('divorce'),
    handler: function(direction) {
      hideAllPoints();
      showDistricts();
      colorDistrict(function(d) {
        var district = d.properties.dname.replace('เขต', '');
        var data = districtDataLookup[district];
        if(data) return colorScales['หย่าร้าง'](data['หย่าร้าง']);
        return '#ccc';
      });
    },
    offset: '10%'
  });
	
  new Waypoint({
    element: document.getElementById('park'),
    handler: function(direction) {
      hideAllPoints();
      showDistricts();
      colorDistrict(function(d) {
        var district = d.properties.dname.replace('เขต', '');
        var data = districtDataLookup[district];
        if(data) return colorScales['พื้นที่สวน (ตรม.)'](data['พื้นที่สวน (ตรม.)']);
        return '#ccc';
      });
    },
    offset: '10%'
  });
}

var sections = d3.selectAll('.sections section');
var sectionPos = [];
var topSectionPos;

sections.each(function(d,i) {
  var top = this.getBoundingClientRect().top;
  if(i === 0) {
    topSectionPos = top;
  }
  sectionPos.push(top - topSectionPos);
});

function getSection(direction) {
  var pos = window.pageYOffset;
  var next = d3.bisect(sectionPos, pos);
  if (direction === 'prev') {
    return Math.max(0, next - 1);
  } else {
    return Math.min(sections.size() - 1, next);
  }
}

document.addEventListener('keyup', function(e) {
  if (e.keyCode == 32) {
    sections[0][getSection('next')].scrollIntoView(
      {block: 'start', behavior: 'smooth'}
    );
  }
});
