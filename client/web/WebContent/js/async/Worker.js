window = {};

importScripts(
	'../crypt/openpgp.js',
	'../crypt/Base64.js',
	'../crypt/Utf.js',
	"../crypt/sjcl.js",
	'../crypt/cryptojs-aes.js',

	"../crypt/zip/support.js",
	"../crypt/zip/inflate.js",
	"../crypt/zip/deflate.js",
	
	"../lib/underscore-min.js",
	
	'Support.js'
);

var MIN_SIZE_RANDOM_BUFFER = 40000;
var MAX_SIZE_RANDOM_BUFFER = 60000;

window.openpgp.crypto.random.randomBuffer.init(MAX_SIZE_RANDOM_BUFFER);
window.sjcl = sjcl;

self.onmessage = function(e) 
{
	if (!e.data)
		return ;
	
	var data = e.data;

	try
	{
		var result = Support[data.cmd].apply(null, data.args);
		self.postMessage({callback:data.callback, result:result, original:data});
	}
	catch (exception)
	{
		self.postMessage({callback:data.callback, exception:exception.toString(), original:data});
	}
};
