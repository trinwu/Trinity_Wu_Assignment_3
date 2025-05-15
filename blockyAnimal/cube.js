class Cube {
  constructor() {
    this.type = 'cube';
    this.matrix = new Matrix4();
  }

  render(color) {
    // Set the transformation matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.uniform4fv(u_FragColor, color);

    // Front face
    drawTriangle3D([0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0]);

    let darkerColor = [color[0]*0.9, color[1]*0.9, color[2]*0.9, color[3]];
    gl.uniform4fv(u_FragColor, darkerColor);

    // Top face
    drawTriangle3D([0.0, 1.0, 0.0,   0.0, 1.0, 1.0,   1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 1.0, 0.0,   1.0, 1.0, 1.0,   1.0, 1.0, 0.0]);

    // Back face
    drawTriangle3D([0.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0]);

    // Bottom face
    drawTriangle3D([0.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0, 1.0]);

    // Right face
    drawTriangle3D([1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0]);

    // Left face
    drawTriangle3D([0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0]);
  }
}
