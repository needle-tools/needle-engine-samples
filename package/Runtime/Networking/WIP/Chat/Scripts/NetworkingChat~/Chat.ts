import { Behaviour, InputField, Mathf, Text, serializable, syncField } from "@needle-tools/engine";

// TODO: add user name selection
// TODO: is a race condition possible? (when user is typing and another user is sending message at the same time)
export class Chat extends Behaviour {
    
    // @nonSerialized
    @serializable()
    public userName?: string;

    // @nonSerialized
    @syncField(Chat.prototype.updateText)
    @serializable()
    public chatText: string = "";

    @serializable(Text)
    public chatLabel?: Text;

    @serializable(InputField)
    inputField?: InputField;

    @serializable()
    reselectInputAfterSend: boolean = true;

    awake(): void {
        // generate random user name if not set
        if(!this.userName)
            this.userName = `User (${Mathf.remap(Math.random(), 0, 1, 100, 999).toFixed(0)})`;
    }

    updateText(text: string) {
        // set text to the UI label
        if(this.chatLabel && text) {
            this.chatLabel.text = text;
        }
    }

    addTextAndClear(text: string) {

        if(text === "")
            return;

        // append new line with user name to the chat text and update UI
        this.chatText += `\n${this.userName}: ${text}`;
        this.updateText(this.chatText);

        if(this.inputField) {

            this.inputField.clear();

            if(this.reselectInputAfterSend)
                this.inputField.select();
                
            //this.inputField.text = "";

            // TODO: report
            // #1 - No way how to clar input field
            // #2 - HTML Input field is visible
        }
    }
}