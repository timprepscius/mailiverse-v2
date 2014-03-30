
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

var Base16 = {
	_key : "0123456789ABCDEF",
	_encode : null,
	_decode : null,

	initialize: function()
	{
		if (this._decode != null)
			return;
		
		this._decode = new Uint8Array(0xFF);
		for (var i=0; i<this._key.length; ++i)
			this._decode[this._key.charCodeAt(i)] = i;
		
		this._encode = new Uint8Array(this._key.length);
		for (var i=0; i<this._key.length; ++i)
			this._encode[i] = this._key.charCodeAt(i) & 0xFF;
	},
	
	decode: function(input) 
	{
		var bytes = new Uint8Array(input.length);
		
		var i;
		for (i=0; i<input.length; ++i)
			bytes[i] = input.charCodeAt(i) & 0xFF;
		
		return Base16.decodeBytes(bytes);
	},
	
	decodeBytes: function(input)
	{
		this.initialize();
		
		var j=0, i = 0;
		var enc1, enc2;
		var out = [];
		
		while (j < input.length) 
		{	
			enc1 = this._decode[input[j++]];
			enc2 = this._decode[input[j++]];
	
			chr1 = (enc1 << 4) | (enc2);
	
			out[i++] = chr1 & 0xFF;
		}
	
		return out;	
	},

	encodeBytes : function(input)
	{
		this.initialize();

		var length = input.length;
	    var output = [];
	    
	    var i = 0;
	    var chr1, enc1, enc2;
	    
	    var j=0;
	    while (i < length) 
	    {
		    chr1 = input[i++] & 0xFF;

	        enc1 = chr1 >> 4;
	        enc2 = chr1 & 0xF;

	        output[j++] = this._encode[enc1];
	        output[j++] = this._encode[enc2];
	    }
	    
	    return output;
	},
	
	encode: function(input)
	{
		var bytes = this.encodeBytes(input);
		var s = "";
		
		for (var i=0; i<bytes.length; ++i)
			s += String.fromCharCode(bytes[i]);
		
		return s;
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