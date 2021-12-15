attribute vec3 planePosition;
attribute vec3 spherePosition;
attribute vec4 color;
attribute vec2 texCoord;
uniform mat4 mvpMatrix;
uniform float shapeRatio;

varying vec4 vColor;
varying vec2 vTexCoord;

void main() {

    vTexCoord=texCoord;
    vec3 p = mix(planePosition, spherePosition, shapeRatio);

    gl_Position = mvpMatrix * vec4(p, 1.0);
    vColor = color;
    gl_PointSize = 2.0;
}