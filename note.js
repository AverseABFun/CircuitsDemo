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

		// Note-specific listeners (currently there are none)
		this.listenEvents = [
			...this.listenEvents,
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
