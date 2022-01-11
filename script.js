let noiseTypeOne = false;         // 乱数生成器がタイプ１かどうか
let noiseStrength = 0.5;         // ノイズの合成強度
let vignetteScale = 1.5;         // ヴィネット係数
let sinWave = 300.0;             // サイン波の周波数係数 @@@
let sinStrength = 0.5;           // サイン波の合成強度 @@@
let backgroundColor = '#00ff00'; // 背景色 @@@
let backgroundColorFloat = [0.1, 1.0, .035];

window.addEventListener('DOMContentLoaded', () => {

    const PANE = new Tweakpane({
        container: document.querySelector('#pane'),
    });

    PANE.addInput({ 'use type1': noiseTypeOne }, 'use type1')
        .on('change', (v) => { noiseTypeOne = v; });

    PANE.addInput({ 'noise strength': noiseStrength }, 'noise strength', {
        step: 0.01,
        min: 0.0,
        max: 1.0,
    }).on('change', (v) => { noiseStrength = v; });

    PANE.addInput({ 'vignette': vignetteScale }, 'vignette', {
        step: 0.01,
        min: 0.0,
        max: 2.0,
    }).on('change', (v) => { vignetteScale = v; });

    PANE.addInput({ 'sin wave': sinWave }, 'sin wave', {
        step: 1.0,
        min: 1.0,
        max: 1000.0,
    }).on('change', (v) => { sinWave = v; });

    PANE.addInput({ 'sin strength': sinStrength }, 'sin strength', {
        step: 0.01,
        min: 0.0,
        max: 1.0,
    }).on('change', (v) => { sinStrength = v; });

    PANE.addInput({ 'background': backgroundColor }, 'background')
        .on('change', (v) => {
            backgroundColor = v;
            const rgb = HEX2RGB(v);
            if (rgb != null) {
                const r = rgb.r / 255;
                const g = rgb.g / 255;
                const b = rgb.b / 255;
                backgroundColorFloat = [r, g, b];
            }
        });

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

        this.texture = [];
        this.deleteFunction = null;
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

        this.program = null;
        this.postAttLocation = null;
        this.postAttStride = null;
        this.postUniLocation = null;
        this.postUniType = null;

        return new Promise((resolve) => {
            this.loadShader([
                './vs1.vert',
                './fs1.frag',
            ])
                .then((shaders) => {
                    const gl = this.gl;
                    const vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                    const fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                    this.program = this.createProgram(vs, fs);
                    this.postAttLocation = [
                        gl.getAttribLocation(this.program, 'position'),
                        gl.getAttribLocation(this.program, 'texCoord'),
                    ];
                    this.postAttStride = [
                        3,
                        2,
                    ];
                    this.postUniLocation = [
                        gl.getUniformLocation(this.program, 'codeTextureUnit'),
                        gl.getUniformLocation(this.program, 'noiseTextureUnit'),
                        gl.getUniformLocation(this.program, 'noiseTypeOne'),
                        gl.getUniformLocation(this.program, 'noiseStrength'),
                        gl.getUniformLocation(this.program, 'vignetteScale'),
                        gl.getUniformLocation(this.program, 'sinWave'),
                        gl.getUniformLocation(this.program, 'sinStrength'),
                        gl.getUniformLocation(this.program, 'time'),
                        gl.getUniformLocation(this.program, 'background'),
                        gl.getUniformLocation(this.program, 'mvpMatrix'),
                    ];
                    this.postUniType = [
                        'uniform1i',
                        'uniform1i',
                        'uniform1i',
                        'uniform1f',
                        'uniform1f',
                        'uniform1f',
                        'uniform1f',
                        'uniform1f',
                        'uniform3fv',
                        'uniformMatrix4fv',
                    ];
                    return this.createTextureFromFile('./code.png');
                })
                .then((texture) => {
                    this.texture[0] = texture;
                    return this.createTextureFromFile('./noise.png');
                })
                .then((texture) => {
                    const gl = this.gl;
                    this.texture[1] = texture;
                    this.texture.forEach((v, index) => {
                        gl.activeTexture(gl.TEXTURE0 + index);
                        gl.bindTexture(gl.TEXTURE_2D, v);
                    })
                    resolve();
                });
        });
    }

    loadShader(pathArray) {
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

        window.addEventListener('keydown', (evt) => {
            this.running = evt.key !== 'Escape';
        }, false);

        //this.camera.update();
        this.canvas.addEventListener('mousedown', this.camera.startEvent, false);
        this.canvas.addEventListener('mousemove', this.camera.moveEvent, false);
        this.canvas.addEventListener('mouseup', this.camera.endEvent, false);
        this.canvas.addEventListener('wheel', this.camera.wheelEvent, false);

        this.position = [
            -1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
        ];
        this.texCoord = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];

        this.index = [0, 2, 1, 1, 2, 3];

        this.vbo = [
            this.createVbo(this.position),
            this.createVbo(this.texCoord),
        ]

        this.ibo = this.createIbo(this.index);

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;


        gl.activeTexture(gl.TEXTURE0);
        gl.clearColor(0.5, 0.5, 0.5, 1.0);
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

    createIbo(data) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    createIboInt(data) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        if (ext == null || ext.elementIndexUint == null) {
            throw new Error('element index Uint not supported');
        }
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    render() {
        const gl = this.gl;

        if (this.running === true) {
            requestAnimationFrame(this.render);
            if (this.deleteFunction != null) {
                this.deleteFunction();
                // 実行後に null を入れておく
                this.deleteFunction = null;
            }
        }

        this.nowTime = (Date.now() - this.beginTime) / 1000;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const cameraPosition = [0.0, 0.0, 3.0];
        const centerPoint = [0.0, 0.0, 0.0];
        const cameraUpDirection = [0.0, 1.0, 0.0];
        const fovy = 60 * this.camera.scale * Math.PI / 180.0; //Field of view Y
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

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);

        this.setAttribute(this.vbo, this.postAttLocation, this.postAttStride, this.ibo);

        this.setUniform([
            0,
            1,
            noiseTypeOne,
            noiseStrength,
            vignetteScale,
            sinWave,
            sinStrength,
            this.nowTime,
            backgroundColorFloat,
            this.mvpMatrix,
        ], this.postUniLocation, this.postUniType);

        gl.drawElements(gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);
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

    createTextureFromFile(source) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        return new Promise((resolve) => {
            const gl = this.gl;
            const img = new Image();
            img.addEventListener('load', () => {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                //事故を防ぐためにバインドしないでおく
                gl.bindTexture(gl.TEXTURE_2D, null);
                resolve(tex);
            }, false);
            img.src = source;
        })
    }
    createFramebuffer(width, height) {
        if (this.gl == null) {
            throw new Error('webgl not initialized');
        }
        const gl = this.gl;
        //空のフレームバッファ
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        //汎用バッファを用いて深度バッファを作成する
        const depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        //フレームバッファと深度バッファの関連付け
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

        //カラーバッファ（色を焼きこむ対象）
        const fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //色用のバッファとして関連付ける
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

        //unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { framebuffer: framebuffer, renderbuffer: depthRenderBuffer, texture: fTexture };
    }

    deleteFrameBuffer(obj) {
        if (this.gl == null || obj == null) { return; }
        const gl = this.gl;
        if (obj.hasOwnProperty('framebuffer') === true && this.gl.isFramebuffer(obj.framebuffer) === true) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(obj.framebuffer);
            obj.framebuffer = null;
        }
        if (obj.hasOwnProperty('renderbuffer') === true && gl.isRenderbuffer(obj.renderbuffer) === true) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.deleteRenderbuffer(obj.renderbuffer);
            obj.renderbuffer = null;
        }
        if (obj.hasOwnProperty('texture') === true && gl.isTexture(obj.texture) === true) {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.deleteTexture(obj.texture);
            obj.texture = null;
        }
        obj = null;
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
        this.scale = 0.3;
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

function HEX2RGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/ig.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}