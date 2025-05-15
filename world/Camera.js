class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjectionMatrix() {
        const aspect = (typeof canvas !== 'undefined') ? canvas.width / canvas.height : 1;
        this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
    }

    moveForward(speed = 0.1) {
        let f = new Vector3().set(this.at).sub(this.eye).normalize().mul(speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateViewMatrix();
    }

    moveBackwards(speed = 0.1) {
        let b = new Vector3().set(this.eye).sub(this.at).normalize().mul(speed);
        this.eye.add(b);
        this.at.add(b);
        this.updateViewMatrix();
    }

    moveLeft(speed = 0.1) {
        let f = new Vector3().set(this.at).sub(this.eye).normalize();
        let s = Vector3.cross(this.up, f).normalize().mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    moveRight(speed = 0.1) {
        let f = new Vector3().set(this.at).sub(this.eye).normalize();
        let s = Vector3.cross(f, this.up).normalize().mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateViewMatrix();
    }

    panLeft(angle = 5) {
        this.pan(angle);
    }

    panRight(angle = 5) {
        this.pan(-angle);
    }

    pan(angle) {
        let f = new Vector3().set(this.at).sub(this.eye);
        let rotationMatrix = new Matrix4().setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3().set(this.eye).add(f_prime);
        this.updateViewMatrix();
    }
}
