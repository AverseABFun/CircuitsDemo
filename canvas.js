/**
 * @class Item
 *
 *  This is a base class for all out p5 guys.
 */
class CanvasChild extends EventTarget {

  viewScaleStart = 1
  viewScale = this.viewScaleStart
  viewScaleTarget = this.viewScaleStart
  viewScalePrevious = this.viewScaleStart
  viewCenter = [0, 0]

  constructor () {
    super();
  }


  /**
   * @method emit
   *
   * @param {<type>}	name - custom event type
   * @param {<type>}	data - event data
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventListener
   *
   */
  emit (name, data) {
    const event = new CustomEvent( name, { detail: data } );
    this.dispatchEvent(event);
  }


  /**
   * @method handleEvent
   *
   *  Including this method makes it possible to pass decendent
   *  class instances to EventTarget.addEventListener
   *
   * @param {<Object>}	event
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventListener/handleEvent
   *
   */
  handleEvent (event) {
    let funcName = 'on' + event.type[0].toUpperCase() + event.type.substr(1)

    if (typeof this[funcName] === 'function') {
      this[funcName](event)
    }
  }


  /**
    * @method _stageToGlobalX
    *
    *  takes x coordinate from stage and returns unit-scale global x position
    *
    * @param {<Number>}	 xCoordIn
    * @param {<Number>}  scale
    *
    * @return {<Number>}
    *
    */
  _stageToGlobalX (xCoordIn, scale = this.viewScale) {
    return (xCoordIn-this.viewCenter[0])/scale;
  }

  /**
    * @method _stageToGlobalY
    *
    *  takes y coordinate from stage and returns unit-scale global y position
    *
    * @param {<Number>}	 yCoordIn
    * @param {<Number>}  scale
    *
    * @return {<Number>}
    *
    */
  _stageToGlobalY (yCoordIn, scale = this.viewScale) {
    return (yCoordIn-this.viewCenter[1])/scale;
  }

  /**
    * @method _globalToStageX
    *
    *  takes x position from unit global position and returns stage x-coordinate
    *
    * @param {<Number>}	 xCoordIn
    * @param {<Number>}  scale
    *
    * @return {<Number>}
    *
    */
  _globalToStageX (xCoordIn, scale = this.viewScale) {
    return xCoordIn*scale + this.viewCenter[0];
  }

  /**
    * @method _globalToStageY
    *
    *  takes y position from unit global position and returns stage y-coordinate
    *
    * @param {<Number>}	 yCoordIn
    * @param {<Number>}  scale
    *
    * @return {<Number>}
    *
    */
  _globalToStageY (yCoordIn, scale = this.viewScale) {
    return yCoordIn * scale + this.viewCenter[1];
  }


  /**
   * @method _coordToGlobal
   *
   * @param {<Number>}	x
   * @param {<Number>}	y
   * @param {<Number>}  scale
   *
   * @return {<Array>} resulting coords
   *
   */
  _coordToGlobal (x, y, scale = this.viewScale) {
    let coord = [ this._stageToGlobalX(x,scale), this._stageToGlobalY(y,scale) ];
    return coord
  }


  /**
   * @method _coordToLocal
   *
   * @param {<Number>}	x
   * @param {<Number>}	y
   * @param {<Number>}  scale
   *
   * @return {<Array>}
   *
   */
  _coordToLocal (x, y, scale = this.viewScale) {
    let coord = [ this._globalToStageX(x,scale), this._globalToStageY(y,scale) ]
    return coord
  }


  /**
   * @method _coordCanvasToGlobal
   *
   *
   *  Given x and y values relative to the 0,0 of the cavas,
   *  find the corresponding x,y values
   *  on the stage for the current scale.
   *
   * @input {<Number>} x - Canvas x coordinate
   * @input {<Number>} y - Canvas y coordinate
   * @input {<Number>} offset - use 0, 1, -1.
   *    Inteded to offset coordinates when being passed between Editor and EditorChild.
   *    0 within same object.
   *    1 Editor to EditorChild.
   *   -1 EditorChild to Editor.
   *
   * @return {<Array>}
   *
   */
  _coordCanvasToGlobal (x = mouseX, y = mouseY, offset = 0) {
    //  We need to work against the view scale
    let scaleInverse = 1/this.viewScale
    let zeroX = 0 - this.viewCenter[0]*scaleInverse
    let zeroY = 0 - this.viewCenter[1]*scaleInverse
    let scaleX = zeroX + x*scaleInverse
    let scaleY = zeroY + y*scaleInverse
    let offsetScaleX = scaleX + this.viewCenter[0]*offset
    let offsetScaleY = scaleY + this.viewCenter[1]*offset

    return [offsetScaleX, offsetScaleY]
  }

  /**
   * @method _coordZoomMouseOffset
   *
   *    Get local offset of coordinates in relationship to the mouse position when scale changes.
   *
   * @param {<Array>}	coord - x, y coordinates
   * @param {<Number>}	prevScale - x, y coordinates
   *
   * @return {<Array>} - newly offset x, y coordinates
   *
   */
  _coordZoomMouseOffset (coord, prevScale = this.viewScalePrevious) {
    let x = coord[0]
    let y = coord[1]
    let prevGlobalOffsetX = this._stageToGlobalX(pmouseX, prevScale) - this._stageToGlobalX(x, prevScale)
    let prevGlobalOffsetY = this._stageToGlobalX(pmouseY, prevScale) - this._stageToGlobalX(y, prevScale)
    let globalX = this._stageToGlobalX(mouseX) - prevGlobalOffsetX
    let globalY = this._stageToGlobalY(mouseY) - prevGlobalOffsetY
    let offsetCoord = this._coordToLocal(globalX, globalY)

    return offsetCoord
  }


  /**
   * @method _intersectRects
   *
   * @param {<Object>}	r1 - rectangle object.  Format: { left: x, right: x, top: y, bottom: y }
   * @param {<Object>}	r2 - rectangle object
   *
   * @return {<Boolean>}
   *
   */
  _intersectRects (r1, r2) {
    return !(r2.left > r1.right ||
             r2.right < r1.left ||
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  }


  /**
   * @method _coordInCircle
   *
   * @param {<Number>}	x
   * @param {<Number>}	y
   * @param {<Object>}	circle - circle object.  Format: { radius: n, x: n, y: n }
   *
   * @return {<Boolean>}
   *
   */
  _coordInCircle (x, y, circle) {
    let aSqr = Math.pow(circle.x - x, 2)
    let bSqr = Math.pow(circle.y - y, 2)
    let cSqr = circle.r*circle.r
    let inCircle = !(aSqr + bSqr >= cSqr)

    return inCircle
  }


  /**
   * @method _coordInRect
   *
   * @param {<Number>}	x
   * @param {<Number>}	y
   * @param {<Object>}	rect - this is the parameter rect
   *
   * @return {<Boolean>}
   *
   */
  _coordInRect (x, y, rect) {
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }


}
