//  Init p5 instance
let mainCanvas = new Editor('circuit-canvas');
mainCanvas.setBackground([255,200,200])
mainCanvas.setGridLineColor([250,250,250])

//  Wire up Editor class to p5
function setup () {
  mainCanvas.setup()
  setupButtons()
}

function draw () {
  mainCanvas.draw()
}

//  Listen for buttons
function setupButtons () {
  let numButton = document.getElementById('create-number');
  let adderButton = document.getElementById('create-adder');
  let multButton = document.getElementById('create-multiplier');
  let expButton = document.getElementById('create-exponentiator');
  let noteButton = document.getElementById('create-note');
  let infoButton = document.getElementById('toggle-information');

  numButton.addEventListener('mousedown', function (event) {
    mainCanvas.addNumber()
  });
  adderButton.addEventListener('mousedown', function (event) {
    mainCanvas.addOperator('Adder')
  });
  multButton.addEventListener('mousedown', function (event) {
    mainCanvas.addOperator('Multiplier')
  });
  expButton.addEventListener('mousedown', function (event) {
    mainCanvas.addOperator('Exponentiator')
  });
  noteButton.addEventListener('mousedown', function (event) {
    mainCanvas.addNote()
  });

  infoButton.addEventListener('click', function (event) {
    let info = document.getElementById('info-text')
    info.classList.toggle('hidden')
    this.classList.toggle('show')
  });

}
