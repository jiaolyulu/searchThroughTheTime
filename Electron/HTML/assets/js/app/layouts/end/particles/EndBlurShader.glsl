#!ATTRIBUTES

#!UNIFORMS
uniform vec3 uColor;
uniform sampler2D tMap;
uniform float uAlpha;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  vec3 pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  
  vUv = uv;
}

#!SHADER: Fragment
void main() {
  vec4 color = vec4(uColor, 1.0);
  color.a = texture2D(tMap, vUv).a;
  color.a *= uAlpha;

  gl_FragColor = color;
}