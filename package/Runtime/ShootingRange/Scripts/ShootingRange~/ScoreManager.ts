import { Behaviour, GameObject, Mathf, RoomEvents, SyncedRoom, Text, serializable, syncField } from "@needle-tools/engine";
import { TargetHitPointRenderer } from "./TargetHitPoints";
import { Target } from "./Target";
import { Gun } from "./Gun";

// Calcualtes score, populates UI
export class ScoreManager extends Behaviour {

    @serializable()
    hitRewards: number = 1; //base reward for a hit

    @serializable()
    streakToMultiplier: number = 5; //how many streaks to have a multiplier +1

    @serializable(Text)
    scoreLabel?: Text;

    @serializable(Text)
    highscoreLabel?: Text;

    @serializable(Text)
    multiplierLabel?: Text;

    @serializable(TargetHitPointRenderer)
    hitPointRenderer?: TargetHitPointRenderer; // flying streak numbers

    private score: number = 0; // total score which is displayed 
    private multiplier: number = 1; // multiplier is calculated based on streak
    private currentStreak: number = 0; //how many hits without a miss
    private currrentScoreNumber = 0;

    @syncField(ScoreManager.prototype.updateLabel)
    private globalHighscore = 0;

    awake() {
        const room = GameObject.findObjectOfType(SyncedRoom);
        if (room) {
            room.tryJoinRoom();
        }
        this.updateLabel();

        Gun.onHitTarget.addEventListener((sender: object, target: Target) => this.onHitTarget(sender, target));
        Gun.onMiss.addEventListener(() => this.resetStreak());
    }

    // Dont generate this method via codegen because then we can not assign it to our UnityEvent
    // and we pass in the method arguments dynamically from typescript
    // The generated .cs file is also modified
    //@nonSerialized
    onHitTarget(_sender: object, target: Target) {
        const distanceToPlayer = target.worldPosition.distanceTo(this.context.mainCameraComponent!.worldPosition);
        const resultingPoints = this.incrementStreak(distanceToPlayer);
        this.hitPointRenderer?.onHitTarget(_sender, target, resultingPoints);
    }

    resetStreak() {
        this.currentStreak = 0;
        this.updateMultiplier();
        this.updateLabel();
    }

    incrementStreak(distance : number) {
        this.currentStreak++;
        this.updateMultiplier();

        const minDistance = 10;
        const maxDistance = 40;
        const distanceFactor = Mathf.remap(Mathf.clamp(distance, minDistance, 100), minDistance, maxDistance, 1, 20);

        const points = (this.hitRewards * distanceFactor) * this.multiplier;
        this.score += points;

        if (this.score > this.globalHighscore) {
            this.globalHighscore = this.score;
        }

        this.updateLabel();
        return points;
    }

    updateMultiplier() {
        this.multiplier = 1 + Math.floor(this.currentStreak / this.streakToMultiplier);
    }

    resetScore() {
        this.score = 0;
    }

    update(): void {
        this.currrentScoreNumber = Mathf.lerp(this.currrentScoreNumber, this.score, this.context.time.deltaTime);
        this.updateLabel();
    }

    updateLabel() {
        if (this.scoreLabel)
            this.scoreLabel.text = `${this.currrentScoreNumber.toFixed(0)} points`;

        if (this.multiplierLabel) {
            // if (this.multiplier > 1)
                this.multiplierLabel.text = `${this.multiplier}x`;
            // else this.multiplierLabel.text = "";
        }

        if (this.highscoreLabel) {
            const txt = `Highscore: ${this.globalHighscore.toFixed(0)} points`;
            this.highscoreLabel.text = txt;
        }
    }
}