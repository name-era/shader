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

    vec3 p = vec3(position.x + time * 0.6 - 4.0, position.y, position.z + time * 0.5-3.0);

    gl_Position = mvpMatrix * vec4(p + n, 1.0);

    vColor = color;
    vColor = vec4(abs(position) + n, 1.0);
    gl_PointSize = 2.0;
}