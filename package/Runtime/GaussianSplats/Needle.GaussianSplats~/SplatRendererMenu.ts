import { Behaviour, GameObject, serializable, setParam } from '@needle-tools/engine';
import { SplatRenderer } from './SplatRenderer.js';

export class SplatRendererMenu extends Behaviour {
    
    @serializable(Array<string>)
    urls: string[] = [];

    onEnable(): void {
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
            setParam('url', select.value);
        });
        this.context.menu.appendChild(label);
    }
}