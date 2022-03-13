/**
  *    @class Editor
  *
  *     This class controls everything that manipulates the editor stage.
  *     It passes events down to it's children - numbers and operators - and listens
  *     for their updates, which are emitted as events.
  */
class Editor extends CanvasChild {

  nodeId
  canvas

  //  Store Children Numbers and Connections
  idIterator = 0;
  myChildren = [];
  myNumbers = {};
  myOperators = {};
  myWires = [];
  freeNodes = [];
  freeNodePaths = [];
  selectedNodes = [];
  unselectedNodes = [];
  overChildren = [];
  overInputs = [];
  overOutputs = [];

  //  View bounds and scale
  viewWidth = document.documentElement.clientWidth;
  viewHeight = document.documentElement.clientHeight;
  viewAspect = this.viewWidth/this.viewHeight
  viewCenter = [this.viewWidth/2, this.viewHeight/2]
  viewScaleStart = this.viewScale = this.viewScaleTarget = this.viewScalePrevious = globalScale ? globalScale : 1
  scaleMax = 2
  scaleMin = .025

  //  Mouse
  mouseEvents = {
    Connecting: "Connecting",
    Duplicate: "Duplicate",
    Idle: "Idle",
    MousePressed: "MousePressed",
    Move: "Move",
    Pan: "Pan",
    TraceNodePaths: "TraceNodePaths",
    Scale: "Scale",
    Scrub: "Scrub",
    SelectArea: "SelectArea",
    WirePull: "WirePull",
  }
  mouseState = this.mouseEvents.Idle;
  mouseOver = false;
  mouseClickDelay = mouseClickDelay ? mouseClickDelay : 300;
  mousePressVarsDefault = {
    coord: false,
    coordGlobal: false,
    over: {
      button: false,
      canvas: false,
      children: [],
      inputs: [],
      outputs: []
    },
    timestamp: false,
    wire: false
  }
  mousePressVars = this.mousePressVarsDefault
  mouseReleaseVars = {
    timestamp: false
  }

  // mode-switch boolean, for going into state of switching a dependency
  reversing = false;

  //  Colors and Weights
  backgroundColor = [255,255,200];
  gridLineColor = [183,205,170];
  gridLineWeight = 1.5;

  //  Grid
  childSize = 100;
  gridSize = this.childSize*4;
  stageSize = this.gridSize*(this.scaleMax/this.scaleMin);

  // Serialization
  deserializing

  constructor (id) {
    super()
    this.nodeId = id;
  }

  /**
   * @method setup
   *
   * @see https://p5js.org/reference/#/p5/setup
   */
  setup () {
    let p = this

    //  Create p5 canvas
    this.canvas = createCanvas(this.viewWidth,this.viewHeight, this.nodeId);

    //  Set up all globally scoped p5 functions with event argument
    [
      'doubleClicked',
      'keyReleased',
      'mouseClicked',
      'mouseDragged',
      'mouseMoved',
      'mousePressed',
      'mouseReleased',
      'mouseWheel'
    ].forEach((item, i) => {
      window[item] = function (event) {
        return p[item](event)
      }
    });

    //  Store mouseover state
    //    - We will use this to limit interactivity to when canvas is visible and mouse is over
    this.canvas.mouseOver(function (event) {
      //  The mouse is over the canvas
      p.mouseOver = true
      //  The canvas is invisible so it doesn't matter
      let display = window.getComputedStyle(this.canvas, null).getPropertyValue('display')
      if (display == 'none') p.mouseOver = false
    })
    this.canvas.mouseOut(function (event) {
      p.mouseOver = false
    });

    // Read URL and deserialize if a URL state object is present
    const obj = this._readURL()
    if (obj)
      this._deserialize(obj)
  }


  /**
   * @method draw
   *
   *
   *  @see https://p5js.org/reference/#/p5/draw
   */
  draw () {
    //  outer background
    background( 'grey' );
    //  center
    this.setCenter()
    //  set scale
    this.setViewScale()
    //  draw stage bg
    this.drawStageBackground()
    //  draw grid
    this.drawGrid()
    //  draw children
    this.drawChildren()
    //  render cursor
    this.drawCursor()
    //  render select box
    this.drawSelect()
    //  render reversal overlay
    this.drawReversal()
    //  keep those values moving...
    this.operate()
  }


  drawCursor () {
    cursor(ARROW);
    if (
      (this.overInputs.length > 0 || this.mouseState == this.mouseEvents.Scrub) &&
      this.mouseState != this.mouseEvents.Connecting &&
      !this.reversing
    ) {
      cursor("ew-resize");
    }
  }


  /**
   * @method drawGrid
   *
   *  Renders grid lines.
   */
  drawGrid () {
    let s = this.stageSize*4

    push();

    stroke(this.gridLineColor);
    strokeWeight(this.gridLineWeight);
    for (var x = -s; x <= s; x += this.gridSize) {
      line(x, -s, x, s);
    }
    for (var y = -s; y <= s; y += this.gridSize) {
      line(-s, y, s, y);
    }
	  circle(0, 0, this.childSize);

    pop();

  }

  drawChildren () {
    const eChildren = this.myChildren[Symbol.iterator]()
    for (let child of eChildren) {
      if (child) child.draw()
    }
  }

  drawReversal () {
    if (this.reversing) {
      push();

      //  draw overlay
      fill(150,150);
      rect( -this.stageSize, -this.stageSize, this.stageSize*2, this.stageSize*2 );

      //  draw free nodes
      this.freeNodes.forEach((nodeId, i) => this.myChildren[nodeId].drawReversal() );

      pop();
    }
  }

  drawSelect () {
    if ( this.mouseState == 'SelectArea') {
      //  We need to work against the view scale
      let selectOrigin = this._coordCanvasToGlobal(...this.mousePressVars.coord)
      let mouse = this._coordCanvasToGlobal()

      //draw rectangle
      push();
      noStroke();
  		fill(150,150);
  		rectMode(CORNERS);
  		rect(
        selectOrigin[0],
        selectOrigin[1],
        mouse[0],
        mouse[1]
      );
      pop();
    }
  }


  /**
   * @method drawStageBackground
   *
   *
   */
  drawStageBackground () {
    let w = this.viewAspect

    push();
    fill( this.backgroundColor );
    rect( -this.stageSize, -this.stageSize, this.stageSize*2, this.stageSize*2 );
    pop();
  }


  /**
   * @method setBackground
   *
   * @param {<Array>}	color - rgb color array
   *
   */
  setBackground (color) {

    if (color instanceof Array && color.length == 3) {
      this.backgroundColor = color
    } else {
      console.log("Error: incorrect color format", color)
    }

  }


  /**
   * @method setCenter
   *
   *  Constrain the center offset to stay on the board.
   */
  setCenter () {
    let zeroX = this.viewWidth/2*this.viewScale
    let zeroY = this.viewHeight/2*this.viewScale
    let minX = this.viewWidth/2 - zeroX - this.stageSize*this.viewScale
    let maxX = this.viewWidth/2 + zeroX + this.stageSize*this.viewScale
    let minY = this.viewHeight/2 - zeroY - this.stageSize*this.viewScale
    let maxY = this.viewHeight/2 + zeroY + this.stageSize*this.viewScale

    //  Save center coords
    this.viewCenter = [
      constrain(this.viewCenter[0], minX, maxX),
      constrain(this.viewCenter[1], minY, maxY)
    ];

    //  Make it so
    translate(...this.viewCenter);
  }



  setChildSelected (childId = this.selectedNodes.slice(), select = true, emit = true) {

    //  For convenience we can skip the first parameter
    if (typeof(childId) == 'boolean') {
      emit = select
      select = childId
      childId = this.selectedNodes.slice()
    }

    //  Accept multiple
    if (Array.isArray(childId)) {
      childId.forEach((cId, i) => {
        this.setChildSelected(cId, select, emit)
      });
      return
    }

    //  Toggle selection
    let detail = { id: childId }
    let eventName = (select) ? 'Select' : 'Deselect'
    let indexOf = this.selectedNodes.indexOf(childId)
    if (select && indexOf == -1) this.selectedNodes.push(childId)
    if (!select && indexOf > -1) this.selectedNodes.splice(indexOf, 1)

    //  Emit to children
    if (emit) this.emit(eventName, detail)

    //    - include operator inputs and outputs
    if (childId in this.myOperators) this.myOperators[childId].forEach((id, i) => {
      this.setChildSelected(id, select, emit)
    });
  }


  /**
   * @method setGridLineColor
   *
   * @param {<type>}	color - rgb color array
   *
   */
  setGridLineColor (color) {

    if (color instanceof Array && color.length == 3) {
      this.gridLineColor = color
    } else {
      console.log("Error: incorrect color format", color);
    }

  }

  setMouseState (state) {
    this.mouseState = this.mouseEvents[state]
  }


  /**
   * @method setViewScale
   *
   *
   */
  setViewScale () {
    scale(this.viewScale);
  }


  /**
   * @method addChild
   *
   * @param {<String>}	type - should name a class that extends EditorChild class
   * @param {<Array>}	coord - operator position. Defaults to mouse position.
   *
   * @return {<Object>} - created child
   *
   */
  addChild (type = "ComplexNumber", coord = this._coordCanvasToGlobal(), etc = [] ) {
    //  Test to make sure this operator type exists
    let makeChild = eval(type)
    let child = {}
    let childArgs = coord.concat(etc)

    if (typeof makeChild === 'function') {
      //  Create Instance
      child = new makeChild(...childArgs)

      //  Set Id
      child.setId(this.idIterator)
      this.idIterator++

      //  Pass on necessary values
      if (typeof child.addToEditor === 'function') child.addToEditor(this)

      //  Store
      this.myChildren[child.id] = child
    }

    return child
  }


  /**
   * @method addNumber
   *
   * @param {<String>}	type - 0, 1, 2.  Naked, Input, or Output.
   * @param {<Array>}	coord - operator position. Defaults to mouse position.
   *
   */
  addNumber (type = 0, setCount = 0, coord = this._coordCanvasToGlobal()) {
    let num = this.addChild("ComplexNumber", coord, [setCount, type])

    console.log('Creating number. myNumbers:', this.myNumbers)

    //  Start Naked Numbers in Move mode
    if (type === 0 && !this.deserializing) {
      this.overChildren = []
      this.overChildren[num.id] = num.id
    }

    //  Store Reference
    this.myNumbers[num.id] = num.id

    // Save state to URL
    if (!this.deserializing && type == 0)
      this._writeURL()

    return num
  }


  /**
   * @method addOperator
   *
   * @param {<String>}	type - should name a class that extends Operator class
   * @param {<Array>}	coord - operator position. Defaults to mouse position.
   *
   */
  addOperator (type = "Adder", coord = this._coordCanvasToGlobal() ) {
    let op = this.addChild(type, coord)

    //  Add Inputs and outputs
    console.log('Creating operator. myNumbers:', this.myNumbers)
    let input1 = this.addNumber(1)
    let input2 = this.addNumber(1)
    let output = this.addNumber(2)
    op.addInput(input1)
    op.addInput(input2, 2)
    op.addOutput(output)

    //  Iterate
    op.iterate()

    //  Start Operators in Move mode
    if (!this.deserializing) {
      this.overChildren = []
      this.overChildren[op.id] = op.id
    }

    //  Store References
    this.myOperators[op.id] = [input1.id, input2.id, output.id]

    // Save state to URL
    if (!this.deserializing)
      this._writeURL()

    return op
  }


  /**
   * @method addWire
   *
   *  Connect an input to an output.
   *  Storage format is originId => [targetId, targetId, targetId ...].
   *  This is called by mouseReleased.
   */
  addWire (originId = this._getChildRef(this.mousePressVars.over.outputs)) {
    //  Create Wire
    let origin = this.myChildren[originId]
    let wire = this.addChild('Wire', [origin])

    //  Store id for connection
    this.mousePressVars.wire = wire.id

  }

  /**
   * @method connectWire
   *
   * @param {<Number>}	targetId - EditorChild.id property which is also the array key in this.myChildren
   *
   */
  connectWire (targetId = this._getChildRef(this.overInputs)) {
    let wireId = this.mousePressVars.wire

    if (wireId) {
      //  add wire target
      this.myChildren[wireId].setTarget(this.myChildren[targetId])
      let originId = this.myChildren[wireId].origin.id
      //  store wire in myWires
      this.myWires[wireId] = [originId, targetId]
      //  store wire references in myNumbers
      this.myWires[wireId].forEach((id, i) => {
        if (this.myNumbers[id] == id) this.myNumbers[id] = []
        this.myNumbers[id].push(wireId)
      });

      //  delete reference to prevent wire deletion in mouseReleased
      this.mousePressVars.wire = false
    }
  }


  /**
   * @method removeChild
   *
   * @param {<Number>}	childId - EditorChild.id property which is also the array key in this.myChildren
   *
   */
  removeChild ( childId = this.selectedNodes.slice() ) {
    let detail = { id: childId }

    //  Accept multiple ids
    if ( Array.isArray(childId) ) childId.forEach( (cId) => this.removeChild(cId) );

    //   Operators
    //    - include operator inputs and outputs
    if (childId in this.myOperators) {
      this.myOperators[childId].forEach((id, i) => {
        this.removeChild(id)
      });
      this.myOperators[childId] = null
    }

    //   Numbers
    //    - include wires attached to deleting numbers
    if (childId in this.myNumbers) {
      if ( Array.isArray(this.myNumbers[childId]) ) {
        this.myNumbers[childId].forEach((wireId, i) => {
          if (childId !== wireId) this.removeChild(wireId)
        });
      }
      this.myNumbers[childId] = null
    }

    //   Wires
    //    - remove wire references from numbers
    if (childId in this.myWires) {
      this.myWires[childId].forEach((numId, i) => {
        if (
          Array.isArray(this.myNumbers[numId]) &&
          this.myNumbers[numId].includes(childId)
        ) {
          let n = this.myNumbers[numId].findIndex( (el) => el == childId )
          this.myNumbers[numId].splice(n, 1)
        }
        //  if number has no more wire refs, return to numId => numId
        if (
          Array.isArray(this.myNumbers[numId]) &&
          this.myNumbers[numId].length == 0
        ) {
          this.myNumbers[numId] = numId
        }
      });
      this.myWires.splice(childId, 1)
    }

    //  Unselect and Delete
    if (this.myChildren[childId]) {
      if (this.selectedNodes.includes(childId)) {
        let indexOf = this.selectedNodes.indexOf(childId)
        this.selectedNodes.splice(indexOf, 1)
      }
      if (typeof this.myChildren[childId].removeFromEditor === 'function') this.myChildren[childId].removeFromEditor(this)
      this.myChildren[childId] = null
    }

  }


  /**
   * @method operate
   *
   *  Continually update numbers connected to wires and continually run operators.
   *
   *  Wires first.  Then operators.
   */
  operate() {
    this.myWires.forEach((wire, wireId) => {
      if (this.myChildren[wireId])
        this.myChildren[wireId].update()
    })

    for (const [operator, opId] of Object.entries(this.myOperators)) {
      if (this.myChildren[opId])
        this.myChildren[opId].iterate()
    }
  }


  /**
   * @method zoom
   *
   * @param {<Number>}	delta - zoom direction, positive for zoom out, negative for zoom in
   * @param {<Boolean>}  offset - offset the zoom to track the mouse position
   *
   */
  zoom (delta = 1, offset = false) {
    // determine scale and store
    this.viewScaleTarget -= delta

    // keep scale within reasonable bounds

    this.viewScaleTarget = constrain(this.viewScaleTarget, this.scaleMin, this.scaleMax)
    this.viewScale += (this.viewScaleTarget - this.viewScale)*0.4
    this.viewScale = constrain(this.viewScale,this.scaleMin, this.scaleMax)

    // offset viewCenter to keep mouseX/Y at the same coordinates
    if (offset) this.viewCenter = this._coordZoomMouseOffset(this.viewCenter)

    let detail = {
      viewScale: this.viewScale,
      viewCenter: this.viewCenter
    }

    // emit this transformation to children
    this.emit( 'Scale', detail)

    //  Save the scale for the next frame
    this.viewScalePrevious = this.viewScale
  }

  onChildOut (event) {
    let id = event.detail.id

    this.overChildren = []
    this.overInputs = []
    this.overOutputs = []

  }

  onChildOver (event) {
    let id = event.detail.id
    let over = event.detail.over
    let overBody = event.detail.overBody
    let overInput = event.detail.overInput
    let overOutput = event.detail.overOutput

    if (over) {
      this.overChildren[id] = id
      if (overInput) this.overInputs[id] = id
      if (overOutput) this.overOutputs[id] = id

    } else {
      this.overChildren = []
      this.overInputs = []
      this.overOutputs = []
    }
  }


  onChildReverse (event) {
    const id = event.detail.id
    const path = event.detail.path

    //  Finish reversal when we've reached the first item in the path
    if (typeof(id) == 'undefined') this.reversing = false

    //  Pass on to children
    if (this.reversing) this.emit('Reverse', event.detail)
  }


  onChildTraceNodePaths (event) {
    //  Record freeNodes
    //    - if passed we are at a dead end so do nothing else
    if (!isNaN(event.detail.freeNode)) {
      this.freeNodes.push(event.detail.freeNode)
      this.freeNodePaths.push(event.detail.freeNodePath)
    }

    //  Pass on event
    //    - if an id is passed
    else {
      this.emit('ChildTraceNodePaths', event.detail)
    }
  }


  onChildSelect (event) {
    let id = event.detail.id
    let shift = event.detail.shift

    //  Select
    this.setChildSelected(id, true, false)

  }

  onChildDeselect (event) {
    let id = event.detail.id

    this.setChildSelected(id, false, false)
  }

  onComplexNumberUpdate (event) {
    // Pass on event for Operators and Wires
    this.emit('ComplexNumberUpdate', event.detail)
  }

  onOperatorUpdate (event) {
    // Pass on event for Operators and Wires
    this.emit('OperatorUpdate', event.detail)
  }

  onWireUpdate (event) {
    // Pass on event for Operators and Wires
    this.emit('WireUpdate', event.detail)
  }



  /**
   * @method _trueClick
   *
   * @param {<Obhect>}	event - the event object
   *
   * @return {Boolean}
   *
   */
  _trueClick (event) {
    if (
      this.mouseOver &&
      this.mousePressVars.coord[0] === event.clientX &&
      this.mousePressVars.coord[1]=== event.clientY &&
      this.mousePressVars.timestamp - this.mouseReleaseVars.timestamp < this.mouseClickDelay
    ) {
      return true
    }
    return false
  }

  /**
   * @method doubleClicked
   *
   *  We can double click on bound nodes (outputs) to ask for control.
   *
   * @see https://p5js.org/reference/#/p5/doubleClicked
   */
  doubleClicked (event) {
    if ( this._trueClick(event) ) {

      //  Initiate Reversal
      if ( this.mousePressVars.over.outputs.length > 0 ) {
        let id = this._getChildRef(this.mousePressVars.over.outputs)

        //  Store state for draw
        this.reversing = true

        //  Reset freeNodes and freeNodePaths
        this.freeNodes = []
        this.freeNodePaths = []

        //  Emit 'TraceNodePaths' event
        let detail = {
          originId: id,
          path: [id]
        }
        this.emit('TraceNodePaths', detail)

      }

      return false

    }
  }


  /**
   * @method mouseClicked
   *
   * @see https://p5js.org/reference/#/p5/mouseClicked
   */
  mouseClicked (event) {
    if ( this._trueClick(event) && this.mouseOver) {

      //  Selection
      //  If we click without shift, deselect all
      if (
        !event.shiftKey &&
        this.selectedNodes.length > 0
      ) {
        this.setChildSelected( false )
      }

      //  Reversal
      //  If we dont click a free node, exit
      //  If we click a free node, find freeNodePath and emit Reverse event
      if (this.reversing) {
        if ( this.mousePressVars.over.inputs.length == 0 ) {
          this.reversing = false
        } else {
          let clickedFreeNode = this.freeNodes.filter( id => (this.mousePressVars.over.inputs.includes(id)) ).pop()
          let reversalPath = this.freeNodePaths.filter( path => {
            let copy = path.slice()
            let last = copy.pop()
            return (last == clickedFreeNode);
          } ).pop()
          let detail = {
            id: clickedFreeNode,
            path: reversalPath
          }
          this.emit('Reverse', detail)
        }
      }

      //  Emit
      //  If we click on a child, send a mouseclicked event
      if (this.mousePressVars.over.children.length > 0) {
        let detail = {
          coord: this._coordCanvasToGlobal(),
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey
        }
        this.emit('MouseClicked', detail)
      }

      return false

    }
  }


  /**
   * @method mouseDragged
   *
   * @see https://p5js.org/reference/#/p5/mouseDragged
   */
  mouseDragged (event) {
    if (
      this.mouseState != this.mouseEvents.TraceNodePaths &&
      (this.mousePressVars.over.canvas || this.mousePressVars.over.button) &&
      event.buttons <= 1 &&
      !this.reversing
    ) {

      let detail = {}
      let init = false

      // Determine if this is the beginning of a drag
      // If so set the mouse state
      if (
        event.timeStamp - this.mousePressVars.timestamp > this.mouseClickDelay &&
        this.mouseState != this.mouseEvents.Idle
      ) {

        //  Mouse Over Canvas
        if ( this.mousePressVars.over.children.length == 0 ) {

          // Pan - Move the view.
          this.mouseState = this.mouseEvents.Pan

          // SelectArea - select children
          if (event.shiftKey) {
            this.mouseState = this.mouseEvents.SelectArea
          }

          // Duplicate - duplicate selection on release
          if (event.ctlKey) {
            this.mouseState = this.mouseEvents.Duplicate
          }
        }

        //  Mouse Over Child
        if (this.mousePressVars.over.children.length > 0) {

          // Move - move selected children.
          if (
            this.mousePressVars.over.inputs.length == 0 &&
            this.mousePressVars.over.outputs.length == 0
          ) {
            if (this.mouseState != this.mouseEvents.Move) { init = true }
            this.mouseState = this.mouseEvents.Move
          }

          // Scrub - change an input value
          if (this.mousePressVars.over.inputs.length > 0) {
            this.mouseState = this.mouseEvents.Scrub
          }

          // WirePull - pull on an output to connect it to an input
          if (this.mousePressVars.over.outputs.length > 0) {
            if (
              this.mouseState != this.mouseEvents.WirePull &&
              this.mouseState != this.mouseEvents.Connecting
            ) { init = true }
            this.mouseState = this.mouseEvents.WirePull

            if (this.overInputs.length > 0) {
              this.mouseState = this.mouseEvents.Connecting
            }
          }

        }
      }


      //  Act based on current state
      switch (this.mouseState) {

        // Pan
        //  - Move the view.
        case 'Pan':

          this.viewCenter = [
            this.viewCenter[0] + event.movementX,
            this.viewCenter[1] + event.movementY
          ]

          detail = {
            viewCenter: this.viewCenter
          }
          break;

        // SelectArea
        //  - Emit selection coordinates to children
        //    who will tell us if they're selected.
        case 'SelectArea':

          detail =  {
            selectOrigin: this._coordToGlobal(...this.mousePressVars.coord),
            selectEnd: this._coordCanvasToGlobal(),
            selectId: this.mousePressVars.coordGlobal[0]+this.mousePressVars.coordGlobal[1]
          }
          break;

        // Move
        //  - move selected children.
        case 'Move':
          //  Get movement in global value
          let thenCoordGlobal = this._coordCanvasToGlobal(event.clientX - event.movementX,  event.clientY - event.movementY)
          let nowCoordGlobal = this._coordCanvasToGlobal(event.clientX, event.clientY)

          //  If Move has just begun
          if (init) {
            //  Include all the movement from when we first pressed the mouse just this once
            thenCoordGlobal = this.mousePressVars.coordGlobal
            //  Make sure that the child that the mouse is over is selected
            let overOpId = this._getChildRef(this.mousePressVars.over.children)
            if ( !this.selectedNodes.includes(overOpId) ) {
              if (!event.shiftKey)  this.setChildSelected( false )
              this.setChildSelected( overOpId )
            }
          }

          detail = {
            xChange: nowCoordGlobal[0] - thenCoordGlobal[0],
            yChange: nowCoordGlobal[1] - thenCoordGlobal[1],
            selected: this.selectedNodes
          }
          break;

        // Scrub
        //  - drag to change an input value
        case 'Scrub':
          let idOverInput = this._getChildRef()
          detail = {
            clientX: event.clientX,
            id: idOverInput,
            mousePressedCoord: this.mousePressVars.coord
          }
          break;

        // Wirepull
        //  - Move a wire
        case 'WirePull':
          //  add wire once
          if (init) this.addWire()
          //  send origin id to children
          detail = {
            id: this._getChildRef(this.mousePressVars.over.outputs)
          }
          break;

        // Connect
        //  - connect an Output to an Input
        case 'Connecting':
          detail = {
            id: this._getChildRef(this.overInputs)
          }
          break;

        // Copy Selected items
        //
        default:
          break;

      }
      //  Emit current mouse state and relevant details
      this.emit( this.mouseState, detail)

      //  Emit mouseMoved event for all dragging modes.
      detail = {
        coord: this._coordCanvasToGlobal()
      }
      this.emit( 'MouseMoved', detail);

      return false
    }

  }


  /**
   * @method mouseMoved
   *
   * @see https://p5js.org/reference/#/p5/mouseMoved
   */
  mouseMoved (event) {
    if (this.mouseOver){
      let detail = {
        coord: this._coordCanvasToGlobal()
      }
      this.emit('MouseMoved', detail)
    }
  }

  /**
   * @method mousePressed
   *
   *  Some notes on how all these stored vars are used:
   *    - timestamp - referred to in _trueClick to check if this is a click or a drag
   *    - coord - used by mouseDragged to make up for initial delay (configured by this.mouseClickDelay)
   *    - coordGlobal
   *    - over - used by mouseDragged in logic determining what action is being taken
   *    - over.button - if any of the operator create buttons was pressed
   *
   * @see https://p5js.org/reference/#/p5/mousePressed
   */
  mousePressed (event) {
    this.mouseState = this.mouseEvents.MousePressed

    //  Store info we'll need later
    this.mousePressVars.timestamp = event.timeStamp;
    this.mousePressVars.coord = [event.clientX, event.clientY]
    this.mousePressVars.coordGlobal = this._coordCanvasToGlobal(event.clientX, event.clientY)
    this.mousePressVars.over.canvas = this.mouseOver
    this.mousePressVars.over.button = event.target.classList.contains('create-child')
    this.mousePressVars.over.children = this.overChildren.slice()
    this.mousePressVars.over.inputs = this.overInputs.slice()
    this.mousePressVars.over.outputs = this.overOutputs.slice()

  }

  /**
   * @method mouseReleased
   *
   * @see https://p5js.org/reference/#/p5/mouseMoved
   */
  mouseReleased (event) {

    //  Store release timestamp for click verification
    this.mouseReleaseVars.timestamp = event.timeStamp;

    //  Wire a connection between an output and input
    if (
      this.mouseState == this.mouseEvents.Connecting &&
      this.mousePressVars.over.outputs.length > 0 &&
      this.overInputs.length > 0
    ) {
      this.connectWire()
    }

    if (['Move', 'Pan', 'Scale', 'Scrub', 'Connecting'].includes(this.mouseState))
      this._writeURL()

    //  Remove any dangling wires
    if ( this.mousePressVars.wire !== false ) {
      this.removeChild( this.mousePressVars.wire )
    }

    //  Reset mouse state
    this.mouseState = this.mouseEvents.Idle;

    //  Reset mouse pressed vars
    this.mousePressVars = this.mousePressVarsDefault

    // Send event to children
    let detail = {
      coord: [mouseX, mouseY]
    }
    this.emit('MouseReleased', detail)

  }


  /**
   * @method mouseWheel
   *
   *    Called every time the mousewheel turns.  We use this to scale the view.
   *
   * @param {<Object>}	event - the event object passed by javascript when the mousewheel turns
   * @see https://p5js.org/reference/#/p5/mouseWheel
   */
  mouseWheel (event) {
    if (this.mouseOver) {

      //  zoom
      this.zoom(event.delta*0.001, true)

      // prevent window scroll
      return false

    }
  }


  /**
   * @method keyReleased
   *
   *    Used for deletion, zoom, and cancel action.
   *
   * @param {<Object>}	event - the event object passed by javascript when the mousewheel turns
   * @see https://p5js.org/reference/#/p5/keyReleased
   */
  keyReleased (event) {
    let keynum = event.keyCode

    //  These actions will only apply when mouse is Idle
    if (
      this.mouseState == this.mouseEvents.Idle &&
      this.selectedNodes.length > 0
    ) {
      //  "Backspace" to delete
      if (keynum == 8) {
        this.removeChild()
      }
    }

    //  Escape reversal
    if ( this.reversing && keynum == 27 ) this.reversing = false

    //  "+" to zoom in
    if (keynum == 61) this.zoom( -.5 )
    //  "-" to zoom out
    if (keynum == 173) this.zoom( 1 )

  }


  /**
   * @method _getChildRef
   *
   *  Get a reference to a child EditorChild stored in an array of id => id.  This is used when sending events to children.
   *
   * @param {Array}	ref - which storage array to retrieve the id from
   *
   * @return {<Number>} the id of the child EditorChild referenced.
   *
   */
  _getChildRef(ref = this.mousePressVars.over.inputs) {
    if (Array.isArray(ref)) {
      ref = ref.slice()
      let getRef = [...ref]
      let id = getRef.pop()

      return id
    }
  }

  /**
   * @method _serialize
   *
   *  Get an object containing the serialized state of every object in the scene.
   *
   * @return {<Object>} the full state of the editor represented as an object.
   */
  _serialize() {
    // We only want to serialize naked numbers, since inputs and outputs are serialized within operators
    const nakedNumbers = Object.values(this.myNumbers).filter(v => {
      const n = this.myChildren[v]
      return n.type == n.NAKED
    })

    const numbers = nakedNumbers.map(v => this.myChildren[v].serialize())
    
    const operators = Object.keys(this.myOperators).map(v => this.myChildren[v].serialize())

    console.log('Operators:', this.myOperators)
    console.log('Numbers:', this.myNumbers)

    return {
      numbers,
      operators,
    }
  }

  /**
   * @method _deserialize
   *
   *  @param {Object} the serialized object to restore editor state from.
   */
  _deserialize(obj) {
    this.deserializing = true

    obj.numbers.forEach(v => {
      console.log(`Spawning number of value ${v.real}`)
      const number = this.addNumber()
      number.deserialize(v)
    })

    obj.operators.forEach(v => {
      console.log(`Spawning operator of type ${v.type}`)
      const operator = this.addOperator(v.type)
      operator.deserialize(v)
    })
  

    this.deserializing = false
  }

  /**
   * @method _writeURL
   *
   *  Write the serialized state of the editor to the URL
   */
  _writeURL() {
    // Serialized object
    const obj = this._serialize()
    // Raw string representation
    const str = JSON.stringify(obj)
    // Encoded string representation
    const enc = encodeURIComponent(str)
    // Base64 string representation
    const b64 = btoa(enc)
    // URL to write to window
    const url = location.protocol+'//'+location.hostname+location.pathname+'?'+b64

    console.log(obj)

    history.pushState(obj, 'Circuits', url)
  }

  /**
   * @method _readURL
   *
   *  Fetch the editor state stored in the URL, if any exists.
   * 
   * @return {<Object>} the state of the editor to restore from.
   */
  _readURL() {
    const query = location.search

    if (!query)
      return null
    
    const b64 = query.slice(1)
    const enc = atob(b64)
    const str = decodeURIComponent(enc)
    const obj = JSON.parse(str)

    console.log(str)

    return obj
  }
};
