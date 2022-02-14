// ------------------------------------------------------------------------------------------------
// シェーダー（GB風フィルター）
// ------------------------------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------
// 頂点シェーダー
const vs_gbfilter = `
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
const fs_gbfilter = `
precision highp float;

uniform sampler2D u_texture0;
uniform vec2 u_resolution;
uniform float u_hi_tone;
uniform float u_grid;
uniform float u_curve;
uniform vec3 u_filter_color;
varying vec2 v_uv0;

void main()
{
	// ターゲット解像度（160*144に合わせると初代GBの解像度になる）
	vec2 target_resolution = u_resolution / 4.0;

	// UVの精度を下げて低解像度サンプリングする
	// Todo : 段階的に解像度を下げていくか、多点サンプリングするかした方が良好な結果を得られるかもしれない
	vec2 uv = v_uv0 * target_resolution;
	uv = floor(uv);
	uv /= target_resolution;
	vec4 color = texture2D(u_texture0, uv);

	// サンプリングした色をグレースケール化する（NTSC規格の加重平均）
	float shade = color.x * 0.2989 + color.y * 0.5866 + color.z * 0.1144;

	// グレースケールの明暗を適当に調整
	shade = pow(shade, u_curve);

	// グレースケールを4階調に変換する
	// また、市松模様のドットパターンも仕込み、疑似的に7諧調に見せかける
	shade *= 4.0;
	float checkered_pattern = step(fract(shade), 0.5);
	checkered_pattern *= step(0.5, mod(uv.x * target_resolution.x + step(0.5, mod(uv.y * target_resolution.y, 2.0)), 2.0)); // 市松模様の計算
	shade = max(shade - checkered_pattern * u_hi_tone, 0.1);
	shade = ceil(shade);
	shade /= 4.0;

	// ドットの格子模様を重ね掛け
	vec2 grid = step(3.0, mod(v_uv0 * u_resolution, 4.0));
	shade = max(shade, max(grid.x, grid.y) * 0.545 * u_grid);

	// グレースケールにフィルターカラーを適用
	color.x = shade * u_filter_color.x;
	color.y = shade * u_filter_color.y;
	color.z = shade * u_filter_color.z;

	gl_FragColor = color;
}
`;

