/**
 * @class Operator
 *
 */

class Operator extends EditorChild {
  //  Graphic representation
  bodyWidth = 600
  bodyHeight = 600
  xOffset = this.bodyWidth/4
  yOffset = this.bodyHeight/2 - 110
  //  colors
  color = [200,220,200]
  selectedColor = [140,150,110]
  reversedColor = [0,0,145]
  overBodyColor = [140,150,200]
  //  text
  label = "+"
  labelSize = 200
  labelColor = [0]

  //  Default values
  input1Default = 0
  input2Default = 0

  //  Number store
  myInput1
  myInput2
  myOutput

  // operator mode
  DEFAULT = 0
  REVERSE1 = 1
  REVERSE2 = 2

  // path labels
  OUTPUT = 0
  INPUT1 = 1
  INPUT2 = 2

  //  Iterate
  iterations = iterationsPerFrame ? iterationsPerFrame : 40

  constructor (x, y, setType = 0) {
    super(x,y,setType);

  	// setting for which operands are driving which other operand
  	this.mode = this.DEFAULT

    // Operator specific listeners
		this.listenEvents = [
			...this.listenEvents,
      "ComplexNumberUpdate",
		  "WireUpdate",
		]

    //  Operator specific
    this.talkEvents = [
			...this.talkEvents,
      "OperatorUpdate",
		]

  }


  /**
   * @method operate
   *
   *  Make the output with the inputs.
   *
   * @param {<Array>} path - path to pass on with event.  Default will not propogate - meant for initial value set.
   */
  iterate (path = [this.id]) {
    let iteration = 0
    while (iteration < this.iterations) {
      iteration++
      this.operate()
    }
  }


  /**
   * @method addInput
   *
   *  Setup and store a ComplexNumber class instance as
   *  an input.
   *
   *  @param {<Object>} input - ComplexNumber instance
   *  @param {<Number>} position - 1 or 2
   *
   */
  addInput (input, position = 1) {

    //  listen for input updates
    input.addEventListener('update', this.onUpdate );

    //  set position & value
    if (position == 1) {
      input.setPosition(this.globalX - this.xOffset, this.globalY - this.yOffset)
      input.setReal(this.input1Default)
    }
    if (position == 2) {
      input.setPosition(this.globalX + this.xOffset, this.globalY - this.yOffset)
      input.setReal(this.input2Default)
    }

    //  store
    let positionName = 'myInput'+position
    this[positionName] = input

  }


  /**
   * @method addOutput
   *
   *  Setup and store a ComplexNumber class instance as
   *  an output.
   *
   * @param {<Object>}	output - ComplexNumber instance
   *
   */
  addOutput (output) {

    //  output listens for operator updates
    this.addEventListener('update', output.onUpdate );

    //  set position
    output.setPosition(this.globalX, this.globalY + this.yOffset)

    //  store
    this.myOutput = output

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

    //  Remove input/output references
    this.myInput1 = null
    this.myInput2 = null
    this.myOutput = null
  }


  /**
   * @method drawChild
   *
   *  Override EditorChild->drawChild
   */
  drawChild () {

    let bg = (this.selected) ? this.selectedColor : (this.over) ? this.overBodyColor : this.color
    if (this.reversed) bg = bg.map( (x,i) => x+this.reversedColor[i] )

    fill(bg);

    stroke(0);
    strokeWeight(6);
    rectMode(CORNER);
    rect(
      -this.bodyWidth/2,
      -this.bodyHeight/2,
      this.bodyWidth,
      this.bodyHeight,90);

    noStroke();
    textSize(this.labelSize);
    textAlign(CENTER,CENTER)
    fill(...this.labelColor);
    text(this.label,0,0);

  }


  /**
   * @method onConnect
   *
   *  The operator needs to operate once on Connect.
   *
   * @param {<Object>}	event
   *
   */
  onConnect (event) {
    let id = event.detail.originId
    let inputs = this.getMyChildIds('inputs')

    //  Operate
    if (inputs.includes(id)) {
      this.operate()
    }
  }


  /**
   * @method onReverse
   *
   *  Toggle reverse state.
   *
   * @param {<Object>}	event
   *
   */
  onReverse (event) {
    const {id, path} = event.detail
    let next = path.indexOf(id) - 1
    let detail = {
      id: path[next],
      path: path
    }

    if (this.id == id) {
      this.reverse(path)
      this.emit('ChildReverse', detail)
    }
  }


  /**
   * @method onTraceNodePaths
   *
   *  Add this operator to freeNodePaths.
   *  Detect if child numbers are freeNodes.
   *
   * @param {<Object>}	event
   *
   */
  onTraceNodePaths (event) {
		const {originId, eventOrigin, path} = event.detail
    const id = path.slice(-1).pop()
    const {inputs, outputId} = this.getMyChildIds()

    if (
      !path.includes(this.id) &&
      (
        ( !eventOrigin && outputId == originId ) ||
        ( eventOrigin == 'Wire' && outputId == id )
      )
    ) {

      //  Record input/output paths.  If they're connected we must follow the connections outwards
      inputs.forEach((childId, i) => {

        if (!path.includes(childId)) {
          //  Free node - emit with freeNodes and FreeNodePaths
          //  Bound node - emit with childId
          let detail = { eventOrigin: 'Operator' }
          let newPath = [...path]
          newPath.push(this.id, childId)
          let child = this.getChildById(childId)
          if (!child.connected) {
            detail.freeNode = childId
            detail.freeNodePath = newPath
          } else {
            detail.path = newPath
          }
          this.emit('ChildTraceNodePaths', detail)

        }

      });
    }

  }


  /**
   * @method getChildById
   *
   * @param {<Number>} id - id that correstponds to an input or output
   * @return {<Object>} - ComplexNumber instance
   *
   */
  getChildById (id) {

    let children = [this.myInput1, this.myInput2, this.myOutput]
    let chosen

    children.forEach((child, i) => {
      if (child.id == id) chosen = child
    });

    return chosen

  }


  /**
   * @method getMyChildIds
   *
   *  Depending on the Operator mode, there are effectively different inputs and outputs.
   *
   * @param {<String>} returnValue - 'inputs' or 'output'
   * @return {<Array|Number>} - if 'inputs' array of two input ComplexNumber ids.  if 'output', one output ComplexNumber id.
   *
   */
  getMyChildIds (returnValue) {
    let current = {
      inputs: [],
      outputId: 0
    }

    //  Determine which numbers are our "inputs"
    switch (this.mode) {
      case this.DEFAULT:
        current.inputs = [this.myInput1.id, this.myInput2.id]
        current.outputId = this.myOutput.id
        break;

      case this.REVERSE1:
        current.inputs = [this.myOutput.id, this.myInput2.id]
        current.outputId = this.myInput1.id
        break;

      case this.REVERSE2:
        current.inputs = [this.myInput1.id, this.myOutput.id]
        current.outputId = this.myInput2.id
        break;

      default:
    }

    if (returnValue) return current[returnValue]
    else return current
  }


  /**
   * @method reverse
   *
   *
   *  @param {<Array>} path - list of child ids in current order, to be reversed
   *
   *  @return {<Boolean>} - true if a reversal was initiated, false if none was possible
   *
   */
  reverse (path) {
  	let i = path.indexOf(this.id)
    const setPrev = (path[i-1]) ? path[i-1] : false
    const setNext = (path[i+1]) ? path[i+1] : false
    const {inputs, outputId} = this.getMyChildIds()
    let internalPath

    //  The operator is already set in this direction
    if (inputs.includes(setPrev) && !inputs.includes(setNext)) return

    //  Set new mode
    if (setNext == this.myInput1.id) this.mode = this.REVERSE1
    if (setNext == this.myInput2.id) this.mode = this.REVERSE2
    if (setNext == this.myOutput.id) this.mode = this.DEFAULT

    //  Continue
    super.reverse(path)

  }


  compareShifts(neg,pos) {
    if (abs(neg) < abs(pos)){
      return -1*searchSize;
    } else if (abs(neg) > abs(pos)){
      return 1*searchSize;
    } else {
      return 0;
    }
  }

}



/**
 * @class Adder
 *
 */
class Adder extends Operator {

  constructor (x, y, setType = 0) {
    super(x,y,setType);
  }

  operate () {

    let r1 = this.myInput1.getReal();
  	let i1 = this.myInput1.getImaginary();
  	let r2 = this.myInput2.getReal();
  	let i2 = this.myInput2.getImaginary();
  	let rout = this.myOutput.getReal();
  	let iout = this.myOutput.getImaginary();
  	let leftX, rightX, upperY, lowerY, shiftX, shiftY, movingNode;

    switch (this.mode) {
    	case this.DEFAULT:
  	    leftX = (rout - searchSize) - (r1 + r2);
  	    rightX = (rout + searchSize) - (r1 + r2);
  	    upperY = (iout + searchSize) - (i1 + i2);
  	    lowerY = (iout - searchSize) - (i1 + i2);
  	    movingNode = this.myOutput;
  	    break;

    	case this.REVERSE1:
  	    leftX = (r1 - searchSize) - (rout - r2);
  	    rightX = (r1 + searchSize) - (rout - r2);
  	    upperY = (i1 + searchSize) - (iout - i2);
  	    lowerY = (i1 - searchSize) - (iout - i2);
  	    movingNode = this.myInput1;
  	    break;

    	case this.REVERSE2:
  	    leftX = (r2 - searchSize) - (rout - r1);
  	    rightX = (r2 + searchSize) - (rout - r1);
  	    upperY = (i2 + searchSize) - (iout - i1);
  	    lowerY = (i2 - searchSize) - (iout - i1);
  	    movingNode = this.myInput2;
  	    break;

    	default:
    	    // should not get here
  	}

    shiftX = this.compareShifts(leftX, rightX)
    shiftY = this.compareShifts(upperY, lowerY)
    movingNode.shift( shiftX, shiftY );

  }
}


/**
 * @class Multiplier
 *
 */
class Multiplier extends Operator {

  //  colors
  color = [2050,245,230]
  selectedColor = [2200,150,110]
  //  text
  label = "x"

  //  Default values
  input1Default = 1
  input2Default = 1

  constructor (x, y, setType = 0) {
    super(x,y,setType);
  }

  operate () {
    let r1 = this.myInput1.getReal();
    let i1 = this.myInput1.getImaginary();
    let r2 = this.myInput2.getReal();
    let i2 = this.myInput2.getImaginary();
    let rout = this.myOutput.getReal();
    let iout = this.myOutput.getImaginary();
    let rprod = (r1 * r2) - (i1 * i2);
    let iprod = (r1 * i2) + (i1 * r2);

    let leftX, rightX, upperY, lowerY, shiftX, shiftY, movingNode, denominator, rquot, iquot;

    switch (this.mode) {
    	case this.DEFAULT:
        //check whether moving left or right better fits constraints...
        leftX = (rout - searchSize) - rprod;
        rightX = (rout + searchSize) - rprod;
        //...same for up or down movement...
        upperY = (iout + searchSize) - iprod;
        lowerY = (iout - searchSize) - iprod;
        //decide whether/where to shift ouput position.
        movingNode = this.myOutput;
        break;

      case this.REVERSE1:
        denominator = (r2 * r2) + (i2 * i2);
        rquot = ((rout * r2) + (iout * i2)) / denominator;
        iquot = ((iout * r2) - (rout * i2)) / denominator;
        leftX = (r1 - searchSize) - rquot;
        rightX = (r1 + searchSize) - rquot;
        upperY = (i1 + searchSize) - iquot;
        lowerY = (i1 - searchSize) - iquot;
        movingNode = this.myInput1;
        break;

      case this.REVERSE2:
        denominator = (r1 * r1) + (i1 * i1);
        rquot = ((rout * r1) + (iout * i1)) / denominator;
        iquot = ((iout * r1) - (rout * i1)) / denominator;
        leftX = (r2 - searchSize) - rquot;
        rightX = (r2 + searchSize) - rquot;
        upperY = (i2 + searchSize) - iquot;
        lowerY = (i2 - searchSize) - iquot;
        movingNode = this.myInput2;
        break;


    	default:
    	    // should not get here
  	}

    shiftX = this.compareShifts(leftX, rightX)
    shiftY = this.compareShifts(upperY, lowerY)
    //console.log(leftX, rightX, shiftX, rout, rprod)
    movingNode.shift( shiftX, shiftY );

  }
}

/**
 * @class Exponentiator
 *
 */
class Exponentiator extends Operator {

  //  colors
  color = [100,245,100]
  selectedColor = [130,220,130]
  reversedColor = [245,100,245]
  //  text
  label = "^"

  //  Default values
  input1Default = 1
  input2Default = 1

  constructor (x, y, setType = 0) {
    super(x,y,setType);
  }

  operate () {
    let r1 = this.myInput1.getReal();
    let i1 = this.myInput1.getImaginary();
    let r2 = this.myInput2.getReal();
    let i2 = this.myInput2.getImaginary();
    let rout = this.myOutput.getReal();
    let iout = this.myOutput.getImaginary();
    let rprod = (r1 * r2) - (i1 * i2);
    let iprod = (r1 * i2) + (i1 * r2);

    let leftX, rightX, upperY, lowerY, shiftX, shiftY, movingNode, denominator, rquot, iquot;

    switch (this.mode) {
    	case this.DEFAULT:
        //check whether moving left or right better fits constraints...
        leftX = (rout - searchSize) - rprod;
        rightX = (rout + searchSize) - rprod;
        //...same for up or down movement...
        upperY = (iout + searchSize) - iprod;
        lowerY = (iout - searchSize) - iprod;
        //decide whether/where to shift ouput position.
        movingNode = this.myOutput;
        break;

      case this.REVERSE1:
        denominator = (r2 * r2) + (i2 * i2);
        rquot = ((rout * r2) + (iout * i2)) / denominator;
        iquot = ((iout * r2) - (rout * i2)) / denominator;
        leftX = (r1 - searchSize) - rquot;
        rightX = (r1 + searchSize) - rquot;
        upperY = (i1 + searchSize) - iquot;
        lowerY = (i1 - searchSize) - iquot;
        movingNode = this.myInput1;
        break;

      case this.REVERSE2:
        denominator = (r1 * r1) + (i1 * i1);
        rquot = ((rout * r1) + (iout * i1)) / denominator;
        iquot = ((iout * r1) - (rout * i1)) / denominator;
        leftX = (r2 - searchSize) - rquot;
        rightX = (r2 + searchSize) - rquot;
        upperY = (i2 + searchSize) - iquot;
        lowerY = (i2 - searchSize) - iquot;
        movingNode = this.myInput2;
        break;


    	default:
    	    // should not get here
  	}

    shiftX = this.compareShifts(leftX, rightX)
    shiftY = this.compareShifts(upperY, lowerY)
    movingNode.shift( shiftX, shiftY );

  }
}
