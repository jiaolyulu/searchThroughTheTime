#!ATTRIBUTES

#!UNIFORMS
uniform sampler2D tMap;
uniform vec3 uColor;
uniform vec2 uSize;
// uniform vec2 uImageSize;
uniform float uThickness;
uniform float uRadius;
uniform float uOpacity;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
// float parabola(float x, float k) {
//     return pow(4.0 * x * (1.0 - x), k);
// }

void main() {
  vec3 pos = position;

  // pos.z -= (1.0 - uAppear) * 0.5;
  // pos.z -= (1.0 - uAppear) * 0.5;

  // pos.xyz -= 0.5;
  // pos.xyz *= mix(0.9, 1.0, uAppear);
  // pos.xyz += 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
#require(roundedBorder.glsl)
#require(aastep.glsl)

// vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 ouv) {
//   vec2 s = uSize;
//   vec2 i = imgSize;
//   float rs = s.x / s.y;
//   float ri = i.x / i.y;
//   vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
//   vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
//   vec2 uv = ouv * s / new + offset;

//   return texture2D(tex, uv);
// }

void main() {
  vec3 color = uColor;
  float inside;
  float border = roundedBorder(uThickness, uRadius, vUv, uSize, inside);

  if (aastep(0.5, border + inside) < 0.5) {
    discard;
    return;
  }

  // vec3 tex = coverTexture(tMap, uImageSize, vUv).rgb;
  vec3 tex = texture2D(tMap, vUv).rgb;
  color = mix(color, tex, inside);

  float opacity = uOpacity;
  opacity *= uAppear;

  gl_FragColor = vec4(color, opacity);
}