import { Behaviour, GameObject, serializable, setParam } from '@needle-tools/engine';
import { SplatRenderer } from './SplatRenderer';

export class SplatRendererMenu extends Behaviour {

    @serializable(Array<string>)
    urls: string[] = [];

    start(): void {
        if (this.urls.length) {
            const splatRenderer = GameObject.findObjectOfType(SplatRenderer);
            const select = document.createElement('select');
            select.style.maxWidth = `24ch`;
            for (const url of this.urls) {
                const option = document.createElement('option');
                option.value = url;
                option.textContent = `Select: ${new URL(url).pathname.split('/').pop()}`;
                select.appendChild(option);
                if(splatRenderer && splatRenderer.path === url) {
                    option.selected = true;
                }
            }
            select.addEventListener('change', () => {
                const url = select.value;
                const splatRenderer = GameObject.findObjectOfType(SplatRenderer);
                if (splatRenderer) {
                    splatRenderer.load(url);
                }
            });
            this.context.menu.appendChild(select);
        }

        const btn = document.createElement('button');
        btn.textContent = 'Download KSplat';
        btn.addEventListener('click', () => {
            const renderer = GameObject.findObjectOfType(SplatRenderer);
            if (!renderer) {
                console.error('No SplatRenderer found');
            }
            else if (renderer.path) SplatRenderer.downloadOptimizedSplat(renderer.path);
        });
        this.context.menu.appendChild(btn);
    }

    onEnable(): void {
        super.onEnable();
    }
}