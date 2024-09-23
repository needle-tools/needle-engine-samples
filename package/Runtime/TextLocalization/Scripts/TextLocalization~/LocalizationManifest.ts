import { Behaviour, EventList, serializable } from "@needle-tools/engine";

export class LocalizedEntry {
    @serializable()
    key: string = "";
    @serializable()
    value: string = "";
}

export class LocalizationManifestEntry {
    @serializable()
    key: string = "";
    
    @serializable(LocalizedEntry)
    value?: LocalizedEntry[];
}

export class LocalizationManifest extends Behaviour {
    private _currentLanguage: string = "";
    // @nonSerialized
    get currentLanguage() {
        return this._currentLanguage;
    }
    // @nonSerialized
    set currentLanguage(value: string) {
        if (this._currentLanguage === value) return;
        this._currentLanguage = value;
        LocalizationManifest.languageChanged.invoke(value);
    }

    @serializable(LocalizationManifestEntry)
    entries?: LocalizationManifestEntry[];

    @serializable()
    defaultLanguage: string = "eng";

    //@nonSerialized
    protected lookup?: { [key: string]: { [key: string]: string } };

    static instance: LocalizationManifest;
    static languageChanged: EventList = new EventList();

    start(): void {
        LocalizationManifest.instance = this;
        this.currentLanguage = this.defaultLanguage;

        // demo
        setInterval(() => {
            const languages = this.entries![0].value!.map(lang => lang.key);
            const newVal = (languages.indexOf(this.currentLanguage) + 1) % languages.length;
            this.currentLanguage = languages[newVal];
        }, 750);
    }

    getKey(key: string): string | undefined {
        if (!this.lookup) {
            this.lookup = {};
            this.entries?.forEach(entry => {
                entry?.value?.forEach(language => {
                    this.lookup![entry.key] ??= { };
                    this.lookup![entry.key][language.key] = language.value;
                });
            });
        }

        const loc = this.lookup[key];
        if (!loc) return undefined;
        const locValue = loc[this.currentLanguage];
        return locValue;
    }
}