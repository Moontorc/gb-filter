﻿// ------------------------------------------------------------------------------------------------
// ユーティリティー
// ------------------------------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------
// ごった煮
var yrUtil = 
{
	// ログ出力＆アラートウィンドウ
	message: function(str, wnd)
	{
		// ログ出力
		console.log(str);

		// アラートウィンドウ
		if(wnd)
		{
			alert(str)
		}
	}
}

