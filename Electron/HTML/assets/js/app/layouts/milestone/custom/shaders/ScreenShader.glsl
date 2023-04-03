#!ATTRIBUTES


#!UNIFORMS
uniform sampler2D tMap;
// uniform sampler2D tMatcap;
uniform float uAlpha;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec2 vMatcap;

#!SHADER: Vertex

void main() {
  vec3 pos = position;
  pos *= uAppear;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vPos = position;
  vUv = uv;
  // vNormal = normalMatrix * normal;
  // vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
}

#!SHADER: Fragment
// float luma(vec3 color) {
//   return dot(color, vec3(0.299, 0.587, 0.114));
// }

// vec2 matcap(vec3 eye, vec3 normal) {
//   vec3 reflected = reflect(eye, normal);
//   float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
//   return reflected.xy / m + 0.5;
// }

// vec2 reflectMatcapFBR(vec3 position, mat4 modelViewMatrix, vec3 normal) {
//     vec4 p = vec4(position, 1.0);

//     vec3 e = normalize(vec3(modelViewMatrix * p));
//     vec3 n = normalize(normal);
//     vec3 r = reflect(e, n);
//     float m = 2.0 * sqrt(
//     pow(r.x, 2.0) +
//     pow(r.y, 2.0) +
//     pow(r.z + 1.0, 2.0)
//     );

//     vec2 uv = r.xy / m + .5;

//     return uv;
// }

float vignette(vec2 uv) {
    uv *=  1.0 - uv.yx;
    float vig = uv.x*uv.y * 15.0;
    return pow(vig, 0.04);
}

void main() {
  float alpha = uAlpha;
  // alpha *= uAppear;

  if (alpha <= 0.001) {
    discard;
    return;
  }

  vec3 color = texture2D(tMap, vUv).rgb;

  // float m = 0.4;
  // vec2 aUV = reflectMatcapFBR(vPos * m, projectionMatrix, vNormal);
  // vec2 bUV = reflectMatcapFBR(vPos * m, modelMatrix, vNormal);
  // vec2 mUV = mix(aUV, bUV, 0.8);
  // vec3 matcap = texture2D(tMatcap, mUV).rgb;

  float vign = vignette(vUv);
  color = mix(color * 0.7, color, vign);

  gl_FragColor = vec4(color, alpha);
}