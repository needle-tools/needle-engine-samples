import { Behaviour, RoomEvents, delay, getParam, isDevEnvironment, isLocalNetwork, showBalloonMessage, syncField } from "@needle-tools/engine";


const test = getParam("testleaderboard");


declare type LeaderboardModel = {
    scores: Array<{
        name: string;
        score: number;
    }>
}

export class SimpleLeaderboard extends Behaviour {

    @syncField(SimpleLeaderboard.prototype.onDataChanged)
    data!: LeaderboardModel;

    private _ready = false;

    get ready() {
        return this._ready;
    }

    onEnable(): void {
        this.context.connection.beginListen(RoomEvents.JoinedRoom, async () => {
            await delay(100);
            // if we havent received any leaderboard state yet we assume it's the first time
            // and just create a new set of data
            const res = this.context.connection.tryGetState(this.guid);
            if (!res) {
                this.data = { scores: [] };
            }
            this._ready = true;
        });

        // this is just for testing
        if (test) {
            console.log("Enabled test leaderboard, adding random scores")
            setInterval(() => {
                this.insertScore("Player", Math.floor(Math.random() * 1000))
            }, 2000)
        }
        else if (isDevEnvironment()) {
            showBalloonMessage("You can add ?testleaderboard to the url to test the leaderboard")
        }
    }

    insertScore(name: string, score: number) {
        if (!this._ready) {
            console.warn("Cannot insert score, data not received yet")
            return;
        }
        const maxScoresToKeepTrackOf = 10;
        const scores = this.data.scores;
        while (scores.length >= maxScoresToKeepTrackOf) {
            // if the leaderboard is not full, just add the score
            this.sortScores();
            const lowest = scores.pop();
            // check if the score is lower than the lowest score
            // if it is, we just ignore it
            if (lowest!.score > score) {
                console.log(`Score ${score} is lower than ${lowest?.score} (lowest score), ignoring`)
                scores.push(lowest!);
                return;
            }
        }

        console.log("Inserting score", name, score)
        scores.push({ name, score });
        this.sortScores();
        // re-assign the field so that the syncField decorator can detect the change
        this.data = this.data;
    }

    private sortScores() {
        this.data.scores.sort((a, b) => b.score - a.score);
    }

    onDataChanged(evt) {
        console.warn("Data changed!", evt, this.data.scores);

        if (this.data.scores.length > 0) {
            const currentHighscore = this.data.scores[0];
            showBalloonMessage("HIGHSCORE - " + currentHighscore.name + ": " + currentHighscore.score)
        }

        this.dispatchEvent(new CustomEvent("changed", { detail: this.data }));
    }



}