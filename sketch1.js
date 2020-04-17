var bugs = [];
var numBugs = 7;
var winX = 640;
var winY = 480;
var spriteX = 80;
var spriteY = 80;
var numBugsSquished = 0;
var timer = 30, oldTime;
var moveSpeed = 1;
var spriteSheet = "bug_spritesheet.png";

var membraneSynth;
var metalSynth;
var monoSynth;
var lfo;
var loop1, loop2, loop3, endLoop1, endLoop2;

//Hardware Assignment #3 variables
var squareWidth = 40, squareHeight = 40;
var squareX = winX / 2, squareY = 0;
var serial;
var portName = 'COM3';
var latestData = "Waiting for data...";
var buttonDown = false;
var buzzerTime = 0.5, buzzerTimer;

function preload(){
	for(var i = 0; i < numBugs; i++){
		bugs[i] = new Bug(random(winX), random(winY), spriteSheet, random([-1, 1]));
	}
}

function setup() {
	// put setup code here
	createCanvas(winX, winY);
	imageMode(CENTER);
	
	var crusher = new Tone.BitCrusher(4).toMaster();
	membraneSynth = new Tone.MembraneSynth({
		"envelope": {
			"release": 0.3
		}
	}).connect(crusher);
	
	metalSynth = new Tone.MetalSynth({
		"frequency": 10,
		"envelope": {
			"decay": 0.7
		}
	}).connect(crusher);
	
	monoSynth = new Tone.MonoSynth({
		"oscillator" : {
			"type" : "triangle"
		}
	}).toMaster();
	monoSynth.volume.value = -48;
	lfo = new Tone.LFO("2n", 400, 2000).start();
	lfo.connect(monoSynth.frequency);
	
	var loopMemSynth = new Tone.MembraneSynth({
		"volume": -24
	}).toMaster();
	loopMetalSynth = new Tone.MetalSynth({
		"frequency": 10,
		"envelope": {
			"decay": 0.7
		},
		"volume": -24
	}).toMaster();
	
	loop1 = new Tone.Loop(function() {
		loopMemSynth.triggerAttackRelease("C3", 0.1);
		loopMetalSynth.triggerAttackRelease(0.3, "+8n");
	}, "4n");
	
	loop2 = new Tone.Loop(function() {
		loopMemSynth.triggerAttackRelease("C3", 0.1);
		loopMetalSynth.triggerAttackRelease(0.3, "+32n");
	}, "16n");
	
	loop3 = new Tone.Loop(function() {
		loopMemSynth.triggerAttackRelease("C3", 0.1);
		loopMetalSynth.triggerAttackRelease(0.3, "+64n");
	}, "32n");
	
	endLoop1 = new Tone.Loop(function() {
		loopMetalSynth.triggerAttackRelease(0.3);
	}, "4n");
	
	endLoop2 = new Tone.Loop(function() {
		loopMemSynth.triggerAttackRelease("C3", 0.1);
	}, "2n");
	
	Tone.Transport.start();
	
	configureBackgroundNoise();
	
	
	//Hardware Assignment #3 Code
	serial = new p5.SerialPort();
	serial.open(portName);
	serial.on('data', gotData);
}

function gotData() {
	var currentString = serial.readLine();
	if(currentString != ""){
		//console.log(currentString);
		latestData = parseInt(currentString);
		if(latestData <= 480 - squareHeight / 2 && latestData >= squareHeight / 2){
			squareY = latestData;
		} else if(latestData < squareHeight / 2){
			squareY = squareHeight / 2;
		} else if(latestData > 480 - squareHeight / 2 && latestData <= 480){
			squareY = 480 - squareHeight / 2;
		} else if(latestData == 1022 && !buttonDown){
			buttonPressed();
			buttonDown = true;
		} else if(latestData == 1023 && buttonDown){
			buttonDown = false;
		}
	}
}

function draw() {
	// put drawing code here
	background(128, 128, 128);
	for(var i = 0; i < numBugs; i++){
		bugs[i].draw();
	}
	textSize(24);
	textAlign(RIGHT, TOP);
	fill(255, 255, 255);
	text('Bugs Squished: ' + numBugsSquished, 0, 0, width);
	if(timer > 0){
		oldTime = timer;
		timer -= deltaTime / 1000;
		
	} else {
		timer = 0;
		textAlign(CENTER, CENTER);
		text("Time's Up!", 0, height/2 - 30, width);
		text('You squished ' + numBugsSquished + (numBugsSquished == 1 ? ' bug!' : ' bugs!'), 0, height/2, width);
		text('Play Again', 0, height/2 + 30, width);
	}
	textAlign(LEFT, TOP);
	text('Time Remaining: ' + ceil(timer), 0, 0);
	
	//Hardware Assignment #3 Code
	text(buttonDown, 10, 40);
	textAlign(RIGHT, TOP);
	//text("" + squareX + ", " + squareY, 0, 40, width);
	rectMode(CENTER);
	fill('rgba(255, 255, 255, 0.30)');
	rect(squareX, squareY, squareWidth, squareHeight);
	fill('rgba(0, 0, 0, 1.00)');
	rect(squareX, squareY, squareWidth / 10, squareHeight / 10);
	rectMode(CORNER);
	if(buzzerTimer > 0){
		buzzerTimer -= deltaTime / 1000;
	} else  {
		serial.write("L");
	}
}

function configureBackgroundNoise(){
	monoSynth.triggerAttackRelease("C3", 30);
	lfo.frequency.setValueAtTime("2n", "+0.1");
	lfo.frequency.setValueAtTime("8n", "+20");
	lfo.frequency.setValueAtTime("16n", "+27");
	lfo.frequency.setValueAtTime("2n", "+30");
	loop1.start("+0.1").stop("+20");
	loop2.start("+20").stop("+27");
	loop3.start("+27").stop("+30");
	endLoop1.start("+30");
	endLoop2.start("+30");
}

function buttonPressed(){
	if(timer > 0){
		var bugClicked = false;
		for(var i = 0; i < numBugs; i++){
			//Check if mouse position is within a moving sprite object
			if(squareX > bugs[i].x - spriteX / 2 && squareX < bugs[i].x + spriteX / 2
			&& squareY > bugs[i].y - spriteY / 2 && squareY < bugs[i].y + spriteY / 2
			&& bugs[i].movement != 0){
				bugs[i].stop();
				numBugsSquished++;
				moveSpeed++;
				bugs[numBugs] = new Bug(random(winX), random(winY), spriteSheet, random([-1, 1]));
				numBugs++;
				bugClicked = true;
				monoSynth.frequency.value += 100;
				break;
			}
		}
		if(!bugClicked){
			metalSynth.triggerAttackRelease(0.5);
		}else{
			membraneSynth.triggerAttackRelease("A4", 0.1);
			buzzerTimer = buzzerTime;
			serial.write("H");
		}
	} else {
		//Click on play again
		if(squareX > width/2 - 75 && squareX < width/2 + 75
		&& squareY > height/2 + 15 && squareY < height/2 + 45){
			numBugsSquished = 0;
			timer = 30;
			moveSpeed = 1;
			numBugs = 7;
			for(var i = 0; i < numBugs; i++){
				bugs[i] = new Bug(random(winX), random(winY), spriteSheet, random([-1, 1]));
			}
			endLoop1.stop("+0.1");
			endLoop2.stop("+0.1");
			configureBackgroundNoise();
		}
	}
}

function mousePressed(){
	if(timer > 0){
		var bugClicked = false;
		for(var i = 0; i < numBugs; i++){
			//Check if mouse position is within a moving sprite object
			if(mouseX > bugs[i].x - spriteX / 2 && mouseX < bugs[i].x + spriteX / 2
			&& mouseY > bugs[i].y - spriteY / 2 && mouseY < bugs[i].y + spriteY / 2
			&& bugs[i].movement != 0){
				bugs[i].stop();
				numBugsSquished++;
				moveSpeed++;
				bugs[numBugs] = new Bug(random(winX), random(winY), spriteSheet, random([-1, 1]));
				numBugs++;
				bugClicked = true;
				monoSynth.frequency.value += 100;
				break;
			}
		}
		if(!bugClicked){
			metalSynth.triggerAttackRelease(0.5);
		}else{
			membraneSynth.triggerAttackRelease("A4", 0.1);
		}
	} else {
		//Click on play again
		if(mouseX > width/2 - 75 && mouseX < width/2 + 75
		&& mouseY > height/2 + 15 && mouseY < height/2 + 45){
			numBugsSquished = 0;
			timer = 30;
			moveSpeed = 1;
			numBugs = 7;
			for(var i = 0; i < numBugs; i++){
				bugs[i] = new Bug(random(winX), random(winY), spriteSheet, random([-1, 1]));
			}
			endLoop1.stop("+0.1");
			endLoop2.stop("+0.1");
			configureBackgroundNoise();
		}
	}
}

function Bug(startX, startY, sprite, movement){
	this.x = startX;
	this.y = startY;
	this.movement = movement;
	this.facing = movement;
	this.spriteSheet = loadImage(sprite);
	this.frame = 0;
	
	this.go = function(direction){
		this.movement = direction;
	}
	this.stop = function(){
		this.movement = 0;
		this.frame = 3;
	}
	
	this.draw = function() {
		// put drawing code here
		push();
		if(this.movement == 0){
			if(this.facing == -1){
				translate(this.x, this.y);
				scale(-1, 1);
				translate(-this.x, -this.y);
			}
			image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 560, 0, 80, 80);
		} else {
			if(this.movement == 1){
				if(this.x >= winX - spriteX/2){
					this.movement = -1;
					this.facing = -1;
				} else {
					this.x += moveSpeed;
				}
			} else if(this.movement == -1) {
				if(this.x <= spriteX/2){
					this.movement = 1;
					this.facing = 1;
				} else {
					translate(this.x, this.y);
					scale(-1, 1);
					translate(-this.x, -this.y);
					this.x -= moveSpeed;
				}
			}
			switch(this.frame){
				case 0: 
				case 6: image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 240, 0, 80, 80);
						break;
				case 1: 
				case 5: image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 160, 0, 80, 80);
						break;
				case 2: 
				case 4: image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 80, 0, 80, 80);
						break;
				case 3: image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 0, 0, 80, 80);
						break;
				case 7: 
				case 11:image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 320, 0, 80, 80);
						break;
				case 8: 
				case 10:image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 400, 0, 80, 80);
						break;
				case 9: image(this.spriteSheet, this.x, this.y, spriteX, spriteY, 480, 0, 80, 80);
						break;
			}
			if(frameCount % 6 == 0){
				this.frame = (this.frame + 1) % 11;
			}
		}
		pop();
	} 
}