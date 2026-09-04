// Ported verbatim from particulate-medusae (static/glsl/**).
// Original build used grunt-contrib-handlebars to precompile
// `{{{chunks.X}}}` -> THREE.ShaderChunk[X] at build time, and a
// separate grunt task injected two custom chunks into THREE.ShaderChunk.
// Reproduced here at runtime: regex substitution is equivalent because
// every .glsl file in the source repo uses ONLY the `{{{chunks.X}}}`
// triple-stash form (verified: no other Handlebars syntax present).

(function () {
  // Two custom chunks the original build injects into THREE.ShaderChunk
  // (see grunt/tasks/shaderChunks.js + static/glsl/shader-chunks/*)
  THREE.ShaderChunk['lerp_pos_pars_vertex'] = [
    'uniform float stepProgress;',
    'attribute vec3 positionPrev;'
  ].join('\n');

  THREE.ShaderChunk['lerp_pos_vertex'] = [
    'vec4 mvPosition = modelViewMatrix * vec4(mix(positionPrev, position, stepProgress), 1.0);',
    'gl_Position = projectionMatrix * mvPosition;'
  ].join('\n');

  var raw = {
    'normal-vert': "{{{chunks.common}}}\n{{{chunks.uv_pars_vertex}}}\n{{{chunks.uv2_pars_vertex}}}\n{{{chunks.color_pars_vertex}}}\n{{{chunks.lerp_pos_pars_vertex}}}\n{{{chunks.logdepthbuf_pars_vertex}}}\n\nvarying vec3 vNormal;\n\nvoid main() {\n  {{{chunks.uv_vertex}}}\n  {{{chunks.uv2_vertex}}}\n  {{{chunks.color_vertex}}}\n\n  {{{chunks.begin_vertex}}}\n  {{{chunks.lerp_pos_vertex}}}\n  {{{chunks.logdepthbuf_vertex}}}\n  {{{chunks.worldpos_vertex}}}\n\n  vNormal = normalize(position);\n}",

    'bulb-frag': "uniform vec3 diffuse;\nuniform vec3 diffuseB;\nuniform float opacity;\nuniform float time;\nvarying vec2 vUv;\nvarying vec3 vNormal;\n\nconst vec3 eye = vec3(0.0, 0.0, 1.0);\n\nfloat oscillate(float vMin, float vMax, float t) {\n  float halfRange = (vMax - vMin) / vMax * 0.5;\n  return (sin(t) * halfRange + (1.0 - halfRange)) * vMax;\n}\n\nfloat accumulate(vec2 uv, float saturation, float scale) {\n  saturation -= sin(uv.x * 60.0) * 0.25 + sin(uv.x * 50.0 * scale) * 0.25 + 0.75;\n\n  saturation -= sin(uv.y * sin(uv.x         * 5.0) * 5.0 * scale) * 0.05;\n  saturation -= sin(uv.y * sin((1.0 - uv.x) * 5.0) * 5.0 * scale) * 0.05;\n\n  saturation -= sin(uv.y * sin(uv.y + cos(uv.x)       * 2.0) * 3.0 * scale) * 0.15;\n  saturation -= sin(uv.y * sin(uv.y + cos(1.0 - uv.x) * 2.0) * 3.0 * scale) * 0.15;\n\n  saturation -= sin((uv.y - 1.5) * sin(uv.y + cos(uv.x - 1.0) * 2.0) * 4.0 * scale) * 0.15;\n  saturation -= sin((uv.y - 1.5) * sin(uv.y + cos(uv.x)       * 2.0) * 3.0 * scale) * 0.15;\n\n  saturation -= sin(uv.y * 5.0) * 0.15 + sin(uv.y * 2.5) * 1.25;\n\n  return saturation;\n}\n\nvoid main() {\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n  float saturation = 0.0;\n\n  vec2 uv0 = vUv;\n  vec2 uv1 = uv0 + rim;\n  vec2 uv2 = vec2(-rim * 0.25);\n  vec2 uv3 = vec2(rim, uv0.y);\n\n  float scale0 = oscillate( 8.0, 15.0, time * 0.25 + 0.5);\n  float scale1 = oscillate(12.0, 20.0, time * 0.125);\n  float scale2 = 1.0;\n  float scale3 = 1.0;\n\n  saturation += max(accumulate(uv0, 2.0, scale0), -0.5);\n  saturation += max(accumulate(uv1, 2.0, scale1),  0.25);\n  saturation += max(accumulate(uv2, 1.0, scale2), -0.25);\n  saturation += max(accumulate(uv3, 1.0, scale3), -0.25);\n\n  gl_FragColor = vec4(\n    mix(diffuse, diffuseB, smoothstep(-0.5, 0.5, saturation)),\n    (1.0 - smoothstep(-0.5, 2.5, saturation)) * opacity);\n}",

    'gel-vert': "{{{chunks.common}}}\n{{{chunks.lerp_pos_pars_vertex}}}\n{{{chunks.color_pars_vertex}}}\n\nvarying vec3 vNormal;\n\nvoid main() {\n  {{{chunks.color_vertex}}}\n  {{{chunks.lerp_pos_vertex}}}\n  {{{chunks.worldpos_vertex}}}\n\n  vNormal = normalize(position);\n}",

    'gel-frag': "uniform vec3 diffuse;\nuniform float opacity;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 eye = vec3(0.0, 0.0, 1.0);\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n\n  float rimLight = 0.25 +\n    smoothstep(0.25, 1.0, rim) * 0.5 +\n    smoothstep(0.90, 1.0, rim) * 0.8;\n\n  gl_FragColor.rgb = diffuse * vec3(rimLight);\n  gl_FragColor.a = opacity;\n}",

    'tail-frag': "uniform vec3 diffuse;\nuniform vec3 diffuseB;\nuniform float opacity;\nuniform float scale;\nvarying vec2 vUv;\nvarying vec3 vNormal;\n\nconst vec3 eye = vec3(0.0, 0.0, 1.0);\n\nfloat accumulate(vec2 uv, float saturation, float scale) {\n  saturation -= sin(uv.y * 12.0 * scale) * 0.8 + uv.y * 1.5 + sin(uv.x * 20.0 * scale) * 0.1 + 0.85;\n\n  saturation -= sin(uv.y * sin(uv.x         * 5.0) * 5.0 * scale) * 0.05;\n  saturation -= sin(uv.y * sin((1.0 - uv.x) * 5.0) * 5.0 * scale) * 0.05;\n\n  saturation -= sin(uv.y * sin(uv.y + cos(uv.x)       * 2.0) * 10.0 * scale) * 0.15;\n  saturation -= sin(uv.y * sin(uv.y + cos(1.0 - uv.x) * 2.0) * 10.0 * scale) * 0.15;\n\n  return saturation;\n}\n\nvoid main() {\n  vec2 uv = vUv;\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n  float saturation = 0.0;\n\n  saturation += accumulate(uv, 2.0, scale);\n  saturation += max(accumulate(vec2(rim), 0.75, scale * 0.25), -0.25);\n\n  gl_FragColor = vec4(\n    mix(diffuseB, diffuse, saturation) * opacity,\n    clamp(saturation, 0.2, 1.0) * opacity);\n}",

    'tentacle-vert': "uniform float area;\nvarying float centerDist;\n\n{{{chunks.common}}}\n{{{chunks.lerp_pos_pars_vertex}}}\n{{{chunks.color_pars_vertex}}}\n\nvoid main() {\n  {{{chunks.color_vertex}}}\n\n  centerDist = length(position);\n\n  {{{chunks.lerp_pos_vertex}}}\n  {{{chunks.worldpos_vertex}}}\n}",

    'tentacle-frag': "uniform vec3 diffuse;\nuniform float opacity;\nuniform float area;\nvarying float centerDist;\n\nvoid main() {\n  float illumination = area * 2.0 / (centerDist * centerDist);\n  gl_FragColor = vec4(\n    mix(vec3(1.0), diffuse, clamp(illumination, 0.0, 1.25)),\n    clamp(opacity * illumination * illumination, 0.0, opacity));\n}",

    'lerp-vert': "{{{chunks.common}}}\n{{{chunks.uv_pars_vertex}}}\n{{{chunks.uv2_pars_vertex}}}\n{{{chunks.color_pars_vertex}}}\n{{{chunks.lerp_pos_pars_vertex}}}\n{{{chunks.logdepthbuf_pars_vertex}}}\n\nvoid main() {\n  {{{chunks.uv_vertex}}}\n  {{{chunks.uv2_vertex}}}\n  {{{chunks.color_vertex}}}\n\n  {{{chunks.begin_vertex}}}\n  {{{chunks.lerp_pos_vertex}}}\n  {{{chunks.logdepthbuf_vertex}}}\n  {{{chunks.worldpos_vertex}}}\n}",

    'basic-frag': "uniform vec3 diffuse;\nuniform float opacity;\n\n{{{chunks.common}}}\n{{{chunks.color_pars_fragment}}}\n{{{chunks.uv_pars_fragment}}}\n{{{chunks.uv2_pars_fragment}}}\n{{{chunks.map_pars_fragment}}}\n{{{chunks.alphamap_pars_fragment}}}\n{{{chunks.aomap_pars_fragment}}}\n{{{chunks.envmap_pars_fragment}}}\n{{{chunks.fog_pars_fragment}}}\n{{{chunks.shadowmap_pars_fragment}}}\n{{{chunks.specularmap_pars_fragment}}}\n{{{chunks.logdepthbuf_pars_fragment}}}\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(diffuse, opacity);\n  vec3 totalAmbientLight = vec3(1.0);\n\n  {{{chunks.logdepthbuf_fragment}}}\n  {{{chunks.map_fragment}}}\n  {{{chunks.color_fragment}}}\n  {{{chunks.alphamap_fragment}}}\n  {{{chunks.alphatest_fragment}}}\n  {{{chunks.specularmap_fragment}}}\n  {{{chunks.aomap_fragment}}}\n\n  outgoingLight = diffuseColor.rgb * totalAmbientLight;\n\n  {{{chunks.envmap_fragment}}}\n  {{{chunks.shadowmap_fragment}}}\n  {{{chunks.linear_to_gamma_fragment}}}\n  {{{chunks.fog_fragment}}}\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}",

    'lerp-point-vert': "uniform float size;\nuniform float scale;\n\n{{{chunks.common}}}\n{{{chunks.color_pars_vertex}}}\n{{{chunks.lerp_pos_pars_vertex}}}\n{{{chunks.logdepthbuf_pars_vertex}}}\n\nvoid main() {\n  {{{chunks.color_vertex}}}\n  {{{chunks.lerp_pos_vertex}}}\n  {{{chunks.logdepthbuf_vertex}}}\n\n  #ifdef USE_SIZEATTENUATION\n    gl_PointSize = size * (scale / length(mvPosition.xyz));\n  #else\n    gl_PointSize = size;\n  #endif\n}",

    'basic-point-frag': "uniform vec3 psColor;\nuniform float opacity;\n\n{{{chunks.common}}}\n{{{chunks.color_pars_fragment}}}\n{{{chunks.map_particle_pars_fragment}}}\n{{{chunks.fog_pars_fragment}}}\n{{{chunks.shadowmap_pars_fragment}}}\n{{{chunks.logdepthbuf_pars_fragment}}}\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(psColor, opacity);\n\n  {{{chunks.logdepthbuf_fragment}}}\n  {{{chunks.map_particle_fragment}}}\n  {{{chunks.color_fragment}}}\n  {{{chunks.alphatest_fragment}}}\n\n  outgoingLight = diffuseColor.rgb;\n\n  {{{chunks.shadowmap_fragment}}}\n  {{{chunks.fog_fragment}}}\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}",

    'dust-vert': "uniform float size;\nuniform float scale;\nuniform float time;\nuniform float area;\nvarying float centerDist;\n\nvoid main() {\n  float offsetY = mod(position.y - 1.0 * time, area) - area * 0.5;\n  vec3 offsetPosition = vec3(\n    position.x + sin(cos(offsetY * 0.1) + sin(offsetY * 0.1 + position.x * 0.1) * 2.0),\n    offsetY,\n    position.z + sin(cos(offsetY * 0.1) + sin(offsetY * 0.1 + position.z * 0.1) * 2.0));\n\n  centerDist = length(offsetPosition);\n\n  vec4 mvPosition = modelViewMatrix * vec4(offsetPosition, 1.0);\n\n  gl_PointSize = size * (scale / length(mvPosition.xyz));\n  gl_Position = projectionMatrix * mvPosition;\n}",

    'dust-frag': "uniform vec3 psColor;\nuniform float opacity;\nuniform float area;\nvarying float centerDist;\n\n{{{chunks.common}}}\n{{{chunks.color_pars_fragment}}}\n{{{chunks.map_particle_pars_fragment}}}\n\nvoid main() {\n  vec4 diffuseColor = vec4(psColor, opacity);\n\n  {{{chunks.map_particle_fragment}}}\n  {{{chunks.color_fragment}}}\n\n  gl_FragColor = vec4(diffuseColor.rgb, diffuseColor.a);\n}",

    'alpha-vert': "{{{chunks.common}}}\n{{{chunks.uv_pars_vertex}}}\n{{{chunks.color_pars_vertex}}}\n{{{chunks.logdepthbuf_pars_vertex}}}\n\nattribute float alpha;\nvarying float vAlpha;\n\nvoid main() {\n  {{{chunks.uv_vertex}}}\n  {{{chunks.color_vertex}}}\n\n  {{{chunks.begin_vertex}}}\n  {{{chunks.project_vertex}}}\n  {{{chunks.logdepthbuf_vertex}}}\n\n  {{{chunks.worldpos_vertex}}}\n\n  vAlpha = alpha;\n}",

    'alpha-frag': "uniform vec3 diffuse;\nuniform float opacity;\nvarying float vAlpha;\n\n{{{chunks.common}}}\n{{{chunks.color_pars_fragment}}}\n{{{chunks.uv_pars_fragment}}}\n{{{chunks.map_pars_fragment}}}\n{{{chunks.logdepthbuf_pars_fragment}}}\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(diffuse, opacity * vAlpha);\n  vec3 totalAmbientLight = vec3(1.0); // hardwired\n  vec3 shadowMask = vec3(1.0);\n\n  {{{chunks.logdepthbuf_fragment}}}\n  {{{chunks.map_fragment}}}\n  {{{chunks.color_fragment}}}\n  {{{chunks.alphatest_fragment}}}\n\n  outgoingLight = diffuseColor.rgb * totalAmbientLight;\n\n  {{{chunks.linear_to_gamma_fragment}}}\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}"
  };

  var CHUNK_RE = /\{\{\{chunks\.(\w+)\}\}\}/g;

  App.shaders = {};
  Object.keys(raw).forEach(function (name) {
    App.shaders[name] = function (data) {
      return raw[name].replace(CHUNK_RE, function (m, key) {
        var val = data.chunks[key];
        if (val == null) {
          App.log('[shader] missing chunk: ' + key);
          return '';
        }
        return val;
      });
    };
  });
}());
