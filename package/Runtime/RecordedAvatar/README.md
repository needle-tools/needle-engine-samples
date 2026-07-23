# Recorded Avatars

Animate a character by performing it in VR. Using a headset's own eye, hand, and mouth tracking, you can record a full upper-body performance and play it back on the web as an animated avatar — no keyframing required.

This sample shows the playback result. The recording itself is done in a separate Quest app, [Avatar Recorder](https://www.meta.com/en-gb/experiences/6145925042141671/) (Quest 2, Quest Pro, and Quest 3 via AppLab), where you can record, trim, and export — with your Meta Avatar or just the bone animation, and optional audio. Eye and face capture needs a Quest Pro in good lighting.

In Unity, a Timeline keeps the exported `.glb` animation and `.wav` audio in sync. Since browsers only play sound after a user interaction, playback starts on the first click.
