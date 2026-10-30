/** Ashima 3D simplex noise (MIT). */
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const orbVertex = /* glsl */ `
${SIMPLEX}
uniform float uTime;
varying vec3 vObject;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vObject=position;
  vec3 displaced=position+normal*.035*snoise(position*1.4+uTime*.18);
  vec4 world=modelViewMatrix*vec4(displaced,1.);
  vNormal=normalize(normalMatrix*normal);
  vView=normalize(-world.xyz);
  gl_Position=projectionMatrix*world;
}`;

/** Obsidian shell crossed by slow-moving veins of light. uPointer brightens the nearest side. */
export const orbFragment = /* glsl */ `
${SIMPLEX}
uniform float uTime;
uniform float uEnergy;
uniform float uAlpha;
uniform vec3 uPointer;
varying vec3 vObject;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec3 p=vObject*1.65;
  float t=uTime*.1;
  float w=snoise(p*.9+t);
  vec3 q=p+vec3(w,w*.6+sin(p.x*1.7+t)*.35,-w*.8+cos(p.y*1.3-t)*.35)*.42;
  float n=snoise(q*1.45);
  float near=smoothstep(1.15,.1,distance(normalize(vObject),uPointer));
  float main=pow(1.-abs(n),mix(20.,11.,near));
  float fine=pow(1.-abs(snoise(q*3.4+4.)),32.)*.55;
  float facing=max(dot(normalize(vNormal),normalize(vView)),0.);
  float fresnel=pow(1.-facing,3.2);

  vec3 blue=vec3(.14,.38,1.);
  vec3 violet=vec3(.48,.26,1.);
  vec3 cyan=vec3(.5,.92,1.);

  vec3 col=mix(vec3(.016,.02,.034),vec3(.038,.044,.07),n*.5+.5);
  col+=(main+fine)*mix(mix(violet,blue,smoothstep(-.5,.5,vObject.y)),cyan,main*main)*(1.25+uEnergy*2.2+near*.9);
  col+=near*blue*.05;
  col+=fresnel*mix(violet*.9,cyan,smoothstep(-.6,.8,vObject.y+vObject.x*.4))*.95;
  gl_FragColor=vec4(col*uAlpha,uAlpha);
}`;

export const haloVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;

export const haloFragment = /* glsl */ `
uniform float uStrength;
varying vec2 vUv;
void main(){
  float d=length(vUv-.5)*2.;
  float a=pow(smoothstep(1.,.2,d),2.6)*uStrength;
  gl_FragColor=vec4(vec3(.2,.38,1.)*a,a);
}`;

export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vSeed;
void main(){
  vSeed=aSeed;
  vec3 p=position;
  float a=uTime*.025*(.4+aSeed);
  float c=cos(a),s=sin(a);
  p.xz=mat2(c,-s,s,c)*p.xz;
  p.y+=sin(uTime*.2+aSeed*40.)*.14;
  vec4 view=modelViewMatrix*vec4(p,1.);
  gl_PointSize=(1.+aSeed*2.6)*uPixelRatio*(6./-view.z);
  gl_Position=projectionMatrix*view;
}`;

export const dustFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying float vSeed;
void main(){
  float d=length(gl_PointCoord-.5)*2.;
  if(d>1.)discard;
  float twinkle=.55+.45*sin(uTime*.7+vSeed*90.);
  float a=pow(1.-d,1.6)*twinkle*(.25+vSeed*.6)*uOpacity;
  vec3 col=mix(vec3(.5,.66,1.),vec3(.62,.95,1.),step(.72,vSeed));
  gl_FragColor=vec4(col*a,a);
}`;
