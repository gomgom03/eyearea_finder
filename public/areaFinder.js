let unit = "mm"
let baseLength = 10;
let currentInputing = false;
let basePixelPush = [];
let basePixels = 10;


let screenWidth = screen.width;
let undoButton = document.getElementById('undoButton');
let clearButton = document.getElementById('clearButton');
let showDimensionsButton = document.getElementById('showDimensions');
let topBar = document.getElementsByClassName("topBar");
let drawArea = {
    canvas: document.createElement('canvas'),
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
let currentImg = new Image();
let canvas = document.createElement('canvas');

//picture verification
let submitButton = document.getElementById('submitButton');
submitButton.style.visibility = "hidden";

function previewFile() {
    resetBasePixel();
    undoButton.style.visibility = "hidden";
    clearButton.style.visibility = "hidden";
    showDimensionsButton.style.visibility = "hidden";
    topBar[0].style.visibility = "hidden";
    topBar[1].style.visibility = "hidden";
    topBar[2].style.visibility = "hidden";
    topBar[3].style.visibility = "hidden";
    let preview = document.querySelector('img');
    let file = document.querySelector('input[type=file]').files[0];
    let reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
        currentImg.src = reader.result;
    }

    if (file) {
        reader.readAsDataURL(file);
        submitButton.style.visibility = "visible";
    } else {
        preview.src = "";
    }
}

//events of top bar
topBar[0].addEventListener("click", function () {
    topBar[0].style.visibility = "hidden";
    topBar[1].style.visibility = "visible";
    topBar[2].style.visibility = "visible";
    topBar[3].style.visibility = "visible";
    currentInputing = true;
});

topBar[3].addEventListener("click", function () {
    if (basePixelPush.length == 2 && topBar[1].value != "" && topBar[2].value != "") {
        topBar[0].style.visibility = "visible";
        topBar[1].style.visibility = "hidden";
        topBar[2].style.visibility = "hidden";
        topBar[3].style.visibility = "hidden";
        basePixels = findLength(basePixelPush[0], basePixelPush[1]);
        unit = topBar[2].value;
        baseLength = topBar[1].value;
        currentInputing = false;
        dashedLines.pop();

        basePixelPush = [];
        updateAll();
    } else if (basePixelPush.length > 2) {
        alert('Resetting points (too many points)');
        dashedLines.splice(dashedLines.length - basePixelPush.length + 1, basePixelPush.length - 1);
        basePixelPush = [];
    } else {
        alert('Too few points or fields empty');
    }
})


//hide dimensions stuff

let showingDimensions = false;
showDimensionsButton.addEventListener("click", function () {
    if (showingDimensions) {
        showDimensionsButton.innerHTML = "Show Dimensions";
    } else {
        showDimensionsButton.innerHTML = "Hide Dimensions"
    }
    showingDimensions = !showingDimensions;
    updateAll();
});
////after submission
var allAreas = [];
var allPoints = [];
var dashedLines = [];
var curFirstPoint = null;

function circleComponent(centerX, centerY, radius, color = '#00fc04') {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.update = function () {
        ctx = drawArea.context;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = 0;
        ctx.strokeStyle = '#00fc04';
        ctx.stroke();
    }
}



submitButton.addEventListener('click', drawAreaStart);
drawArea.canvas.addEventListener('click', (event) => {
    var rect = drawArea.canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left
    let mouseY = event.clientY - rect.top;
    addPoint(mouseX, mouseY);

});


function drawAreaStart() {
    clearVariables();
    document.querySelector('img').src = "";
    submitButton.style.visibility = "hidden";
    undoButton.style.visibility = "visible";
    clearButton.style.visibility = "visible";
    showDimensionsButton.style.visibility = "visible";
    topBar[0].style.visibility = "visible";
    drawArea.canvas.width = screenWidth * 0.7; allPoints = [];
    dashedLines = [];
    drawArea.canvas.height = currentImg.height / currentImg.width * drawArea.canvas.width;
    drawArea.context = drawArea.canvas.getContext("2d");
    drawCurrentImage();
    document.body.insertBefore(drawArea.canvas, document.body.childNodes[0]);
}

function addPoint(posX, posY) {

    let newPoint = new circleComponent(posX, posY, 1, "#00eaff");
    if (curFirstPoint != null && Math.sqrt(Math.pow((newPoint.centerX - curFirstPoint.centerX), 2) + Math.pow((newPoint.centerY - curFirstPoint.centerY), 2)) <= 8) {
        newPoint.centerX = curFirstPoint.centerX;
        newPoint.centerY = curFirstPoint.centerY;
        let dashedLine = new newDashedLine(allPoints[0], allPoints[allPoints.length - 1])
        dashedLines.push(dashedLine);
        allAreas.push({ points: allPoints });
        allPoints = [];
        curFirstPoint = null;
        setAreaTxt(allAreas[allAreas.length - 1]);
        
    } else {
        if (!curFirstPoint && !currentInputing) {
            curFirstPoint = JSON.parse(JSON.stringify(newPoint));
        }

        currentInputing ? basePixelPush.push(newPoint) : allPoints.push(newPoint);
        if (allPoints.length != 1 && !currentInputing) {
            let dashedLine = new newDashedLine(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])
            dashedLines.push(dashedLine);
        } else if (basePixelPush.length != 1 && currentInputing) {
            let dashedLine = new newDashedLine(basePixelPush[basePixelPush.length - 2], basePixelPush[basePixelPush.length - 1], "#fc0303")
            dashedLines.push(dashedLine);
        }
    }


    updateAll();
}

function findArea(poi) {
    if (poi.length == 2) {
        return findLength();
    }
    if (poi.length <= 1) {
        return 0;
    }
    let total = 0;
    for (let i = 0; i < poi.length - 1; i++) {
        total += poi[i].centerX * poi[i + 1].centerY - poi[i].centerY * poi[i + 1].centerX;
    }
    total += poi[poi.length - 1].centerX * poi[0].centerY - poi[poi.length - 1].centerY * poi[0].centerX;
    return Math.abs(total) / 2;
}

function findLength(a, b) {
    return Math.sqrt(Math.pow(a.centerX - b.centerX, 2) + Math.pow(a.centerY - b.centerY, 2));
}

function newDashedLine(comp1, comp2, color = "#00ff4c") {
    this.comp1 = comp1;
    this.comp2 = comp2;
    this.color = color;
    this.update = function () {
        drawArea.context.beginPath();
        drawArea.context.strokeStyle = color;
        drawArea.context.setLineDash([3, 5]);
        drawArea.context.moveTo(comp1.centerX, comp1.centerY);
        drawArea.context.lineTo(comp2.centerX, comp2.centerY);
        drawArea.context.stroke();
    };
    this.lengthTxt = `${(findLength(comp1, comp2) * baseLength / basePixels).toFixed(4)} ${unit}`;
    this.updateLengthText = function () {
        drawArea.context.font = "10px Arial";
        drawArea.context.fillStyle = "#fc0303";
        drawArea.context.fillText(this.lengthTxt, (this.comp1.centerX + this.comp2.centerX) / 2 - drawArea.canvas.width / 32, (this.comp1.centerY + this.comp2.centerY) / 2);
    };
    this.reLengthTxt = function () {
        this.lengthTxt = `${(findLength(comp1, comp2) * baseLength / basePixels).toFixed(4)} ${unit}`;
    }
}

function updatePoints() {
    for (let i = 0; i < allPoints.length; i++) {
        allPoints[i].update();
    }
}

function updateDashedLines() {
    for (let i = 0; i < dashedLines.length; i++) {
        dashedLines[i].update();
    }
}

function drawCurrentImage() {
    drawArea.context.drawImage(currentImg, 0, 0, drawArea.canvas.width, drawArea.canvas.height);
}

function updateAll() {
    drawArea.clear();
    drawCurrentImage();
    updatePoints();
    updateDashedLines();
    reLengthDashed();
    setAllAreaTxt();
    if(showingDimensions){
        dashedLines.forEach(function(x){x.updateLengthText()});
        allAreas.forEach(function(x){x.updateArea()});
    }
}

function clearVariables() {
    allPoints = [];
    dashedLines = [];
    curFirstPoint = null;
}


clearButton.addEventListener("click", function () {
    clearVariables();
    allAreas = [];
    drawArea.clear();
    drawCurrentImage();
});

function resetBasePixel() {
    basePixels = 10;
    basePixelPush = [];
}

function setAreaTxt(x) {
    x.area = `${(findArea(x.points) * baseLength * baseLength / basePixels / basePixels).toFixed(4)} ${unit}^2`;
    x.updateArea = function () {
        drawArea.context.font = "10px Arial";
        drawArea.context.fillStyle = "#0000ff";
        let tempX = 0;
        let tempY = 0;
        for (let i = 0; i < x.points.length; i++) {
            tempX += x.points[i].centerX;
            tempY += x.points[i].centerY;
        }
        tempX /= x.points.length;
        tempY /= x.points.length;
        drawArea.context.fillText(this.area, tempX - drawArea.canvas.width / 32, tempY);

    }
}

function setAllAreaTxt(){
    for(let i = 0; i<allAreas.length;i++){
        setAreaTxt(allAreas[i]);
    }
}

function reLengthDashed() {
    for (let i = 0; i < dashedLines.length; i++) {
        dashedLines[i].reLengthTxt();
    }
}