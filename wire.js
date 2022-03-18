/**
 * @class Operator
 *
 */

class Wire extends EditorChild {

  origin
  target

  myPoints = [0,0,0,0,0,0,0,0]

  mouseGlobalX = 0
  mouseGlobalY = 0

  //  colors
  defaultColor = [245,161,52]
  defaultColorReversed = [0,255,0]
  hoverColor = [255,0,0]
  defaultOutline = 0
  hoverOutline = 255
  selectedOutline = this.defaultColor

  constructor (origin, target, reversed = false) {
    super(origin.globalX, origin.globalY);
    this.origin = origin
    this.reversed = reversed

    if (target) {
      this.setTarget(target)
    }

    // Wire specific listeners
		this.listenEvents = [
			...this.listenEvents,
      "ComplexNumberUpdate",
		  "OperatorUpdate",
      "WireUpdate",
		]

    //  Wire specific
    this.talkEvents = [
			...this.talkEvents,
      "WireUpdate",
		]

  }


  /**
   * @method removeFromEditor
   *
   *  Override EditorChild.removeFromEditor method.
   *
   * @param {<Object>}	editor
   *
   */
  removeFromEditor (editor) {
    super.removeFromEditor(editor)

    //  Origin - reset connected/target/origin values
    let originId = this.origin.id
    if ( !Array.isArray(editor.myNumbers[originId]) ) {
      this.origin.origin = false
      if (!this.origin.target) this.origin.connected = false
    }

    //  Target - reset connected/target/origin values
    if (this.target) {
      this.target.target = false
      if (
        this.target.type == this.target.INPUT ||
        !this.target.origin
      ) {
        this.target.connected = false
      }
    }

    //  Remove origin/target references
    this.origin = null
    this.target = null

  }


  /**
   * @method draw
   *
   *  Override EditorChild.draw().
   */
  draw ( ) {

    //  Color
    let defaultColor = this.reversed ? this.defaultColorReversed : this.defaultColor
    let color = (this.overBody || this.selected) ? this.hoverColor : defaultColor
    let outlineColor = (this.overBody) ? this.hoverOutline : (this.selected) ? this.selectedOutline : this.defaultOutline

    //  Update bezier point
    this.getMyPoints()

    //  Draw
    push();

    noFill();
    stroke(outlineColor);
    strokeWeight(24*this.viewScale);
    bezier(...this.myPoints);
    stroke(color);
    strokeWeight(12 * globalScale);
    bezier(...this.myPoints);

    pop();

  }


  /**
   * @mthod update
   *
   *  Send value from origin to target
   */
  update () {
    const {origin, target} = this.getMyChildren()
    const real = origin.getReal()
    const imaginary = origin.getImaginary()

    target.setReal(real)
    target.setImaginary(imaginary)
  }


  /**
   * @method getMyChildIds
   *
   *
   * @param {<String>} returnValue - 'originId' or 'targetId'
   * @return {<Object|Number>} - if specified ComplexNumber id, otherwise Object.
   *
   */
  getMyChildIds (returnValue) {
    const current = {
      originId: this.reversed ? this.target.id : this.origin.id,
      targetId: this.reversed ? this.origin.id : this.target.id
    }

    if (returnValue) return current[returnValue]
    else return current

  }


  /**
   * @method getMyChildIds
   *
   *
   * @param {<String>} returnValue - 'origin' or 'target'
   * @return {<Object>} - if specified, ComplexNumber instance, otherwise Object.
   *
   */
  getMyChildren (returnValue) {
    const current = {
      origin: this.reversed ? this.target : this.origin,
      target: this.reversed ? this.origin : this.target
    }

    if (returnValue) return current[returnValue]
    else return current

  }


  /**
   * @method getMyPoints
   *
   *  Store calculated bezier points in this.myPoints.
   */
  getMyPoints () {
    let targetX, targetY
    let targetDirection = 1
    let radiusScale = 0.8
    let originDirection = (this.origin.reversed !== this.reversed) ? -1 : 1
    let originX = this.origin.globalX
    let originY = this.origin.globalY + this.origin.stemHeight*originDirection + this.origin.ioRadius*radiusScale*originDirection
    //  Use target number if it exists
    if (this.target) {
      targetDirection = (this.target.reversed !== this.reversed) ? -1 : 1
      targetX = this.target.globalX
      targetY = this.target.globalY - this.target.stemHeight*targetDirection - this.target.ioRadius*radiusScale*targetDirection
    } else {
      targetX = this.mouseGlobalX
      targetY = this.mouseGlobalY
    }

    let originToTargetDistance = dist(
      originX,
      originY,
      targetX,
      targetY
    );
    let controlPointRadius = map(
      originToTargetDistance,
      0,
      300,
      0,
      300 * this.viewScale
    );

    if (controlPointRadius > 300) {
      controlPointRadius = 300;
    }

    this.myPoints = [
      originX,
      originY,
      originX,
      originY + controlPointRadius*originDirection,
      targetX,
      targetY - controlPointRadius*targetDirection,
      targetX,
      targetY
    ]
  }


  /**
   * @method setTarget
   *
   * @param {<Object>}	target - ComplexNumber instance
   *
   */
  setTarget ( target ) {
    this.target = target

    // Pass real value from origin to target
    let value = this.origin.getReal()
    this.target.setReal(value)

    //  Update number
    this.origin.connected = true
    this.target.connected = true
    this.origin.origin = true
    this.target.target = true

    //  Emit update to pass on initial values
    let event = { detail: {
      path: [this.origin.id, this.id],
      id: this.origin.id
    }}

    //  prevent overInput
    let detail = { id: this.target.id}
    this.emit('ChildOut', detail)

  }


  /**
   * @method isOverBody
   *
   *  Override EditorChild.isOverBody()
   *
   * @param {<Number>}	x
   * @param {<Number>}	y
   *
   */
  isOverBody (x, y) {
    //  Do not store mouse over if this wire hasn't been connected to a target
    if (!this.target) {
      this.overBody = false
      return
    }

    let points1 = [this.myPoints[0],this.myPoints[2],this.myPoints[4],this.myPoints[6]]
    let points2 = [this.myPoints[1],this.myPoints[3],this.myPoints[5],this.myPoints[7]]
    let nearBezPointParam = this._nearestBezPoint(10, ...this.myPoints)
    let minBezPointSoFar = dist(
      this._paramBez( nearBezPointParam, ...points1 ),
      this._paramBez( nearBezPointParam, ...points2 ),
      x,
      y
    )

    this.overBody = (minBezPointSoFar < 10) ? true : false

  }


  /**
   * @method onChildTraceNodePaths
   *
   *  Add this wire to the freeNodePaths.
   *
   * @param {<Object>}	event
   *
   */
  onChildTraceNodePaths (event) {
    const {eventOrigin, path} = event.detail
    const id = path.slice(-1).pop()
    const {originId, targetId} = this.getMyChildIds()
    let newPath = [...path]

    //  Only continue if
    //    - the event came from an Operator or Number
    //    - this wire isn't already in the path
    //    - id is target
    if (
      eventOrigin != 'Wire' &&
      !path.includes(this.id) &&
      targetId == id
    ) {
      newPath.push(this.id, originId)
      let detail = {
        eventOrigin: 'Wire',
        path: newPath
      }
      this.emit('ChildTraceNodePaths', detail)

    }
  }



  /**
   * @method onMouseMoved
   *
   *  Overrides EditorChild.onMouseMoved().
   *
   *  We need to save the global mouse position to make it
   *  available for _nearestBezPoint
   *
   * @param {<Object>}	event
   *
   */
  onMouseMoved (event) {
    super.onMouseMoved(event)

    this.mouseGlobalX = event.detail.coord[0]
		this.mouseGlobalY = event.detail.coord[1]
  }

  /**
   * @method _paramBez
   *
   *  Parametric bezier curve (cubic) (a,b,c,d are x coords only or y coords only)
   *
   * @param {<Number>}	t
   * @param {<Number>}	a
   * @param {<Number>}	b
   * @param {<Number>}	c
   * @param {<Number>}	d
   *
   * @return {<type>}
   *
   */
  _paramBez (t,a,b,c,d) {
  	return (1-t)*(1-t)*(1-t)*a+3*(1-t)*(1-t)*t*b+3*(1-t)*t*t*c+t*t*t*d
  }


  /**
   * @method _nearestBezPoint
   *
   *  Finds nearest point on bezier curve to mouse position.
   *  a-h represents standard arguments to bezier function
   *
   * @param {<Number>}	iter
   * @param {<Number>}	a
   * @param {<Number>}	b
   * @param {<Number>}	c
   * @param {<Number>}	d
   * @param {<Number>}	e
   * @param {<Number>}	f
   * @param {<Number>}	g
   * @param {<Number>}	h
   *
   * @return {<Number>}
   *
   */
  _nearestBezPoint (iter,a,b,c,d,e,f,g,h) {

    let s, lowerDist, upperDist

  	let lowerParam = 0
  	let upperParam = 1
  	let refineAmount = .5

  	for(s=0;s<iter;s++){

  		lowerDist = dist(this._paramBez(lowerParam,a,c,e,g),this._paramBez(lowerParam,b,d,f,h),this.mouseGlobalX,this.mouseGlobalY)
  		upperDist = dist(this._paramBez(upperParam,a,c,e,g),this._paramBez(upperParam,b,d,f,h),this.mouseGlobalX,this.mouseGlobalY)

  		if(upperDist<lowerDist){
  			lowerParam += refineAmount
  		}else{
  			upperParam -= refineAmount
  		}

  		refineAmount *= .5

  	}

  	lowerDist = dist(this._paramBez(lowerParam,a,c,e,g),this._paramBez(lowerParam,b,d,f,h),this.mouseGlobalX,this.mouseGlobalY)
  	upperDist = dist(this._paramBez(upperParam,a,c,e,g),this._paramBez(upperParam,b,d,f,h),this.mouseGlobalX,this.mouseGlobalY)

  	if(upperDist<lowerDist){
  		return upperParam
  	}else{
  		return lowerParam
  	}
  }

	/**
	 * @method serialize
	 * Get a static object representation of this wire
	 *
	 * @return {<Object>} the state of this wire, serialized to an object
	 */
  serialize() {
    return {
      id: this.id,
      origin: this.origin.id,
      target: this.target.id,
      reversed: this.reversed,
    }
  }

	/**
	 * @method deserialize
	 * Restore state from a static object representation of this wire
	 *
	 * @param {<Object>} state - the state of this wire, serialized to an object
	 */
  deserialize(state) {
    this.reversed = state.reversed
  }
}
