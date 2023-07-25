import { getParam } from "@needle-tools/engine";
import { EventDispatcher } from "three";

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

// https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/PointerLockControls.js
// TODO: is it a good practice to maintain it's own version of PointerLock? Since we are only interested in the locking.
// TODO: is LOCK API supported on mobile/touch devices?
// TODO: add support/mode for touch devices / mobile so "IsLocked" is always true

var debug = getParam("pointerlockdebug");

// @dont-generate-component
export class PointerLock extends EventDispatcher {

    domElement: HTMLElement;

	// TODO: is this a good practice? Is there a way there would be multiple systems we would want to ask, if we are locked to
	// Perhaps multiple elements?
    public static IsLocked: boolean = false;

    _onMouseMove: (event: MouseEvent) => void;
    _onPointerlockChange: () => void;
    _onPointerlockError: () => void;

	constructor( domElement ) {

		super();

		this.domElement = domElement;

		this._onMouseMove = this.onMouseMove.bind( this );
		this._onPointerlockChange = this.onPointerlockChange.bind( this );
		this._onPointerlockError = this.onPointerlockError.bind( this );

		this.connect();
	}

	connect() {

		this.domElement.ownerDocument.addEventListener( 'mousemove', this._onMouseMove );
		this.domElement.ownerDocument.addEventListener( 'pointerlockchange', this._onPointerlockChange );
		if(debug)
			this.domElement.ownerDocument.addEventListener( 'pointerlockerror', this._onPointerlockError );

	}

	disconnect() {

		this.domElement.ownerDocument.removeEventListener( 'mousemove', this._onMouseMove );
		this.domElement.ownerDocument.removeEventListener( 'pointerlockchange', this._onPointerlockChange );
		if(debug)
			this.domElement.ownerDocument.removeEventListener( 'pointerlockerror', this._onPointerlockError );

	}

	//has to be called manually from onDestroy from a Behaviour
	dispose() { 

		this.disconnect();
	}

	async lock() {

		if(debug)
			console.log("Locking pointer");

		try {		
			await this.domElement.requestPointerLock();
		}
		catch(e) { 
			if(debug)
				console.log("Locking pointer");
		}
	}

	unlock() {

		if(debug)
			console.log("Locking pointer");

		this.domElement.ownerDocument.exitPointerLock();
	}

    onMouseMove() {

        if (PointerLock.IsLocked === false)
			return;
    
        this.dispatchEvent( _changeEvent );
    }
    
    onPointerlockChange() {
    
        if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
    
            this.dispatchEvent(_lockEvent);
            PointerLock.IsLocked = true;
        } 
		else {
    
            this.dispatchEvent(_unlockEvent);
            PointerLock.IsLocked = false;
        }
    }
    
    onPointerlockError() {
    
        console.error("PointerLock: Unable to use Pointer Lock API");
    }
}