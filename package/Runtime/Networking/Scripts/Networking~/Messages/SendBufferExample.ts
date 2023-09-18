import { Behaviour, Text, registerBinaryType, serializable } from "@needle-tools/engine";
import { SendBuffer_Model } from "./SendBuffer_Model";
import { Builder } from "flatbuffers";
import { UuidTool } from "uuid-tool";

// START MARKER network flatbuffer id register
// needs to be 4 letters exactly, a specification of flatbuffers
const msgId = "MESG";

// Register the Model factory with the message ID, so a handler registered with beginListenBinary can intersect it
registerBinaryType(msgId, SendBuffer_Model.getRootAsSendBuffer_Model);
// END MARKER network flatbuffer id register

export class SendBufferExample extends Behaviour {
    @serializable(Text)
    msgLabel?: Text;

    @serializable(Text)
    saveStateLabel?: Text;

    @serializable(Text)
    outgoingSizeLabel?: Text;

    @serializable()
    saveState: boolean = true;

    // START MARKER network flatbuffer receive
    onEnable() {
        this.context.connection.beginListenBinary(msgId, this.recieveBuffer); 
    }

    onDisable() {
        this.context.connection.stopListenBinary(msgId, this.recieveBuffer);
    }

    // we use a lambda (variable with an anonymous function) to not deal with binding
    private recieveBuffer = (receivedModel: SendBuffer_Model) => {
        if(this.msgLabel)
            this.msgLabel.text = `${receivedModel.prefix()} ${receivedModel.seconds()}`;
    }
    // END MARKER network flatbuffer receive

    // START MARKER network flatbuffer create and send
    sendBuffer() {        
        // With flatbuffers we need to create values first and then insert them into the hierarchy.
        // So the order of the keywords you should call in flatbuffer workflow is: create, start, add, end, finish
        // In other words, first, we add unique values and later we define the place they have in the hierarchy.

        // maintains a binary buffer that is later sent
        const builder = new Builder(0);        

        // create values and save their positions in the buffer
        const guidOffeset = SendBuffer_Model.createGuidVector(builder, UuidTool.toBytes(this.guid));
        const dontSave = !this.saveState; // booleans don't need to be created
        const messageOffset = builder.createString("Hello, it is ");
        const seconds = Math.floor(this.context.time.time); // numbers don't need to be created

        console.log(guidOffeset);
        // Add the positions of the previously created values to fit the scheme's structure
        SendBuffer_Model.startSendBuffer_Model(builder);
        SendBuffer_Model.addGuid(builder, guidOffeset);
        SendBuffer_Model.addDontSave(builder, dontSave);
        SendBuffer_Model.addPrefix(builder, messageOffset);
        SendBuffer_Model.addSeconds(builder, seconds);
        const endPos = SendBuffer_Model.endSendBuffer_Model(builder);
        builder.finish(endPos, msgId); // add the MsgID to the flat buffer so it can be identified upon receiving

        // send
        const payload = builder.asUint8Array();
        this.context.connection.sendBinary(payload);

        if(this.outgoingSizeLabel) {
            this.outgoingSizeLabel.text = `${payload.length} bytes`;
        }
    }
    // END MARKER network flatbuffer create and send

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