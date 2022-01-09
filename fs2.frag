precision mediump float;
uniform sampler2D textureUnit;
uniform bool noiseTypeOne;  // 乱数生成のタイプ１かどうか
uniform float noiseStrength; // ノイズの合成強度
uniform float vignetteScale; // ヴィネット係数
uniform float sinWave;       // サイン波の周波数係数 @@@
uniform float sinStrength;   // サイン波の合成強度 @@@
uniform float time;          // 時間の経過 @@@
uniform vec3 background;    // 背景色 @@@
varying vec2 vTexCoord;

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
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;

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
    gl_FragColor = vec4(background * gray * vig * wave * n, 1.0);
}
