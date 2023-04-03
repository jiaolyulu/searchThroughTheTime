#!ATTRIBUTES

#!UNIFORMS
uniform vec3 uColor;
uniform float uHover;
uniform float uBorder;
uniform float uOpacity;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  vec3 pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
#require(aastep.glsl)

vec4 add(vec4 fg, vec4 bg) {
    return fg * fg.a + bg * (1.0 - fg.a);
}

float sdBox(in vec2 p, in vec2 b){
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

// https://www.shadertoy.com/view/XtGfzw
float sdCross( in vec2 p, in vec2 b, float r ) 
{
    p = abs(p); p = (p.y>p.x) ? p.yx : p.xy;
	  vec2  q = p - b;
    float k = max(q.y,q.x);
    vec2  w = (k>0.0) ? q : vec2(b.y-p.x,-k);
    float d = length(max(w,0.0));
    return ((k>0.0)?d:-d) + r;
}

void main() {
  float hover = 1.0 - uHover;
  vec4 color = vec4(1.0, 1.0, 1.0, 0.0);

  if (uBorder > 0.5) {
    color = vec4(uColor, 0.2);
    float radius = 0.08 * hover;
    float circleIn = aastep(0.5 - radius, length(vUv - vec2(0.5)));
    float circleOut = aastep(0.5, length(vUv - vec2(0.5)));
    color.a *= circleIn - circleOut;
  }

  vec4 fill = vec4(uColor, 1.0);
  float width = 0.25 * hover;
  float height = 0.028 * hover;

  // x1  y1   x2   y2
  vec4 rect = vec4(0.5 - width, 0.5 - height, 0.5 + width, 0.5 + height);
  vec2 hv = aastep(rect.xy, vUv) * aastep(vUv, rect.zw);
  color = add(mix(color, fill, hv.x * hv.y), color);

  rect = vec4(0.5 - height, 0.5 - width, 0.5 + height, 0.5 + width);
  hv = aastep(rect.xy, vUv) * aastep(vUv, rect.zw);
  color = add(mix(color, fill, hv.x * hv.y), color);

  // float x = sdCross((vUv - 0.5), vec2(0.3, 0.04), 0.0);
  // float d = fwidth(x);
  // float s = smoothstep(-d, d, x);
  
  // if ((1.0 - s) < 0.01) discard;

  // // color.r = w;
  // // color *= w;
  // // color = add(mix(color, fill, 1.0 - sign(w)), color);
  // color = vec4(vec3(s), 1.0);

  color.a *= hover;
  color.a *= uOpacity;
  color.a *= uAppear;

  // color = vec4(w, 1.0, 1.0, 1.0);

  gl_FragColor = color;
}