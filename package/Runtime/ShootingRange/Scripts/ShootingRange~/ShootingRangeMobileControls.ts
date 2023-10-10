import { EventList, serializable } from "@needle-tools/engine";
import { MobileControls } from "firstpersoncontroller/MobileControls";

export class ShootingRangeMobileControls extends MobileControls {

    @serializable(EventList)
    onAimEnd: EventList = new EventList();

    @serializable(EventList)
    onSingleTap: EventList = new EventList();

    @serializable()
    maxShootDistance: number = 0.1;

    @serializable()
    maxShootDuration: number = 0.1;

    onEnable(): void {
        super.onEnable();
        
        const time = this.context.time;
        let timeDiff = 0;
        let lastDistance = 0;
        
        this._look?.on("start", () => {
            timeDiff = time.time;
            lastDistance = 0;
        });

        this._look?.on('move', (_, data) => { 
            lastDistance = data.distance;
        });

        this._look?.on("end", () => {
            const diff = time.time - timeDiff;
            if(lastDistance < this.maxShootDistance && diff < this.maxShootDuration) {
                this.onSingleTap.invoke();
            }
            else
                this.onAimEnd.invoke();
        });
    }
}