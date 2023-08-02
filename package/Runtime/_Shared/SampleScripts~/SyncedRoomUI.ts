import { Behaviour, Text, serializable } from "@needle-tools/engine";

export class SyncedRoomUI extends Behaviour {
    @serializable(Text)
    connectionLabel?: Text;

    private roomId = "";
    private playerCount = 0;
    
    update() {
        const net = this.context.connection;
        
        let updateLabel = false;

        if(net.currentRoomName && net.currentRoomName !== this.roomId) {
            this.roomId = net.currentRoomName;
            updateLabel = true;
        }

        if(net.usersInRoom().length !== this.playerCount) {
            this.playerCount = net.usersInRoom().length;
            updateLabel = true;
        }

        if(updateLabel && this.connectionLabel) {
            this.connectionLabel.text = `Room: ${this.roomId}\nUsers: ${this.playerCount}\nYour id: ${net.connectionId}`;
        }
    }
}