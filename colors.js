function hslToRgb(arg){
  hue = arg[0];
  saturation = arg[1];
  lightness = arg[2];

  if( hue == undefined ){
      return [0, 0, 0];
    }

    var chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    var huePrime = hue / 60;
    var secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

    huePrime = Math.floor(huePrime);
    var red;
    var green;
    var blue;

    if( huePrime === 0 ){
      red = chroma;
      green = secondComponent;
      blue = 0;
    }else if( huePrime === 1 ){
      red = secondComponent;
      green = chroma;
      blue = 0;
    }else if( huePrime === 2 ){
      red = 0;
      green = chroma;
      blue = secondComponent;
    }else if( huePrime === 3 ){
      red = 0;
      green = secondComponent;
      blue = chroma;
    }else if( huePrime === 4 ){
      red = secondComponent;
      green = 0;
      blue = chroma;
    }else if( huePrime === 5 ){
      red = chroma;
      green = 0;
      blue = secondComponent;
    }

    var lightnessAdjustment = lightness - (chroma / 2);
    red += lightnessAdjustment;
    green += lightnessAdjustment;
    blue += lightnessAdjustment;

    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];

}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function RGBtoHex(RGBArray){
  var rr = parseInt(RGBArray[0]).toString(16);
  var gg = parseInt(RGBArray[1]).toString(16);
  var bb = parseInt(RGBArray[2]).toString(16);
  return "#" + componentToHex(rr) + componentToHex(gg) + componentToHex(bb);
}

function ColorLuminance(hex, lum) {
	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;
	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}
	return rgb;
}

module.exports.hslToRgb = hslToRgb;
module.exports.RGBtoHex = RGBtoHex;
module.exports.ColorLuminance = ColorLuminance;
