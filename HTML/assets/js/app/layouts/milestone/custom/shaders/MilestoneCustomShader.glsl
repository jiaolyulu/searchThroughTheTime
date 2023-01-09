#!ATTRIBUTES

#!UNIFORMS
uniform vec3 uColor;
uniform sampler2D tAO;
uniform float uFresnelStrength;
uniform float uAOStrength;
uniform float uAlpha;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

#!SHADER: Vertex
void main() {
  vec3 pos = position;

  pos *= uAppear;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vec4 modelViewPos = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = -modelViewPos.xyz;
}

#!SHADER: Fragment
#require(fresnel.glsl)
#require(range.glsl)

void main() {
  float alpha = uAlpha;
  // alpha *= uAppear;

  if (alpha <= 0.001) {
    discard;
    return;
  }

  vec3 color = uColor;
  vec3 ao = texture2D(tAO, vUv).rgb;
  color = color * ao;
  color = mix(uColor, color, uAOStrength);

  float fresnel = getFresnel(vNormal, vViewDir, 1.0);
  color = mix(color, vec3(1.0), fresnel * uFresnelStrength);

  gl_FragColor = vec4(color, alpha);
}
