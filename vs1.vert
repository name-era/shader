attribute vec3  position;
attribute vec2  texCoord;
varying   vec2  vTexCoord;
uniform mat4 mvpMatrix;

void main(){
    vTexCoord = vec2(texCoord.s, 1.0 - texCoord.t);
    gl_Position = mvpMatrix*vec4(position, 1.0);
}