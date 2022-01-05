precision mediump float;
uniform sampler2D textureUnit; 
uniform float     brightness;  
varying vec2      vTexCoord;

void main(){
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    gl_FragColor = samplerColor * vec4(vec3(brightness), 1.0);
}

