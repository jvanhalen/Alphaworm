The OpenShift `nodejs` cartridge documentation can be found at:

https://github.com/openshift/origin-server/tree/master/cartridges/openshift-origin-cartridge-nodejs/README.md

CURRENT SYSTEM LIMITATIONS:
https://www.openshift.com/faq/how-many-applications-can-i-deploy-and-what-resource-limitations-would-they-have

CREDITS:
http://itweek.deviantart.com/art/Knob-Buttons-Toolbar-icons-73463960 for the nice UI icons
http://opengameart.org/content/completion-sound for pick up sound
http://opengameart.org/content/retro music
http://opengameart.org/content/menu-selection-click
http://opengameart.org/content/yellow-blue-button-set nice buttons
http://opengameart.org/content/magic-buttons
http://opengameart.org/content/pd-glossy-icon-buttons
http://opengameart.org/content/aqua-buttons
http://opengameart.org/content/keyboard-keys for tablets
http://opengameart.org/content/lpc-pennomis-ui-elements

TODO:
 - more strict encapsulation in modules
 - refactoring

KNOWN PROBLEMS:
 - Input handler: WASD opens FF quick search bar -> set focus to some textfield, while game is on, to prevent this

CORRECTED PROBLEMS:
 ++ Input handler: restrict one user input per server tick (latest will be used when ticked)
 ++ Chat: prevent unauthorized user chat
