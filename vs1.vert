attribute vec3 planePosition;
attribute vec3 spherePosition;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform float time;
varying vec4 vColor;

void main() {

    //float k = time * 0.2;
    float s = (sin(time) + 1.0) * 0.5;

    vec3 p = mix(planePosition, spherePosition, s);

    gl_Position = mvpMatrix * vec4(p, 1.0);

    vColor = color;

    gl_PointSize = 2.0;
}