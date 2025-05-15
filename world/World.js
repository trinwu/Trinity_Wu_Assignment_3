// World.js 
// Vertex shader program
var VSHADER_SOURCE = `
precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  void main() {
    if(u_whichTexture == -2){
        gl_FragColor = u_FragColor;
    } else if(u_whichTexture == -1){
        gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if(u_whichTexture == 0){
        gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if(u_whichTexture == 1){
        gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if(u_whichTexture == 2){
        gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else{
        gl_FragColor = vec4(1, 0.2, 0.2, 1);
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;

// Game state
let g_camera;
let g_selectedBlock = 1;
let g_canAddBlock = true;
let g_canRemoveBlock = true;

// Animal states
let g_parentAnimal = {
    x: 10,
    y: 0,
    z: 10,
    rotY: 0
};

let g_babyAnimals = [
    { x: 11, y: 0, z: 11, rotY: 45, targetX: 0, targetZ: 0, followDelay: 0 },
    { x: 9, y: 0, z: 11, rotY: -45, targetX: 0, targetZ: 0, followDelay: 0.3 },
    { x: 10, y: 0, z: 12, rotY: 0, targetX: 0, targetZ: 0, followDelay: 0.6 }
];

// Optimization: We'll store a simplified version of visible blocks
let g_visibleBlocks = [];

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
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

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
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

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if(!u_GlobalRotateMatrix){
        console.log('Failed to get the storage location of u_GlobalRotateMatrix'); 
        return;
    }

    // Get the storage location of u_ViewMatrix
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if(!u_ViewMatrix){
        console.log('Failed to get the storage location of u_ViewMatrix'); 
        return;
    }

    // Get the storage location of u_ProjectionMatrix
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if(!u_ProjectionMatrix){
        console.log('Failed to get the storage location of u_ProjectionMatrix'); 
        return;
    }

    // Get the storage location of samplers
    u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
    if(!u_Sampler0){
        console.log("Failed to get the storage location of u_Sampler0");
        return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
    if(!u_Sampler1){
        console.log("Failed to get the storage location of u_Sampler1");
        return false;
    }
    
    u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
    if(!u_Sampler2){
        console.log("Failed to get the storage location of u_Sampler2");
        return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
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
let g_animate = false; 
let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0-g_startTime;

// Mouse tracking for camera rotation
let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// World map definition (32x32x4)
// 0: No block
// 1-4: Block with height 1-4
let g_worldMap = createInitialWorldMap();

// Optimization: fog distance for culling
let g_renderDistance = 20; // How far blocks are rendered

function createInitialWorldMap() {
    // Create a 32x32 world map initialized with zeros
    let map = new Array(32);
    for (let i = 0; i < 32; i++) {
        map[i] = new Array(32).fill(0);
    }
    
    // Create outer walls
    for (let i = 0; i < 32; i++) {
        map[0][i] = 4;  // Bottom wall
        map[31][i] = 4; // Top wall
        map[i][0] = 4;  // Left wall
        map[i][31] = 4; // Right wall
    }
    
    // Add some inner walls and structures with different heights
    for (let i = 5; i < 10; i++) {
        map[i][10] = 2; // Height 2 wall
    }
    
    for (let i = 15; i < 20; i++) {
        map[10][i] = 3; // Height 3 wall
    }
    
    // Add a small building
    for (let i = 20; i < 25; i++) {
        for (let j = 20; j < 25; j++) {
            if (i === 20 || i === 24 || j === 20 || j === 24) {
                map[i][j] = 2;
            }
        }
    }
    
    // Add a tower
    map[15][15] = 4;
    map[15][16] = 4;
    map[16][15] = 4;
    map[16][16] = 4;
    
    // Add a little playground area for the parent and baby animals
    for (let i = 8; i < 13; i++) {
        for (let j = 8; j < 13; j++) {
            if (i === 8 || i === 12 || j === 8 || j === 12) {
                map[i][j] = 1;
            }
        }
    }
    
    return map;
}

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    // Reset Button
    document.getElementById('resetButton').onclick = function() {
        g_globalAngle = 180;
        g_camera = new Camera();
        g_worldMap = createInitialWorldMap();
        // Reset animal positions
        g_parentAnimal = { x: 10, y: 0, z: 10, rotY: 0 };
        g_babyAnimals = [
            { x: 11, y: 0, z: 11, rotY: 45, targetX: 0, targetZ: 0, followDelay: 0 },
            { x: 9, y: 0, z: 11, rotY: -45, targetX: 0, targetZ: 0, followDelay: 0.3 },
            { x: 10, y: 0, z: 12, rotY: 0, targetX: 0, targetZ: 0, followDelay: 0.6 }
        ];
        renderAllShapes();
    };

    // Animation Buttons
    document.getElementById('animationOnButton').onclick = function() {g_animate = true;};
    document.getElementById('animationOffButton').onclick = function() {g_animate = false;};

    // Block Selection
    document.getElementById('block1').onclick = function() {
        g_selectedBlock = 1;
        updateBlockButtons();
    };
    document.getElementById('block2').onclick = function() {
        g_selectedBlock = 2;
        updateBlockButtons();
    };
    document.getElementById('block3').onclick = function() {
        g_selectedBlock = 3;
        updateBlockButtons();
    };
    document.getElementById('block4').onclick = function() {
        g_selectedBlock = 4;
        updateBlockButtons();
    };
    
    // We need to check if the element exists first
    const renderDistanceSlider = document.getElementById('renderDistance');
    if (renderDistanceSlider) {
        renderDistanceSlider.onchange = function() {
            g_renderDistance = parseInt(this.value);
            renderAllShapes();
        };
    }
    
    // Mouse events for camera rotation
    canvas.onmousedown = function(ev) {
        g_mouseDown = true;
        g_lastMouseX = ev.clientX;
        g_lastMouseY = ev.clientY;
    };
    
    canvas.onmouseup = function() {
        g_mouseDown = false;
    };
    
    canvas.onmousemove = function(ev) {
        if (!g_mouseDown) return;
        
        const newX = ev.clientX;
        const newY = ev.clientY;
        
        const dx = newX - g_lastMouseX;
        
        // Rotate camera based on mouse movement
        if (dx !== 0) {
            g_camera.pan(-dx * 0.5); // Negate to match expected direction
        }
        
        g_lastMouseX = newX;
        g_lastMouseY = newY;
        
        renderAllShapes();
    };

    // Initial setup for block buttons
    updateBlockButtons();
}

function updateBlockButtons() {
    // First remove the 'selected' class from all buttons
    const buttons = document.getElementsByClassName('block-btn');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('selected');
    }
    
    // Add 'selected' class to the currently selected block button
    const selectedButton = document.getElementById('block' + g_selectedBlock);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

function initTextures() {
    // Load wall texture
    var wallImage = new Image();
    if(!wallImage){
        console.log("Failed to create the wall image object");
        return false;
    }
    
    wallImage.onload = function(){
        sendImageToTexture(wallImage, gl.TEXTURE0, u_Sampler0, 0);
    };
    wallImage.src = "wall.jpg";
    
    // Load sky texture
    var skyImage = new Image();
    if(!skyImage){
        console.log("Failed to create the sky image object");
        return false;
    }
    
    skyImage.onload = function(){
        sendImageToTexture(skyImage, gl.TEXTURE1, u_Sampler1, 1);
    };
    skyImage.src = "sky.jpg";
    
    // Load ground texture
    var groundImage = new Image();
    if(!groundImage){
        console.log("Failed to create the ground image object");
        return false;
    }
    
    groundImage.onload = function(){
        sendImageToTexture(groundImage, gl.TEXTURE2, u_Sampler2, 2);
    };
    groundImage.src = "ground.jpg";

    return true; 
}

function sendImageToTexture(image, texUnit, sampler, samplerIndex) {
    var texture = gl.createTexture();
    if(!texture){
        console.log("Failed to create the texture object");
        return false;
    }

    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // Enable texture unit
    gl.activeTexture(texUnit);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit to the sampler
    gl.uniform1i(sampler, samplerIndex);

    console.log("Finished loading texture " + samplerIndex);
}

function drawBlockyAnimal(animal, isParent) {
    try {
        // Create an instance of the BlockyAnimal
        var animalModel = new BlockyAnimal();
        
        // Set position in the world
        animalModel.matrix.translate(animal.x - 16, animal.y, animal.z - 16);
        
        // Rotate the animal
        animalModel.matrix.rotate(animal.rotY, 0, 1, 0);
        
        // Scale the animal appropriately - babies are smaller
        if (isParent) {
            animalModel.matrix.scale(0.5, 0.5, 0.5);
        } else {
            animalModel.matrix.scale(0.25, 0.25, 0.25);
        }
        
        // Render the animal
        animalModel.render();
    } catch (e) {
        console.log("Could not render BlockyAnimal: ", e);
    }
}

function main() {
    // Set up canvas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();   
    
    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    // Add keyboard event handler
    document.onkeydown = keydown;

    // Initialize the camera
    g_camera = new Camera();
    
    // Position the camera at a good starting point
    g_camera.eye = new Vector3([5, 2, 5]);
    g_camera.at = new Vector3([0, 2, 0]);
    g_camera.updateViewMatrix();

    // Initialize textures
    initTextures();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Prevent spacebar from scrolling the page
    window.addEventListener('keydown', function(e) {
        if(e.key === ' ' && e.target == document.body) {
            e.preventDefault();
        }
    });

    // Pre-calculate visible blocks
    updateVisibleBlocks();

    // Start the animation loop
    requestAnimationFrame(tick);
}

// Optimization: Pre-calculate which blocks should be visible
function updateVisibleBlocks() {
    g_visibleBlocks = [];
    
    // Get camera position in world coordinates
    const cameraX = Math.floor(g_camera.eye.elements[0] + 16);
    const cameraZ = Math.floor(g_camera.eye.elements[2] + 16);
    
    for (let x = 0; x < 32; x++) {
        for (let z = 0; z < 32; z++) {
            const height = g_worldMap[x][z];
            if (height > 0) {
                // Calculate distance from camera
                const dx = x - cameraX;
                const dz = z - cameraZ;
                const distSquared = dx*dx + dz*dz;
                
                // Only include blocks within render distance
                if (distSquared <= g_renderDistance * g_renderDistance) {
                    // Perform frustum culling (simplified)
                    // For now, just store blocks within range
                    for (let y = 0; y < height; y++) {
                        g_visibleBlocks.push({x, y, z});
                    }
                }
            }
        }
    }
}

// Called by browser repeatedly whenever it's time
function tick() {
    // Save the current time
    g_seconds = performance.now()/1000.0-g_startTime;

    // Update animation if enabled
    if (g_animate) {
        // Move the parent animal in a figure-8 pattern
        const t = g_seconds * 0.5;
        g_parentAnimal.x = 10 + Math.sin(t) * 1.5;
        g_parentAnimal.z = 10 + Math.sin(t * 2) * 1.5;
        g_parentAnimal.rotY = (Math.atan2(Math.sin(t * 2) * 3 * Math.cos(t), Math.cos(t) * 1.5) * 180 / Math.PI) + 90;
        
        // Store the parent's previous positions to create a trail for babies to follow
        const positions = [
            {x: g_parentAnimal.x, z: g_parentAnimal.z},
            {x: g_parentAnimal.x, z: g_parentAnimal.z},
            {x: g_parentAnimal.x, z: g_parentAnimal.z}
        ];
        
        // Update each baby animal to follow the parent with delay
        for (let i = 0; i < g_babyAnimals.length; i++) {
            const baby = g_babyAnimals[i];
            
            // Calculate target position with delay
            const delayedTime = Math.max(0, t - baby.followDelay);
            baby.targetX = 10 + Math.sin(delayedTime) * 1.5;
            baby.targetZ = 10 + Math.sin(delayedTime * 2) * 1.5;
            
            // Smoothly move toward target
            baby.x += (baby.targetX - baby.x) * 0.1;
            baby.z += (baby.targetZ - baby.z) * 0.1;
            
            // Calculate rotation to face direction of movement
            const dx = baby.targetX - baby.x;
            const dz = baby.targetZ - baby.z;
            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                const targetAngle = Math.atan2(dz, dx) * 180 / Math.PI;
                // Smoothly rotate toward target angle
                const angleDiff = targetAngle - baby.rotY;
                baby.rotY += angleDiff * 0.1;
            }
        }
        
        // Update the set of visible blocks (only sometimes, not every frame)
        if (Math.random() < 0.1) {
            updateVisibleBlocks();
        }
    }

    // Draw everything
    renderAllShapes();

    // Tell the browser to update again when it has time
    requestAnimationFrame(tick);
}

function keydown(ev) {
    const key = ev.key.toLowerCase();
    
    // Prevent default for spacebar to avoid page scrolling
    if (key === ' ') {
        ev.preventDefault();
    }

    switch (key) {
        case 'w':
            g_camera.moveForward();
            break;
        case 's':
            g_camera.moveBackwards(); // Using the correct method name
            break;
        case 'a':
            g_camera.moveLeft();
            break;
        case 'd':
            g_camera.moveRight();
            break;
        case 'q':
            g_camera.panLeft();
            break;
        case 'e':
            g_camera.panRight();
            break;
        case ' ':
            addBlockInFront();
            break;
        case 'x':
            removeBlockInFront();
            break;
        case '1':
            g_selectedBlock = 1;
            updateBlockButtons();
            break;
        case '2':
            g_selectedBlock = 2;
            updateBlockButtons();
            break;
        case '3':
            g_selectedBlock = 3;
            updateBlockButtons();
            break;
        case '4':
            g_selectedBlock = 4;
            updateBlockButtons();
            break;
    }
    
    // After movement, update visible blocks
    updateVisibleBlocks();
    renderAllShapes();
}

function getBlockInFront() {
    // Get direction vector from eye to at
    let direction = new Vector3().set(g_camera.at).sub(g_camera.eye).normalize();
    
    // Calculate position 3 units in front of camera
    let targetPos = new Vector3().set(g_camera.eye);
    direction.mul(3); // Scale to 3 units
    targetPos.add(direction);
    
    // Convert to world coordinates (offset by 16 to center the map)
    const worldX = Math.floor(targetPos.elements[0] + 16);
    const worldZ = Math.floor(targetPos.elements[2] + 16);
    
    // Check if within world bounds
    if (worldX >= 0 && worldX < 32 && worldZ >= 0 && worldZ < 32) {
        return { x: worldX, z: worldZ };
    }
    
    return null;
}

function addBlockInFront() {
    if (!g_canAddBlock) return;
    
    const blockPos = getBlockInFront();
    if (blockPos) {
        g_worldMap[blockPos.x][blockPos.z] = g_selectedBlock;
        
        // Add cooldown to prevent rapid placement
        g_canAddBlock = false;
        setTimeout(() => { g_canAddBlock = true; }, 250);
        
        // Update visible blocks after adding a block
        updateVisibleBlocks();
    }
}

function removeBlockInFront() {
    if (!g_canRemoveBlock) return;
    
    const blockPos = getBlockInFront();
    if (blockPos && g_worldMap[blockPos.x][blockPos.z] > 0) {
        g_worldMap[blockPos.x][blockPos.z] = 0;
        
        // Add cooldown to prevent rapid removal
        g_canRemoveBlock = false;
        setTimeout(() => { g_canRemoveBlock = true; }, 250);
        
        // Update visible blocks after removing a block
        updateVisibleBlocks();
    }
}

// Draw every shape that is supposed to be in the canvas
function renderAllShapes(){
    // Check the time at the start of this function
    var startTime = performance.now();

    // Pass the projection and view matrices
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);

    // Pass the matrix to u_GlobalRotateMatrix attribute
    var globalRotMat = new Matrix4();
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the ground
    var ground = new Cube();
    ground.color = [0.5, 0.5, 0.5, 1.0];
    ground.textureNum = 2; // Ground texture
    ground.matrix.translate(0, -1.0, 0);
    ground.matrix.scale(32, 0.1, 32);
    ground.matrix.translate(-0.5, 0, -0.5);
    ground.render();

    // Draw the skybox
    var sky = new Cube();
    sky.color = [0.6, 0.8, 1.0, 1.0];
    sky.textureNum = 1; // Sky texture
    sky.matrix.scale(100, 100, 100);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.render();

    // Draw the world blocks - optimization: only draw visible blocks
    drawWorldBlocks();

    // Draw the parent animal
    drawBlockyAnimal(g_parentAnimal, true);
    
    // Draw the baby animals
    for (const baby of g_babyAnimals) {
        drawBlockyAnimal(baby, false);
    }

    // Display instructions and info
    displayInfo();

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// Optimized world block drawing
function drawWorldBlocks() {
    // Only draw blocks that are likely to be visible
    for (const block of g_visibleBlocks) {
        var cube = new Cube();
        cube.color = [1.0, 1.0, 1.0, 1.0];
        cube.textureNum = 0; // Wall texture
        cube.matrix.translate(block.x - 16, block.y, block.z - 16);
        cube.render();
    }
}

function displayInfo() {
    const blockPos = getBlockInFront();
    let infoText = "WASD: Move | Q/E: Rotate | Space: Add Block | X: Remove Block";
    
    if (blockPos) {
        infoText += " | Target: (" + blockPos.x + "," + blockPos.z + ")";
        infoText += " | Selected Block: " + g_selectedBlock;
    }
    
    // Add info about the animals
    infoText += " | Parent Animal with " + g_babyAnimals.length + " babies";
    
    sendTextToHTML(infoText, "instructions");
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