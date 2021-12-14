attribute vec3 planePosition;
attribute vec3 spherePosition;
attribute vec4 color;
attribute vec2 texCoord;
uniform mat4 mvpMatrix;
uniform float time;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {

    vTexCoord=texCoord;

    float s = (sin(time) + 1.0) * 0.5;

    vec3 p = mix(planePosition, spherePosition, s);

    gl_Position = mvpMatrix * vec4(p, 1.0);

    vColor = color;

    gl_PointSize = 2.0;
}