// BlockyAnimal class - simplified version

class BlockyAnimal {
    constructor() {
        this.type = 'blockyAnimal';
        this.matrix = new Matrix4();
    }
    
    render() {
        // Animation values
        let pulse = 1.0 + 0.05 * Math.sin(g_seconds * 2.0);
        let yOffset = 0.2 + 0.02 * Math.sin(g_seconds * 2.0);
        
        // Main body
        var body = new Dome();
        body.color = [0.71, 0.82, 1.0, 0.7];  
        body.matrix.setIdentity();
        body.matrix.translate(0, yOffset, 0);
        body.matrix.scale(0.6 * pulse, 0.45 * pulse, 0.6 * pulse);
        body.matrix.multiply(this.matrix);
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
        let tentacleLength = 10;
        let tentacleRadius = 0.5 * 0.3 * pulse; 

        for (let i = 0; i < tentacleCount; i++) {
            let angle = (360 / tentacleCount) * i;
        
            // Start from bodyMatrix
            let baseMatrix = new Matrix4(bodyMatrix);
            baseMatrix.rotate(angle, 0, 1, 0); 
            baseMatrix.translate(tentacleRadius * 1.05, 0.0, 0.0);
        
            let currentMatrix = new Matrix4(baseMatrix);
        
            let segmentHeight = 0.12;     
        
            for (let j = 0; j < tentacleLength; j++) {
                let segment = new Cube();
                segment.color = [0.7, 0.9, 1.0, 0.6];
                segment.textureNum = -2; // Solid color
        
                segment.matrix.set(currentMatrix);
        
                // Simple wiggle based on time and tentacle position
                let wiggle = 15 * Math.sin(g_seconds * 2 + i);
                segment.matrix.rotate(wiggle * j / tentacleLength, 0, 0, 1);
        
                segment.matrix.translate(0, -segmentHeight, 0);
        
                let thickness = 0.07 * (1 - j / tentacleLength);
                thickness = Math.max(thickness, 0.015);
                segment.matrix.scale(thickness, segmentHeight, thickness);
        
                segment.render();
        
                currentMatrix.set(segment.matrix);
        
                currentMatrix.scale(1 / thickness, 1 / segmentHeight, 1 / thickness);
            }
        }
        
        // Eyes
        let eyeLeft = new Cube();
        eyeLeft.color = [0.0, 0.0, 0.5, 1.0];  
        eyeLeft.textureNum = -2; // Solid color
        eyeLeft.matrix.set(bodyMatrix);
        eyeLeft.matrix.translate(-0.15, 0.25, 0.5); 
        eyeLeft.matrix.scale(0.08, 0.1, 0.1);
        eyeLeft.render();

        let eyeRight = new Cube();
        eyeRight.color = [0.0, 0.0, 0.5, 1.0]; 
        eyeRight.textureNum = -2; // Solid color
        eyeRight.matrix.set(bodyMatrix);
        eyeRight.matrix.translate(0.15, 0.25, 0.5); 
        eyeRight.matrix.scale(0.08, 0.1, 0.1);
        eyeRight.render();
    }
}