# Player Framework
A player is the character that the user controls. That character has to handle input, drive the camera, interact with the world and animate itself.

It is common that different players behave similarly but still need custom logic which separates them. For example a tank player and an aeroplane player. These 2 players drive their cameras in the same way, but have different inputs and move differently. 

The Player Framework solves that by separating unique systems into modules. 

