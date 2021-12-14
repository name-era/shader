precision mediump float;

uniform float ratio;
uniform sampler2D textureUnit0;
uniform sampler2D textureUnit1;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vec4 samplerColor0 = texture2D(textureUnit0, vTexCoord);
    vec4 samplerColor1 = texture2D(textureUnit1, vTexCoord);
    vec4 mixColor = mix(samplerColor0, samplerColor1, ratio);
    gl_FragColor = vColor * mixColor;
}