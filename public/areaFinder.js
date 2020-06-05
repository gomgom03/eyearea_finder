/* Copyright (C) - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Hyun Min Kim <gomgom03@gmail.com>, August 2019
 */

//GLOBAL VARIABLES
let isTiff,
    unit = null,
    baseLength = null,
    currentInputing = false,
    basePixelPush = [],
    basePixels = 10,
    curTiff,
    recordLasso = false,
    drawTypePoints = true,
    screenWidth = screen.width,
    showingDimensions = false,
    currentImg = new Image(),
    allAreas = [],
    allPoints = [],
    dashedLines = [],
    curFirstPoint = null;


//OBJECTS 
let previousMove = {
    allPoints: null,
    dashedLines: null,
    curFirstPoint: null,
    allAreas: null
}

let drawArea = {
    canvas: document.createElement('canvas'),
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}


//DOM INSTANTIATION
let undoButton = document.getElementById('undoButton'),
    clearButton = document.getElementById('clearButton'),
    showDimensionsButton = document.getElementById('showDimensions'),
    topBar = document.getElementsByClassName("topBar"),
    submitButton = document.getElementById('submitButton'),
    drawType = document.getElementById("drawType");

//PRESET
submitButton.style.visibility = "hidden";

//DOM EVENTLISTENERS
undoButton.addEventListener('click', goPrevious);

drawType.addEventListener('click', function () { verify(drawTypeFunc); });

submitButton.addEventListener('click', drawAreaStart);

topBar[0].addEventListener("click", function () {
    drawTypePoints ? null : drawTypeFunc();
    assignDrawTypeListener();
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
        updateAll();
    } else {
        alert('Too few points or fields empty');
    }
});

showDimensionsButton.addEventListener("click", function () {
    if (showingDimensions) {
        showDimensionsButton.innerHTML = "Show Dimensions";
    } else {
        showDimensionsButton.innerHTML = "Hide Dimensions"
    }
    showingDimensions = !showingDimensions;
    updateAll();
});

clearButton.addEventListener("click", function () {
    currentInputing ? basePixelPush = [] : null;
    clearVariables();
    allAreas = [];
    drawArea.clear();
    drawCurrentImage();
});

//VARIABLES WITH EVENTLISTENER FUNCTIONS REFERENCE (for removal of event listeners also)
let mouseHandlers = {
    click: function (event) {
        setPreviousMove()
        let rect = drawArea.canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;
        addPoint(mouseX, mouseY);
    },
    mousedown: function (event) {
        if (!recordLasso) { setPreviousMove() }
        recordLasso = true;
    },
    mousemove: function (event) {
        if (recordLasso) {
            let rect = drawArea.canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;
            addPoint(mouseX, mouseY);
        }
    },
    mouseleave: function () {
        if (recordLasso) {
            recordLasso = false;
            closeLasso();
        }
    },
    mouseup: function (event) {
        if (recordLasso) {
            recordLasso = false;
            closeLasso();
        }
    }
}

//FUNCTIONS

//Verifies whether a user wants to change draw type
function verify(func) {
    switch (func) {
        case drawTypeFunc:
            confirm("This will clear the current drawing") ? func() : null;
            break;
        default:
    }
}

function drawTypeFunc() {
    if (drawTypePoints) {
        drawTypePoints = false;
        drawType.innerHTML = "Draw Type: <strong>Lasso</strong>"
    } else {
        drawTypePoints = true;
        drawType.innerHTML = "Draw Type: <strong>Points</strong>"
    }
    clearVariables();
    updateAll();
    assignDrawTypeListener();
}

//Assigning the draw type click/lasso
function assignDrawTypeListener() {
    if (drawTypePoints) {
        drawArea.canvas.removeEventListener('mousedown', mouseHandlers.mousedown);
        drawArea.canvas.removeEventListener('mousemove', mouseHandlers.mousemove);
        drawArea.canvas.removeEventListener('mouseleave', mouseHandlers.mouseleave);
        drawArea.canvas.removeEventListener('mouseup', mouseHandlers.mouseup);
        drawArea.canvas.addEventListener('click', mouseHandlers.click);
    } else {
        drawArea.canvas.removeEventListener('click', mouseHandlers.click);
        drawArea.canvas.addEventListener('mousedown', mouseHandlers.mousedown);
        drawArea.canvas.addEventListener('mousemove', mouseHandlers.mousemove);
        drawArea.canvas.addEventListener('mouseleave', mouseHandlers.mouseleave);
        drawArea.canvas.addEventListener('mouseup', mouseHandlers.mouseup);
    }
}

//Called when user lifts off click, creates a shape
function closeLasso() {
    let dashedLine = new newDashedLine(allPoints[0], allPoints[allPoints.length - 1])
    dashedLines.push(dashedLine);
    setArea();
    allPoints = [];
    curFirstPoint = null;
    setAreaTxt(allAreas[allAreas.length - 1]);
    updateAll();
}

//Loads preview Image on the left half of the screen
function previewFile() {
    resetBasePixel();
    undoButton.style.visibility = "hidden";
    clearButton.style.visibility = "hidden";
    showDimensionsButton.style.visibility = "hidden";
    drawType.style.visibility = "hidden";
    topBar[0].style.visibility = "hidden";
    topBar[1].style.visibility = "hidden";
    topBar[2].style.visibility = "hidden";
    topBar[3].style.visibility = "hidden";
    let preview = document.querySelector('img');
    let file = document.querySelector('input[type=file]').files[0];
    isTiff = file.name.split(".").pop() == "tiff" || file.name.split(".").pop() == "tif"
    let reader = new FileReader();
    reader.onloadend = function () {
        if (isTiff) {
            curTiff = new Tiff({ buffer: reader.result });
            preview.src = curTiff.toDataURL();
            currentImg.src = curTiff.toDataURL();
        } else {
            preview.src = reader.result;
            currentImg.src = reader.result;
        }
    }
    if (file) {
        isTiff ? reader.readAsArrayBuffer(file) : reader.readAsDataURL(file);
        submitButton.style.visibility = "visible";
    } else {
        preview.src = "";
    }
}

//Circle component constructor function
function circleComponent(centerX, centerY, radius, color = '#00fc04') {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color;
    this.update = function () {
        ctx = drawArea.context;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = 0;
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}

//Starts the canvas and draws the current image
function drawAreaStart() {

    drawArea.context = drawArea.canvas.getContext("2d");
    assignDrawTypeListener();

    clearVariables();
    document.querySelector('img').src = "";
    submitButton.style.visibility = "hidden";

    undoButton.style.visibility = "visible";
    clearButton.style.visibility = "visible";
    showDimensionsButton.style.visibility = "visible";
    drawType.style.visibility = "visible";

    topBar[0].style.visibility = "visible";
    drawArea.canvas.width = screenWidth * 0.7; allPoints = [];
    dashedLines = [];
    drawArea.canvas.height = currentImg.height / currentImg.width * drawArea.canvas.width;

    drawCurrentImage();

    document.body.insertBefore(drawArea.canvas, document.body.childNodes[0]);
}

//add points when screen clicked or mouse held down
function addPoint(posX, posY) {
    let newPoint = new circleComponent(posX, posY, 1, "#00eaff");
    if (curFirstPoint != null && Math.sqrt(Math.pow((newPoint.centerX - curFirstPoint.centerX), 2) + Math.pow((newPoint.centerY - curFirstPoint.centerY), 2)) <= 8 && drawTypePoints) {
        newPoint.centerX = curFirstPoint.centerX;
        newPoint.centerY = curFirstPoint.centerY;
        let dashedLine = new newDashedLine(allPoints[0], allPoints[allPoints.length - 1])
        dashedLines.push(dashedLine);
        setArea();
        allPoints = [];
        curFirstPoint = null;
        setAreaTxt(allAreas[allAreas.length - 1]);

    } else {
        if (!curFirstPoint && !currentInputing) {
            curFirstPoint = JSON.parse(JSON.stringify(newPoint));
        }

        if (currentInputing) {
            newPoint.color = "#00FFFF";
            newPoint.radius = 2;
            basePixelPush.push(newPoint);
        } else {
            allPoints.push(newPoint);
        }

        if (allPoints.length != 1 && !currentInputing) {
            let dashedLine = new newDashedLine(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])
            dashedLines.push(dashedLine);
        } else if (basePixelPush.length != 1 && currentInputing) {
            let dashedLine = new newDashedLine(basePixelPush[basePixelPush.length - 2], basePixelPush[basePixelPush.length - 1], "#fc0303")
            dashedLines.push(dashedLine);
        }
    }


    updateAll();
    currentInputing ? updateInputPoints() : null;
}

//Finds the area of the enclosed Area by Shoelace Formula
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

//Uses Quadratic Formula to find the length between two Point objects
function findLength(a, b) {
    return Math.sqrt(Math.pow(a.centerX - b.centerX, 2) + Math.pow(a.centerY - b.centerY, 2));
}

//Dashed Line constructor function
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
    this.lengthTxt = drawTypePoints ? `${(findLength(comp1, comp2) * baseLength / basePixels).toFixed(4)} ${unit}` : null;
    this.updateLengthText = function () {
        drawArea.context.font = "14px Arial";
        drawArea.context.fillStyle = "#fc0303";
        drawTypePoints ? drawArea.context.fillText(this.lengthTxt, (this.comp1.centerX + this.comp2.centerX) / 2 - drawArea.canvas.width / 32, (this.comp1.centerY + this.comp2.centerY) / 2) : null;
    };
    this.reLengthTxt = function () {
        drawTypePoints ? this.lengthTxt = `${(findLength(comp1, comp2) * baseLength / basePixels).toFixed(4)} ${unit}` : null;
    }
}

//Redraws all points in the array allPoints
function updatePoints() {
    for (let i = 0; i < allPoints.length; i++) {
        allPoints[i].update();
    }
}

//Redraws all lines in the array dashedLines
function updateDashedLines() {
    for (let i = 0; i < dashedLines.length; i++) {
        dashedLines[i].update();
    }
}

//Redraws the current image on the canvas
function drawCurrentImage() {
    drawArea.context.drawImage(currentImg, 0, 0, drawArea.canvas.width, drawArea.canvas.height);
}

//Redraws all on Canvas
function updateAll() {
    drawArea.clear();
    drawCurrentImage();
    updatePoints();
    updateDashedLines();
    reLengthDashed();
    setAllAreaTxt();
    if (showingDimensions && unit != null && baseLength != null && basePixels != null) {
        dashedLines.forEach(function (x) { x.updateLengthText() });
        allAreas.forEach(function (x) { x.updateArea() });
    }
}

//Clears all arrays with stored points, lines, or areas
function clearVariables() {
    allPoints = [];
    dashedLines = [];
    curFirstPoint = null;
    allAreas = [];
}

//Resets the length unit measures per pixel
function resetBasePixel() {
    baseLength = null;
    unit = null;
    basePixels = null;
    basePixelPush = [];
}

//Sets the area and the length of the enclosed ergion
function setArea() {
    let totalLength = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
        totalLength += findLength(allPoints[i], allPoints[i + 1]);
    }
    allAreas.push({ points: allPoints, totalLength: totalLength });
}

//sets the area and updateArea functions of Area objects again
function setAreaTxt(x) {
    x.area = `Area: ${(findArea(x.points) * baseLength * baseLength / basePixels / basePixels).toFixed(2)} ${unit}^2`;
    x.totalLengthTxt = `Length: ${x.totalLength.toFixed(2)} ${unit}`
    x.updateArea = function () {
        drawArea.context.font = "14px Arial";
        drawArea.context.fillStyle = "#00ffbb";
        let tempX = 0;
        let tempY = 0;
        for (let i = 0; i < x.points.length; i++) {
            tempX += x.points[i].centerX;
            tempY += x.points[i].centerY;
        }
        tempX /= x.points.length;
        tempY /= x.points.length;
        drawArea.context.fillText(this.area, tempX - drawArea.canvas.width / 16, tempY);
        drawArea.context.fillText(this.totalLengthTxt, tempX - drawArea.canvas.width / 16, tempY + 30);
    }
}

//Sets all the texts inside an area
function setAllAreaTxt() {
    for (let i = 0; i < allAreas.length; i++) {
        setAreaTxt(allAreas[i]);
    }
}

//Changes the length text of dashed lines when called
function reLengthDashed() {
    for (let i = 0; i < dashedLines.length; i++) {
        dashedLines[i].reLengthTxt();
    }
}

//
function updateInputPoints() {
    for (let i = 0; i < basePixelPush.length; i++) {
        basePixelPush[i].update();
    }
}

//Stores data of previous move in the previousMove object for the "undo" button to have a reference for the last instance
function setPreviousMove() {
    previousMove.allPoints = JSON.parse(JSON.stringify(allPoints));
    previousMove.allAreas = JSON.parse(JSON.stringify(allAreas));
    previousMove.curFirstPoint = JSON.parse(JSON.stringify(curFirstPoint));
    previousMove.dashedLines = JSON.parse(JSON.stringify(dashedLines));
}

//Peforms the "undo" functionality by referring to previousMove object
function goPrevious() {
    if (previousMove.allPoints != null) {
        allPoints = JSON.parse(JSON.stringify(previousMove.allPoints));
        allAreas = JSON.parse(JSON.stringify(previousMove.allAreas));
        curFirstPoint = JSON.parse(JSON.stringify(previousMove.curFirstPoint));
        dashedLines = JSON.parse(JSON.stringify(previousMove.dashedLines));
    }
    reDefineAreaUpdate();
    reDefineLineUpdate();
    reDefinePointUpdate();
    updateAll();
}

//Redefine point update function
function reDefinePointUpdate() {
    for (let i = 0; i < allPoints.length; i++) {
        allPoints[i].update = function () {
            ctx = drawArea.context;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.lineWidth = 0;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }
}

//Redefine area update function
function reDefineAreaUpdate() {
    for (let i = 0; i < allAreas.length; i++) {
        setAreaTxt(allAreas[i]);
    }
}

//Redefine line update function
function reDefineLineUpdate() {
    for (let i = 0; i < dashedLines.length; i++) {
        dashedLines[i].update = function () {
            drawArea.context.beginPath();
            drawArea.context.strokeStyle = this.color;
            drawArea.context.setLineDash([3, 5]);
            drawArea.context.moveTo(this.comp1.centerX, this.comp1.centerY);
            drawArea.context.lineTo(this.comp2.centerX, this.comp2.centerY);
            drawArea.context.stroke();
        };
        dashedLines[i].updateLengthText = function () {
            drawArea.context.font = "14px Arial";
            drawArea.context.fillStyle = "#fc0303";
            drawTypePoints ? drawArea.context.fillText(this.lengthTxt, (this.comp1.centerX + this.comp2.centerX) / 2 - drawArea.canvas.width / 32, (this.comp1.centerY + this.comp2.centerY) / 2) : null;
        };
        dashedLines[i].reLengthTxt = function () {
            drawTypePoints ? this.lengthTxt = `${(findLength(this.comp1, this.comp2) * baseLength / basePixels).toFixed(4)} ${unit}` : null;
        }
    }
}



function about() {
    alert("This web app does not support Internet Explorer, Opera Mini, Blackberry Browser, Opera Mobile, and IE Mobile")
}