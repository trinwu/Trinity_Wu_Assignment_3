class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -1;
        this.cubeVerts32 = new Float32Array(
            [
                0,0,0, 1,1,0, 1,0,0,
                0,0,0, 0,1,0, 1,1,0,
                0,1,0, 0,1,1, 1,1,1,
                0,1,0, 1,1,1, 1,0,0,
                1,1,0, 1,1,1, 1,0,0,
                1,0,0, 1,1,1, 1,0,1,
                0,1,0, 0,1,1, 0,0,0,
                0,0,0, 0,1,1, 0,0,1,
                0,0,0, 0,0,1, 1,0,1,
                0,0,0, 1,0,1, 1,0,0,
                0,0,1, 1,1,1, 1,0,1,
                0,0,1, 0,1,1, 1,1,1
            ]
        );
        this.cubeVerts = [
            0,0,0, 1,1,0, 1,0,0,
            0,0,0, 0,1,0, 1,1,0,
            0,1,0, 0,1,1, 1,1,1,
            0,1,0, 1,1,1, 1,0,0,
            1,1,0, 1,1,1, 1,0,0,
            1,0,0, 1,1,1, 1,0,1,
            0,1,0, 0,1,1, 0,0,0,
            0,0,0, 0,1,1, 0,0,1,
            0,0,0, 0,0,1, 1,0,1,
            0,0,0, 1,0,1, 1,0,0,
            0,0,1, 1,1,1, 1,0,1,
            0,0,1, 0,1,1, 1,1,1 
        ];
    }

    render(color) {
        var rgba = this.color;

        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Set the transformation matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Front face
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 0.0, 0.0],
            [1, 0,  0, 1,  1, 1]
        );
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   1.0, 1.0, 0.0],
            [0, 0,  0, 1,  1, 1]
        );

        // Darken color slightly for other faces
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // Top face
        drawTriangle3DUV(
            [0.0, 1.0, 0.0,   0.0, 1.0, 1.0,   1.0, 1.0, 1.0],
            [0, 0,  0, 1,  1, 1]
        );
        drawTriangle3DUV(
            [0.0, 1.0, 0.0,   1.0, 1.0, 1.0,   1.0, 1.0, 0.0],
            [0, 0,  1, 1,  1, 0]
        );

        // Back face
        drawTriangle3DUV(
            [0.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0],
            [0, 0,  1, 0,  1, 1]
        );
        drawTriangle3DUV(
            [0.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0],
            [0, 0,  1, 1,  0, 1]
        );

        // Bottom face
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 0.0, 0.0],
            [0, 0,  1, 1,  1, 0]
        );
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   1.0, 0.0, 1.0],
            [0, 0,  0, 1,  1, 1]
        );

        // Right face
        drawTriangle3DUV(
            [1.0, 0.0, 0.0,   1.0, 1.0, 1.0,   1.0, 0.0, 1.0],
            [0, 0,  1, 1,  1, 0]
        );
        drawTriangle3DUV(
            [1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0],
            [0, 0,  0, 1,  1, 1]
        );

        // Left face
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0],
            [0, 0,  1, 0,  1, 1]
        );
        drawTriangle3DUV(
            [0.0, 0.0, 0.0,   0.0, 1.0, 1.0,   0.0, 1.0, 0.0],
            [0, 0,  1, 1,  0, 1]
        );
    }

    renderfast() {
        var rgba = this.color;

        // Pass the texture number
        gl.uniform1i(u_whichTexture, -2)

        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts = [];

        // Front of cube
        allverts = allverts.concat([0,0,0, 1,1,0, 1,0,0]);
        allverts = allverts.concat([0,0,0, 0,1,0, 1,1,0]);

        // Top of cube
        allverts = allverts.concat([0,1,0, 0,1,1, 1,1,1]);
        allverts = allverts.concat([0,1,0, 1,1,1, 1,1,0]);

        // Right of cube
        allverts = allverts.concat([1,1,0, 1,1,1, 1,0,0]);
        allverts = allverts.concat([1,0,0, 1,1,1, 1,0,1]);

        // Left of cube
        allverts = allverts.concat([0,1,0, 0,1,1, 0,0,0]);
        allverts = allverts.concat([0,0,0, 0,1,1, 0,0,1]);

        // Bottom of cube
        allverts = allverts.concat([0,0,0, 0,0,1, 1,0,1]);
        allverts = allverts.concat([0,0,0, 1,0,1, 1,0,0]);

        // Back of cube
        allverts = allverts.concat([0,0,1, 1,1,1, 1,0,1]);
        allverts = allverts.concat([0,0,1, 0,1,1, 1,1,1]);

        drawTriangle3D(allverts);
    }

    renderfaster(){
        var rgba = this.color;

        // Pass the texture number
        gl.uniform1i(u_whichTexture, -2)

        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        if(g_vertexBuffer==null){
            initTriangle3D();
        }

        gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}
