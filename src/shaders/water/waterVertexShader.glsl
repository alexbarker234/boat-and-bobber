uniform float time;
uniform vec2 wave_size;
uniform float wave_speed;
uniform float height;

varying vec2 vUv;

const float M_2PI = 6.283185307;
const float M_6PI = 18.84955592;

void main() {
    vUv = uv;
    
    vec3 pos = position;
    float timeValue = time * wave_speed;
    vec2 uvPos = uv * wave_size;
    float d1 = mod(uvPos.x + uvPos.y, M_2PI);
    float d2 = mod((uvPos.x + uvPos.y + 0.25) * 1.3, M_6PI);
    d1 = timeValue * 0.07 + d1;
    d2 = timeValue * 0.5 + d2;
    vec2 dist = vec2(
        sin(d1) * 0.15 + sin(d2) * 0.05,
        cos(d1) * 0.15 + cos(d2) * 0.05
    );
    pos.y += dist.y * height;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}