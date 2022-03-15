/**
 * @Class Note
 *
 */
class Note extends EditorChild {
	//  STATE
  editing = false
  
  text = "Click here to edit me"

  //  DOM
  domNotes = document.querySelector('#notes-layer')
  domEditor = document.querySelector('#notes-editor')
  
	constructor(x, y, setCount = 0, setType = 0) {
		super(x, y, setType);

		// Note-specific listeners (currently there are none)
		this.listenEvents = [
			...this.listenEvents,
		]

		this.talkEvents = [
			...this.talkEvents,
		]

    this.domNotes = 
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
      real: this.real,
      imaginary: this.imaginary,
      reversed: this.reversed,
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
