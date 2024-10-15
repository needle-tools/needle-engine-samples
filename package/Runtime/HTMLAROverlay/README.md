# AR Overlays

You can specify what HTML is only visible while in AR with useful premade classes. This sample and custom web project showcases how.

```html
<needle-engine>
    <div class="desktop ar" style="pointer-events:none;">
        <div class="positioning-container">
          <p>your content for AR and desktop goes here</p>
          <p class="only-in-ar">This will only be visible in AR</p>
        <div>
    </div>
</needle-engine>
```

See [HTML Content Overlays in AR](https://engine.needle.tools/docs/xr.html#html-content-overlays-in-ar) for more info.