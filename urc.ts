// Enum for button selection
enum URCButton {
    //% block="Button A"
    A,
    //% block="Button B"
    B,
    //% block="Button A+B"
    AB,
    //% block="Logo"
    Logo
}

//% weight=95 color="#E3008C" block="Unified RC"
//% icon="\uf2ce"
namespace urc {
    // State variables
    let isInitialized: boolean = false;
    let altModeActive: boolean = false;
    let autoUpdateFlash: boolean = true;
    let deactivateJoyInAlt: boolean = false;

    // Calibration variables (defaults)
    let x_center = 512, y_center = 512;
    let x_left = 1023, x_right = 0;
    let y_top = 1023, y_bottom = 0;

    /**
     * Initializes the Unified Remote Controller.
     * Must be placed in the 'on start' block.
     */
    //% blockId=urc_init_controller 
    //% block="initialize Unified Remote Controller|confirm calibration with %calibBtn|save to flash %saveFlash|alt mode %altMode|alt mode deactivates joystick %altJoyDeact|activate alt mode with %altBtn"
    //% saveFlash.defl=true altMode.defl=false altJoyDeact.defl=true
    //% calibBtn.defl=URCButton.B altBtn.defl=URCButton.AB
    //% inlineInputMode=external
    export function initController(
        calibBtn: URCButton,
        saveFlash: boolean,
        altMode: boolean,
        altJoyDeact: boolean,
        altBtn: URCButton
    ): void {
        if (isInitialized) return;

        // Apply settings
        autoUpdateFlash = saveFlash;
        deactivateJoyInAlt = altJoyDeact;

        // Initialize hardware via Elecfreaks API
        joystickbit.initJoystickBit();
        radio.setGroup(14); // Consider exposing this as a parameter later

        // TODO: Insert Flash Storage check here. 
        // If data exists, load it. If not, trigger calibration sequence via 'calibBtn'.

        // Start background tasks ONLY after initialization
        startBackgroundTasks();

        isInitialized = true;
    }

    function in_run_calibration(x: number, y: number) {
        let updated = false;
        if (x > x_left) { x_left = x; updated = true; }
        if (x < x_right) { x_right = x; updated = true; }
        if (y < y_bottom) { y_bottom = y; updated = true; } // y_bottom is 0
        if (y > y_top) { y_top = y; updated = true; }       // y_top is 1023

        // Optional: Save to flash periodically or upon threshold if autoUpdateFlash is true
    }

    function startBackgroundTasks() {
        // Main Coordinate Transmission Loop
        loops.everyInterval(101, function () {
            if (altModeActive && deactivateJoyInAlt) {
                return; // Skip reading and sending coordinates
            }

            let urc_x = joystickbit.getRockerValue(joystickbit.rockerType.X);
            let urc_y = joystickbit.getRockerValue(joystickbit.rockerType.Y);

            in_run_calibration(urc_x, urc_y);

            // Map values and pack them
            let mapped_x = Math.map(urc_x, x_left, x_right, -100, 100);
            let mapped_y = Math.map(urc_y, y_bottom, y_top, -100, 100);

            // Note: Ensure ValPacker is properly imported in pxt.json dependencies
            radio.sendValue("urccoord", ValPacker.pack(mapped_x, mapped_y));
        });

        // Ping Loop
        loops.everyInterval(500, function () {
            radio.sendValue("urcping", 1);
        });

        // Register Button Events
        // Note: Logic needs to map configured 'altBtn' to toggle 'altModeActive' state.
        setupButtonEvents();
    }

    function setupButtonEvents() {
        // Example: Pin 12 (up)
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P12, joystickbit.ButtonType.up, function () {
            if (altModeActive) {
                radio.sendValue("urcbtn", 140);
            } else {
                radio.sendValue("urcbtn", 40);
            }
        });
        // Remainder of the button registrations...
    }
}