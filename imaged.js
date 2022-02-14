// ------------------------------------------------------------------------------------------------
// シェーダー（テクスチャマッピング）
// ------------------------------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------
// 頂点シェーダー
var vs_imaged = `
attribute vec3 a_position;
attribute vec2 a_uv0;
uniform mat4 u_wvp;
varying vec2 v_uv0;

void main()
{
	v_uv0 = a_uv0;
	gl_Position = u_wvp * vec4(a_position, 1.0);
}
`;


// -------------------------------------------------------------------------------------------
// フラグメントシェーダー
var fs_imaged = `
/*precision mediump float;*/
precision highp float;

uniform sampler2D u_texture0;
varying vec2 v_uv0;

void main()
{
	gl_FragColor = texture2D(u_texture0, v_uv0);
}
`;

