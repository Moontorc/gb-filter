// ------------------------------------------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------
// グローバルな変数
var enable = false;			// GBフィルター有効化
var hi_tone = 0.0;			// 疑似高階調化
var grid = 0.0;				// ドット格子
var curve = 0.0;			// 色のサンプリングカーブ値
var filter_color_r = 0.0;	// フィルターカラー
var filter_color_g = 0.0;	// 
var filter_color_b = 0.0;	// 


// -------------------------------------------------------------------------------------------
// ページ読み込み完了イベント
onload = function()
{
	// GL関係のインスタンスを生成
	var gl = new yrGL("canvas_main");
	var renderer = gl.createRenderer();										// レンダラ―
	var material_imaged = gl.createMaterial(vs_imaged, fs_imaged);			// マテリアル
	var material_gbfilter = gl.createMaterial(vs_gbfilter, fs_gbfilter);	// 
	var geometry_square = gl.createGeometrySquare(1.0, true, false);		// ジオメトリ
	var texture = gl.createTexture("gb.jpg");								// テクスチャ

	// タイマー
	var timer = new yrTimer();

	// 外部から画像を読み込む
	{
		// 画像ファイル入力のハンドラを設定
		var file_input = document.getElementById("input_image");
		file_input.onchange = function(e)
		{
			var files = e.target.files;
			load_image(files);
		}

		// 画像ファイルドロップのハンドラを設定
		gl._canvas.ondragover = function(e)
		{
			e.preventDefault();
		}
		gl._canvas.ondrop = function(e)
		{
			e.preventDefault();
			var files = e.dataTransfer.files;
			load_image(files);
		}

		// 画像読み込み
		function load_image(files)
		{
			var image_files = [];
			for(var i = 0; i < files.length; i++)
			{
				if(files[i].type.match("image.*"))
				{
					image_files.push(files[i]);
				}
			}
			if(image_files.length > 0)
			{
				// ファイルの読み取り開始
				var reader = new FileReader();
				reader.onload = function(e)
				{
					texture.release();
					texture = gl.createTexture(e.target.result);
				}
				reader.readAsDataURL(image_files[0]);	// とりあえず最初の一個が処理されます
			}
		}
	}

	// メインループ
	main_loop();


	// -------------------------------------------------------------------------------------------
	// メインループ
	function main_loop()
	{
		// テクスチャ読み込み待ち
		if(!texture._is_loaded)
		{
			requestAnimationFrame(main_loop);
			return;
		}

		// UIの更新
		enable = document.form_ui.enable.checked;
		hi_tone = document.form_ui.hi_tone.checked ? 1.0 : 0.0;
		grid = document.form_ui.grid.checked ? 1.0 : 0.0;
		curve = parseFloat(document.form_ui.curve.value) / 100.0;
		filter_color_r = parseFloat(document.form_ui.filter_color_r.value) / 100.0;
		filter_color_g = parseFloat(document.form_ui.filter_color_g.value) / 100.0;
		filter_color_b = parseFloat(document.form_ui.filter_color_b.value) / 100.0;

		// タイマー更新
		timer.update();

		// 描画
		{
			// カラーバッファとZバッファをクリアする
			renderer.clearBuffer();

			if(!enable)
			{
				// 加工しない
				material_imaged.SetUniformFloat32Array("u_wvp", mat4.create());
				material_imaged.SetUniformInt32Array("u_texture0", new Int32Array([0]));
				material_imaged.SetTextureArray([texture._texture]);
				renderer.renderGeometry(geometry_square, material_imaged);
			}
			else
			{
				// 加工する
				material_gbfilter.SetUniformFloat32Array("u_wvp", mat4.create());
				material_gbfilter.SetUniformInt32Array("u_texture0", new Int32Array([0]));
				material_gbfilter.SetUniformFloat32Array("u_resolution", new Float32Array([gl._canvas.width, gl._canvas.height]));
				material_gbfilter.SetUniformFloat32Array("u_hi_tone", new Float32Array([hi_tone]));
				material_gbfilter.SetUniformFloat32Array("u_grid", new Float32Array([grid]));
				material_gbfilter.SetUniformFloat32Array("u_curve", new Float32Array([curve]));
				material_gbfilter.SetUniformFloat32Array("u_filter_color", new Float32Array([filter_color_r, filter_color_g, filter_color_b]));
				material_gbfilter.SetTextureArray([texture._texture]);
				renderer.renderGeometry(geometry_square, material_gbfilter);
			}
		}

		// バッファリングされたWebGLコマンドをただちに実行する
		renderer.flush();

		requestAnimationFrame(main_loop);
	}
}

