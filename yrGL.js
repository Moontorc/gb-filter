// ------------------------------------------------------------------------------------------------
// WebGLラッパー
// ------------------------------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------
// グローバル変数
var __ext_OES_texture_float__ = null;		// 拡張機能とか
var __ext_EXT_frag_depth__ = null;			// 
var __ext_WEBGL_draw_buffers__ = null;		// 
var __MAX_COLOR_ATTACHMENTS_WEBGL__ = 0;	// 
var __MAX_DRAW_BUFFERS_WEBGL__ = 0;			// 
var __MAX_VERTEX_TEXTURE_IMAGE_UNITS__ = 0;	// 


// -------------------------------------------------------------------------------------------
// レンダラー
function yrGLRenderer(gl)
{
	this._gl = gl;

	/* ↓とりあえずの初期設定、変更はご自由に */

	// 背面カリング有効化
	this._gl.enable(this._gl.CULL_FACE);
	this._gl.cullFace(this._gl.BACK)
	this._gl.frontFace(this._gl.CCW);	// 半時計回りが表（OpenGL系の初期設定、DirectX系と逆だったりする）

	// 深度書き込み＆深度テスト有効化
	this._gl.enable(this._gl.DEPTH_TEST);
	this._gl.depthFunc(this._gl.LEQUAL);	// 同深度なら描く
	this._gl.depthMask(true);

	// αブレンド無効化
	this._gl.disable(this._gl.BLEND);
}
yrGLRenderer.prototype.release = function()
{
}

// ビューポートをセットする（デフォだとcanvasに合わさっている）
yrGLRenderer.prototype.setViewport = function(x, y, w, h)
{
	this._gl.viewport(x, y, w, h);
}

// カラーバッファとZバッファをクリアする
yrGLRenderer.prototype.clearBuffer = function()
{
	this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
	this._gl.clearDepth(1.0);
	this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
}

// ジオメトリを描画する
yrGLRenderer.prototype.renderGeometry = function(geometry, material)
{
	// プログラムオブジェクトを有効化する
	this._gl.useProgram(material._program);

	// アトリビュート設定
	var attls = [];	// 後で無効化するために記録しておく
	for(var i in geometry._vbo)
	{
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, geometry._vbo[i].vbo);
		var attLocation = this._gl.getAttribLocation(material._program, geometry._vbo[i].name);
		if(-1 == attLocation)
		{
			// 失敗
			yrUtil.message("warning : not found " + geometry._vbo[i].name, false);
		}
		else
		{
			this._gl.enableVertexAttribArray(attLocation);
			this._gl.vertexAttribPointer(attLocation, geometry._vbo[i].size, this._gl.FLOAT, false, 0, 0);
			attls.push(attLocation);
		}
	}
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

	// ユニフォーム設定（かなり中途半端な実装になってます）
	for(var i in material._uni_f)
	{
		var uniLocation = this._gl.getUniformLocation(material._program, material._uni_f[i].name);
		if(null == uniLocation)
		{
			// 失敗
			yrUtil.message("warning : not found " + material._uni_f[i].name, false);
		}
		else
		{
			if(16 == material._uni_f[i].value.length)
			{
				// 4x4行列とみなす
				this._gl.uniformMatrix4fv(uniLocation, false, material._uni_f[i].value);
			}
			else if(4 == material._uni_f[i].value.length)
			{
				// 4ベクトルとみなす
				this._gl.uniform4fv(uniLocation, material._uni_f[i].value);
			}
			else if(3 == material._uni_f[i].value.length)
			{
				// 3ベクトルとみなす
				this._gl.uniform3fv(uniLocation, material._uni_f[i].value);
			}
			else if(2 == material._uni_f[i].value.length)
			{
				// 2ベクトルとみなす
				this._gl.uniform2fv(uniLocation, material._uni_f[i].value);
			}
			else if(1 == material._uni_f[i].value.length)
			{
				// 単体値とみなす
				this._gl.uniform1f(uniLocation, material._uni_f[i].value[0]);
			}
			else
			{
				// 未実装
				yrUtil.message("warning : " + material._uni_f[i].name, false);
			}
		}
	}
	for(var i in material._uni_i)
	{
		var uniLocation = this._gl.getUniformLocation(material._program, material._uni_i[i].name);
		if(null == uniLocation)
		{
			// 失敗
			yrUtil.message("warning : not found " + material._uni_i[i].name, false);
		}
		else
		{
			if(4 == material._uni_i[i].value.length)
			{
				// 4ベクトルとみなす
				this._gl.uniform4iv(uniLocation, material._uni_i[i].value);
			}
			else if(3 == material._uni_i[i].value.length)
			{
				// 3ベクトルとみなす
				this._gl.uniform3iv(uniLocation, material._uni_i[i].value);
			}
			else if(2 == material._uni_i[i].value.length)
			{
				// 2ベクトルとみなす
				this._gl.uniform2iv(uniLocation, material._uni_i[i].value);
			}
			else if(1 == material._uni_i[i].value.length)
			{
				// 単体値とみなす
				this._gl.uniform1i(uniLocation, material._uni_i[i].value[0]);
			}
			else
			{
				// 未実装
				yrUtil.message("warning : " + material._uni_i[i].name, false);
			}
		}
	}

	// テクスチャ設定
	for(var i in material._texture)
	{
		if(i >= 4)
		{
			// 未実装
			yrUtil.message("warning : activeTexture", false);
			break;
		}

		if(0 == i)		this._gl.activeTexture(this._gl.TEXTURE0);
		else if(1 == i)	this._gl.activeTexture(this._gl.TEXTURE1);
		else if(2 == i)	this._gl.activeTexture(this._gl.TEXTURE2);
		else if(3 == i)	this._gl.activeTexture(this._gl.TEXTURE3);
		this._gl.bindTexture(this._gl.TEXTURE_2D, material._texture[i]);
	}

	// モデルの描画
	if(null != geometry._ibo)
	{
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, geometry._ibo);
		this._gl.drawElements(geometry._mode, geometry._index_num, this._gl.UNSIGNED_SHORT, 0);
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
	}
	else
	{
		this._gl.drawArrays(geometry._mode, 0, geometry._vertex_num);
	}

	// 後片付けしておく
	for(var i in material._texture)
	{
		if(i >= 4)
		{
			// 未実装
			yrUtil.message("warning : activeTexture", false);
			break;
		}

		if(0 == i)		this._gl.activeTexture(this._gl.TEXTURE0);
		else if(1 == i)	this._gl.activeTexture(this._gl.TEXTURE1);
		else if(2 == i)	this._gl.activeTexture(this._gl.TEXTURE2);
		else if(3 == i)	this._gl.activeTexture(this._gl.TEXTURE3);
		this._gl.bindTexture(this._gl.TEXTURE_2D, null);
	}
	for(var i in attls)
	{
		this._gl.disableVertexAttribArray(attls[i]);
	}
}

// バッファリングされたWebGLコマンドをただちに実行する
yrGLRenderer.prototype.flush = function()
{
	this._gl.flush();
}


// -------------------------------------------------------------------------------------------
// マテリアル
function yrGLMaterial(gl, vs_str, fs_str)
{
	this._gl = gl;
	this._vs = this.createShader(vs_str, this._gl.VERTEX_SHADER);
	this._fs = this.createShader(fs_str, this._gl.FRAGMENT_SHADER);
	this._program = this.createProgram(this._vs, this._fs);
	this._uni_f = [];
	this._uni_i = [];
	this._texture = [];
}
yrGLMaterial.prototype.release = function()
{
	if(this._program)	this._gl.deleteProgram(this._program);
	if(this._fs)		this._gl.deleteShader(this._fs);
	if(this._vs)		this._gl.deleteShader(this._vs);
}

// シェーダーを作成
yrGLMaterial.prototype.createShader = function(s, type)
{
	// シェーダーを作成
	var shader = this._gl.createShader(type);

	// シェーダーにソースを割り当てる
	this._gl.shaderSource(shader, s);

	// シェーダーをコンパイルする
	this._gl.compileShader(shader);

	// シェーダが正しくコンパイルされたかチェック
	if(this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS))
	{
		// 成功
		return shader;
	}
	else
	{
		// 失敗
		yrUtil.message(this._gl.getShaderInfoLog(shader), true);
	}
}

// プログラムオブジェクトを作成する
yrGLMaterial.prototype.createProgram = function(vs, fs)
{
	// プログラムオブジェクトを作成
	var program = this._gl.createProgram();

	// シェーダを割り当てる
	this._gl.attachShader(program, vs);
	this._gl.attachShader(program, fs);

	// シェーダをリンク
	this._gl.linkProgram(program);

	// シェーダのリンクが正しく行なわれたかチェック
	if(this._gl.getProgramParameter(program, this._gl.LINK_STATUS))
	{
		// 成功
		return program;
	}
	else
	{
		// 失敗
		yrUtil.message(this._gl.getProgramInfoLog(program), true);
	}
}

// ユニフォーム変数（Float32配列）をセットする
yrGLMaterial.prototype.SetUniformFloat32Array = function(name, value)
{
	for(var i in this._uni_f)
	{
		if(this._uni_f[i].name == name)
		{
			this._uni_f[i].value = value;
			return;
		}
	}

	this._uni_f.push({name: name, value: value});
}

// ユニフォーム変数（Int32配列）をセットする
yrGLMaterial.prototype.SetUniformInt32Array = function(name, value)
{
	for(var i in this._uni_i)
	{
		if(this._uni_i[i].name == name)
		{
			this._uni_i[i].value = value;
			return;
		}
	}

	this._uni_i.push({name: name, value: value});
}

// テクスチャ配列をセットする
yrGLMaterial.prototype.SetTextureArray = function(texture)
{
	this._texture = texture;
}


// -------------------------------------------------------------------------------------------
// ジオメトリ
function yrGLGeometry(gl, vertex, index, mode)
{
	/* 
		Todo : 
		動的書き換えは今のところ考えていない。
		毎フレーム、バッファを作り直すくらいなら、
		DYNAMIC_DRAWとbufferSubDataあたりを実装すると幸せかもしれない。

		Todo : 
		インターリーブ配列になっていないのでGPUのキャッシュ効率が悪いかもしれないが、
		そちらの対応は一旦保留。
	*/

	this._gl = gl;
	this._vbo = [];
	this._vbo.push({vbo: this.createVBO(vertex), name: "a_position", size: 3});
	this._mode = mode;
	this._vertex_num = vertex.length / 3;

	this._ibo = null;
	this._index_num = 0;
	if(null != index)
	{
		this._ibo = this.createIBO(index);
		this._index_num = index.length;
	}
}
yrGLGeometry.prototype.release = function()
{
	if(this._ibo)			this._gl.deleteBuffer(this._ibo);
	for(var i in this._vbo)	this._gl.deleteBuffer(this._vbo[i].vbo);
}

// UV0を追加する
yrGLGeometry.prototype.addUV0 = function(uv0)
{
	this._vbo.push({vbo: this.createVBO(uv0), name: "a_uv0", size: 2});
}

// 法線を追加する
yrGLGeometry.prototype.addNormal = function(normal)
{
	this._vbo.push({vbo: this.createVBO(normal), name: "a_normal", size: 3});
}

// VBOを作成する
yrGLGeometry.prototype.createVBO = function(vertex)
{
	// バッファオブジェクトの生成
	var vbo = this._gl.createBuffer();

	// バッファをバインドする
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);

	// バッファにデータをセット
	this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertex), this._gl.STATIC_DRAW);

	// バインドを解除
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

	// 生成したVBOを返して終了
	return vbo;
}

// IBOを作成する
yrGLGeometry.prototype.createIBO = function(vertex)
{
	// バッファオブジェクトの生成
	var ibo = this._gl.createBuffer();

	// バッファをバインドする
	this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, ibo);

	// バッファにデータをセット
	this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Int16Array(vertex), this._gl.STATIC_DRAW);

	// バインドを解除
	this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);

	// 生成したIBOを返して終了
	return ibo;
}


// -------------------------------------------------------------------------------------------
// テクスチャ
function __handleTextureLoaded__(_this)
{
	// テクスチャをバインドする
	_this._gl.bindTexture(_this._gl.TEXTURE_2D, _this._texture);

	// テクスチャへイメージを適用
	_this._gl.texImage2D(_this._gl.TEXTURE_2D, 0, _this._gl.RGBA, _this._gl.RGBA, _this._gl.UNSIGNED_BYTE, _this._img);

	// 2のべき乗サイズか？（npotだとミップマップとリピートが使えない）
	var npot = false;
	var wl = Math.log2(_this._img.width)
	var hl = Math.log2(_this._img.height)
	if(Math.round(wl) !== wl || Math.round(hl) !== hl)
	{
		npot = true;
	}

	// ミップマップを生成（とりあえず作れれば作っておく）
	if(!npot)
	{
		_this._gl.generateMipmap(_this._gl.TEXTURE_2D);
	}

	// テクスチャパラメーター（とりあえずの初期値）をセット
	if(!npot)
	{
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_MAG_FILTER, _this._gl.LINEAR);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_MIN_FILTER, _this._gl.LINEAR_MIPMAP_LINEAR);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_WRAP_S, _this._gl.CLAMP_TO_EDGE);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_WRAP_T, _this._gl.CLAMP_TO_EDGE);
	}
	else
	{
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_MAG_FILTER, _this._gl.LINEAR);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_MIN_FILTER, _this._gl.LINEAR);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_WRAP_S, _this._gl.CLAMP_TO_EDGE);
		_this._gl.texParameteri(_this._gl.TEXTURE_2D, _this._gl.TEXTURE_WRAP_T, _this._gl.CLAMP_TO_EDGE);
	}

	// テクスチャのバインドを無効化
	_this._gl.bindTexture(_this._gl.TEXTURE_2D, null);
}
function yrGLTexture(gl, src)
{
	this._gl = gl;

	this._img = new Image();
	this._texture = this._gl.createTexture();
	this._is_loaded = false;
	var _this = this;
	this._img.onload = function()
	{
		// イメージの読み込みが終わった
		__handleTextureLoaded__(_this);
		_this._is_loaded = true;
	};
	this._img.onerror = function()
	{
		yrUtil.message("warning : not found " + _this._img.src, true);
		_this._is_loaded = true;
	}
	this._img.src = src;
}
yrGLTexture.prototype.release = function()
{
	if(this._texture)	this._gl.deleteTexture(this._texture);
}

// テクスチャパラメーターのセット
yrGLTexture.prototype.setTextureParameters = function(mag, min, wrap_s, wrap_t)
{
	// テクスチャをバインド
	this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);

	// テクスチャパラメーターをセット
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, mag);
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, min);
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrap_s);	// npotだとリピートが使えない
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrap_t);	// 

	// バインドを解除
	this._gl.bindTexture(this._gl.TEXTURE_2D, null);
}


// -------------------------------------------------------------------------------------------
// フレームバッファ
function yrGLFrameBuffer(gl, w, h, float_texture)
{
	if(float_texture && null == __ext_OES_texture_float__)
	{
		// 浮動小数点数テクスチャはサポート外
		yrUtil.message("warning : not supported float_texture", true);
		float_texture = false;
	}

	this._gl = gl;

	// フレームバッファの作成
	this._frame_buffer = this._gl.createFramebuffer();

	// フレームバッファをバインド
	this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._frame_buffer);
    
	// レンダーテクスチャの作成
	this._render_texture = this._gl.createTexture();

	// レンダーテクスチャをバインド
	this._gl.bindTexture(this._gl.TEXTURE_2D, this._render_texture);

	// レンダーテクスチャの設定
	this._gl.texImage2D(
		this._gl.TEXTURE_2D, 
		0, 
		this._gl.RGBA, 
		w, 
		h, 
		0, 
		this._gl.RGBA, 
		(true == float_texture) ? this._gl.FLOAT : this._gl.UNSIGNED_BYTE, 
		null
		);

	// テクスチャパラメーター（とりあえずの初期値）をセット
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);	// 浮動小数点数テクスチャでLINEARを使いたい場合、対応しているか確認する必要がある
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);	// 
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

	// フレームバッファにレンダーテクスチャを関連付ける
	this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._render_texture, 0);

	// 深度バッファの作成
	this._depth_buffer = this._gl.createRenderbuffer();

	// 深度バッファをバインド
	this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._depth_buffer);

	// 深度バッファの設定
	this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, w, h);

	// フレームバッファに深度バッファを関連付ける
	this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this._depth_buffer);

	// バインドを解除
	this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
	this._gl.bindTexture(this._gl.TEXTURE_2D, null);
	this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
}
yrGLFrameBuffer.prototype.release = function()
{
	if(this._frame_buffer)		this._gl.deleteFramebuffer(this._frame_buffer);
	if(this._render_texture)	this._gl.deleteTexture(this._render_texture);
	if(this._depth_buffer)		this._gl.deleteRenderbuffer(this._depth_buffer);
}

// テクスチャパラメーターのセット
yrGLFrameBuffer.prototype.setTextureParameters = function(mag, min, wrap_s, wrap_t)
{
	// レンダーテクスチャをバインド
	this._gl.bindTexture(this._gl.TEXTURE_2D, this._render_texture);

	// テクスチャパラメーターをセット
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, mag);	// 浮動小数点数テクスチャでLINEARを使いたい場合、対応しているか確認する必要がある
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, min);	// 
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrap_s);
	this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrap_t);

	// バインドを解除
	this._gl.bindTexture(this._gl.TEXTURE_2D, null);
}

// 有効化
yrGLFrameBuffer.prototype.enable = function()
{
	this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._frame_buffer);
}

// 無効化
yrGLFrameBuffer.prototype.disable = function()
{
	this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
}


// -------------------------------------------------------------------------------------------
// WebGLラッパー
function yrGL(canvas_id)
{
	// canvasエレメント
	this._canvas = document.getElementById(canvas_id);

	// WebGLコンテキスト
	this._gl = this._canvas.getContext("webgl") || this._canvas.getContext("experimental-webgl");
	if(!this._gl)
	{
		// 失敗
		yrUtil.message("何らかの理由でWebGLを使用することができません。\n他のブラウザをお試しください。", true);
	}

	// 浮動小数点数テクスチャ使えるか？
	__ext_OES_texture_float__ = this._gl.getExtension("OES_texture_float");

	// フラグメントシェーダーから深度値を出力できるか？
	__ext_EXT_frag_depth__ = this._gl.getExtension("EXT_frag_depth");

	// MRT使えるか？
	__ext_WEBGL_draw_buffers__ = this._gl.getExtension("WEBGL_draw_buffers");
	if(__ext_WEBGL_draw_buffers__)
	{
    	__MAX_COLOR_ATTACHMENTS_WEBGL__ = this._gl.getParameter(__ext_WEBGL_draw_buffers__.MAX_COLOR_ATTACHMENTS_WEBGL);
    	__MAX_DRAW_BUFFERS_WEBGL__ = this._gl.getParameter(__ext_WEBGL_draw_buffers__.MAX_DRAW_BUFFERS_WEBGL);
	}

	// VTF使えるか？（0 or 1以上）
	__MAX_VERTEX_TEXTURE_IMAGE_UNITS__ = this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
}

// レンダラーのインスタンスを生成する
yrGL.prototype.createRenderer = function()
{
	return new yrGLRenderer(this._gl);
}

// マテリアルのインスタンスを生成する
yrGL.prototype.createMaterial = function(vs_str, fs_str)
{
	return new yrGLMaterial(this._gl, vs_str, fs_str);
}

// ジオメトリのインスタンスを生成する
yrGL.prototype.createGeometry = function(vertex, index, mode)
{
	return new yrGLGeometry(this._gl, vertex, index, mode);
}

// ジオメトリのインスタンスを生成する（正方形）
yrGL.prototype.createGeometrySquare = function(scale, create_uv0, create_normal)
{
	var vertex = 
	[
		-1.0,  1.0,  0.0, 
		 1.0,  1.0,  0.0, 
		 1.0, -1.0,  0.0, 
		-1.0, -1.0,  0.0
	];
	var index = 
	[
		0, 3, 1, 2
	];
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	var o = new yrGLGeometry(this._gl, vertex, index, this._gl.TRIANGLE_STRIP);

	if(create_uv0)
	{
		var uv0 = 
		[
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0
		];
		o.addUV0(uv0);
	}

	if(create_normal)
	{
		var normal = 
		[
			0.0, 0.0, 1.0, 
			0.0, 0.0, 1.0, 
			0.0, 0.0, 1.0, 
			0.0, 0.0, 1.0
		];
		o.addNormal(normal);
	}

	return o;
}

// ジオメトリのインスタンスを生成する（ワイヤー表示用の正方形）
yrGL.prototype.createGeometryWiredSquare = function(scale)
{
	var vertex = 
	[
		-1.0,  1.0,  0.0, 
		 1.0,  1.0,  0.0, 
		 1.0, -1.0,  0.0, 
		-1.0, -1.0,  0.0
	];
	var index = 
	[
		0, 1, 2, 3, 0
	];
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	return new yrGLGeometry(this._gl, vertex, index, this._gl.LINE_STRIP);
}

// ジオメトリのインスタンスを生成する（立方体）
yrGL.prototype.createGeometryCube = function(scale, create_uv0, create_normal)
{
	var vertex = 
	[
		-1.0,  1.0,  1.0, 	// 手前
		 1.0,  1.0,  1.0, 	// 
		 1.0, -1.0,  1.0, 	// 
		-1.0, -1.0,  1.0, 	// 
		 1.0,  1.0,  1.0, 	// 右
		 1.0,  1.0, -1.0, 	// 
		 1.0, -1.0, -1.0, 	// 
		 1.0, -1.0,  1.0, 	// 
		 1.0,  1.0, -1.0, 	// 奥
		-1.0,  1.0, -1.0, 	// 
		-1.0, -1.0, -1.0, 	// 
		 1.0, -1.0, -1.0, 	// 
		-1.0,  1.0, -1.0, 	// 左
		-1.0,  1.0,  1.0, 	// 
		-1.0, -1.0,  1.0, 	// 
		-1.0, -1.0, -1.0, 	// 
		-1.0,  1.0, -1.0, 	// 上
		 1.0,  1.0, -1.0, 	// 
		 1.0,  1.0,  1.0, 	// 
		-1.0,  1.0,  1.0, 	// 
		 1.0, -1.0, -1.0, 	// 下
		-1.0, -1.0, -1.0, 	// 
		-1.0, -1.0,  1.0, 	// 
		 1.0, -1.0,  1.0	// 
	];
	var index = 
	[
		 0,  2,  1,  0,  3,  2, 
		 4,  6,  5,  4,  7,  6, 
		 8, 10,  9,  8, 11, 10, 
		12, 14, 13, 12, 15, 14, 
		16, 18, 17, 16, 19, 18, 
		20, 22, 21, 20, 23, 22
	];
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	var o = new yrGLGeometry(this._gl, vertex, index, this._gl.TRIANGLES);

	if(create_uv0)
	{
		var uv0 = 
		[
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0, 
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0, 
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0, 
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0, 
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0, 
			0.0, 0.0, 
			1.0, 0.0, 
			1.0, 1.0, 
			0.0, 1.0
		];
		o.addUV0(uv0);
	}

	if(create_normal)
	{
		var normal = 
		[
			 0.0,  0.0,  1.0, 
			 0.0,  0.0,  1.0, 
			 0.0,  0.0,  1.0, 
			 0.0,  0.0,  1.0, 
			 1.0,  0.0,  0.0, 
			 1.0,  0.0,  0.0, 
			 1.0,  0.0,  0.0, 
			 1.0,  0.0,  0.0, 
			 0.0,  0.0, -1.0, 
			 0.0,  0.0, -1.0, 
			 0.0,  0.0, -1.0, 
			 0.0,  0.0, -1.0, 
			-1.0,  0.0,  0.0, 
			-1.0,  0.0,  0.0, 
			-1.0,  0.0,  0.0, 
			-1.0,  0.0,  0.0, 
			 0.0,  1.0,  0.0, 
			 0.0,  1.0,  0.0, 
			 0.0,  1.0,  0.0, 
			 0.0,  1.0,  0.0, 
			 0.0, -1.0,  0.0, 
			 0.0, -1.0,  0.0, 
			 0.0, -1.0,  0.0, 
			 0.0, -1.0,  0.0
		];
		o.addNormal(normal);
	}

	return o;
}

// ジオメトリのインスタンスを生成する（ワイヤー表示用の立方体）
yrGL.prototype.createGeometryWiredCube = function(scale)
{
	var vertex = 
	[
		-1.0,  1.0,  1.0, 
		 1.0,  1.0,  1.0, 
		 1.0, -1.0,  1.0, 
		-1.0, -1.0,  1.0, 
		-1.0,  1.0, -1.0, 
		 1.0,  1.0, -1.0, 
		 1.0, -1.0, -1.0, 
		-1.0, -1.0, -1.0
	];
	var index = 
	[
		0, 1, 1, 2, 2, 3, 3, 0, 
		4, 5, 5, 6, 6, 7, 7, 4, 
		0, 4, 1, 5, 2, 6, 3, 7
	];
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	return new yrGLGeometry(this._gl, vertex, index, this._gl.LINES);
}

// ジオメトリのインスタンスを生成する（球）
yrGL.prototype.createGeometrySphere = function(scale, div, create_uv0, create_normal)
{
	var vertex = [];
	var normal = [];
	for(var y = 0; y < div + 1; y++)
	{
		for(var x = 0; x < div + 1; x++)
		{
			var y_ = Math.cos(y / div * Math.PI);
			var xz_ = Math.sin(y / div * Math.PI);
			var r = -(Math.PI * 0.5) - (x / div * Math.PI * 2.0);
			var x_ = xz_ * Math.cos(r);
			var z_ = xz_ * Math.sin(r);
			vertex.push(x_);
			vertex.push(y_);
			vertex.push(z_);
			if(create_normal)
			{
				normal.push(x_);
				normal.push(y_);
				normal.push(z_);
			}
		}
	}
	var index = [];
	for(var y = 0; y < div; y++)
	{
		for(var x = 0; x < div; x++)
		{
			index.push(y * (div + 1) + x);
			index.push((y + 1) * (div + 1) + x + 1);
			index.push(y * (div + 1) + x + 1);
			index.push(y * (div + 1) + x);
			index.push((y + 1) * (div + 1) + x);
			index.push((y + 1) * (div + 1) + x + 1);
		}
	}
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	var o = new yrGLGeometry(this._gl, vertex, index, this._gl.TRIANGLES);

	if(create_uv0)
	{
		var uv0 = [];
		for(var y = 0; y < div + 1; y++)
		{
			for(var x = 0; x < div + 1; x++)
			{
				uv0.push(x / (div + 1));
				uv0.push(y / (div + 1));
			}
		}
		o.addUV0(uv0);
	}

	if(create_normal)
	{
		o.addNormal(normal);
	}

	return o;
}

// ジオメトリのインスタンスを生成する（ワイヤー表示用の球）
yrGL.prototype.createGeometryWiredSphere = function(scale, div)
{
	var vertex = [];
	for(var y = 0; y < div + 1; y++)
	{
		for(var x = 0; x < div + 1; x++)
		{
			var y_ = Math.cos(y / div * Math.PI);
			var xz_ = Math.sin(y / div * Math.PI);
			var r = -(Math.PI * 0.5) - (x / div * Math.PI * 2.0);
			var x_ = xz_ * Math.cos(r);
			var z_ = xz_ * Math.sin(r);
			vertex.push(x_);
			vertex.push(y_);
			vertex.push(z_);
		}
	}
	var index = [];
	for(var y = 1; y < div; y++)
	{
		for(var x = 0; x < div; x++)
		{
			index.push(y * (div + 1) + x);
			index.push(y * (div + 1) + x + 1);
		}
	}
	for(var x = 0; x < div; x++)
	{
		for(var y = 0; y < div; y++)
		{
			index.push(y * (div + 1) + x);
			index.push((y + 1) * (div + 1) + x);
		}
	}
	for(var i in vertex)
	{
		vertex[i] *= scale;
	}
	return new yrGLGeometry(this._gl, vertex, index, this._gl.LINES);
}

// テクスチャのインスタンスを生成する
yrGL.prototype.createTexture = function(src)
{
	return new yrGLTexture(this._gl, src);
}

// フレームバッファのインスタンスを生成する
yrGL.prototype.createFrameBuffer = function(w, h, float_texture)
{
	return new yrGLFrameBuffer(this._gl, w, h, float_texture);
}

// デバッグ表示
yrGL.prototype.debug = function(debug, description)
{
	if(document.getElementById(debug))
	{
		/* 細かいことだが、連結の繰り替えしはメモリに優しくないかもしれない */

		var str = "";
		str += "<pre>";
		if(description)
		{
			str += "-- Description ---------------------------------------------------------\n";
			str += " CULL_FACE_MODE       : " + "FRONT                    [" + this._gl.FRONT + "]" + "\n";
			str += "                      : " + "BACK                     [" + this._gl.BACK + "]" + "\n";
			str += "                      : " + "FRONT_AND_BACK           [" + this._gl.FRONT_AND_BACK + "]" + "\n";
			str += "\n";
			str += " FRONT_FACE           : " + "CW                       [" + this._gl.CW + "]" + "\n";
			str += "                      : " + "CCW                      [" + this._gl.CCW + "]" + "\n";
			str += "\n";
			str += " DEPTH_FUNC           : " + "NEVER                    [" + this._gl.NEVER + "]" + "\n";
			str += "                      : " + "LESS                     [" + this._gl.LESS + "]" + "\n";
			str += "                      : " + "EQUAL                    [" + this._gl.EQUAL + "]" + "\n";
			str += "                      : " + "LEQUAL                   [" + this._gl.LEQUAL + "]" + "\n";
			str += "                      : " + "GREATER                  [" + this._gl.GREATER + "]" + "\n";
			str += "                      : " + "NOTEQUAL                 [" + this._gl.NOTEQUAL + "]" + "\n";
			str += "                      : " + "GEQUAL                   [" + this._gl.GEQUAL + "]" + "\n";
			str += "                      : " + "ALWAYS                   [" + this._gl.ALWAYS + "]" + "\n";
			str += "\n";
			str += " BLEND_EQUATION       : " + "FUNC_ADD                 [" + this._gl.FUNC_ADD + "]" + "\n";
			str += "                      : " + "FUNC_SUBTRACT            [" + this._gl.FUNC_SUBTRACT + "]" + "\n";
			str += "                      : " + "FUNC_REVERSE_SUBTRACT    [" + this._gl.FUNC_REVERSE_SUBTRACT + "]" + "\n";
			str += "\n";
			str += " BLEND_FUNC           : " + "ZERO                     [" + this._gl.ZERO + "]" + "\n";
			str += "                      : " + "ONE                      [" + this._gl.ONE + "]" + "\n";
			str += "                      : " + "SRC_COLOR                [" + this._gl.SRC_COLOR + "]" + "\n";
			str += "                      : " + "ONE_MINUS_SRC_COLOR      [" + this._gl.ONE_MINUS_SRC_COLOR + "]" + "\n";
			str += "                      : " + "DST_COLOR                [" + this._gl.DST_COLOR + "]" + "\n";
			str += "                      : " + "ONE_MINUS_DST_COLOR      [" + this._gl.ONE_MINUS_DST_COLOR + "]" + "\n";
			str += "                      : " + "SRC_ALPHA                [" + this._gl.SRC_ALPHA + "]" + "\n";
			str += "                      : " + "ONE_MINUS_SRC_ALPHA      [" + this._gl.ONE_MINUS_SRC_ALPHA + "]" + "\n";
			str += "                      : " + "DST_ALPHA                [" + this._gl.DST_ALPHA + "]" + "\n";
			str += "                      : " + "ONE_MINUS_DST_ALPHA      [" + this._gl.ONE_MINUS_DST_ALPHA + "]" + "\n";
			str += "                      : " + "CONSTANT_COLOR           [" + this._gl.CONSTANT_COLOR + "]" + "\n";
			str += "                      : " + "ONE_MINUS_CONSTANT_COLOR [" + this._gl.ONE_MINUS_CONSTANT_COLOR + "]" + "\n";
			str += "                      : " + "CONSTANT_ALPHA           [" + this._gl.CONSTANT_ALPHA + "]" + "\n";
			str += "                      : " + "ONE_MINUS_CONSTANT_ALPHA [" + this._gl.ONE_MINUS_CONSTANT_ALPHA + "]" + "\n";
			str += "                      : " + "SRC_ALPHA_SATURATE       [" + this._gl.SRC_ALPHA_SATURATE + "]" + "\n";
			str += "\n";
		}
		str += "-- Information ---------------------------------------------------------\n";
		str += " version              : " + this._gl.getParameter(this._gl.VERSION) + "\n";
		str += " shading lang version : " + this._gl.getParameter(this._gl.SHADING_LANGUAGE_VERSION) + "\n";
		str += " vender               : " + this._gl.getParameter(this._gl.VENDOR) + "\n";
		str += "\n";
		str += " cull face            : " + this._gl.getParameter(this._gl.CULL_FACE) + "\n";
		str += " cull face mode       : " + this._gl.getParameter(this._gl.CULL_FACE_MODE) + "\n";
		str += " cull front face      : " + this._gl.getParameter(this._gl.FRONT_FACE) + "\n";
		str += "\n";
		str += " depth test           : " + this._gl.getParameter(this._gl.DEPTH_TEST) + "\n";
		str += " depth func           : " + this._gl.getParameter(this._gl.DEPTH_FUNC) + "\n";
		str += " depth writemask      : " + this._gl.getParameter(this._gl.DEPTH_WRITEMASK) + "\n";
		str += " depth range          : " + this._gl.getParameter(this._gl.DEPTH_RANGE) + "\n";
		str += "\n";
		str += " blend                : " + this._gl.getParameter(this._gl.BLEND) + "\n";
		str += " blend equation rgb   : " + this._gl.getParameter(this._gl.BLEND_EQUATION_RGB) + "\n";
		str += " blend equation alpha : " + this._gl.getParameter(this._gl.BLEND_EQUATION_ALPHA) + "\n";
		str += " blend src rgb        : " + this._gl.getParameter(this._gl.BLEND_SRC_RGB) + "\n";
		str += " blend src alpha      : " + this._gl.getParameter(this._gl.BLEND_SRC_ALPHA) + "\n";
		str += " blend dst rgb        : " + this._gl.getParameter(this._gl.BLEND_DST_RGB) + "\n";
		str += " blend dst alpha      : " + this._gl.getParameter(this._gl.BLEND_DST_ALPHA) + "\n";
		str += " blend color          : " + this._gl.getParameter(this._gl.BLEND_COLOR) + "\n";
		str += "\n";
		str += " red bits             : " + this._gl.getParameter(this._gl.RED_BITS) + "\n";
		str += " green bits           : " + this._gl.getParameter(this._gl.GREEN_BITS) + "\n";
		str += " blue bits            : " + this._gl.getParameter(this._gl.BLUE_BITS) + "\n";
		str += " alpha bits           : " + this._gl.getParameter(this._gl.ALPHA_BITS) + "\n";
		str += " depth bits           : " + this._gl.getParameter(this._gl.DEPTH_BITS) + "\n";
		str += "\n";
		str += " viewport             : " + this._gl.getParameter(this._gl.VIEWPORT) + "\n";
		str += "\n";
		str += " _float_texture_      : " + __ext_OES_texture_float__ + "\n";
		str += " _frag_depth_         : " + __ext_EXT_frag_depth__ + "\n";
		str += " _mrt_                : " + __ext_WEBGL_draw_buffers__ + "\n";
		str += " _mrt_max_color_att   : " + __MAX_COLOR_ATTACHMENTS_WEBGL__ + "\n";
		str += " _mrt_max_sraw_buf    : " + __MAX_DRAW_BUFFERS_WEBGL__ + "\n";
		str += " _vtf_                : " + __MAX_VERTEX_TEXTURE_IMAGE_UNITS__ + "\n";
		str += "\n";
		str += "-- Supported Extensions ------------------------------------------------\n";
		var supported_extensions = this._gl.getSupportedExtensions();
		for(var i = 0; i < supported_extensions.length; i++)
		{
			str += " " + supported_extensions[i] + "\n";
		}
		str += "\n";
		str += "------------------------------------------------------------------------\n";
		str += "</pre>";

		document.getElementById(debug).innerHTML += str;
	}
}

