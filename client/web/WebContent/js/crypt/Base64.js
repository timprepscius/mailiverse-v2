
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

/** @namespace Arrays of bytes */
SJCLBytes = {
  /** Convert from a bitArray to an array of bytes. */
  fromBits: function (arr) {
    var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
    for (i=0; i<bl/8; i++) {
      if ((i&3) === 0) {
        tmp = arr[i/4];
      }
      out.push(tmp >>> 24);
      tmp <<= 8;
    }
    return out;
  },
  /** Convert from an array of bytes to a bitArray. */
  toBits: function (bytes) {
    var out = [], i, tmp=0;
    for (i=0; i<bytes.length; i++) {
      tmp = tmp << 8 | bytes[i];
      if ((i&3) === 3) {
        out.push(tmp);
        tmp = 0;
      }
    }
    if (i&3) {
      out.push(sjcl.bitArray.partial(8*(i&3), tmp));
    }
    return out;
  }
};

var Base64 = {
	decode: function(input) 
	{
		return SJCLBytes.fromBits(window.sjcl.codec.base64.toBits(input));
	},
	
	encode : function(input)
	{
		return window.sjcl.codec.base64.fromBits(SJCLBytes.toBits(input));
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