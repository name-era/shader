window.addEventListener('DOMContentLoaded', () => {
    const webgl = new WebGLFrame();
    webgl.init('webgl-canvas');
    webgl.load().then(() => {
        webgl.setUp();
        webgl.render();
    });
}, false);

class WebGLFrame {

    constructor() {
        this.canvas = null;
        this.gl = null;
        this.running = false;
        this.beginTime = 0;
        this.nowTime = 0;
        this.render = this.render.bind(this);

        this.camera = new InteractionCamera();

        this.mMatrix = glMatrix.mat4.create();
        this.vMatrix = glMatrix.mat4.create();
        this.pMatrix = glMatrix.mat4.create();
        this.vpMatrix = glMatrix.mat4.create();
        this.mvpMatrix = glMatrix.mat4.create();

    }

    //初期化
    init(canvas) {
        if (canvas instanceof HTMLCanvasElement === true) {
            this.canvas = canvas;
        }
        else if (Object.prototype.toString.call(canvas) === '[object String]') {
            //文字列の場合
            const c = document.querySelector(`#${canvas}`);
            if (c instanceof HTMLCanvasElement === true) {
                this.canvas = c;
            }
        }

        if (this.canvas == null) {
            throw new Error('invalid argument');
        }

        this.gl = this.canvas.getContext('webgl');
        if (this.gl == null) {
            throw new Error('webgl not supported');
        }
    }

    load() {
        this.program = null;
        this.attLocation = null;
        this.attStride = null;
        this.uniLocation = null;
        this.uniType = null;

        return new Promise((resolve) => {
            this.loadShadedr([
                './vs1.vert',
                './fs1.frag',
            ])
                .then((shaders) => {
                    const gl = this.gl;
                    const vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                    const fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);

                    this.program = this.createProgram(vs, fs);

                    this.attLocation = [
                        gl.getAttribLocation(this.program, 'position'),
                        gl.getAttribLocation(this.program, 'color'),
                    ];
                    this.attStride = [
                        3,
                        4,
                    ];
                    this.uniLocation = [
                        gl.getUniformLocation(this.program, 'mvpMatrix'),
                        gl.getUniformLocation(this.program, 'time'),
                    ];
                    this.uniType = [
                        'uniformMatrix4fv',
                        'uniform1f',
                    ];

                    resolve();
                })
        })
    }

    loadShadedr(pathArray) {
        if (Array.isArray(pathArray) != true) {
            throw new Error('invalid argument');
        }
        const promises = pathArray.map((path) => {
            return fetch(path).then((response) => { return response.text(); })
        });
        return Promise.all(promises);
    }

    createShader(source, type) {
        if (this.gl == null) {
            throw new Error('webgl not initializedd');
        }

        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

    }

    createProgram(vs, fs) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            return program;
        } else {
            alert(gl.getProgramInfoLog(program));
            return null;
        }
    }

    setUp() {
        const gl = this.gl;

        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener('keydown', (evt) => {
            this.running = evt.key !== 'Escape';
        }, false);

        this.camera.update();
        this.canvas.addEventListener('mousedown', this.camera.startEvent, false);
        this.canvas.addEventListener('mousemove', this.camera.moveEvent, false);
        this.canvas.addEventListener('mouseup', this.camera.endEvent, false);
        this.canvas.addEventListener('wheel', this.camera.wheelEvent, false);

        this.position = [];
        this.color = [];

        const VERTEX_COUNT = 100;
        const VERTEX_RADIUS = 1.0;

        for (let i = 0; i < VERTEX_COUNT; ++i) {
            const iRad = i / VERTEX_COUNT * Math.PI * 2.0;

            for (let j = 0; j < VERTEX_COUNT; j++) {
                const jRad = j / VERTEX_COUNT * Math.PI * 2.0;

                let x = VERTEX_RADIUS * Math.cos(iRad) * Math.cos(jRad);
                let y = VERTEX_RADIUS * Math.cos(iRad) * Math.sin(jRad);
                let z = VERTEX_RADIUS * Math.sin(iRad);
                this.position.push(x, y, z);
                this.color.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 0.5, 1.0);
            }
        }

        this.vbo = [
            this.createVbo(this.position),
            this.createVbo(this.color),
        ]

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);

        this.running = true;
        this.beginTime = Date.now();
    }

    createVbo(data) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    render() {
        const gl = this.gl;

        if (this.running === true) {
            requestAnimationFrame(this.render);
        }

        this.nowTime = (Date.now() - this.beginTime) / 1000;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);

        this.setAttribute(this.vbo, this.attLocation, this.attStride);

        const cameraPosition = [0.0, 3.0, 0.0];
        const centerPoint = [0.0, 0.0, 0.0];
        const cameraUpDirection = [0.0, 0.0, 1.0];
        const fovy = 60 * this.camera.scale * Math.PI / 180.0;　//Field of view Y
        const aspect = this.canvas.width / this.canvas.height;
        const near = 0.1;
        const far = 10.0;

        //view
        glMatrix.mat4.lookAt(this.vMatrix, cameraPosition, centerPoint, cameraUpDirection);

        //projection
        glMatrix.mat4.perspective(this.pMatrix, fovy, aspect, near, far);
        glMatrix.mat4.multiply(this.vpMatrix, this.pMatrix, this.vMatrix);

        this.camera.update();
        let quaternionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(quaternionMatrix, this.camera.qtn);

        glMatrix.mat4.multiply(this.vpMatrix, this.vpMatrix, quaternionMatrix);
        this.mvpMatrix = this.vpMatrix;

        this.setUniform([
            this.mvpMatrix,
            this.nowTime,
        ], this.uniLocation, this.uniType);

        gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
    }

    setAttribute(vbo, attL, attS, ibo) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        vbo.forEach((v, index) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.enableVertexAttribArray(attL[index]);
            gl.vertexAttribPointer(attL[index], attS[index], gl.FLOAT, false, 0, 0);
        });
        if (ibo != null) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }

    }

    setUniform(value, uniL, uniT) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        value.forEach((v, index) => {
            const type = uniT[index];
            if (type.includes('Matrix') === true) {
                gl[type](uniL[index], false, v);
            } else {
                gl[type](uniL[index], v);
            }
        });
    }



}

class InteractionCamera {
    constructor() {
        this.qtn = glMatrix.quat.create();
        this.dragging = false;
        this.prevMouse = [0, 0];
        this.rotationScale = Math.min(window.innerWidth, window.innerHeight);
        this.rotation = 0.0;
        this.rotateAxis = [0.0, 0.0, 0.0];
        this.rotatePower = 2.0;
        this.rotateAttenuation = 0.9;
        this.scale = 1.0;
        this.scalePower = 0.0;
        this.scaleAtternuation = 0.8;
        this.scaleMin = 0.25;
        this.scaleMax = 2.0;
        this.startEvent = this.startEvent.bind(this);
        this.moveEvent = this.moveEvent.bind(this);
        this.endEvent = this.endEvent.bind(this);
        this.wheelEvent = this.wheelEvent.bind(this);
    }

    startEvent(eve) {
        this.dragging = true;
        this.prevMouse = [eve.clientX, eve.clientY];
    }

    moveEvent(eve) {
        if (this.dragging != true) { return; }
        const x = this.prevMouse[0] - eve.clientX;
        const y = this.prevMouse[1] - eve.clientY;
        this.rotation = Math.sqrt(x * x + y * y) / this.rotationScale * this.rotatePower;
        this.rotateAxis[0] = y;
        this.rotateAxis[1] = x;
        this.prevMouse = [eve.clientX, eve.clientY];
    }

    endEvent() {
        this.dragging = false;
    }

    wheelEvent(eve) {
        const w = eve.wheelDelta;
        const s = this.scaleMin * 0.1;
        if (w > 0) {
            this.scalePower = -s;
        } else if (w < 0) {
            this.scalePower = s;
        }
    }

    update() {
        this.scalePower *= this.scaleAtternuation;
        this.scale = Math.max(this.scaleMin, Math.min(this.scaleMax, this.scale + this.scalePower));
        if (this.rotation === 0.0) { return; }
        this.rotation *= this.rotateAttenuation;

        glMatrix.vec3.normalize(this.rotateAxis, this.rotateAxis);
        const q = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(q, this.rotateAxis, this.rotation);

        //現在のクォータニオンに対して更に回転する
        glMatrix.quat.multiply(this.qtn, this.qtn, q);
    }
}