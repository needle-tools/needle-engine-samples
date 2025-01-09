import { Behaviour, GameObject, serializable, setParam } from '@needle-tools/engine';
import { SplatRenderer } from './SplatRenderer';

export class SplatRendererMenu extends Behaviour {

    @serializable(Array<string>)
    urls: string[] = [];

    start(): void {
        const label = document.createElement('label');
        label.textContent = 'Select Splat';
        const select = document.createElement('select');
        for (const url of this.urls) {
            const option = document.createElement('option');
            option.value = url;
            option.textContent = new URL(url).pathname;
            select.appendChild(option);
        }
        label.appendChild(select);
        select.addEventListener('change', () => {
            const url = select.value;
            const splatRenderer = GameObject.findObjectOfType(SplatRenderer);
            if (splatRenderer) {
                splatRenderer.load(url);
            }
        });
        this.context.menu.appendChild(label);

        const btn = document.createElement('button');
        btn.textContent = 'Download .ksplat';
        btn.addEventListener('click', () => {
            const renderer = GameObject.findObjectOfType(SplatRenderer);
            if (!renderer) {
                console.error('No SplatRenderer found');
            }
            else if (renderer.path) SplatRenderer.downloadOptimizedSplat(renderer.path);
        });
        this.context.menu.appendChild(btn);
    }
}