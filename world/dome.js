class Dome {
  constructor() {
    this.type = 'dome';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 30; 
    this.radius = 0.5;
    this.maxTheta = Math.PI * 0.7; 
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
    let seg = this.segments;
    for (let i = 0; i < seg/2; i++) {
      let theta1 = i * this.maxTheta / (seg/2);
      let theta2 = (i+1) * this.maxTheta / (seg/2);
    
      for (let j = 0; j <= seg; j++) {
        let phi1 = j * 2 * Math.PI / seg;
        let phi2 = (j+1) * 2 * Math.PI / seg;
    
        let p1 = this.sphericalToCartesian(theta1, phi1, this.radius);
        let p2 = this.sphericalToCartesian(theta2, phi1, this.radius);
        let p3 = this.sphericalToCartesian(theta1, phi2, this.radius);
        let p4 = this.sphericalToCartesian(theta2, phi2, this.radius);
        

        let progress1 = theta1 / (Math.PI/2); // Progress from top (0) to middle (1)
        let progress2 = theta2 / (Math.PI/2); // (for p2 and p4)
        
        let fade1 = 1.0;
        let squish1 = 1.0;

        if (progress1 > 0.7) {
          let t = (progress1 - 0.7) / 0.3;
          fade1 = 1.0 - 0.4 * t;    // Shrink X/Z more strongly
          squish1 = 1.0 - 0.5 * t;  // Also lower Y as it nears bottom
        }

        let fade2 = 1.0;
        let squish2 = 1.0;

        if (progress2 > 0.7) {
          let t = (progress2 - 0.7) / 0.3;
          fade2 = 1.0 - 0.4 * t;
          squish2 = 1.0 - 0.5 * t;
        }

        // Apply to points
        p1[0] *= fade1; p1[2] *= fade1; p1[1] *= squish1;
        p2[0] *= fade2; p2[2] *= fade2; p2[1] *= squish2;
        p3[0] *= fade1; p3[2] *= fade1; p3[1] *= squish1;
        p4[0] *= fade2; p4[2] *= fade2; p4[1] *= squish2;

    
        drawTriangle3D([
          p1[0], p1[1], p1[2],
          p2[0], p2[1], p2[2],
          p4[0], p4[1], p4[2],
        ]);
        drawTriangle3D([
          p1[0], p1[1], p1[2],
          p4[0], p4[1], p4[2],
          p3[0], p3[1], p3[2],
        ]);
      }
    }
    
    
  }
  

  sphericalToCartesian(theta, phi, r) {
    let x = r * Math.sin(theta) * Math.cos(phi);
    let y = r * Math.cos(theta);
    let z = r * Math.sin(theta) * Math.sin(phi);
    return [x, y, z];
  }
}
