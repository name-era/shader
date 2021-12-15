precision mediump float;

uniform float textureRatio;
uniform sampler2D textureUnit0;
uniform sampler2D textureUnit1;
uniform sampler2D textureUnit2;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vec4 samplerColor0 = texture2D(textureUnit0, vTexCoord);
    vec2 transTexChoord = vTexCoord + vec2(0.1, 0.0) * textureRatio;
    vec4 samplerColor1 = texture2D(textureUnit1, transTexChoord);
    vec4 samplerColor2 = texture2D(textureUnit2, vTexCoord);
    float r = clamp(textureRatio * 2.0 - samplerColor2.r, 0.0, 1.0);
    vec4 mixColor = mix(samplerColor0, samplerColor1, r);
    gl_FragColor = mixColor;
}