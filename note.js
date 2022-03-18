/**
 * @Class Note
 *
 */
class Note extends EditorChild {
	//  STATE
  editing = false
  
  text = "Click here to edit me"

  //  DOM
  backgroundElement
  pElementode
  deleteButtonElement
  
	constructor(x, y, setCount = 0, setType = 0) {
		super(x, y, setType);

		// Note-specific listeners
		this.listenEvents = [
			...this.listenEvents,
      'RefreshNotes'
		]

		this.talkEvents = [
			...this.talkEvents,
		]

    this.backgroundElement = createDiv('')
    this.backgroundElement.parent('notes-layer')
    this.backgroundElement.class('note-background')

    this.pElementode = createP('hello world')
    this.pElementode.parent(this.backgroundElement)
    this.pElementode.class('note-paragraph')
    
    this.deleteButtonElement = createButton('click me')
    this.deleteButtonElement.parent(this.backgroundElement)
    this.deleteButtonElement.class('note-delete-button')
	}

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
    const detail = event.detail

    const [screenX, screenY] = detail.worldToScreen(this.globalX, this.globalY)

    const width = this.backgroundElement.elt.offsetWidth
    const height = this.backgroundElement.elt.offsetHeight

    this.bodyWidth = width
    this.bodyHeight = height

    console.log('Refreshing note '+this.id)

    this.backgroundElement.attribute('style', `transform: translate(${screenX-width/2}px, ${screenY-height/2}px) scale(${detail.scale}, ${detail.scale})`)
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

    this.backgroundElement.remove()
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
