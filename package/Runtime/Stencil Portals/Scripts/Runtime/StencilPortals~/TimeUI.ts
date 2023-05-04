import { Behaviour, serializable, Text } from "@needle-tools/engine";

export class TimeUI extends Behaviour 
{
    @serializable(Text)
    label? : Text;

    update() 
    { 
        if (this.label)
        {
            const date = new Date();
            this.label.text = `${date.getHours()}:${this.padTo2Digits(date.getMinutes())}`;
        }
    }

    padTo2Digits(num: number) 
    {
        return num.toString().padStart(2, '0');
    }
}