precision mediump float;
uniform sampler2D textureUnit;
uniform float saturation;
uniform float vignette;
varying vec2 vTexCoord;

void main() {
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;
    vec3 rgb = mix(vec3(gray), samplerColor.rgb, saturation);

    //ヴィネット
    vec2 v = vTexCoord * 2.0 - 1.0;
    float vig = vignette - length(v);
    gl_FragColor = vec4(vec3(rgb) * vig, 1.0);
}
