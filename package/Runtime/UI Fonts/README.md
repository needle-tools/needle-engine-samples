# UI Fonts

## Custom fonts

On the **Text** component you can select what font asset you want to use. There is no global default and it will always be `Ariel`.  

You can import a font by adding the *.ttf or *.otf file into your project and then assigning them to every Text component you create.

Mind that to make the **font style** option on the Text component to work, it is required to have an adequate version of the font, such as `Ariel-bold`, which you need to supply your own.

That same logic applies for [rich text](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/StyledText.html), where you need to have such font variants already in place.

---

The fonts are exporter to a texture and are not preserved as is, this means that by default only fixed set of chracters are exported from the font. To extend this set, you can use the `Font Addition Characters` component to specify what extra character you want to export.