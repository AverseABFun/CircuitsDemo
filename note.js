/**
 * @Class Note
 *
 */
class Note extends EditorChild {
	//  STATE
  editing = false
  text = "Double-click me to edit!"
  assignedWidth

  //  DOM
  backgroundNode
  contentNode
  editorNode

  // Transforms assigned by editor through constructor. This feels like a janky way to inject these dependencies, I do not like it, but it works.
  transforms
  scaleFactor = 4
  
	constructor(x, y, transforms) {
		super(x, y, 0);

		// Note-specific listeners
		this.listenEvents = [
			...this.listenEvents,
      'RefreshNotes',
		]

		this.talkEvents = [
			...this.talkEvents,
		]

    console.log('Creating note:', arguments)
    this.transforms = transforms

    this.backgroundNode = createDiv('')
    this.backgroundNode.parent('notes-layer')
    this.backgroundNode.class('note')

    this.contentNode = createDiv(this.text)
    this.contentNode.parent(this.backgroundNode)
    this.contentNode.class('note-content')

    this.editorNode = createElement('textarea')
    this.editorNode.parent(this.backgroundNode)
    this.editorNode.class('note-editor')
    this.editorNode.elt.value = this.text

    new ResizeObserver(this.onResizeEditor.bind(this)).observe(this.editorNode.elt)
    
    this.editorNode.elt.addEventListener('mousedown', event => {
      event.stopPropagation()
    })
	}

  /**
   * @method onMove
   *
   * @param {<Object>}	event
   *
   */
  onMove (event) {
    super.onMove(event)

    
  }

  /**
   * @method onRefreshNotes
   *
   * @param {<Object>}	detail - contains transforms required to correctly position/scale this element
   *
   */
  onRefreshNotes(event) {
    this.refreshTransform()
  }

  /**
   * @method refreshBodySize
   *
   * Align this node's transform with the canvas camera
   */
  refreshTransform() {
    this.refreshBodySize()

    const [screenX, screenY] = this.transforms.worldToScreen(this.globalX, this.globalY)

    const width = this.bodyWidth
    const height = this.bodyHeight
    const scale = this.transforms.scale

    console.log('Refreshing transform of note '+this.id)

    this.backgroundNode.attribute('style', `transform: translate(${screenX-width/2}px, ${screenY-height/2}px) scale(${scale}, ${scale})`)
  }

  /**
   * @method refreshBodySize
   *
   * Align this node's body size to its DOM size
   */
  refreshBodySize() {
    const width = this.backgroundNode.elt.offsetWidth
    const height = this.backgroundNode.elt.offsetHeight

    this.bodyWidth = width
    this.bodyHeight = height
  }

  /**
   * @method onSelect
   *
   */
  onSelect(event) {
    console.log(`Selecting note ${this.id}`)
    super.onSelect(event)

    if (event.detail.id == this.id) {
      this.backgroundNode.addClass('selected')
    }
  }

  /**
   * @method onDeselect
   *
   */
  onDeselect(event) {
    console.log(`Deselecting note ${this.id}`)
    super.onSelect(event)

    if (event.detail.id == this.id) {
      this.backgroundNode.removeClass('selected')
    }
  }

  /**
   * @method onResizeEditor
   *
   */
   onResizeEditor(event) {
    console.log(`Resizing note ${this.id}`)

    // const x = this.backgroundNode.elt.offsetLeft
    // const y = this.backgroundNode.elt.offsetTop

    // const width = this.backgroundNode.elt.offsetWidth
    // const height = this.backgroundNode.elt.offsetHeight

    // this.globalX = x+width/2
    // this.globalY = y+height/2

    this.refreshTransform()
  }

  /**
   * @method beginEdit
   *
   * Begin editing this note
   */
  beginEdit() {
    console.log('Editing note '+this.id)
    this.editing = true
    this.backgroundNode.addClass('editing')
    this.editorNode.elt.value = this.text

    this.refreshTransform()
  }

  /**
   * @method endEdit
   *
   * End editing this note
   */
  endEdit() {
    this.editing = false

    this.assignedWidth = this.editorNode.elt.offsetWidth
    this.text = this.editorNode.elt.value

    console.log(`Finishing edit of note ${this.id}:`, this.text)

    const converter = new showdown.Converter()
    converter.setOption('tables', true)
    converter.setOption('strikethrough', true)
    const html = converter.makeHtml(this.text)

    this.contentNode.html(html)
    this.backgroundNode.removeClass('editing')

    // this.contentNode.attribute('style', `width: ${this.assignedWidth}px`)

    this.refreshTransform()
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

    this.backgroundNode.remove()
  }

  onOver(detail) {
    super.onOver(detail)

    console.log('Over note '+this.id)
  }

  onOut(detail) {
    super.onOut(detail)

    console.log('Out of note '+this.id)
  }

  /**
	 * @method isOverBody
   * 
   * Overrides the standard method to include our scale factor
	 *
	 * @param {<Number>}	x
	 * @param {<Number>}	y
	 *
	 */
	// isOverBody (x, y) {
	// 	let body = this._getBody()
	// 	this.overBody = this._coordInRect(x, y, body)
	// }

  /**
   * @method _getSquare
   * 
   * Overrides the standard method to include our scale factor
   *
   * @return {<Object>}	square - an object with outer bounds of a square
   *
   */
  // _getSquare ( r, b, l = this.globalX - this.bodyWidth/2, t = this.globalY - this.bodyHeight/2 ) {
  //   if ( typeof(b) == 'undefined' ) {
  //     b = t + this.bodyHeight
  //   }
  //   if ( typeof(r) == 'undefined' ) {
  //     r = l + this.bodyWidth
  //   }
  //   let square = {
  //     left: l,
  //     right: r,
  //     top: t,
  //     bottom: b
  //   }

  //   return square
  // }

  /**
	 * @method isOverBody
	 *
	 * @param {<Number>}	x
	 * @param {<Number>}	y
	 *
	 */
	// isOverBody (x, y) {
	// 	let body = this._getBody()
  //   const el = document.elementFromPoint(x, y)
	// 	this.overBody = this.backgroundNode.elt.contains(el)
	// }

	/**
	 * @method serialize
	 * Get a static object representation of this note
	 *
	 * @return {<Object>} the state of this note, serialized to an object
	 */
  serialize() {
    return {
      id: this.id,
      x: this.globalX,
      y: this.globalY,
      text: this.text,
    }
  }

	/**
	 * @method deserialize
	 * Restore state from a static object representation of this note
	 *
	 * @param {<Object>} state - the state of this note, serialized to an object
	 */
  deserialize(state) {
    this.setPosition(state.x, state.y)
    this.real = state.real
    this.imaginary = state.imaginary
    this.reversed = state.reversed
  }
}
