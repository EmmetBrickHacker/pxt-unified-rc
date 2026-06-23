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

//% weight=95 color="#E3008C" icon="\uf2ce" block="Unified RC"
namespace urc {
    // State variables with user-defined default values
    let isInitialized: boolean = false;
    let altModeActive: boolean = false;
    let autoUpdateFlash: boolean = true;
    let deactivateJoyInAlt: boolean = true; // Fixed to true as requested
    let pingInt: number = 500;
    let altToggleButton: URCButton = URCButton.AB;
    let calibrationButton: URCButton = URCButton.B;

    // Calibration variables (defaults)
    let x_center = 512, y_center = 512;
    let x_left = 1013, x_right = 10;
    let y_top = 1013, y_bottom = 10;

    /**
     * Initializes the Unified Remote Controller with default settings.
     * Must be placed in the 'on start' block.
     * @param pingInterval ping interval in ms, eg: 100, 200, 500, 1000, 2000
     * @param radioGroup radio group (0-255, 256 to ignore)
     */
    //% blockId=urc_init_controller 
    //% block="initialize Unified Remote Controller | with ping interval (ms) $pingInterval||radio set group $radioGroup"
    //% pingInterval.shadow="timePicker" pingInterval.defl=500
    //% radioGroup.min=0 radioGroup.max=256 radioGroup.defl=256
    //% expandableArgumentMode="toggle" inlineInputMode=external
    //% weight=100
    export function initController(pingInterval: number = 500, radioGroup: number = 256): void {
        if (isInitialized) return;

        pingInt = pingInterval;

        joystickbit.initJoystickBit();

        // Vyhodnocení hlídací hodnoty
        if (radioGroup >= 0 && radioGroup <= 255) {
            radio.setGroup(radioGroup);
        }

        let flashHasData = loadCalibration();
        if (!flashHasData) {
            if (autoUpdateFlash) saveCalibration();
        }

        startBackgroundTasks();
        isInitialized = true;
    }
    // --- ADVANCED CONFIGURATION BLOCKS ---

    /**
     * Configures the Alternative Mode.
     * @param enable Enable alternative mode
     * @param deactivateJoy Deactivate joystick input when alt mode is active
     * @param toggleBtn Button combination to toggle alt mode
     */
    //% blockId=urc_config_altmode
    //% block="configure alternative mode: | enable $enable deactivate joystick $deactivateJoy toggle button $toggleBtn"
    //% enable.shadow="toggleOnOff" enable.defl=false
    //% deactivateJoy.shadow="toggleOnOff" deactivateJoy.defl=true
    //% toggleBtn.defl=URCButton.AB
    //% expandableArgumentMode="toggle"  inlineInputMode=external
    //% advanced=true
    export function configureAltMode(
        enable: boolean = false,
        deactivateJoy: boolean = true,
        toggleBtn: URCButton = URCButton.AB
    ): void {
        altModeActive = enable;
        deactivateJoyInAlt = deactivateJoy;
        altToggleButton = toggleBtn;
    }

    /**
      * Configures Calibration settings.
      * @param confirmBtn Button to confirm calibration steps
      * @param saveFlash Enable saving calibration to flash memory
      */
    //% blockId=urc_config_calibration
    //% block="configure calibration: | confirm button $confirmBtn save to flash $saveFlash"
    //% confirmBtn.defl=URCButton.B 
    //% saveFlash.shadow="toggleOnOff" saveFlash.defl=true
    //% advanced=true  inlineInputMode=external
    export function configureCalibration(
        confirmBtn: URCButton = URCButton.B,
        saveFlash: boolean = true
    ): void {
        calibrationButton = confirmBtn;
        autoUpdateFlash = saveFlash;
    }

    // --- INTERNAL FUNCTIONS ---

    /**
     * Loads calibration values using bsiever/microbit-pxt-flashstorage.
     * @return true if data was successfully loaded, false if no previous data exists.
     */
    function loadCalibration(): boolean {
        let xc = flashstorage.get("urc_xc");
        // flashstorage returns an empty string if the key does not exist
        if (xc === "") {
            return false;
        }

        x_center = parseInt(xc);
        y_center = parseInt(flashstorage.get("urc_yc"));
        x_left = parseInt(flashstorage.get("urc_xl"));
        x_right = parseInt(flashstorage.get("urc_xr"));
        y_top = parseInt(flashstorage.get("urc_yt"));
        y_bottom = parseInt(flashstorage.get("urc_yb"));

        return true;
    }

    /**
     * Saves current calibration values using bsiever/microbit-pxt-flashstorage.
     */
    function saveCalibration(): void {
        // Values must be stored as strings using put()
        flashstorage.put("urc_xc", x_center.toString());
        flashstorage.put("urc_yc", y_center.toString());
        flashstorage.put("urc_xl", x_left.toString());
        flashstorage.put("urc_xr", x_right.toString());
        flashstorage.put("urc_yt", y_top.toString());
        flashstorage.put("urc_yb", y_bottom.toString());
    }
    
    // --- MANUAL CALIBRATION ---
    /*
     * auxiliary functions for manual calibration
     */
    function isButtonPressed(btn: URCButton): boolean {
        switch (btn) {
            case URCButton.A: return input.buttonIsPressed(Button.A);
            case URCButton.B: return input.buttonIsPressed(Button.B);
            case URCButton.AB: return input.buttonIsPressed(Button.AB);
            case URCButton.Logo: return input.logoIsPressed();
            default: return false;
        }
    }

    function waitUntilClick(btn: URCButton): void {
        // Wait until the button is pressed
        while (!isButtonPressed(btn)) {
            basic.pause(20);
        }
        // Wait until the button is released to prevent skipping steps
        while (isButtonPressed(btn)) {
            basic.pause(20);
        }
        // Haptic feedback: Short vibration to confirm the step
        joystickbit.Vibration_Motor(100);
    }
    
    /*
     * main function for manual calibration
     */
    function runManualCalibration(btn: URCButton): void {
        // Step 1: Center position calibration (Keep joystick idle)
        basic.showLeds(`
            . . . . .
            . . # . .
            . # # # .
            . . # . .
            . . . . .
            `);
        waitUntilClick(btn);
        y_center = joystickbit.getRockerValue(joystickbit.rockerType.Y);
        x_center = joystickbit.getRockerValue(joystickbit.rockerType.X);

        // Step 2: Right boundary calibration (Push joystick all the way right)
        basic.showLeds(`
            . . # . .
            . . . # .
            # # # # #
            . . . # .
            . . # . .
            `);
        waitUntilClick(btn);
        x_right = joystickbit.getRockerValue(joystickbit.rockerType.X);

        // Step 3: Left boundary calibration (Push joystick all the way left)
        basic.showLeds(`
            . . # . .
            . # . . .
            # # # # #
            . # . . .
            . . # . .
            `);
        waitUntilClick(btn);
        x_left = joystickbit.getRockerValue(joystickbit.rockerType.X);

        // Step 4: Top boundary calibration (Push joystick all the way up)
        basic.showLeds(`
            . . # . .
            . # # # .
            # . # . #
            . . # . .
            . . # . .
            `);
        waitUntilClick(btn);
        y_top = joystickbit.getRockerValue(joystickbit.rockerType.Y);

        // Step 5: Bottom boundary calibration (Push joystick all the way down)
        basic.showLeds(`
            . . # . .
            . . # . .
            # . # . #
            . # # # .
            . . # . .
            `);
        waitUntilClick(btn);
        y_bottom = joystickbit.getRockerValue(joystickbit.rockerType.Y);

        // Calibration complete indicator
        basic.showIcon(IconNames.Yes);
        basic.pause(400);
        basic.clearScreen();
    }

    function in_run_calibration(x: number, y: number) {
        let updated = false;
        if (x > x_left) { x_left = x; updated = true; }
        if (x < x_right) { x_right = x; updated = true; }
        if (y < y_bottom) { y_bottom = y; updated = true; }
        if (y > y_top) { y_top = y; updated = true; }

        if (updated && autoUpdateFlash) {
            saveCalibration();
        }
    }

    function startBackgroundTasks() {
        loops.everyInterval(101, function () {
            if (altModeActive && deactivateJoyInAlt) return;

            let urc_x = joystickbit.getRockerValue(joystickbit.rockerType.X);
            let urc_y = joystickbit.getRockerValue(joystickbit.rockerType.Y);

            in_run_calibration(urc_x, urc_y);

            let mapped_x = Math.map(urc_x, x_left, x_right, -100, 100);
            let mapped_y = Math.map(urc_y, y_bottom, y_top, -100, 100);

            radio.sendValue("urccoord", ValPacker.pack(mapped_x, mapped_y));
        });

        loops.everyInterval(pingInt, function () {
            radio.sendValue("urcping", 1);
        });

        setupButtonEvents();
    }

    /* 
     *  buttons        numbers (motivated by numeric keyboard)
     *  =======        =======
     *    (D)           [ 8 ]
     * (C)   (F)   [ 4 ]     [ 6 ]
     *    (E)           [ 2 ]
     */
    function setupButtonEvents() {
        // Helper function to assemble the 3-digit code and send it via radio
        function sendButtonMessage(buttonId: number, isDown: boolean) {
            /* KEY FIX: 
             * If Joystick:bit has not been initialized yet, 
             * we ignore the signals from the pins caused by hardware startup. 
             */
            /* SUSPECTED CAUSE OF MALFUNCTION:
             * When calling joystickbit.initJoystickBit(), 
             * the pins are set to the correct mode(pull - up / pull - down).
             * This state transition(voltage fluctuation on the pins) is interpreted 
             * by the library as a button press or release, even if the user has not touched anything.
             */
            if (!isInitialized) return;
            
            let modeDigit = altModeActive ? 100 : 0; // Hundreds: 100 for alt mode, 0 for standard mode
            let actionDigit = isDown ? 1 : 0;       // Units: 1 for pressed (down), 0 for released (up)

            let finalValue = modeDigit + buttonId + actionDigit;
            radio.sendValue("urcbtn", finalValue);
        }

        // Button C (Pin P12) - Tens digit: 4
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P12, joystickbit.ButtonType.down, function () {
            sendButtonMessage(40, true);
        });
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P12, joystickbit.ButtonType.up, function () {
            sendButtonMessage(40, false);
        });

        // Button D (Pin P13) - Tens digit: 8
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P13, joystickbit.ButtonType.down, function () {
            sendButtonMessage(80, true);
        });
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P13, joystickbit.ButtonType.up, function () {
            sendButtonMessage(80, false);
        });

        // Button E (Pin P14) - Tens digit: 2
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P14, joystickbit.ButtonType.down, function () {
            sendButtonMessage(20, true);
        });
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P14, joystickbit.ButtonType.up, function () {
            sendButtonMessage(20, false);
        });

        // Button F (Pin P15) - Tens digit: 6
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P15, joystickbit.ButtonType.down, function () {
            sendButtonMessage(60, true);
        });
        joystickbit.onButtonEvent(joystickbit.JoystickBitPin.P15, joystickbit.ButtonType.up, function () {
            sendButtonMessage(60, false);
        });

    }
}