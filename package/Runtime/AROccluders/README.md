# AR Occluders

Occluders are typically used in AR applications to provide a better integration between a virtual scene and a real-world environment.

For this, objects are rendered early into the depth buffer to "occlude" objects behind them, but without rendering color information, so that the camera background or backdrop is visible instead.  

This sample demonstrates using AR occluders. The Presence Platform samples show another typical usecase for occluding walls/tables in AR.