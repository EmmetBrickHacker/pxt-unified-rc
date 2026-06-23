# Unified Remote Control (URC)
> Open this page at [https://brickhackers.github.io/pxt-unified-rc/](https://brickhackers.github.io/pxt-unified-rc/)

A MakeCode extension to simplify creating a remote controller using the **micro:bit** and [**ElecFreaks Joystick:bit**](https://wiki.elecfreaks.com/en/microbit/expansion-board/joystick-bit-v2/). It provides a plug-and-play solution for joystick calibration, background data transmission, and smart button handling.

## Key Features
* **Single-Block Setup**: Initialize the controller, set the radio group, and handle ping intervals with one block.
* **Smart Calibration**: Built-in interactive manual calibration with on-screen guides and haptic feedback.
* **Persistent Storage**: Calibration data is saved to the micro:bit's flash memory so it survives restarts.
* **Background Processing**: Automatically reads, maps (-100 to +100), and broadcasts joystick coordinates.
* **Standardized Button Events**: Encodes button presses into structured 3-digit radio messages.

## Usage

### Initialization
Place the **`initialize Unified Remote Controller`** block inside your `on start` block. 
* Set your ping interval (default is 500ms).
* Set the radio group (0-255). Use `256` to ignore and keep the default/previous radio group.

### First Boot & Calibration
On the very first run, the controller will guide you through a manual calibration:
1. Follow the LED arrows on the micro:bit screen.
2. Move the joystick to the requested extreme positions (center, right, left, top, bottom).
3. Confirm each step by pressing the configured button (default is `B`). 
4. A short vibration will confirm that the position was saved.

### Data Transmission
Once initialized, the extension automatically sends the following data via radio:
* **`urcping`**: Periodic ping for check connection.
* **`urccoord`**: Packed X/Y joystick coordinates mapped to a `-100` to `100` scale.
* **`urcbtn`**: A 3-digit number representing button states.

#### Button ID Mapping (based on Numpad Layout)
* Button C = `4`
* Button D = `8`
* Button E = `2`
* Button F = `6`

## Dependencies
This extension relies on the following libraries. They should load automatically, but you can (re)load them manually if needed:
* `radio` (Built-in) - Core MakeCode library for wireless communication.
* `https://github.com/elecfreaks/pxt-joystickbit` - Hardware support for the ElecFreaks Joystick:bit.
* `https://github.com/BrickHackers/pxt-valpacker` - Packs X/Y coordinates into a single efficient radio message.
* `https://github.com/bsiever/microbit-pxt-flashstorage` - Provides persistent flash storage to save calibration data across reboots.

## Supported Targets
* for PXT/microbit