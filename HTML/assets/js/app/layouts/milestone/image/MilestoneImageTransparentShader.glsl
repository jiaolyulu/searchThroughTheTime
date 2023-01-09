#!ATTRIBUTES

#!UNIFORMS
uniform sampler2D tMap;
// uniform vec2 uSize;
// uniform vec2 uImageSize;
uniform float uOpacity;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
void main() {
  /*
    "Scale To Fill": vec2(1.0, 1.0).
    landscape "Aspect Fit": vec2(1.0, aspect).
    landscape "Aspect Fill": vec2(1.0/aspect, 1.0).
    portrait "Aspect Fit": vec2(1.0/aspect, 1.0).
    portrait "Aspect Fill": vec2(1.0, aspect).
  */
  // vec2 imageScale;
  // float ratio = uImageSize.x / uImageSize.y;
  // if (ratio > 1.0) {
  //   imageScale = vec2(1.0, ratio);
  // } else {
  //   imageScale = vec2(1.0/ratio, 1.0);
  // }

  // vec2 imageUV = imageScale * (vUv - 0.5) + 0.5;

  // // Simulate CLAMP_TO_EDGE
  // if (imageUV.x < 0.0 || imageUV.x > 1.0 ||
  //     imageUV.y < 0.0 || imageUV.y > 1.0) {
  
  //     discard;
  // }

  vec4 color = texture2D(tMap, vUv);
  color.a *= uOpacity;
  color.a *= uAppear;

  gl_FragColor = color;
}