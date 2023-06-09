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
const urlCustomer = "images/People-Patient-Female-icon.png";
const urlCashier = "images/Doctor_Female.png";
const urlReceptionist ="images/receptionist-icon.png"
const urlChair = "images/Chair-icon.png";



var workerRow = 5;
var workerCol = 12;
var doorRow = 1;
var doorColumn = 20;

let collectedData = [];

// a customer enters the canteen UNTREATED; a customer then is QUEUEING to be treated by a Cashier; 
// then INTREATMENT with the doctor; then TREATED;
// When the customer is DISCHARGED he or she leaves the clinic immediately at that point.
const UNTREATED=0;
const WAITING=1;
const CAFE1 = 7
const CAFE4 = 10
const CAFE5 = 11
const CAFE6 = 12
const CAFE2 = 8
const CAFE3 = 9
const STAGING=2; 
const INTREATMENT =3;
const TREATED=4;
const DISCHARGED=5;
const EXITED = 6;


// The cashier can be either BUSY treating a customer, or IDLE, waiting for a customer 
const IDLE = 0;
const BUSY = 1;

// There are two types of caregivers in our system: chashier and receptionists (door)
const CASHIER = 0;
const DOOR = 1;
const WORKER1 = 2;
const WORKER2 = 3;
const WORKER3 = 4;
const WORKER4 = 5;
const WORKER5 = 6;
const WORKER6 = 7;
console.log(DOOR )

// customers is a dynamic list, initially empty

var customers = [];
// caregivers is a static list, populated with a receptionist (door) and a cashier	
var caregivers = [
    {"type":WORKER1,"label":"Worker1","location":{"row":workerRow + 5,"col":workerCol},"state":IDLE},
	{"type":WORKER2,"label":"Worker2","location":{"row":workerRow + 5,"col":workerCol + 4 * 1},"state":IDLE},
	{"type":WORKER3,"label":"Worker3","location":{"row":workerRow + 5,"col":workerCol + 4 * 2},"state":IDLE},
	{"type":WORKER4,"label":"Worker4","location":{"row":workerRow + 5,"col":workerCol + 4 * 3},"state":IDLE},
	{"type":WORKER5,"label":"Worker5","location":{"row":workerRow + 5,"col":workerCol + 4 * 4},"state":IDLE},
	{"type":WORKER6,"label":"Worker6","location":{"row":workerRow + 5,"col":workerCol + 4 * 5},"state":IDLE},
	{"type":DOOR,"label":"Door","location":{"row":doorRow,"col":doorColumn},"state":IDLE}
];
var cashier = caregivers[0]; // the cashier is the first element of the caregivers list.

// We can section our screen into different areas. In this model, the waiting area and the staging area are separate.
var areas =[
 {"label":"Cafe 1","startRow":4,"numRows":3,"startCol":11,"numCols":3,"color":"lightblue", "state": CAFE1},
 {"label":"Cafe 2","startRow":4,"numRows":3,"startCol":15,"numCols":3,"color":"lightgreen", "state": CAFE2},
 {"label":"Cafe 3","startRow":4,"numRows":3,"startCol":19,"numCols":3,"color":"pink", "img": urlChair, "state": CAFE3},
 {"label":"Cafe 4","startRow":4,"numRows":3,"startCol":23,"numCols":3,"color":"yellow", "state": CAFE4},
 {"label":"Cafe 5","startRow":4,"numRows":3,"startCol":27,"numCols":3,"color":"orange", "state": CAFE5},
 {"label":"Cafe 6","startRow":4,"numRows":3,"startCol":31,"numCols":3,"color":"brown", "state": CAFE6},
 {"label":"Staging Area 1","startRow":workerRow + 4,"numRows":1,"startCol":workerCol,"numCols":1,"color":"red"},
 {"label":"Staging Area 2","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 1,"numCols":1,"color":"red"},
 {"label":"Staging Area 3","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 2,"numCols":1,"color":"red"},
 {"label":"Staging Area 4","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 3,"numCols":1,"color":"red"},
 {"label":"Staging Area 5","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 4,"numCols":1,"color":"red"},
 {"label":"Staging Area 6","startRow":workerRow + 4,"numRows":1,"startCol":workerCol + 4 * 5,"numCols":1,"color":"red"}				
]
var cafes = areas.slice(0, 6); // the waiting room is the first element of the areas array

var currentTime = 0;
var statistics = [
	{"name": "Total customer treated: ", "location": {"row": workerRow + 10, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Total customer untreated: ", "location": {"row": workerRow + 11, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Total customer discharged: ", "location": {"row": workerRow + 12, "col": workerCol - 4}, "cumulativeValue": 0, "count": 0},
	{"name": "Cafe 1 selected (%): ", "location": {"row": workerRow + 13, "col": workerCol - 4}, "count": 0, "percentage": 0},
  	{"name": "Cafe 2 selected (%): ", "location": {"row": workerRow + 14, "col": workerCol - 4}, "count": 0, "percentage": 0},
  	{"name": "Cafe 3 selected (%): ", "location": {"row": workerRow + 15, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Cafe 4 selected (%): ", "location": {"row": workerRow + 16, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Cafe 5 selected (%): ", "location": {"row": workerRow + 17, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Cafe 6 selected (%): ", "location": {"row": workerRow + 18, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Total number of customers: ", "location": {"row": workerRow + 19, "col": workerCol - 4}, "count": 0},
	{"name": "First option selected (%): ", "location": {"row": workerRow + 20, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Second option selected (%): ", "location": {"row": workerRow + 21, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Third option selected (%): ", "location": {"row": workerRow + 22, "col": workerCol - 4}, "count": 0, "percentage": 0},
	{"name": "Total number of customers in staging: ", "location": {"row": workerRow + 23, "col": workerCol - 4}, "count": 0},
	

  ];

// The probability of a customer arrival needs to be less than the probability of a departure, else an infinite queue will build.
// You also need to allow travel time for customers to move from their seat in the waiting room to get close to the cashier.
// So don't set probDeparture too close to probArrival.
var probArrival = 0.6 // 0.25;
var probDeparture = 0.28;

// To manage the queues, we need to keep track of customerIDs.
var nextCustomerId = 0; // increment this and assign it to the next admitted customer

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
// In case we want to check the stats in excel
function arrayToCSV(data) {

	if (data.length === 0) {
		console.error("No data collected!");
		return '';
	  }
	const header = Object.keys(data[0]).join(',') + '\n';
	const rows = data.map(row => Object.values(row).join(',')).join('\n');
	return header + rows;
  }

// Download the CSV file
function downloadCSV(csv, filename) {
	const blob = new Blob([csv], { type: 'text/csv' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
  }

function redrawWindow(){
	isRunning = false; // used by simStep
	window.clearInterval(simTimer); // clear the Timer
	animationDelay = 550 - document.getElementById("slider1").value;
	simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	
	// Re-initialize simulation variables
	
	nextCustomerId = 0; // increment this and assign it to the next entering customer
	
	currentTime = 0;
	cashier.state=IDLE;
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
	statistics[10].count=0;
	statistics[10].cumulativeValue=0;
	statistics[11].count=0;
	statistics[11].cumulativeValue=0;
	statistics[12].count=0;
	statistics[12].cumulativeValue=0;
	statistics[13].count=0;
	statistics[13].cumulativeValue=0;
	
	customers = [];

	
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
	
	//Select all svg elements of class "patient" and map it to the data list called customers
	var allcustomers = surface.selectAll(".patient").data(customers);
	
	// If the list of svg elements is longer than the data list, the excess elements are in the .exit() list
	// Excess elements need to be removed:
	allcustomers.exit().remove(); //remove all svg elements associated with entries that are no longer in the data list
	// (This remove function is needed when we resize the window and re-initialize the customers array)
	 
	// If the list of svg elements is shorter than the data list, the new elements are in the .enter() list.
	// The first time this is called, all the elements of data will be in the .enter() list.
	// Create an svg group ("g") for each new entry in the data list; give it class "patient"
	var newcustomers = allcustomers.enter().append("g").attr("class","patient"); 
	//Append an image element to each new patient svg group, position it according to the location data, and size it to fill a cell
	// Also note that we can choose a different image to represent the patient based on the patient type
	newcustomers.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href", urlCustomer);
	
	// For the existing customers, we want to update their location on the screen 
	// but we would like to do it with a smooth transition from their previous position.
	// D3 provides a very nice transition function allowing us to animate transformations of our svg elements.
	
	//First, we select the image elements in the allcustomers list
	var images = allcustomers.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.
 
	// Customers will leave the clinic when they have been discharged. 
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
	 .attr("xlink:href",function(d){if (d.type==CASHIER) return urlCashier; else return urlReceptionist;});
	
	// It would be nice to label the caregivers, so we add a text element to each new caregiver group
	newcaregivers.append("text")
    .attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.label; });
	
	// The simulation should serve some purpose 
	// We created the array "statistics" for this purpose.
	// Here we will create a group for each element of the statistics array (two elements)

	var statsToShow = statistics.map((x) => x);
	statsToShow.splice(9, 1)
	var allstatistics = surface.selectAll(".statistics").data(statsToShow);
	var newstatistics = allstatistics.enter().append("g").attr("class","statistics");
	// For each new statistic group created we append a text label
	newstatistics.append("text")
	.attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(""); 

	
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
	// Customers are dynamic agents: they enter the clinic, wait, get treated, and then leave
	if (Math.random()< probArrival){
		var newcustomer = {"id":1,"type":"A","location":{"row":1,"col":1}, "timeTreatmentStarted":0,
		"target":{"row":doorRow,"col":doorColumn},"state":UNTREATED,"timeAdmitted":0};		
		customers.push(newcustomer);
	}
	
}

// States for queues
const EMPTY = 0;
const OCCUPIED = 1;

// Different queues for the caffes
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
	 
	[{row: 4, column: 31, state: EMPTY}, {row: 4, column: 32, state: EMPTY}, {row: 4, column: 33, state: EMPTY},
	 {row: 5, column: 31, state: EMPTY}, {row: 5, column: 32, state: EMPTY}, {row: 5, column: 33, state: EMPTY},
	 {row: 6, column: 31, state: EMPTY}, {row: 6, column: 32, state: EMPTY}, {row: 6, column: 33, state: EMPTY}],

];

// As customers move me need to know whether they are on the way to the selected queue/staging place as otherwise collisions will be happening
const isOnTheWay = [ {state: false}, {state:false}, {state:false}, {state:false}, {state:false}, {state:false} ]

// Helper function to help with processing state of different caffe queues
// If the is a free spot in the queue -> customers move there.
// Customers move right and down the queue
// If there is a customer that is the next customer to be treated -> move the customer to the staging
function processCafeState(customer, state, hasArrived) {

	const cafeIndex = state - CAFE1;
	const cafeQueue = queues[cafeIndex];
  
	const currentQueueIndex = cafeQueue.findIndex(
	  (n) => n.row === customer.location.row && n.column === customer.location.col
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

	 
  
	  const customerInStaging = customers.find(
		(p) => p.location.row === staging.row && p.location.col === staging.col
	  );
  
	  // Move a customer to the staging
	  if (!customerInStaging && !isOnTheWay[cafeIndex].state) {
		isOnTheWay[cafeIndex].state = true;
		cafeQueue[currentQueueIndex].state = EMPTY;
		customer.state = STAGING;
		customer.target.row = staging.row;
		customer.target.col = staging.col;
		customer.location.row = staging.row;
		customer.location.col = staging.col; // update customers's location
	  } // Move customer down the queue 
	} else if (
	  hasArrived &&
	  (nextQueueIndex < cafeQueue.length || currentQueueIndex === cafeQueue.length - 1) &&
      (nextQueueIndex >= cafeQueue.length || cafeQueue[nextQueueIndex].state === EMPTY)
  ) {
	  cafeQueue[currentQueueIndex].state = EMPTY;
	  if (nextQueueIndex < cafeQueue.length) {
		cafeQueue[nextQueueIndex].state = OCCUPIED; 
		customer.target.row = cafeQueue[nextQueueIndex].row;
		customer.target.col = cafeQueue[nextQueueIndex].column;
		customer.location.row = cafeQueue[nextQueueIndex].row;
		customer.location.col = cafeQueue[nextQueueIndex].column;
    }
	}
  }

  // Helper function that gives index of the cafe for the isOnTheWay boolean
  const getCurrentCafe = (customer) => {
	var col = customer.location.col;

	if (col === 11 || col === 12 || col === 13) {
		return 0
	} else if (col === 15 || col === 16 || col === 17) {
		return 1
	} else if (col === 19 || col === 20 || col === 21) {
		return 2
	} else if (col === 23 || col === 24 || col === 25) {
		return 3
	} else if (col === 27 || col === 28 || col === 29) {
		return 4
	} else if (col === 31 || col === 32 || col === 33) {
		return 5
	}
	return undefined
	
}

// Fisher-Yates-Shuffle algorithm for more efficient shuffeling of cafes to be selected by customers.
function fisherYatesShuffle(arr) {
	let i, j, temp;
	for (i = arr.length - 1; i > 0; i--) {
	  j = Math.floor(Math.random() * (i + 1));
	  temp = arr[i];
	  arr[i] = arr[j];
	  arr[j] = temp;
	}
	return arr;
  }
  


  function updateCustomer(customerIndex) {
	//customerIndex is an index into the customers data array
	customerIndex = Number(customerIndex); //it seems customerIndex was coming in as a string
	var customer = customers[customerIndex];
  
	// get the current location of the customer
	var { row, col } = customer.location;
	var state = customer.state;
  
	// determine if customer has arrived at destination
	var hasArrived = (Math.abs(customer.target.row - row) + Math.abs(customer.target.col - col)) == 0;


	// A helper function to make the code more clean
	const handleCafeState = (index) => {
		processCafeState(customer, state, hasArrived);
		statistics[9].count++;
		statistics[index].count++;
		statistics[index].percentage = statistics[index].count / statistics[9].count * 100;
	  };


  
	// Behavior of customer depends on his or her state
	switch (state) {
	  case UNTREATED:
			// A customer has 3 prefered cafe options 
			// We use fisherYatesShuffle algorithm to get 3 uniq cafe indecis 
			let cafeIndices = Array.from({ length: queues.length }, (_, i) => i);
  			let shuffledCafeIndices = fisherYatesShuffle(cafeIndices);
  
  			let first_option = shuffledCafeIndices[0];
  			let second_option = shuffledCafeIndices[1];
  			let third_option = shuffledCafeIndices[2];

			// Other options are chosen randomly but the should not be the same
			while(second_option == first_option && (third_option == first_option || third_option == second_option)) {
				second_option = first_option ? Math.floor(Math.random() * queues.length) : second_option;
				third_option = first_option ? ( second_option ? Math.floor(Math.random() * queues.length) : third_option) : third_option;
			}
			
			var chosenQueue = queues[first_option];
			var chooseQueueForSecondOption = queues[second_option];
			var chooseQueueForThirdOption = queues[third_option];
			var amoutOfFreeSpotsIntheQueue = chosenQueue.filter(n => n.state == EMPTY).length;
			var amoutOfFreeSpotsIntheQueue_2 = chooseQueueForSecondOption.filter(n => n.state == EMPTY).length;
			var amoutOfFreeSpotsIntheQueue_3 = chooseQueueForThirdOption.filter(n => n.state == EMPTY).length;
			var isNotFullyBooked = amoutOfFreeSpotsIntheQueue > 0;
			var isNotFullyBooked_2 = amoutOfFreeSpotsIntheQueue_2 > 0;
			var isNotFullyBooked_3 = amoutOfFreeSpotsIntheQueue_3 > 0;

		if (hasArrived) {
			// Prefered options
			const options = [
				{ isNotFullyBooked: isNotFullyBooked, option: first_option, queue: chosenQueue, spots: amoutOfFreeSpotsIntheQueue },
				{ isNotFullyBooked: isNotFullyBooked_2, option: second_option, queue: chooseQueueForSecondOption, spots: amoutOfFreeSpotsIntheQueue_2 },
				{ isNotFullyBooked: isNotFullyBooked_3, option: third_option, queue: chooseQueueForThirdOption, spots: amoutOfFreeSpotsIntheQueue_3 }
			];
			const selectedOption = options.find(opt => opt.isNotFullyBooked);
				
			if (selectedOption) {
				customer.timeAdmitted = currentTime;
				customer.state = CAFE1 + selectedOption.option;
				customer.target = { row: selectedOption.queue[selectedOption.spots - 1].row, col: selectedOption.queue[selectedOption.spots - 1].column };
				selectedOption.queue[selectedOption.spots - 1].state = OCCUPIED;
				customer.id = ++nextCustomerId;
				statistics[13].count++;

				// This is for calculating statistics
				if (selectedOption.option === first_option) {
					statistics[10].count++;
					statistics[10].percentage =  statistics[10].count / statistics[13].count * 100;
				} else if (selectedOption.option === second_option) {
					statistics[11].count++;
					statistics[11].percentage =   statistics[11].count / statistics[13].count * 100;
				} else if (selectedOption.option === third_option) {
					statistics[12].count++;
					statistics[12].percentage =  statistics[12].count / statistics[13].count * 100;
				}

			} else {
				// If all of the 3 prefered caffes are fully booked -> discharge
				customer.state = DISCHARGED;
				statistics[3].count += 1;
				customer.target = { row: 1, col: maxCols };
				}
			  }
		break;
  
	  case CAFE5:
		handleCafeState(7)
		break;	
	  case CAFE2:
		handleCafeState(4)
		break;
	  case CAFE3:
		handleCafeState(5)
		break;	
	  case CAFE4:
		handleCafeState(6)
		break;
	  case CAFE1:
		handleCafeState(3)
		break;
	  case CAFE6:
		handleCafeState(8)
		break;
  
		// Customers come text to the cashier
	case STAGING:
		if (hasArrived) {
				// Finding corresponding cashiers
				const currentCashier = caregivers.find(cg => cg.location.row === customer.location.row + 1 && cg.location.col === customer.location.col);
				if (currentCashier && currentCashier.state === IDLE) {
					currentCashier.state = BUSY;
				customer.state = INTREATMENT;
				customer.timeTreatmentStarted = currentTime;
				} else {
				isOnTheWay[currentCashier.type - 2] = false;
				}
		} else {
				// If the customer hasn't arrived, set the corresponding isOnTheWay flag to false
				const cafeIndex = customer.state - CAFE1;
				isOnTheWay[cafeIndex] = false;
		}
		break;

	  // Serving the customer
	case INTREATMENT:

		if (currentTime - customer.timeTreatmentStarted >= 5) {
			customer.state = TREATED;
			const currentCashier = caregivers.find(cg => cg.location.row === customer.location.row + 1 && cg.location.col === customer.location.col);
			if (currentCashier) {
				currentCashier.state = IDLE;
			}

			statistics[3].count++;
		}
		
		break;
	case TREATED:
		if (hasArrived){
			isOnTheWay[getCurrentCafe(customer)].state = false

			customer.state = DISCHARGED;
			customer.target.row = 1;
			customer.target.col = maxCols;
			
			statistics[0].count++;
		}
  
		break;
	  case DISCHARGED:
		if (hasArrived){
			customer.state = EXITED;
			
			statistics[2].count++;
			  
		}
  
		break;
	  default:
		break;

	}

	// set the destination row and column
	var targetRow = customer.target.row;
	var targetCol = customer.target.col;
	// compute the distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// set the speed
	var cellsPerStep = 1;
	// compute the cell to move to
	var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
	var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo);
	// update the location of the customer
	customer.location.row = newRow;
	customer.location.col = newCol;
  }

function removeDynamicAgents(){
	// We need to remove customers who have been discharged. 
	//Select all svg elements of class "patient" and map it to the data list called customers
	var allcustomers = surface.selectAll(".patient").data(customers);
	//Select all the svg groups of class "patient" whose state is EXITED
	var treatedcustomers = allcustomers.filter(function(d,i){return d.state==EXITED;});
	// Remove the svg groups of EXITED customers: they will disappear from the screen at this point
	treatedcustomers.remove();
	
	// Remove the EXITED customers from the customers list using a filter command
	customers = customers.filter(function(d){return d.state!=EXITED;});
	// At this point the customers list should match the images on the screen one for one 
	// and no customers should have state EXITED
}


function updateDynamicAgents(){
	// loop over all the agents and update their states
	for (var customerIndex in customers){
		updateCustomer(customerIndex);
	}

	// Setting the data for the csv file
	setInterval(() => {
		// Replace this with the data you want to collect from your simulation
		const data = {
			currentTime,
			customersTreated: statistics[0].count,
			customersDischarged: statistics[1].count,
			customersExited: statistics[2].count,
			cafe1Choices: statistics[3].count,
			cafe2Choices: statistics[4].count,
			cafe3Choices: statistics[5].count,
			cafe4Choices: statistics[6].count,
			cafe5Choices: statistics[7].count,
			cafe6Choices: statistics[8].count,
			firstOptionChoices: statistics[10].count,
			firstOptionPercentage: statistics[10].percentage,
			secondOptionChoices: statistics[11].count,
			secondOptionPercentage: statistics[11].percentage,
			thirdOptionChoices: statistics[12].count,
			thirdOptionPercentage: statistics[12].percentage,
			totalCustomers: statistics[13].count
		  };
	  
		collectedData.push(data);
	  }, 5000); // Collect data every 5 seconds
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
	} else{
		const csv = arrayToCSV(collectedData);
		downloadCSV(csv, 'simulation-data.csv');
	  }
}
