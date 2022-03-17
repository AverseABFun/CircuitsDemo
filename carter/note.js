const notes = [];

function setup() {
  createCanvas(400, 400);
  button = createButton("new note");
  button.mousePressed(createNote);
    
}

function createNote() {
  const testNote = new NewNote(0, 0, 200, 90);
      notes.push(testNote);
}

function draw() {
  background(255);
  
  for(let i = 0; i < notes.length; i++){
    notes[i].overXCorner();
    notes[i].overCorner();
    notes[i].over();
    notes[i].update();
    notes[i].show();
    notes[i].name();
  }
}

function mousePressed(){
  for(let i = 0; i < notes.length; ++i){
    notes[i].deleteNote();
    notes[i].cornerPressed();
    notes[i].pressed();
    }
  
}

function mouseReleased(){
  for(let i = 0; i < notes.length; ++i){
    notes[i].released();
  }
}





///------NEW NOTE-----

class NewNote {
  userString = prompt("New Note:", "text");
  
  constructor(x, y, w, h) {
    this.userString = prompt("New Note:", "text");
    this.dragging = false; // Is the object being dragged?
    this.rollover = false; // Is the mouse over the note?
    this.overX = false; //is the mouse over the close button?
    this.rollovercorner = false; //Is the mouse over the corner?
    this.resizing = false;// Is the object being resized?
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.adjustX = this.x + this.w;
    this.adjustY = this.y + this.h;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  body() { 
    textSize(30);
    fill(0);
    text(this.userString, this.x, this.y, this.w, this.h);
  }
  
  over() {
    // Is mouse over object
    if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
      this.rollover = true;
    } else {
      this.rollover = false;
    }
  }
  
  overCorner() {
    //Is mouse over the corner to resize it
    if (mouseX > this.adjustX - 15 && mouseX < this.adjustX && mouseY > this.adjustY - 15 
       && mouseY < this.adjustY) {
      this.rollovercorner = true;
    } else {
      this.rollovercorner = false;
    }
  }
  
  overXCorner() {
    if (mouseX > this.adjustX - 15 && mouseX < this.adjustX && mouseY > this.y 
    && mouseY < this.y + 15) {
      this.overX = true;
      } else {
      this.overX  = false;
      }
  }

  update() {
    // Adjust location if being dragged
    if (this.dragging) {
      this.x = mouseX + this.offsetX;
      this.y = mouseY + this.offsetY;
      this.adjustX = this.x + this.w;
      this.adjustY = this.y + this.h;
    }
    if (this.resizing) {
      //translate(this.x, this.y);
      this.w = mouseX - this.x;
      this.h = mouseY - this.y;
      this.adjustX = this.x + this.w;
      this.adjustY = this.y + this.h;
    }
  }
 

  show() {
    stroke(0);
    // Different fill based on state
    if (this.dragging) {
      fill(255, 229, 204);
    } else if (this.rollovercorner){
      fill(205, 255, 229);
    } else if (this.overX) {
      fill(255, 150, 140);
    } else if (this.rollover) {
      fill(255, 229, 204);
    } else {
      fill(255, 255, 204);
    }
    rect(this.x, this.y, this.w, this.h);
    if (this.h > 0) { //to make sure these get deleted with the note
      rect(this.adjustX - 15, this.adjustY - 15, 15, 15);
      rect(this.adjustX - 15, this.y, 15, 15);
      fill(0);
      textFont('Courier');
      textSize(17);
      text("X", this.adjustX - 13, this.y + 13)
    }
  }
  
  cornerPressed() {
   //Did I click in the corner?
    if (mouseX > this.adjustX - 15 && mouseX < this.adjustX && mouseY > this.adjustY - 15 && mouseY < this.adjustY) {
      this.resizing = true;
    
    }
  }
  deleteNote() {
    //Did I click the X?
    if (mouseX > this.adjustX - 15 && mouseX < this.adjustX && mouseY > this.y && mouseY < this.y + 15) {
      this.w = 0;
      this.h = 0;
    }
  }
  
  pressed() {
    // Did I click on the rectangle?
    if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h && this.resizing === false) {
      this.dragging = true;
      // If so, keep track of relative location of click to corner of rectangle
      this.offsetX = this.x - mouseX;
      this.offsetY = this.y - mouseY;
    }
  }
  released() {
    // Quit dragging
    this.dragging = false;
    //Quit resizing
    this.resizing = false;

  }
}  