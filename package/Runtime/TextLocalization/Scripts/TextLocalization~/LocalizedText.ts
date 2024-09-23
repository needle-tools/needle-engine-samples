import { Behaviour, getComponent, Text } from "@needle-tools/engine";
import { LocalizationManifest } from "./LocalizationManifest"

export class LocalizedText extends Behaviour {
    key: string = "";

    private label?: Text;
    private get localization() {
        return LocalizationManifest.instance;
    }
    awake(): void {
        this.label = this.gameObject.getComponent(Text)!;
        LocalizationManifest.languageChanged.addEventListener(this.updateText);
    }

    onDestroy(): void {
        LocalizationManifest.languageChanged.removeEventListener(this.updateText);
    }

    onEnable(): void {
        if (this.localization) {    
            this.updateText(this.localization.currentLanguage);
        }
    }

    private fetchedLang?: string;
    private updateText = (lang:string) => {
        if (!this.label) return;
        if (!this.localization) return;
        if (this.fetchedLang === lang) return;

        const value = this.localization.getKey(this.key);
        this.label.text = value ? value : `<color=#ff0000>ERR: ${this.key}</color>(${this.localization.currentLanguage})`;
        this.fetchedLang = lang;
    }
}