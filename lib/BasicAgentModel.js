var WINDOWBORDERSIZE = 10;
var HUGE = 999999; //Sometimes useful when testing for big or small numbers
var animationDelay = 200; //controls simulation and transition speed
var isRunning = false; // used in simStep and toggleSimStep
var surface; // Set in the redrawWindow function. It is the D3 selection of the svg drawing surface
var simTimer; // Set in the initialization function

//The drawing surface will be divided into logical cells
var maxCols = 40;
var cellWidth; //cellWidth is calculated in the redrawWindow function
var cellHeight; //cellHeight is calculated in the redrawWindow function

//You are free to change images to suit your purpose. These images came from icons-land.com. 
// The copyright rules for icons-land.com require a backlink on any page where they appear. 
// See the credits element on the html page for an example of how to comply with this rule.
const urlPatientA = "images/People-Patient-Female-icon.png";
const urlPatientB = "images/People-Patient-Male-icon.png";
const urlDoctor1 = "images/Doctor_Female.png";
const urlDoctor2 = "images/Doctor_Male.png";
const urlReceptionist ="images/receptionist-icon.png"
const urlChair = "images/Chair-icon.png";



var workerRow = 5;
var workerCol = 12;
var doorRow = 1;
var doorColumn = 20;

//a patient enters the hospital UNTREATED; he or she then is QUEUEING to be treated by a doctor; 
// then INTREATMENT with the doctor; then TREATED;
// When the patient is DISCHARGED he or she leaves the clinic immediately at that point.
const UNTREATED=0;
const WAITING=1;
const CAFE1 = 7
const CAFE4 = 10
const CAFE5 = 11
const CAFE2 = 8
const CAFE3 = 9
const STAGING=2; 
const INTREATMENT =3;
const TREATED=4;
const DISCHARGED=5;
const EXITED = 6;



// We create list of cafes to randomly assign to customers as a prefered cafe

const cafesToChoose = [CAFE1, CAFE2, CAFE3, CAFE4, CAFE5];

// The doctor can be either BUSY treating a patient, or IDLE, waiting for a patient 
const IDLE = 0;
const BUSY = 1;

// There are two types of caregivers in our system: doctors and receptionists
const DOCTOR = 0;
const DOOR = 1;
const WORKER1 = 2;
const WORKER2 = 3;
const WORKER3 = 4;
const WORKER4 = 5;
const WORKER5 = 6;
console.log(DOOR )

// patients is a dynamic list, initially empty

var patients = [];
// caregivers is a static list, populated with a receptionist and a doctor	
var caregivers = [
    {"type":WORKER1,"label":"Worker1","location":{"row":workerRow + 5,"col":workerCol},"state":IDLE},
	{"type":WORKER2,"label":"Worker2","location":{"row":workerRow + 5,"col":workerCol + 4 * 1},"state":IDLE},
	{"type":WORKER3,"label":"Worker3","location":{"row":workerRow + 5,"col":workerCol + 4 * 2},"state":IDLE},
	{"type":WORKER4,"label":"Worker4","location":{"row":workerRow + 5,"col":workerCol + 4 * 3},"state":IDLE},
	{"type":WORKER5,"label":"Worker5","location":{"row":workerRow + 5,"col":workerCol + 4 * 4},"state":IDLE},
	{"type":DOOR,"label":"Door","location":{"row":doorRow,"col":doorColumn},"state":IDLE}
];
var doctor = caregivers[0]; // the doctor is the first element of the caregivers list.

// We can section our screen into different areas. In this model, the waiting area and the staging area are separate.
var areas =[
 {"label":"Cafe 1","startRow":4,"numRows":3,"startCol":11,"numCols":3,"color":"lightblue", "state": CAFE1},
 {"label":"Cafe 2","startRow":4,"numRows":3,"startCol":15,"numCols":3,"color":"lightgreen", "state": CAFE2},
 {"label":"Cafe 3","startRow":4,"numRows":3,"startCol":19,"numCols":3,"color":"pink", "img": urlChair, "state": CAFE3},
 {"label":"Cafe 4","startRow":4,"numRows":3,"startCol":23,"numCols":3,"color":"yellow", "state": CAFE4},
 {"label":"Cafe 5","startRow":4,"numRows":3,"startCol":27,"numCols":3,"color":"orange", "state": CAFE5},
 {"label":"Staging Area 1","startRow":workerRow + 4,"numRows":1,"startCol":workerCol,"numCols":1,"color":"red"},
 {"label":"Staging Area 2","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 1,"numCols":1,"color":"red"},
 {"label":"Staging Area 3","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 2,"numCols":1,"color":"red"},
 {"label":"Staging Area 4","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 3,"numCols":1,"color":"red"},
 {"label":"Staging Area 5","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 4,"numCols":1,"color":"red"}			
]
var cafes = areas.slice(0, 5); // the waiting room is the first element of the areas array

var currentTime = 0;
var statistics = [
	{"name": "Average time in clinic, Type A: ", "location": {"row": workerRow + 7, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Average time in clinic, Type B: ", "location": {"row": workerRow + 8, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Reject percentage ", "location": {"row": workerRow + 9, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Total patients treated: ", "location": {"row": workerRow + 10, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Total patients untreated: ", "location": {"row": workerRow + 11, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Total patients discharged: ", "location": {"row": workerRow + 12, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Cafe 1 selected (%): ", "location": {"row": workerRow + 13, "col": workerCol - 4}, "count": 0, "percentage": 0},
  	{"name": "Cafe 2 selected (%): ", "location": {"row": workerRow + 14, "col": workerCol - 4}, "count": 0, "percentage": 0},
  	{"name": "Cafe 3 selected (%): ", "location": {"row": workerRow + 15, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Cafe 4 selected (%): ", "location": {"row": workerRow + 16, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Cafe 5 selected (%): ", "location": {"row": workerRow + 17, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Total number of patients: ", "location": {"row": workerRow + 18, "col": workerCol - 4}, "count": 0},
	

  ];

// The probability of a patient arrival needs to be less than the probability of a departure, else an infinite queue will build.
// You also need to allow travel time for patients to move from their seat in the waiting room to get close to the doctor.
// So don't set probDeparture too close to probArrival.
var probArrival = 0.6 // 0.25;
var probDeparture = 0.28;

// We can have different types of patients (A and B) according to a probability, probTypeA.
// This version of the simulation makes no difference between A and B patients except for the display image
// Later assignments can build on this basic structure.
var probTypeA = 0.5;

// To manage the queues, we need to keep track of patientIDs.
var nextPatientID_A = 0; // increment this and assign it to the next admitted patient of type A
// var nextPatientID_B = 0; // increment this and assign it to the next admitted patient of type B
var nextTreatedPatientID_A =1; //this is the id of the next patient of type A to be treated by the doctor
// var nextTreatedPatientID_B =1; //this is the id of the next patient of type B to be treated by the doctor

// This next function is executed when the script is loaded. It contains the page initialization code.
(function() {
	// Your page initialization code goes here
	// All elements of the DOM will be available here
	window.addEventListener("resize", redrawWindow); //Redraw whenever the window is resized
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	redrawWindow();
})();

// We need a function to start and pause the the simulation.
function toggleSimStep(){ 
	//this function is called by a click event on the html page. 
	// Search BasicAgentModel.html to find where it is called.
	isRunning = !isRunning;
	console.log("isRunning: "+isRunning);
}

function redrawWindow(){
	isRunning = false; // used by simStep
	window.clearInterval(simTimer); // clear the Timer
	animationDelay = 550 - document.getElementById("slider1").value;
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	
	// Re-initialize simulation variables
	
	nextPatientID_A = 0; // increment this and assign it to the next entering patient of type A
	// nextPatientID_B = 0; // increment this and assign it to the next entering patient of type B
	nextTreatedPatientID_A =1; //this is the id of the next patient of type A to be treated by the doctor
	// nextTreatedPatientID_B =1; //this is the id of the next patient of type B to be treated by the doctor
	currentTime = 0;
	doctor.state=IDLE;
	statistics[0].cumulativeValue=0;
	statistics[0].count=0;
	statistics[1].cumulativeValue=0;
	statistics[1].count=0;
	statistics[2].cumulativeValue=0;
	statistics[2].count=0;
	statistics[3].cumulativeValue=0;
	statistics[4].count=0;
	statistics[4].cumulativeValue=0;
	statistics[5].count=0;
	statistics[5].cumulativeValue=0;
	statistics[6].count=0;
	statistics[6].cumulativeValue=0;
	statistics[7].count=0;
	statistics[7].cumulativeValue=0;
	statistics[8].count=0;
	statistics[8].cumulativeValue=0;
	statistics[9].count=0;
	statistics[9].cumulativeValue=0;
	statistics[10].cumulativeValue=0;
	statistics[10].count=0;
	
	patients = [];

	
	//resize the drawing surface; remove all its contents; 
	var drawsurface = document.getElementById("surface");
	var creditselement = document.getElementById("credits");
	var w = window.innerWidth;
	var h = window.innerHeight;
	var surfaceWidth =(w - 3*WINDOWBORDERSIZE);
	var surfaceHeight= (h-creditselement.offsetHeight - 3*WINDOWBORDERSIZE);
	
	drawsurface.style.width = surfaceWidth+"px";
	drawsurface.style.height = surfaceHeight+"px";
	drawsurface.style.left = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.top = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.border = "thick solid #0000FF"; //The border is mainly for debugging; okay to remove it
	drawsurface.innerHTML = ''; //This empties the contents of the drawing surface, like jQuery erase().
	
	// Compute the cellWidth and cellHeight, given the size of the drawing surface
	numCols = maxCols;
	cellWidth = surfaceWidth/numCols;
	numRows = Math.ceil(surfaceHeight/cellWidth);
	cellHeight = surfaceHeight/numRows;
	
	// In other functions we will access the drawing surface using the d3 library. 
	//Here we set the global variable, surface, equal to the d3 selection of the drawing surface
	surface = d3.select('#surface');
	surface.selectAll('*').remove(); // we added this because setting the inner html to blank may not remove all svg elements
	surface.style("font-size","100%");
	// rebuild contents of the drawing surface
	updateSurface();	
};

// The window is resizable, so we need to translate row and column coordinates into screen coordinates x and y
function getLocationCell(location){
	var row = location.row;
	var col = location.col;
	var x = (col-1)*cellWidth; //cellWidth is set in the redrawWindow function
	var y = (row-1)*cellHeight; //cellHeight is set in the redrawWindow function
	return {"x":x,"y":y};
}

function updateSurface(){
	// This function is used to create or update most of the svg elements on the drawing surface.
	// See the function removeDynamicAgents() for how we remove svg elements
	
	//Select all svg elements of class "patient" and map it to the data list called patients
	var allpatients = surface.selectAll(".patient").data(patients);
	
	// If the list of svg elements is longer than the data list, the excess elements are in the .exit() list
	// Excess elements need to be removed:
	allpatients.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the patients array)
	 
	// If the list of svg elements is shorter than the data list, the new elements are in the .enter() list.
	// The first time this is called, all the elements of data will be in the .enter() list.
	// Create an svg group ("g") for each new entry in the data list; give it class "patient"
	var newpatients = allpatients.enter().append("g").attr("class","patient"); 
	//Append an image element to each new patient svg group, position it according to the location data, and size it to fill a cell
	// Also note that we can choose a different image to represent the patient based on the patient type
	newpatients.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href",function(d){if (d.type=="A") return urlPatientA; else return urlPatientB;});
	
	// For the existing patients, we want to update their location on the screen 
	// but we would like to do it with a smooth transition from their previous position.
	// D3 provides a very nice transition function allowing us to animate transformations of our svg elements.
	
	//First, we select the image elements in the allpatients list
	var images = allpatients.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.
 
	// Patients will leave the clinic when they have been discharged. 
	// That will be handled by a different function: removeDynamicAgents
 
	//Select all svg elements of class "caregiver" and map it to the data list called caregivers
	var allcaregivers = surface.selectAll(".caregiver").data(caregivers);
	//This is not a dynamic class of agents so we only need to set the svg elements for the entering data elements.
	// We don't need to worry about updating these agents or removing them
	// Create an svg group ("g") for each new entry in the data list; give it class "caregiver"
	var newcaregivers = allcaregivers.enter().append("g").attr("class","caregiver");
	newcaregivers.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href",function(d){if (d.type==DOCTOR) return urlDoctor1; else return urlReceptionist;});
	
	// It would be nice to label the caregivers, so we add a text element to each new caregiver group
	newcaregivers.append("text")
    .attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.label; });
	
	// The simulation should serve some purpose 
	// so we will compute and display the average length of stay of each patient type.
	// We created the array "statistics" for this purpose.
	// Here we will create a group for each element of the statistics array (two elements)
	var allstatistics = surface.selectAll(".statistics").data(statistics);
	var newstatistics = allstatistics.enter().append("g").attr("class","statistics");
	// For each new statistic group created we append a text label
	newstatistics.append("text")
	.attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(""); 

	console.log(newstatistics, "newstatistics")
	
	// The data in the statistics array are always being updated.
	// So, here we update the text in the labels with the updated information.
	allstatistics.selectAll("text").text(function(d) {
		console.log()
		var avgLengthOfStay = d.percentage ? d.percentage : d.count; // cumulativeValue and count for each statistic are always changing
		return d.name+avgLengthOfStay.toFixed(3); }); //The toFixed() function sets the number of decimal places to display

	// Finally, we would like to draw boxes around the different areas of our system. We can use d3 to do that too.
	var allareas = surface.selectAll(".areas").data(areas);
	var newareas = allareas.enter().append("g").attr("class","areas");
	// For each new area, append a rectangle to the group
	newareas.append("rect")
	.attr("x", function(d){return (d.startCol-1)*cellWidth;})
	.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
	.attr("width",  function(d){return d.numCols*cellWidth;})
	.attr("height",  function(d){return d.numRows*cellWidth;})
	.style("fill", function(d) { return d.color; })
	.style("stroke","black")
	.style("stroke-width",1);
}



function addDynamicAgents(){
	// Patients are dynamic agents: they enter the clinic, wait, get treated, and then leave
	// We have entering patients of two types "A" and "B"
	// We could specify their probabilities of arrival in any simulation step separately
	// Or we could specify a probability of arrival of all patients and then specify the probability of a Type A arrival.
	// We have done the latter. probArrival is probability of arrival a patient and probTypeA is the probability of a type A patient who arrives.
	// First see if a patient arrives in this sim step.
	if (Math.random()< probArrival){
		var newpatient = {"id":1,"type":"A","location":{"row":1,"col":1}, "timeTreatmentStarted":0,
		"target":{"row":doorRow,"col":doorColumn},"state":UNTREATED,"timeAdmitted":0};
		// if (Math.random()<probTypeA) newpatient.type = "A";
		// else newpatient.type = "B";			
		patients.push(newpatient);
	}
	
}

const EMPTY = 0;
const OCCUPIED = 1;


const queues = [
	[{row: 4, column: 11, state: EMPTY}, {row: 4, column: 12, state: EMPTY}, {row: 4, column: 13, state: EMPTY},
	 {row: 5, column: 11, state: EMPTY}, {row: 5, column: 12, state: EMPTY}, {row: 5, column: 13, state: EMPTY},
	 {row: 6, column: 11, state: EMPTY}, {row: 6, column: 12, state: EMPTY}, {row: 6, column: 13, state: EMPTY}],

	[{row: 4, column: 15, state: EMPTY}, {row: 4, column: 16, state: EMPTY}, {row: 4, column: 17, state: EMPTY},
	 {row: 5, column: 15, state: EMPTY}, {row: 5, column: 16, state: EMPTY}, {row: 5, column: 17, state: EMPTY},
	 {row: 6, column: 15, state: EMPTY}, {row: 6, column: 16, state: EMPTY}, {row: 6, column: 17, state: EMPTY}],

	[{row: 4, column: 19, state: EMPTY}, {row: 4, column: 20, state: EMPTY}, {row: 4, column: 21, state: EMPTY},
	 {row: 5, column: 19, state: EMPTY}, {row: 5, column: 20, state: EMPTY}, {row: 5, column: 21, state: EMPTY},
	 {row: 6, column: 19, state: EMPTY}, {row: 6, column: 20, state: EMPTY}, {row: 6, column: 21, state: EMPTY}],

	[{row: 4, column: 23, state: EMPTY}, {row: 4, column: 24, state: EMPTY}, {row: 4, column: 25, state: EMPTY},
	 {row: 5, column: 23, state: EMPTY}, {row: 5, column: 24, state: EMPTY}, {row: 5, column: 25, state: EMPTY},
	 {row: 6, column: 23, state: EMPTY}, {row: 6, column: 24, state: EMPTY}, {row: 6, column: 25, state: EMPTY}],

	[{row: 4, column: 27, state: EMPTY}, {row: 4, column: 28, state: EMPTY}, {row: 4, column: 29, state: EMPTY},
	 {row: 5, column: 27, state: EMPTY}, {row: 5, column: 28, state: EMPTY}, {row: 5, column: 29, state: EMPTY},
	 {row: 6, column: 27, state: EMPTY}, {row: 6, column: 28, state: EMPTY}, {row: 6, column: 29, state: EMPTY}],

];

const isOnTheWay = [ {state: false}, {state:false}, {state:false}, {state:false}, {state:false} ]


function processCafeState(patient, state, hasArrived) {

	

	const cafeIndex = state - CAFE1;
	const cafeQueue = queues[cafeIndex];


	// console.log("Cafe Index:", cafeIndex, "Patient ID:", patient.id, "Patient State:", patient.state);
  
	const currentQueueIndex = cafeQueue.findIndex(
	  (n) => n.row === patient.location.row && n.column === patient.location.col
	);


	if (currentQueueIndex === -1) {
		return;
	  }

	const nextQueueIndex = currentQueueIndex + 1;
  
	if (currentQueueIndex === cafeQueue.length - 1 && hasArrived) {
	  const staging = {
		row: caregivers[cafeIndex].location.row - 1,
		col: caregivers[cafeIndex].location.col,
	  };

	 
  
	  const patientInStaging = patients.find(
		(p) => p.location.row === staging.row && p.location.col === staging.col
	  );

	 // console.log(patientInStaging, " patientInStaging")
  
	  if (!patientInStaging && !isOnTheWay[cafeIndex].state) {
		isOnTheWay[cafeIndex].state = true;
		//console.log(!isOnTheWay[cafeIndex].state, " !isOnTheWay[cafeIndex].state in staging")
		cafeQueue[currentQueueIndex].state = EMPTY;
		patient.state = STAGING;
		patient.target.row = staging.row;
		patient.target.col = staging.col;
		patient.location.row = staging.row;
		patient.location.col = staging.col; // update patient's location
	  }
	} else if (
	  hasArrived &&
	  (nextQueueIndex < cafeQueue.length || currentQueueIndex === cafeQueue.length - 1) &&
      (nextQueueIndex >= cafeQueue.length || cafeQueue[nextQueueIndex].state === EMPTY)
  ) {
	  cafeQueue[currentQueueIndex].state = EMPTY;
	  if (nextQueueIndex < cafeQueue.length) {
		cafeQueue[nextQueueIndex].state = OCCUPIED;
		patient.target.row = cafeQueue[nextQueueIndex].row;
		patient.target.col = cafeQueue[nextQueueIndex].column;
		patient.location.row = cafeQueue[nextQueueIndex].row;
		patient.location.col = cafeQueue[nextQueueIndex].column;
    }
	}
  }

  //NIKI tein tälläse apufunktio mil saadaa potilaa nykyse kahvila indeksi isOnTheWay arrayt varte
  const getCurrentCafe = (patient) => {
	var col = patient.location.col;
	let currentQueue = undefined

	if (col === 11 || col === 12 || col === 13) {
		currentQueue = 0
	} else if (col === 15 || col === 16 || col === 17) {
		currentQueue = 1
	} else if (col === 19 || col === 20 || col === 21) {
		currentQueue = 2
	} else if (col === 23 || col === 24 || col === 25) {
		currentQueue = 3
	} else if (col === 27 || col === 28 || col === 29) {
		currentQueue = 4
	}

	return currentQueue
}


  function updatePatient(patientIndex) {
	//patientIndex is an index into the patients data array
	patientIndex = Number(patientIndex); //it seems patientIndex was coming in as a string
	var patient = patients[patientIndex];
  
	// get the current location of the patient
	var row = patient.location.row;
	var col = patient.location.col;
	var state = patient.state;
  
	// determine if patient has arrived at destination
	var hasArrived = (Math.abs(patient.target.row - row) + Math.abs(patient.target.col - col)) == 0;
  
	// Behavior of patient depends on his or her state
	switch (state) {
	  case UNTREATED:
		// ... Same as before


			let randomIndex = Math.floor(Math.random() * queues.length);
			var chosenQueue = queues[randomIndex];
			var amoutOfFreeSpotsIntheQueue = chosenQueue.filter(n => n.state == EMPTY).length;
			var isNotFullyBooked = amoutOfFreeSpotsIntheQueue > 0;

			if (hasArrived) {
				if (isNotFullyBooked) {
				patient.timeAdmitted = currentTime;

				patient.state = CAFE1 + randomIndex; //randomCafe.state;
				patient.target.row = chosenQueue[amoutOfFreeSpotsIntheQueue - 1].row;
				patient.target.col = chosenQueue[amoutOfFreeSpotsIntheQueue - 1].column;
				chosenQueue[amoutOfFreeSpotsIntheQueue - 1].state = OCCUPIED;

				patient.id = ++nextPatientID_A;
				} else {
				patient.state = DISCHARGED;
				stats = statistics[2];

				patient.target.row = 1;
				patient.target.col = maxCols;
				break;
				}
			}
  
		break;
  
	  case CAFE5:
		processCafeState(patient, state, hasArrived);
		statistics[11].count++;
		statistics[10].count++;
		statistics[10].percentage = statistics[10].count / statistics[11].count
		// console.log(statistics[10], "     statistics[10]    ")
  
		break;
  
		
	  case CAFE2:
		processCafeState(patient, state, hasArrived);
		statistics[11].count++;
		statistics[7].count++;
		statistics[7].percentage = statistics[7].count / statistics[11].count
		break;
  
	  case CAFE3:
		processCafeState(patient, state, hasArrived);
		statistics[11].count++;
		statistics[8].count++;
		statistics[8].percentage = statistics[8].count / statistics[11].count
		break;
  
		
	  case CAFE4:
		processCafeState(patient, state, hasArrived);
		statistics[11].count++;
		statistics[9].count++;
		statistics[9].percentage = statistics[9].count / statistics[11].count
		break;
  
		
	  case CAFE1:
		processCafeState(patient, state, hasArrived);
		statistics[11].count++;
		statistics[6].count++;
		statistics[6].percentage = statistics[6].count / statistics[11].count
  
		break;
  
		case STAGING:
			if (hasArrived) {
				const currentDoctor = caregivers.find(cg => cg.location.row === patient.location.row + 1 && cg.location.col === patient.location.col);
				if (currentDoctor && currentDoctor.state === IDLE) {
				currentDoctor.state = BUSY;
				patient.state = INTREATMENT;
				patient.timeTreatmentStarted = currentTime;
				} else {
				isOnTheWay[currentDoctor.type - 2] = false;
				}
			} else {
				// If the patient hasn't arrived, set the corresponding isOnTheWay flag to false
				const cafeIndex = patient.state - CAFE1;
				isOnTheWay[cafeIndex] = false;
			}
			break;
	  case INTREATMENT:

		if (currentTime - patient.timeTreatmentStarted >= 5) {
			patient.state = TREATED;
			const currentDoctor = caregivers.find(cg => cg.location.row === patient.location.row + 1 && cg.location.col === patient.location.col);

			if (currentDoctor) {
				currentDoctor.state = IDLE;
			}

			statistics[3].count++;

			//NIKI OTIN NÄ VITTUU
			//En oo iha varma oliks täs kohtaa oleellist ohjaa potilas vittuu

			// patient.target.row = doorRow;
			// patient.target.col = doorColumn;
		}
		
		break;
	  case TREATED:
		if (hasArrived){

			//NIKI tää oli vanha
			// Anto aina saman indeksi minkä takii jumitti vaa yhtee cafee
			// isOnTheWay[doctor.type - 2].state = false

			//NIKI tää on uus
			isOnTheWay[getCurrentCafe(patient)].state = false

			patient.state = DISCHARGED;
			patient.target.row = 1;
			patient.target.col = maxCols;
			
			// compute statistics for discharged patient
			var timeInClinic = currentTime - patient.timeAdmitted;
			var stats;
			if (patient.type=="A"){
				stats = statistics[0].count;
			}else{
				stats = statistics[1].count;
			}
			stats.cumulativeValue = stats.cumulativeValue+timeInClinic;
			stats.count = stats.count + 1;
			statistics[5].count++;
		}
  
		break;
	  case DISCHARGED:
		if (hasArrived){
			patient.state = EXITED;
			if (patient.type === "A" || patient.type === "B") {
				statistics[4].count++;
			  }
			stats = statistics[2].count;
		}
  
		break;
	  default:
		break;

	}

	// set the destination row and column
	var targetRow = patient.target.row;
	var targetCol = patient.target.col;
	// compute the distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// set the speed
	var cellsPerStep = 1;
	// compute the cell to move to
	var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
	var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo);
	// update the location of the patient
	patient.location.row = newRow;
	patient.location.col = newCol;
  }

function removeDynamicAgents(){
	// We need to remove patients who have been discharged. 
	//Select all svg elements of class "patient" and map it to the data list called patients
	var allpatients = surface.selectAll(".patient").data(patients);
	//Select all the svg groups of class "patient" whose state is EXITED
	var treatedpatients = allpatients.filter(function(d,i){return d.state==EXITED;});
	// Remove the svg groups of EXITED patients: they will disappear from the screen at this point
	treatedpatients.remove();
	
	// Remove the EXITED patients from the patients list using a filter command
	patients = patients.filter(function(d){return d.state!=EXITED;});
	// At this point the patients list should match the images on the screen one for one 
	// and no patients should have state EXITED
}


function updateDynamicAgents(){
	// loop over all the agents and update their states
	for (var patientIndex in patients){
		updatePatient(patientIndex);
	}
	updateSurface();	
}

function simStep(){
	//This function is called by a timer; if running, it executes one simulation step 
	//The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ //the isRunning variable is toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
		// Sometimes new agents will be created in the following function
		addDynamicAgents();
		// In the next function we update each agent
		updateDynamicAgents();
		// Sometimes agents will be removed in the following function
		removeDynamicAgents();
	}
}
