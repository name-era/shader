attribute vec3 position;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform float time;
varying vec4 vColor;

void main() {

    vColor = color;

    float s = sin(position.x * 4.0 + time) * 0.5;
    vec3 p = vec3(position.x, s, position.z);
    gl_Position = mvpMatrix * vec4(p, 1.0);
    gl_PointSize = 2.0;
}