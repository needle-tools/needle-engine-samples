import { Behaviour, GameObject, getParam, serializable, setParam, setParamWithoutReload } from '@needle-tools/engine';
import { SplatRenderer } from './SplatRenderer';

export class SplatRendererMenu extends Behaviour {

    @serializable(Array<string>)
    urls: string[] = [];

    @serializable()
    downloadButton: boolean = true;

    awake(): void {
        const splatRenderer = GameObject.findObjectOfType(SplatRenderer);
        const url_param = getParam('splat');
        if(splatRenderer && url_param && typeof url_param === 'string') {
            splatRenderer.path = url_param;
        }
    }

    start(): void {

        const splatRenderer = GameObject.findObjectOfType(SplatRenderer);

        if (this.urls.length) {
            const select = document.createElement('select');
            select.style.maxWidth = `24ch`;
            for (const url of this.urls) {
                const option = document.createElement('option');
                option.value = url;
                option.textContent = `Select: ${new URL(url).pathname.split('/').pop()}`;
                select.appendChild(option);
                if (splatRenderer && splatRenderer.path === url) {
                    option.selected = true;
                }
            }
            select.addEventListener('change', () => {
                const url = select.value;
                setParamWithoutReload('splat', url);
                const splatRenderer = GameObject.findObjectOfType(SplatRenderer);
                if (splatRenderer) {
                    splatRenderer.load(url);
                }
            });
            this.context.menu.appendChild(select);
        }

        if (this.downloadButton) {
            const btn = document.createElement('button');
            btn.textContent = 'Download KSplat';
            let isDownloading = false;
            btn.addEventListener('click', () => {
                const renderer = GameObject.findObjectOfType(SplatRenderer);
                if (!renderer) {
                    console.error('No SplatRenderer found');
                }
                else if (renderer.path) {
                    isDownloading = true;
                    btn.disabled = true;
                    SplatRenderer.downloadOptimizedSplat(renderer.path).finally(() => {
                        btn.disabled = false;
                        isDownloading = false;
                    });
                }
            });
            this.context.menu.appendChild(btn);
        }
    }

    onEnable(): void {
        super.onEnable();
    }
}