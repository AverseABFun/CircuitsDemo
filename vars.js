/**
  *
  *
  *
  *
  **/
// how far to look in each direction
const searchSize = .01
// how many decimal places to look at when determining if a numbers value is an integer or not.
const fixed = searchSize.toString().length - 2

// how many iterations to run before updating
const iterationsPerFrame = 25


// milliseconds before we count a click as a drag
const mouseClickDelay = 100


// starting view scale
const globalScale = .25


//  Colors
var colorArray = [
	[144,29,14],
	[225,47,46],
	[245,161,52],
	[239,247,145],
	[130,171,175],
	[153,203,158],
	[116,119,78],
	[19,91,169],
]
