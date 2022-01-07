precision mediump float;
uniform sampler2D renderedTexture; 
uniform sampler2D noiseTexture;    
uniform float     time;            
uniform float     timeScale;       
uniform float     distortionScale; 
uniform bool      polar;           
uniform bool      noiseVisible;    
varying vec2      vTexCoord;

const float PI = 3.1415926;

//乱数生成1
float rnd(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

//乱数生成2
float rnd2(vec2 n) {
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt = dot(n, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

void main() {
    vec2 coord = fract(vTexCoord - vec2(0.0, time * timeScale));

    if(polar == true){
        vec2 originCenter = vTexCoord * 2.0 - 1.0;
        //atanは-π～π
        float s = (atan(originCenter.y, originCenter.x) + PI) / (PI * 2.0);
        float t = length(originCenter);
        coord = vec2(s, fract(t - time * timeScale));
    }

    vec4 noiseColor = texture2D(noiseTexture, coord);
    vec2 noiseCoord = (noiseColor.rg * 2.0 - 1.0) * distortionScale;
    vec4 samplerColor = texture2D(renderedTexture, vTexCoord + noiseCoord);

    if(noiseVisible == true){
        samplerColor += vec4(noiseColor.rgb, 0.0);
    }

    gl_FragColor = samplerColor;
}
