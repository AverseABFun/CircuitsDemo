/**
 * @Class Number
 *
 */
class ComplexNumber extends EditorChild {

	NAKED = 0
	INPUT = 1
	OUTPUT = 2

	//  STATE
	wirepull = false
	connecting = false
	connected = false
	origin = false
	target = false

	// Scrubbing vars
	numAnchor
	touchDown
	travelRate = 35

	// Drawing
	stemHeight = 200
	stemWidth = 18
	ioRadius = 45
	overInputColor = 255

	//measure of bezier curve aggressiveness
	mouseToTipDistance
	controlPointRadius

	constructor(x, y, setCount = 0, setType = 0) {
		super(x, y, setType);

		// store number
		this.real = setCount;
		this.imaginary = 0;

		// Number specific listeners
		this.listenEvents = [
			...this.listenEvents,
			"Connecting",
			"Scrub",
		]

		this.talkEvents = [
			...this.talkEvents,
			"ComplexNumberUpdate",
		]
	}


	/**
	 * @method reverse
	 *
	 *	It's important for origin and target boolean values to reverse as well.
	 * 	They are used to determine if mouseOver is detected or not, arrows are
	 * 	drawn, etc.
	 */
	reverse () {
		const origin = this.origin
		const target = this.target

		this.reversed = !this.reversed
		this.origin = target
		this.target = origin
	}


	/**
   * @method drawChild
   *
   * 	Overrides EditorChild->drawChild.
   */
  drawChild () {

		if (
			this.type == this.NAKED ||
			(this.type == this.INPUT && !this.reversed) ||
			(this.type == this.OUTPUT && this.reversed)
		) {
			this.drawInput();
		}
		if (
			this.type == this.NAKED ||
			(this.type == this.OUTPUT && !this.reversed) ||
			(this.type == this.INPUT && this.reversed)
		) {
			this.drawOutput();
		}
		this.drawBody();

  }


	/**
	 * @method drawBody
	 *
	 *
	 */
  drawBody () {
    // main bubble
		if (this.selected) {
			fill(this.selectedColor);
		} else if (this.overBody) {
			fill(this.overBodyColor);
		} else {
			fill(this.color);
		}
		ellipse(0,0,this.bodyWidth,this.bodyHeight);

		//the number itself

		const out = this.real.toFixed(fixed - 1)
		const testNum = Math.pow(10, fixed - 1)
		const testPlaces = out*testNum%testNum
		const places = (testPlaces < 1) ? 0 : 2;
		const n = Number(floor(out)).toString().length + places + 1
		const size = ceil(300/(3*Math.log(n)) + 20)

		push()
		translate(0,15)
		textAlign(CENTER,CENTER);
		textSize(size);

		noStroke();
		fill(0);
		text(nfc(out, places),0,0);
		fill(255,0,0);
		pop();
  }


	/**
	 * @method drawInput
	 *
	 *
	 */
drawInput () {
		const inputDirection = this.reversed ? 1 : -1

    // Stem
		this.drawStem(inputDirection);
    push();
    translate( 0, this.stemHeight*inputDirection );

		//  Arrows
		if (
			!this.connecting &&
			!(this.connected && this.target)
		) {
			this.drawSlideArrow();
		}

		//  Circle
		this.drawIOCircle(this.overInput);
    pop();

  }


	/**
	 * @method drawOutput
	 *
	 *
	 */
  drawOutput () {
		const outputDirection = this.reversed ? -1 : 1

    // stem going down
    this.drawStem(outputDirection);

    push();
    translate( 0, this.stemHeight*outputDirection );

		//  Arrow
		this.drawOutArrow();

		//  Circle
    this.drawIOCircle(this.overOutput);
    pop();
  }


	/**
	 * @method drawOutArrow
	 *
	 *
	 */
	drawOutArrow () {
		const yDirection = this.reversed ? -1 : 1

		if (!this.wirepull)  {
      noStroke();
      fill(0);
      beginShape();
      vertex(-12, 0);
      vertex(-12, 78*yDirection);
      vertex(-33, 78*yDirection);
      vertex(0, 135*yDirection);
      vertex(33, 78*yDirection);
      vertex(12, 78*yDirection);
      vertex(12, 0);
      endShape(CLOSE);
		}
	}


	/**
	 * @method drawReversal
	 *
	 *  Dodge holes in reversal overlay drawn by Editor in it's own method drawReversal.
	 *
	 */
	drawReversal() {
		let x = this.globalX
		let y = this.globalY
		let offset = (!this.reversed) ? -this.stemHeight : this.stemHeight
		let highlight = this.overInput
		let blend = (highlight) ? BURN : SCREEN
		let fillColor = (highlight) ? 'gold' : [150,150]

		push();

		translate(x,y + offset);
		fill(fillColor);
		blendMode(blend);
		this.drawIOCircle(highlight);

		pop();
	}


  /**
   * @method drawStem
   *
   * @param {<Number>}	direction - 1 or -1
   *
   */
  drawStem (direction) {
		let xOffset = -this.stemWidth/2;
		let yOffset = 0;

		fill(this.color);
    stroke(0);
    strokeWeight(6);
    rect(xOffset,yOffset,this.stemWidth,this.stemHeight*direction);
  }


  /**
   * @method drawIOCircle
   *
   *
   */
  drawIOCircle (over = false) {
		let w = this.ioRadius*2
		let ww = w - w/3 - this.stroke/2
		let s = this.stroke
		let ss = this.stroke*2

    //Thick circle
    fill(255);
    stroke(0);
    strokeWeight(ss);
    ellipse(0,0,w,w);

    //Inner circle
    if(over){
      fill( this.color );
    } else {
      fill( this.overInputColor );
    }
    strokeWeight(s);
    ellipse(0,0,ww,ww);
  }


  /**
   * @method drawSlideArrow
   *
   *
   */
  drawSlideArrow () {
    noStroke();
    fill(0);
    beginShape();
      vertex(-135,0);
      vertex(-78,-33);
      vertex(-78,-12);
      vertex(78,-12);
      vertex(78,-33);
      vertex(135,0);
      vertex(78,33);
      vertex(78,12);
      vertex(-78,12);
      vertex(-78,33);
    endShape(CLOSE);
  }

	onConnecting (event) {
		if (this.id == event.detail.id) {
			this.connecting = true
		}
	}


	/**
	 * @method onMouseReleased
	 *
	 * @param {<Object>}	event
	 *
	 */
	onMouseReleased (event) {
		//  Reset values
		this.wirepull = false
		this.connecting = false
  }


	/**
	 * @method onTraceNodePaths
	 *
	 * 	When tracing node paths, only Naked numbers will get involved.  They'll never
	 * 	need to add themselves to the path as Wires will take care of that.  They'll
	 * 	only need to pass on events in order to keep the trace moving.  They'll do
	 * 	so in two cases:
	 * 		- they are connected to two wires
	 * 		- they are a free node at the end of a path
	 *
	 * @param {<Object>}	event
	 *
	 */
	onTraceNodePaths (event) {
		const {eventOrigin, originId, path} = event.detail
		const id = path.slice(-1).pop()

		if (
			this.type == this.NAKED &&
			this.id == id &&
			(
				((eventOrigin == 'Wire' || !eventOrigin) && this.connected) ||
				(!eventOrigin && !this.connected && originId == this.id)
			)
		) {

	    //  Record input/output paths.
			//  Follow connections outwards.
	    let detail = {
				eventOrigin: 'ComplexNumber',
	      path: path
			}

			if (
				(eventOrigin == 'Wire' && (!this.origin || !this.target)) ||
				(!eventOrigin && !this.connected)
			) {
				//  This is only necessary for individual naked numbers
				if (!path.includes(this.id)) path.push(this.id)
				detail.freeNode = this.id
				detail.freeNodePath = path
	    }

	    this.emit('ChildTraceNodePaths', detail)

    }

  }


	/**
	 * @method onScrub
	 *
	 * @param {<Object>}	event
	 *
	 */
	onScrub (event) {
		let clientX, id, mousePressedCoord

		id = event.detail.id
		clientX = event.detail.clientX
		mousePressedCoord = event.detail.mousePressedCoord

		//  Only continue if the mouse clicked on this numbers input to start
		if (id === this.id) {

			// initiate scrub variables
			if (this.touchDown != mousePressedCoord[0]) {
				this.numAnchor = this.real
				this.touchDown = mousePressedCoord[0]
			}

			// update this.real value
			let travelDistance = clientX - this.touchDown
			let real = floor(this.numAnchor + travelDistance / this.travelRate)
			this.setReal(real)

    }
	}


	/**
	 * @method onSelectArea
	 *
	 * 	Do not react to events unless NAKED.
	 *
	 * @param {<Object>}	event
	 *
	 */
	onSelectArea (event) {
		if (this.type == this.NAKED) super.onSelectArea(event)
	}


	/**
	 * @method onWirePull
	 *
	 * @param {<Object>}	event
	 *
	 */
	onWirePull (event) {
		if (this.id == event.detail.id) {
			this.wirepull = true
		}
	}


	/**
	 * @method isOverBody
	 *
	 * @param {<Number>}	x
	 * @param {<Number>}	y
	 *
	 */
	isOverBody (x, y) {
		let body = this._getBody()
		if (this.type == this.NAKED) {
			this.overBody = this._coordInCircle(x, y, body)
		} else {
			this.overBody = false
		}
	}


	/**
	 * @method isOverInput
	 *
	 * @param {<Number>}	x
	 * @param {<Number>}	y
	 *
	 */
	isOverInput (x, y) {

		if (
			!this.target &&
			(
				this.type == this.NAKED ||
				(this.type == this.INPUT && !this.reversed) ||
				(this.type == this.OUTPUT && this.reversed)
			)
		) {
 			let input = this._getInput()
			this.overInput = this._coordInCircle(x, y, input)
		} else {
			this.overInput = false
		}
	}


	/**
	 * @method isOverOutput
	 *
	 * @param {<Number>}	x
	 * @param {<Number>}	y
	 *
	 */
	isOverOutput (x, y) {

		if (
			this.type == this.NAKED ||
			(this.type == this.OUTPUT && !this.reversed) ||
			(this.type == this.INPUT && this.reversed)
		) {
 			let output = this._getOutput()
			this.overOutput = this._coordInCircle(x, y, output)
		} else {
			this.overOutput = false
		}
	}


	// wrappers for checking and setting coordinates
	getReal() { return this.real; }
	getRealPx() { return this.axisToPixelX(this.real); }
	getImaginary() { return this.imaginary; }
	getImaginaryPx() { return this.axisToPixelY(this.imaginary); }
	setReal(x) { this.real = x; }
	setRealPx(x) { this.real = this.pixelToAxisX(x); }
	setImaginary(y) { this.imaginary = y; }
	setImaginaryPx(y) { this.imaginary = this.pixelToAxisY(y); }
	shift(x,y) {
		this.real += x;
		this.imaginary += y;
	}
	shiftPx(x,y) {
		this.real = this.pixelToAxisX( this.axisToPixelX(this.real) + x );
		this.imaginary = this.pixelToAxisY( this.axisToPixelY(this.imaginary) + y );
	}
	pixelToAxisX(x) { return (x - this.viewCenter[0]) / this.viewScale; }
	pixelToAxisY(y) { return (this.viewCenter[1] - y) / this.viewScale; }
	axisToPixelX(x) { return (x * this.viewScale) + this.viewCenter[0]; }
	axisToPixelY(y) { return this.viewCenter[1] - (y * this.viewScale); }


	/**
	 * @method _getBody
	 *
	 *
	 * @return {<Object>} - circle object
	 *
	 */
	_getBody () {
		let x = this.globalX
		let y = this.globalY
		let r = this.bodyWidth/2
		let body = this._getCircle(x, y, r)

		return body
	}


	/**
	 * @method _getInput
	 *
	 *
	 * @return {<Object>} - circle object
	 *
	 */
  _getInput () {
		let yDirection = this.reversed ? -1 : 1
		let x = this.globalX
		let y = this.globalY - this.stemHeight*yDirection
		let input = this._getCircle(x,y)

    return input
  }


	/**
	 * @method _getOutput
	 *
	 *
	 * @return {<Object>} - circle object
	 *
	 */
  _getOutput () {
		let yDirection = this.reversed ? -1 : 1
		let x = this.globalX
		let y = this.globalY + this.stemHeight*yDirection
		let output = this._getCircle(x,y)

    return output
  }

	/**
	 * @method _getCircle
	 *
	 *
	 * @return {<Object>} - circle object
	 *
	 */
	_getCircle ( x, y, r = this.ioRadius ) {
		let circle = {
			x: x,
			y: y,
			r: r
		}

		return circle
	}

	/**
	 * @method serialize
	 * Get a static object representation of this number
	 *
	 * @return {<Object>} the state of this number, serialized to an object
	 */
  serialize() {
    return {
      id: this.id,
      x: this.globalX,
      y: this.globalY,
      real: this.real,
      imaginary: this.imaginary,
      reversed: this.reversed,
    }
  }

	/**
	 * @method deserialize
	 * Restore state from a static object representation of this number
	 *
	 * @param {<Object>} state - the state of this number, serialized to an object
	 */
  deserialize(state) {
    this.setPosition(state.x, state.y)
    this.real = state.real
    this.imaginary = state.imaginary
    this.reversed = state.reversed
  }
}
