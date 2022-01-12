#extension GL_OES_standard_derivatives : enable
precision mediump float;
uniform sampler2D codeTextureUnit;
uniform sampler2D noiseTextureUnit;
uniform bool noiseTypeOne;
uniform float noiseStrength;
uniform float vignetteScale;
uniform float sinWave;
uniform float sinStrength;
uniform float time;
uniform vec3 background;

varying vec2 vTexCoord;
const float unitWidth = 32.0;
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

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec2 v = vTexCoord * 2.0 - 1.0;
    float vig = vignetteScale - length(v);
    float wave = sin(v.y * sinWave + time * 5.0);
    //値を0～1に修正
    wave = (wave + 1.0) * 0.5;
    wave = 1.0 - wave * sinStrength;

    //ホワイトノイズの生成
    float n = rnd(gl_FragCoord.st + time * 0.001);
    if(noiseTypeOne != true) {
        n = rnd2(gl_FragCoord.st + time * 0.01);
    }
    n = 1.0 - n * noiseStrength;

    //rain
    float coordX = gl_FragCoord.x - mod(gl_FragCoord.x, unitWidth);
    float speed = cos(coordX * 30.0) * 0.3 + 0.7;
    float y = fract(vTexCoord.y + time * speed / 1.5);
    vec3 matrixColor = background / (y * 15.0);

    //code
    vec2 uv = mod(gl_FragCoord.xy, unitWidth) / unitWidth;
    //1ブロックを計算
    vec2 block = gl_FragCoord.xy / unitWidth - uv;
    vec2 resizedUV = uv * 0.8 + 0.1;
    //ノイズ画像をピクセルで取得、円状に辿る
    vec2 squreUV = resizedUV + floor(texture2D(noiseTextureUnit, block / vec2(234, 121) + 0.01*sin(time)+0.1).xy * unitWidth);
    vec2 randomBlock = squreUV / unitWidth;
    vec2 texCoord = vec2(randomBlock.x, randomBlock.y);
    //文字を取り出す
    vec4 codeText = texture2D(codeTextureUnit, texCoord);

    //msdf
    float sigDist = median(codeText.r, codeText.g, codeText.b) - 0.5;
    float dist = sigDist * dot(vec2(unitWidth, unitWidth), 0.5 / fwidth(texCoord));
    float opacity = clamp(dist + 0.5, 0.0, 1.0);

    //gl_FragColor = vec4(codeText);
    gl_FragColor = vec4(matrixColor * opacity * vig * wave * n, 1.0);
}