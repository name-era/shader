attribute vec3  position;
attribute vec2  texCoord;
varying   vec2  vTexCoord;

void main(){
    vTexCoord = vec2(texCoord.s, 1.0 - texCoord.t);
    gl_Position = vec4(position, 1.0);
}