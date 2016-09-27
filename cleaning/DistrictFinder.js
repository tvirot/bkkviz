var d3 = require('d3');
var getPixels = require('get-pixels')

var pixels;
var indexedDistricts = ["บางพลัด","ห้วยขวาง","วังทองหลาง","ทวีวัฒนา","ลาดกระบัง","ดินแดง","ตลิ่งชัน","ดุสิต","สะพานสูง","พญาไท","บางกอกน้อย","ราชเทวี","พระนคร","ป้อมปราบศัตรูพ่าย","ปทุมวัน","บางแค","สวนหลวง","วัฒนา","บางกอกใหญ่","ภาษีเจริญ","สัมพันธวงศ์","คลองเตย","ธนบุรี","คลองสาน","ประเวศ","บางรัก","หนองแขม","สาทร","ยานนาวา","จอมทอง","บางคอแหลม","พระโขนง","ราษฎร์บูรณะ","บางบอน","บางนา","บางขุนเทียน","ดอนเมือง","หนองจอก","สายไหม","คลองสามวา","หลักสี่","บางเขน","จตุจักร","คันนายาว","มีนบุรี","ลาดพร้าว","บางซื่อ","บึงกุ่ม","บางกะปิ","ทุ่งครุ"]

var projection = d3.geo.mercator()
  .scale(110000)
  // Customize the projection to make the center of Thailand become the center of the map
  .rotate([-100.5718, -13.73])
  .translate([500, 500]);

function getDistrictByIndex(index) {
  if(index >= 0 && index < 50) return indexedDistricts[index];
  return 'Unknown';
}

function getDistrictByLatLon(lat, lon) {
  var xy = projection([lon, lat]);
  if(!pixels) {
    return 'Unknown';
  }
  var x = Math.round(xy[0]);
  var y = Math.round(xy[1]);
  var colors = [
    pixels.get(x, y, 0),
    pixels.get(x, y, 1),
    pixels.get(x, y, 2),
  ];
  var index = colors[0] * 255 * 255 + colors[1] * 255 + colors[2] - 1;
  return getDistrictByIndex(index);
}

function init(cb) {
  if(pixels) {
    cb();
    return;
  }
  getPixels(__dirname + '/../bitmap/districts.png', function(err, loadedPixels) {
    if(err) {
      console.log('Bad image path');
      return;
    }

    pixels = loadedPixels;
    cb();
  });
}

module.exports = {
  getDistrictByLatLon: getDistrictByLatLon,
  getDistrictByIndex: getDistrictByIndex,
  init: init,
};