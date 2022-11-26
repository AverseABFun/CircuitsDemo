/**
 * @class EditorChild
 *
 *  This is a base class for Number and Operator classes.
 */
class EditorChild extends CanvasChild {

    id
    type

    globalX
    globalY

    color = [245,161,52]
    selectedColor = [200,100,15]
    overBodyColor = [100,100,15]
    bodyWidth = 180
    bodyHeight = 180
    stroke = 6

    over = false
    overInput = false
    overBody = false
    overOutput = false

    selected = false
    selectIntersection = {
        id: false,
        state: false
    }

    reversed = false


    listenEvents = [
        "ChildTraceNodePaths",
        "Connect",
        "Deselect",
        "Duplicate",
        "Idle",
        "MouseClicked",
        "MouseMoved",
        "MousePressed",
        "MouseReleased",
        "Move",
        "Pan",
        "Reverse",
        "Scale",
        "Select",
        "SelectArea",
        "TraceNodePaths",
        "WirePull"
    ]

    talkEvents = [
        "ChildDeselect",
        "ChildOut",
        "ChildOver",
        "ChildReverse",
        "ChildSelect",
        "ChildTraceNodePaths"
    ]


    constructor (x, y, setType, id = 0) {
        super();

        this.id = id
        this.type = setType
        this.globalX = x
        this.globalY = y

    }


    /**
     * @method draw
     *
     *
     */
    draw () {
        let x = this.globalX
	let y = this.globalY

	push();

	translate( x, y );

	this.drawChild();

	pop();
    }


    /**
     * @method drawChild
     *
     *
     */
    drawChild () {

    }


    /**
     * @method addToEditor
     *
     *  Set all scale vars to one value.
     *  Intended for when instance is created
     *  so that parent Editor can pass on scale.
     *
     * @param {<Object>}	editor
     *
     */
    addToEditor (editor) {
        //  set viewCenter
        this.viewCenter = editor.viewCenter

        //  set up event listeners
        this.listenTo(editor)
        this.talkTo(editor)

    }


    /**
     * @method removeFromEditor
     *
     *  Remove all listeners.  In descendant classes,
     *  there be references to other objects that also
     *  need to be removed.
     *
     * @param {<Object>}	editor
     *
     */
    removeFromEditor (editor) {
        this.ignore( editor )
        this.silence( editor )
    }


    /**
     * @method listenTo
     *
     * @param {<Object>}	target - an instance of the Editor class
     *
     */
    listenTo (target) {
        this.listenEvents.forEach((evtName, i) => {
            target.addEventListener(evtName, this );
        });
    }


    /**
     * @method talkTo
     *
     * @param {<Object>}	target - an instance of the Editor class
     *
     */
    talkTo (target) {
        this.talkEvents.forEach((evtName, i) => {
            this.addEventListener(evtName, target );
        });
    }


    /**
     * @method ignore
     *
     *  Remove event listeners added to Editor in method listenTo
     *
     * @param {<Object>}	target - an instance of the Editor class
     *
     */
    ignore (target) {
        this.listenEvents.forEach((evtName, i) => {
            target.removeEventListener(evtName, this );
        });
    }

    /**
     * @method silence
     *
     *  Remove event listeners added from Editor in method talkTo
     *
     * @param {<Object>}	target - an instance of the Editor class
     *
     */
    silence (target) {
        this.talkEvents.forEach((evtName, i) => {
            this.removeEventListener(evtName, target );
        });
    }


    /**
     * @method reverse
     *
     *  Toggle reverse state and change any other internal logic dependant upon it.
     *
     * @param {<Array>}	path - list of child ids in current order, to be reversed
     * @param {<Boolean>}	state - this child's reversal state
     *
     */
    reverse (path, state = !this.reversed) {
	this.reversed = state
    }


    /**
     * @method setId
     *
     * @param {<type>}	id - this is the parameter id
     *
     */
    setId (id) {
        this.id = id
    }


    /**
     * @method setPosition
     *
     * @param {<Number>}	x
     * @param {<Number>}	y
     *
     */
    setPosition (x, y) {
        this.globalX = x
        this.globalY = y
    }


    /**
     * @method onChildTraceNodePaths
     *
     * @param {<Object>}	event
     *
     */
    onChildTraceNodePaths (event) {
        if (event.detail.eventOrigin == 'Wire')  this.onTraceNodePaths(event)
    }


    /**
     * @method onMouseClicked
     *
     * @param {<Object>}	event
     *
     */
    onMouseClicked (event) {
        let coord = event.detail.coord
        let alt = event.detail.altKey
        let ctrl = event.detail.ctrlKey
        let shift = event.detail.shiftKey
        let detail = {
            id: this.id,
            shift: shift
        }

        if (this.over && !this.overInput && !this.overOutput ) {
            //  Toggle select
            this.selected = !this.selected
            //  Emit
            if (this.selected) {
                this.emit( 'ChildSelect', detail)
            } else {
                this.emit( 'ChildDeselect', detail)
            }
        }
    }


    /**
     * @method onMouseMoved
     *
     * @param {<Object>}	event
     *
     */
    onMouseMoved (event) {
        //	These coords are scale adjusted in Editor.mouseMoved
	let x = event.detail.coord[0]
	let y = event.detail.coord[1]
        let detail

	//  Store if mouse is over specific area
	this.isOverBody(x,y)
	this.isOverInput(x,y)
	this.isOverOutput(x,y)

        //  Store and emit over changes so Editor can keep track
	let over = (this.overBody || this.overInput || this.overOutput)
	let change = (over != this.over)
	if (change) {
	    this.over = over
	    if (over) {
		detail = {
		    id: this.id,
		    over: this.over,
		    overBody: this.overBody,
		    overInput: this.overInput,
		    overOutput: this.overOutput
		}
		this.emit('ChildOver', detail)
                this.onOver(detail)
	    } else {
		detail = { id: this.id }
		this.emit('ChildOut', detail)
                this.onOut(detail)
		// reset on out
		this.connecting = false
	    }

	}
    }

    /**
     * @method onMove
     *
     * @param {<Object>}	event
     *
     */
    onMove (event) {
        let selected = event.detail.selected.includes(this.id)
        let xChange = event.detail.xChange
        let yChange = event.detail.yChange

        //  Only move selected
        if (selected) {
            this.globalX += xChange
            this.globalY += yChange

            //  Make sure this item is selected if the event says it is.
            if (!this.selected) this.selected = true
        }
    }


    /**
     * @method onPan
     *
     * @param {<Object>}	event
     *
     */
    onPan (event) {
        this.viewCenter = event.detail.viewCenter
    }


    /**
     * @method onReverse
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
     * @method onScale
     *
     * @param {<Object>}	event
     *
     */
    onScale (event) {
        this.viewCenter = event.detail.viewCenter
    }


    /**
     * @method onOver
     *
     * @param {<Object>}	event
     *
     */
    onOver (event) {
        
    }

    /**
     * @method onOut
     *
     * @param {<Object>}	event
     *
     */
    onOut (event) {
        
    }


    /**
     * @method onSelectArea
     *
     * @param {<Object>}	event
     *
     */
    onSelectArea (event) {
        let origin, end, left, right, top, bottom, select, body, intersect;

        origin = event.detail.selectOrigin
        end = event.detail.selectEnd
        left = (origin[0] < end[0]) ? origin[0] : end[0]
        right = (origin[0] < end[0]) ? end[0] : origin[0]
        top = (origin[1] < end[1]) ? origin[1] : end[1]
        bottom = (origin[1] < end[1]) ? end[1] : origin[1]
        select = {
            left: left,
            right: right,
            top: top,
            bottom: bottom,
        }
        body = this._getSquare()

        //  Store this instance of selection
        if (this.selectIntersection.id != event.detail.selectId) {
            this.selectIntersection.id = event.detail.selectId
            this.selectIntersection.state = false
        }

        //  Determine if Item selection state has changed
        intersect = this._intersectRects(select, body)
        if ( intersect != this.selectIntersection.state ) {
            this.selectIntersection.state = intersect
            this.selected = !this.selected
            let detail = {
                id: this.id,
                shift: true
            }
            if (this.selected) {
                this.emit( 'ChildSelect', detail)
            } else {
                this.emit( 'ChildDeselect', detail)
            }
        }
    }


    /**
     * @method onSelect
     *
     * @param {<Object>}	event
     *
     */
    onSelect (event) {
        if (event.detail.id == this.id) {
            this.selected = true
        }
    }


    /**
     * @method onDeselect
     *
     * @param {<Object>}	event
     *
     */
    onDeselect (event) {
        if (event.detail.id == this.id) {
            this.selected = false
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
	this.overBody = this._coordInRect(x, y, body)
    }


    /**
     * @method isOverInput
     *
     * @param {<Number>}	x
     * @param {<Number>}	y
     *
     */
    isOverInput (x, y) {

    }


    /**
     * @method isOverOutput
     *
     * @param {<Number>}	x
     * @param {<Number>}	y
     *
     */
    isOverOutput (x, y) {

    }



    /**
     * @method _getBody
     *
     *
     * @return {<Object>}
     *
     */
    _getBody () {
        let body = this._getSquare()

        return body
    }

    /**
     * @method _getSquare
     *
     * @return {<Object>}	square - an object with outer bounds of a square
     *
     */
    _getSquare ( r, b, l = this.globalX - this.bodyWidth/2, t = this.globalY - this.bodyHeight/2 ) {
        if ( typeof(b) == 'undefined' ) {
            b = t + this.bodyHeight
        }
        if ( typeof(r) == 'undefined' ) {
            r = l + this.bodyWidth
        }
        let square = {
            left: l,
            right: r,
            top: t,
            bottom: b
        }

        return square
    }


}
