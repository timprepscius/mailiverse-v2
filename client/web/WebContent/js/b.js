
/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 * 
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

var Base64 = {
	decode: function(input) 
	{
		return window.sjcl.codec.base64.toBits(input);
	},
	
	encode : function(input)
	{
		return window.sjcl.codec.base64.fromBits(input);
	},
	
	bytesToBuffer: function (bytes)
	{
		var buf = new Uint8Array(bytes.length);
		for (var i=0; i<bytes.length; ++i)
		{
			buf[i] = bytes[i];
		}
		
		return buf;
	}
} ;

/** end **/