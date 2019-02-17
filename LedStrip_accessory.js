var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var rgb = require('hsv-rgb');
var rpio = require('rpio');

// Pixel color correction with respect to led intensities
function generate_gamma() {
  var gamma_buffer = new ArrayBuffer(256);
  var gamma = new Uint8Array(gamma_buffer);

  // function that generates the gamma values for each pixel
  for (var i=0; i<256; i++) { 
    gamma[i] = Math.floor(Math.pow(i / 255.0, 2.5)*255);
  }
  return gamma
}

// Filter pixel in RGB format
function filter_pixel(input_pixel,brightness) {

  var gamma = generate_gamma();

  var pixel_buffer = new ArrayBuffer(3);
  var output_pixel = new Uint8Array(pixel_buffer);
  
  // Apply brightness adjustment
  input_pixel[0] = brightness * input_pixel[0];
  input_pixel[1] = brightness * input_pixel[1];
  input_pixel[2] = brightness * input_pixel[2];

  // Gamma lookup
  output_pixel[0] = gamma[input_pixel[0]];
  output_pixel[1] = gamma[input_pixel[1]];
  output_pixel[2] = gamma[input_pixel[2]];

  return output_pixel;
}

// writes the pixel to the SPI device
function update_color(color, NUM_LEDS, PIXEL_SIZE) {

  // SPI initialization stuff
  rpio.spiBegin();
  rpio.spiChipSelect(0);      /* we dont care about the CS */
  rpio.spiSetClockDivider(100);  /* Set SPI speed to 250MHz/100 */
  rpio.spiSetDataMode(0);         /* 0 is the default */

  var spi_buffer = new ArrayBuffer(NUM_LEDS * PIXEL_SIZE);
  var pixel_output = new Uint8Array(spi_buffer);

  // Fixed brightness = 1. Change to adjust!
  var filtered_pixel = filter_pixel(color, 1);

  for (var led = 0; led < (NUM_LEDS * PIXEL_SIZE); led+=3) {
    pixel_output[led + 0] = filtered_pixel[0];
    pixel_output[led + 1] = filtered_pixel[1];
    pixel_output[led + 2] = filtered_pixel[2];
  }
    
  // Flush data to SPI
  //rpio.spiWrite(pixel_output, pixel_output.length);
  //rpio.msleep(10);
  rpio.spiWrite(pixel_output, pixel_output.length);
  rpio.msleep(1);
  rpio.spiEnd();
  //rpio.msleep(10);
}

var LightController = {
  name: "Led Strip", //name of accessory
  pincode: "031-45-154",
  username: "FA:3C:ED:5A:1A:1A", // MAC like address used by HomeKit to differentiate accessories. 
  manufacturer: "leosam", //manufacturer (optional)
  model: "v1.0", //model (optional)
  serialNumber: "A12S345KGB", //serial number (optional)

  power: false, //current power status
  brightness: 75, //current brightness
  hue: 0, //current hue
  saturation: 0, //current saturation
  number_leds: 20,
  brightness_limit: 100,

  outputLogs: true, //output logs

  setPower: function(status) { //set power of accessory

    if (status == true && this.power == false) 
    {
      var color = rgb(this.hue,this.saturation,this.brightness);
      update_color(color, this.number_leds, 3);
      if(this.outputLogs) console.log("Turning the '%s' %s", this.name, status ? "on" : "off");
    }

    if (status == false && this.power == true)
    {
      var color = rgb(0,0,0);
      update_color(color, this.number_leds, 3);
      if(this.outputLogs) console.log("Turning the '%s' %s", this.name, status ? "on" : "off");
    }

    this.power = status;
  },

  getPower: function() { //get power of accessory
    if(this.outputLogs) console.log("'%s' is %s.", this.name, this.power ? "on" : "off");
    return this.power;
  },

  setBrightness: function(brightness) { //set brightness
    
    // fix a bug where the pixel get different colors when brightness is too high
    if (brightness > this.brightness_limit) {
      brightness = this.brightness_limit;
    }

    var color = rgb(this.hue,this.saturation,brightness);
    update_color(color, this.number_leds, 3);

    if(this.outputLogs) console.log("Setting '%s' brightness to %s", this.name, brightness);
    this.brightness = brightness;
  },

  getBrightness: function() { //get brightness
    if(this.outputLogs) console.log("'%s' brightness is %s", this.name, this.brightness);
    return this.brightness;
  },

  setSaturation: function(saturation) { //set brightness
    var color = rgb(this.hue,saturation,this.brightness);
    update_color(color, this.number_leds, 3);

    if(this.outputLogs) console.log("Setting '%s' saturation to %s", this.name, saturation);
    this.saturation = saturation;
  },

  getSaturation: function() { //get brightness
    if(this.outputLogs) console.log("'%s' saturation is %s", this.name, this.saturation);
    return this.saturation;
  },

  setHue: function(hue) { //set brightness

    var color = rgb(hue,this.saturation,this.brightness);
    update_color(color, this.number_leds, 3);

    if(this.outputLogs) console.log("Setting '%s' hue to %s", this.name, hue);
    this.hue = hue;
  },

  getHue: function() { //get hue
    if(this.outputLogs) console.log("'%s' hue is %s", this.name, this.hue);
    return this.hue;
  },

  identify: function() { //identify the accessory
    
    for (var i = 0; i <= 3; i++) {
      var color = rgb(353,100,100);
      update_color(color, this.number_leds, 3);
      rpio.msleep(200);
      var color = rgb(256,100,100);
      update_color(color, this.number_leds, 3);
      rpio.msleep(200);
    }
    
    // Return to normal color
    var color = rgb(this.hue,this.saturation,this.brightness);
    update_color(color, this.number_leds, 3);
    if(this.outputLogs) console.log("Identify the '%s'", this.name);
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light' + LightController.name);

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
var lightAccessory = exports.accessory = new Accessory(LightController.name, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
lightAccessory.username = LightController.username;
lightAccessory.pincode = LightController.pincode;

// set some basic properties (these values are arbitrary and setting them is optional)
lightAccessory
  .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, LightController.manufacturer)
    .setCharacteristic(Characteristic.Model, LightController.model)
    .setCharacteristic(Characteristic.SerialNumber, LightController.serialNumber);

// listen for the "identify" event for this Accessory
lightAccessory.on('identify', function(paired, callback) {
  LightController.identify();
  callback();
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
lightAccessory
  .addService(Service.Lightbulb, LightController.name) // services exposed to the user should have "names" like "Light" for this case
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    LightController.setPower(value);

    // Our light is synchronous - this value has been successfully set
    // Invoke the callback when you finished processing the request
    // If it's going to take more than 1s to finish the request, try to invoke the callback
    // after getting the request instead of after finishing it. This avoids blocking other
    // requests from HomeKit.
    callback();
  })
  // We want to intercept requests for our current power state so we can query the hardware itself instead of
  // allowing HAP-NodeJS to return the cached Characteristic.value.
  .on('get', function(callback) {
    callback(null, LightController.getPower());
  });

// To inform HomeKit about changes occurred outside of HomeKit (like user physically turn on the light)
// Please use Characteristic.updateValue
// 
// lightAccessory
//   .getService(Service.Lightbulb)
//   .getCharacteristic(Characteristic.On)
//   .updateValue(true);

// also add an "optional" Characteristic for Brightness
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('set', function(value, callback) {
    LightController.setBrightness(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getBrightness());
  });

// also add an "optional" Characteristic for Saturation
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('set', function(value, callback) {
    LightController.setSaturation(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getSaturation());
  });

// also add an "optional" Characteristic for Hue
lightAccessory
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('set', function(value, callback) {
    LightController.setHue(value);
    callback();
  })
  .on('get', function(callback) {
    callback(null, LightController.getHue());
  });