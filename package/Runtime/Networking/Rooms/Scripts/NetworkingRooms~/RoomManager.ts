import { Behaviour, InputField, LogType, Text, serializable, showBalloonMessage } from "@needle-tools/engine";

export class RoomManager extends Behaviour {

    @serializable(Text)
    roomLabel?: Text;

    @serializable(Text)
    usersLabel?: Text;

    @serializable(InputField)
    roomNameInput?: InputField;

    // bad practise to update UI every frame, it is not recommended
    update(): void {
        
        if(!this.roomLabel || !this.usersLabel)
            return;

        const net = this.context.connection;

        const name = net.currentRoomName || "";
        const id = net.connectionId || "";
        const view = net.currentRoomViewId || "";

        this.roomLabel.text = net.isInRoom ? `Joined:\n${name}\n(${id}) (${view})\n${net.currentLatency}ms` : "Not in a room";

        const usersList = net.usersInRoom().join("\n");
        const usersText = usersList.length > 0 ? usersList : "no users";
        this.usersLabel.text = net.isInRoom ? usersText : "";
    }

    joinRoom(): void { 
        const net = this.context.connection;

        if(!this.roomNameInput)
            return;

        if(net.isInRoom)
            showBalloonMessage("You are already in a room, you have to leave it first!", LogType.Error);
        else
            net.joinRoom(this.roomNameInput.text);
    }

    disconnectRoom(): void {
        const net = this.context.connection;

        if(net.isInRoom)
            net.leaveRoom();
    }
}