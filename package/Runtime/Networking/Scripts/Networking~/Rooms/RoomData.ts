import { Behaviour, InputField, RoomEvents, Text, isMobileDevice, randomNumber, serializable, showBalloonMessage, syncField } from "@needle-tools/engine";

/**
 * Example of a sync field object that contains array of data for every user.
 * This can be used as a reference to create a inventory system and so on.
 * Mind that there are potential race conditions and in a p2p network, you should choose one master client that holds data.
 */
export class RoomData extends Behaviour {

    @syncField(RoomData.prototype.onModelChanged)
    private model: RoomData_Model = new RoomData_Model();

    @serializable(Text)
    displayLabel?: Text;

    @serializable(InputField)
    inputField!: InputField;

    awake(): void {
        this.onModelChanged();
    }

    updateUser() {
        this.model.guid = this.guid; // set the object guid

        let localUserData = this.model.users.find(x => x.userId == this.context.connection.connectionId);            
        if(!localUserData) {
            localUserData = new UsedData();
            this.model.users.push(localUserData);
        }

        localUserData.userId = this.context.connection.connectionId!;
        localUserData.nickname = this.inputField?.text

        this.model = this.model; // force update
    }

    private onModelChanged() {
        showBalloonMessage("Room data recieved");
        if(this.displayLabel) {
            const users = this.model.users.map(x => `${x.nickname}`).join("\n");
            this.displayLabel.text = users.length > 0 ? users : "no data";
        }
    }
}

class RoomData_Model {
    guid: string = ""; // roomId
    users: UsedData[] = [];
}

class UsedData {
    userId: string = "";
    nickname: string = "";
}