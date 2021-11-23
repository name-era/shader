attribute vec3 position;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform float time;
varying vec4 vColor;

void main() {

    //float k = time * 0.2;
    float s = sin(position.z * 2.0 + time * 2.0);
    vec3 normal = normalize(position);
    vec3 n = normal * s * 0.1;

    gl_Position = mvpMatrix * vec4(position + n, 1.0);
    //vColor = vec4(position, 1.0);
    vColor = vec4(position + n, 1.0);
    gl_PointSize = 3.0;
}