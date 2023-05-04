namespace Needle
{
    public abstract class EditorMaskUtility
    {
        public abstract string[] Masks { get; }
        public abstract string GetMaskAtIndex(int index);
        public abstract void SetMaskAtIndex(int index, string value, bool apply = true);
    }
}
