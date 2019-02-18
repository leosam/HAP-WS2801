# HAP-WS2801
HAP-NodeJS is a [WS2801 ledstrip](https://learn.adafruit.com/12mm-led-pixels/project-ideas) accessory for [KhaosT's HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS) HomeKit accessory server, with full color and brightness control from HSV, 2.5 MHz SPI speed and supporting different number of leds on cascaded ledstrips.

In my implementation, the ledstrip is connected to the SPI port of the raspberry pi through a bidirectional 3.3 to 5V converter, but with a few code modifications it could be used with any other setup. More info on the raspberry pi connection can be derived from the [rpio npm page](https://www.npmjs.com/package/rpio). 

## Install the required dependencies

rpio:

```sh
npm install rpio
```

hsv-rgb:

```sh
npm install hsv-rgb
```

## Install the accessory

Install the LedStrip_accessory.js file in the HAP-NodeJS's accessory folder

## Credits

This led strip accessory is heavily inspired from the [Light_accessory.js](https://github.com/KhaosT/HAP-NodeJS/blob/master/accessories/Light_accessory.js) from [KhaosT's HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS). Please check [there](https://github.com/KhaosT/HAP-NodeJS) for more accessory examples.
