// BlockyAnimal.js 
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() { 
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;

let g_isDragging = false;
let g_lastX = -1, g_lastY = -1;
let g_rotationMatrix; 

let g_frozenPulse = 1.0;
let g_frozenYOffset = 0.2;
let g_frozenTentacleWiggles = [];


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if(!u_ModelMatrix){
        console.log('Failed to get the storage location of u_ModelMatrix'); 
        return;
    }

    // Get the storage location of u_GlobalRotatelMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if(!u_GlobalRotateMatrix){
        console.log('Failed to get the storage location of u_GlobalRotateMatrix'); 
        return;
    }

    // Set an initial value for this matrix to identity
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_globalAngle = 180;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_animate = false; 
let g_bodyAngle = 0; 
let g_pokeAnimation = false;
let g_pokeStartTime = 0;



// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    // Reset Button
    document.getElementById('resetButton').onclick = function() {
        g_bodyAngle = 0;
        g_globalAngle = 180;
        g_yellowAngle = 0;
        g_magentaAngle = 0;
        g_rotationMatrix = new Matrix4();
    
        // Reset tentacle joint angles
        for (let i = 0; i < g_tentacleJointAngles.length; i++) {
            for (let j = 0; j < g_tentacleJointAngles[i].length; j++) {
                g_tentacleJointAngles[i][j] = 0;
                let slider = document.getElementById(`tentacle_${i}_joint_${j}`);
                if (slider) slider.value = 0;  
            }
        }
    
        renderAllShapes();
    };

    // Animation Buttons
    document.getElementById('animationOnButton').onclick = function() {g_animate = true;};
    document.getElementById('animationOffButton').onclick = function() {g_animate = false;};

    // Body Angle Slider
    document.getElementById('bodyAngleSlider').addEventListener('input', function() {g_bodyAngle = this.value; renderAllShapes();});


    // document.getElementById('animationYellowOnButton').onclick = function() {g_yellowAnimation = true;};
    // document.getElementById('animationYellowOffButton').onclick = function() {g_yellowAnimation = false; g_yellowAngle = 45*Math.sin(g_seconds);};

    // document.getElementById('animationMagentaOnButton').onclick = function() {g_magentaAnimation = true;};
    // document.getElementById('animationMagentaOffButton').onclick = function() {g_magentaAnimation = false; g_magentaAngle = 45*Math.sin(3*g_seconds);};

    // // // Color Slider Events
    // document.getElementById('magentaSlide').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderAllShapes();});
    // document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderAllShapes();});

    // Angle Slider Event
    document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes(); })

    // Mouse control to rotate jellyfish
    canvas.addEventListener('mousedown', function(ev) {
        g_isDragging = true;
        g_lastX = ev.clientX;
        g_lastY = ev.clientY;
    });
    
    canvas.addEventListener('mousemove', function(ev) {
        if (g_isDragging) {
            let x = ev.clientX;
            let y = ev.clientY;
    
            let dx = x - g_lastX;
            let dy = y - g_lastY;
    
            let mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 1e-6) { 
                let axis = [-dy, dx, 0];  
                let angle = mag * 0.5;    
        
                let newMatrix = new Matrix4();
                newMatrix.setRotate(angle, axis[0], axis[1], axis[2]);
                g_rotationMatrix = newMatrix.multiply(g_rotationMatrix); 
            }
    
            g_globalAngle += dx * 0.5;
            g_globalAngle = (g_globalAngle + 360) % 360;  
            document.getElementById('angleSlide').value = g_globalAngle;
    
            g_lastX = x;
            g_lastY = y;
        }
    });
    
    // Poke animation
    canvas.addEventListener('click', function(ev) {
        if (ev.shiftKey) {
            g_pokeAnimation = true;
            g_pokeStartTime = g_seconds;
        }
    });
    
    canvas.addEventListener('mouseup', function(ev) {
        g_isDragging = false;
    });
    

}

function main() {
    // Set up cnavas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();   
    
    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    g_rotationMatrix = new Matrix4();

    g_frozenTentacleWiggles = [];
    for (let i = 0; i < 12; i++) {
        g_frozenTentacleWiggles.push(0);
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);

    initializeTentacleControls();
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

// Called by browser repeatedly whenever its time
function tick(){
    // Save the current time
    g_seconds = performance.now()/1000.0-g_startTime;
    // console.log(g_seconds);

    // Update animation angles
    if (g_animate) {
        updateAnimationAngles();
    }

    // Poke animation
    if (g_pokeAnimation && (g_seconds - g_pokeStartTime > 2)) {
        g_pokeAnimation = false;  // End poke animation after 2 seconds
    }

    // Always update frozen values if animating
    if (g_animate) {
        g_frozenPulse = 1.0 + 0.05 * Math.sin(g_seconds * 2.0);
        g_frozenYOffset = 0.2 + 0.02 * Math.sin(g_seconds * 2.0);
        g_frozenTentacleWiggles = [];
        for (let i = 0; i < 12; i++) {
            g_frozenTentacleWiggles.push(15 * Math.sin(g_seconds * 2 + i));
        }
    }

    // Draw everything
    renderAllShapes();

    // Tell the browser to update again when it has time
    requestAnimationFrame(tick);
}

// Update the angles of everything if currently animated
function updateAnimationAngles(){
    if(g_yellowAnimation){
        g_yellowAngle = (45*Math.sin(g_seconds));
    }

    if(g_magentaAnimation){
        g_magentaAngle = (45*Math.sin(3*g_seconds));
    }
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes(){
    // Check the time at the start of this function
    var startTime = performance.now();

    // Pass the matrix to u_ModelMatrix attribute
    var globalRotMat = new Matrix4(g_rotationMatrix);
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);

    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Jellyfish body pulse
    let pulse = g_animate ? (1.0 + 0.05 * Math.sin(g_seconds * 2.0)) : g_frozenPulse;

    // Main body
    var body = new Dome();
    body.color = [0.71, 0.82, 1.0, 0.7];  
    body.matrix.setIdentity();
    body.matrix.translate(0.0, g_animate ? (0.2 + 0.02 * Math.sin(g_seconds * 2.0)) : g_frozenYOffset, 0.0);
    body.matrix.rotate(-g_bodyAngle, 0, 0, 1);
    body.matrix.scale(0.6 * pulse, 0.45 * pulse, 0.6 * pulse);
    let bodyMatrix = new Matrix4(body.matrix);  
    body.render();

    // Outer halo
    var outer = new Dome();
    outer.color = [0.71, 0.82, 1.0, 0.3];
    outer.matrix = new Matrix4(bodyMatrix);
    outer.matrix.scale(1.2, 1.15, 1.2);
    outer.render();

    // Tentacles
    let tentacleCount = 12;
    let tentacleRadius = 0.5 * 0.3 * pulse; 
    let yOffset = -0.5 * 0.3 * pulse;      

    for (let i = 0; i < tentacleCount; i++) {
        let angle = (360 / tentacleCount) * i;
    
        // Start from bodyMatrix
        let baseMatrix = new Matrix4(bodyMatrix);
        baseMatrix.rotate(angle, 0, 1, 0); 
        baseMatrix.translate(tentacleRadius * 1.05, 0.0, 0.0);
    
        let currentMatrix = new Matrix4(baseMatrix);
    
        let tentacleLength = 10;     
        let segmentHeight = 0.12;     
    
        for (let j = 0; j < tentacleLength; j++) {
            let segment = new Cube();
            let segmentColor = [0.7, 0.9, 1.0, 0.6];
    
            segment.matrix.set(currentMatrix);
    
            let wiggle = g_animate ? (15 * Math.sin(g_seconds * 2 + i)) : g_frozenTentacleWiggles[i];
            let manualAngle = g_tentacleJointAngles[i]?.[j] || 0;
            segment.matrix.rotate(wiggle * j / tentacleLength + manualAngle, 0, 0, 1);
    
            segment.matrix.translate(0, -segmentHeight, 0);
    
            let thickness = 0.07 * (1 - j / tentacleLength);
            thickness = Math.max(thickness, 0.015);
            segment.matrix.scale(thickness, segmentHeight, thickness);
    
            segment.render(segmentColor);
    
            currentMatrix.set(segment.matrix);
    
            currentMatrix.scale(1 / thickness, 1 / segmentHeight, 1 / thickness);
        }
    }
    
    // Eyes
    let eyeLeft = new Cube();
    let eyeLeftColor = [0.0, 0.0, 0.5, 1.0];  
    eyeLeft.matrix.set(bodyMatrix);
    eyeLeft.matrix.translate(-0.15, 0.25, 0.5); 
    eyeLeft.matrix.scale(0.08, 0.1, 0.1);
    eyeLeft.render(eyeLeftColor);

    let eyeRight = new Cube();
    let eyeRightColor = [0.0, 0.0, 0.5, 1.0]; 
    eyeRight.matrix.set(bodyMatrix);
    eyeRight.matrix.translate(0.15, 0.25, 0.5); 
    eyeRight.matrix.scale(0.08, 0.1, 0.1);
    eyeRight.render(eyeRightColor);

    // Poke animation
    if (g_pokeAnimation) {
        let tearDrop = (g_seconds - g_pokeStartTime) * 0.5;  
    
        let tearLeft = new Cube();
        let tearLeftColor = [0.0, 0.0, 1.0, 1.0];  
        tearLeft.matrix.set(bodyMatrix);
        tearLeft.matrix.translate(-0.15, 0.25 - tearDrop, 0.6);
        tearLeft.matrix.scale(0.02, 0.04, 0.02);
        tearLeft.render(tearLeftColor);
    
        let tearRight = new Cube();
        let tearRightColor = [0.0, 0.0, 1.0, 1.0];
        tearRight.matrix.set(bodyMatrix);
        tearRight.matrix.translate(0.15, 0.25 - tearDrop, 0.6);
        tearRight.matrix.scale(0.02, 0.04, 0.02);
        tearRight.render(tearRightColor);
    }



    // Draw the body cube
    // var body = new Cube();
    // body.color = [1.0, 0.0, 0.0, 1.0];
    // body.matrix.translate(-0.25, -0.75, 0.0);
    // body.matrix.rotate(-5.0, 1.0, 0.0, 0.0);
    // body.matrix.scale(0.5, 0.3, 0.5);
    // body.render();

    // // Draw a left arm
    // var yellow = new Cube();
    // yellow.color = [1.0, 1.0, 0.0, 1.0];
    // yellow.matrix.setTranslate(0.0, -0.5, 0.0);
    // yellow.matrix.rotate(-5.0, 1.0, 0.0, 0.0);
    // yellow.matrix.rotate(-g_yellowAngle, 0.0, 0.0, 1.0);
    // var yellowCoordinatesMat = new Matrix4(yellow.matrix);
    // yellow.matrix.scale(0.25, 0.7, 0.5);
    // yellow.matrix.translate(-0.5, 0.0, 0.0);
    // yellow.render();

    // // Test box
    // var magenta = new Cube();
    // magenta.color = [1.0, 0.0, 1.0, 1.0];
    // magenta.matrix = yellowCoordinatesMat;
    // magenta.matrix.translate(0.0, 0.65, 0.0);
    // magenta.matrix.rotate(-g_magentaAngle, 0.0, 0.0, 1.0);
    // magenta.matrix.scale(0.3, 0.3, 0.3);
    // magenta.matrix.translate(-0.5, 0.0, -0.001);
    // // box.matrix.translate(-0.1, 0.1, 0.0, 0.0);
    // // box.matrix.rotate(-30.0, 1.0, 0.0, 0.0);
    // // box.matrix.scale(0.2, 0.4, 0.2);
    // magenta.render();

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

}

// Set text of a HTML element
function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

let g_tentacleJointAngles = []; 

function initializeTentacleControls() {
    const controlPanel = document.getElementById('tentacleControls');
    const tentacleCount = 12;
    const tentacleLength = 10;

    for (let i = 0; i < tentacleCount; i++) {
        g_tentacleJointAngles.push([]);

        // Container div for each tentacle
        const tentacleContainer = document.createElement('details');
        tentacleContainer.style.marginBottom = '8px';

        // Summary (clickable label)
        const tentacleSummary = document.createElement('summary');
        tentacleSummary.textContent = `Tentacle ${i}`;
        tentacleSummary.style.cursor = 'pointer';
        tentacleContainer.appendChild(tentacleSummary);

        // Div for joints inside tentacle
        const jointDiv = document.createElement('div');
        jointDiv.style.paddingLeft = '15px';

        for (let j = 0; j < tentacleLength; j++) {
            const sliderLabel = document.createElement('label');
            sliderLabel.style.display = 'block';
            sliderLabel.style.marginBottom = '4px';
            sliderLabel.textContent = `Joint ${j}: `;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = -45;
            slider.max = 45;
            slider.value = 0;
            slider.id = `tentacle_${i}_joint_${j}`;
            slider.classList.add('slider');

            slider.addEventListener('input', function() {
                g_tentacleJointAngles[i][j] = Number(this.value);
                renderAllShapes();
            });

            g_tentacleJointAngles[i].push(0);

            sliderLabel.appendChild(slider);
            jointDiv.appendChild(sliderLabel);
        }

        tentacleContainer.appendChild(jointDiv);
        controlPanel.appendChild(tentacleContainer);
    }
}
