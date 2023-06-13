import { Behaviour, InputField, Text, serializable } from "@needle-tools/engine";

export class RoomManager extends Behaviour {

    @serializable(Text)
    roomLabel?: Text;

    @serializable(InputField)
    roomNameInput?: InputField;

    update(): void {
        
        if(!this.roomLabel)
            return;

        const net = this.context.connection;

        const name = net.currentRoomName || "";
        const id = net.connectionId || "";
        const view = net.currentRoomViewId || "";

        this.roomLabel.text = net.isInRoom ? `Joined: ${name} (${id}) (${view})` : "Not in a room";
    }

    
    joinRoom(): void { 
        if(!this.roomNameInput)
            return;

        this.context.connection.joinRoom(this.roomNameInput.text);
    }

    disconnectRoom(): void {
        const net = this.context.connection;

        if(net.isInRoom)
            this.context.connection.leaveRoom();
    }
}