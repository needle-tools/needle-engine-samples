import { Behaviour, Text, serializable, IModel } from "@needle-tools/engine";

export class SendMessageExample extends Behaviour {

    @serializable(Text)
    msgLabel?: Text;

    @serializable(Text)
    saveStateLabel?: Text;

    @serializable(Text)
    outgoingSizeLabel?: Text;

    @serializable()
    saveState: boolean = true;

    private msgId = "SendMessage"; 

    // START MARKER network messages receive
    onEnable() {
        this.context.connection.beginListen(this.msgId, this.recieveMessage); 
    }

    onDisable() {
        this.context.connection.stopListen(this.msgId, this.recieveMessage);
    }
    
    private recieveMessage = (receivedModel: SendMessage_Model) => {
        if(this.msgLabel) {
            this.msgLabel.text = `${receivedModel.prefix} ${receivedModel.seconds}`;
        }
    }
    // END MARKER network messages receive

    // START MARKER network messages send
    sendMessage() {
        const model: SendMessage_Model = {
            guid: this.guid,
            dontSave: !this.saveState,
            prefix: "Hello, it is ",
            seconds: Math.floor(this.context.time.time),
        };

        this.context.connection.send(this.msgId, model);

        if(this.outgoingSizeLabel) {
            const payload = new TextEncoder().encode(JSON.stringify(model));
            this.outgoingSizeLabel.text = `${payload.length} bytes`;
        }
    }
    // END MARKER network messages send

    deleteState() {
        this.context.connection.sendDeleteRemoteState(this.guid); // delete all state for this component
    }

    awake() {
        this.updateSaveStateLabel();
    }

    toggleSaveState() {
        this.saveState = !this.saveState;
        this.updateSaveStateLabel();
    }

    updateSaveStateLabel() {
        if(this.saveStateLabel)
            this.saveStateLabel.text = `Save state: ${this.saveState}`;
    }
}

// IModel implements the guid and dont_save properties which control the storing state logic on the server.
class SendMessage_Model implements IModel {
    // Unique id for the message, it is up to us to define how much unique it is. 
    // Often the use case is that this represents this instance of SendMessageExample.
    // So when we reconnect to the session we can potentially ask what was the last state for this specific SendMessageExample instance.
    guid: string = ""; 

    // optional flag which is by default false and thus if not specified the message is stored on the server. 
    // if true, it is not saved on the server.
    dontSave: boolean = false;

    // Our custom payload
    prefix: string = "";
    seconds: number = 0;
}