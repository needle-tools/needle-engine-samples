import { Behaviour, Text, serializable, IModel } from "@needle-tools/engine";

export class SendMessageExample extends Behaviour {

    @serializable(Text)
    msgLabel?: Text;

    @serializable(Text)
    saveStateLabel?: Text;

    @serializable()
    saveState: boolean = true;

    private msgId = "SendMessage"; 

    // we need to store the handler that we register so we can unregister it as well
    private handler?: any;

    onEnable() {
        this.handler ??= this.recieveMessage.bind(this); //a callback needs to be binded to this instance
        this.context.connection.beginListen(this.msgId, this.handler); 
    }

    onDisable() {
        this.context.connection.stopListen(this.msgId, this.handler);
    }
    
    recieveMessage(receivedModel: SendMessage_Model) { 
        if(this.msgLabel)
            this.msgLabel.text = receivedModel.message;
    }

    // local model property, so we don't need to create a new object everytime we want to send a message
    private cachedModel: SendMessage_Model = new SendMessage_Model();
    sendMessage() {
        this.cachedModel.guid = this.guid; // setting guid to the guid of this component ting the data 
        this.cachedModel.dont_save = !this.saveState;
        this.cachedModel.message = this.getExampleMessage();

        this.context.connection.send(this.msgId, this.cachedModel);
    }

    deleteState() {
        this.context.connection.sendDeleteRemoteState(this.guid); // delete all state for this component
    }

    awake() {
        this.updateSaveStateLabel();
    }

    getExampleMessage() { return `Hello, it is ${new Date(Date.now()).toLocaleTimeString()}!`; }

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
// Mind that you don't have to implement the IModel interface and tha you don't 
class SendMessage_Model implements IModel {
    // Unique id for the message, it is up to us to define how much unique it is. 
    // Often the usecase is that this represence this instance of SendMessageExample.
    // So when we reconnect to the session we can potentially ask what was the last state for this specific SendMessageExample instnace.
    guid: string = ""; 

    // optional flag which is by default false and thus if not specified the message is stored on the server. 
    // if true, it is not saved on the server. For this sample we do not utilize the state at all, so the flag is true.
    dont_save: boolean = true;

    // Our custom payload, more properties can follow. 
    message: string = "";
}