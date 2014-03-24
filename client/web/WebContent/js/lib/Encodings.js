define([], function() {
	
	// =?UTF-8?B?RGFuacOrbCBCb3MgKOi/nOa0iyk=?=
	
	EncodersInline = {
			is : function (str) {
				return str && str.indexOf('=?')!=-1;
			},
			
			decode: function (str) {
				//              UTF         B         BLOCK
				var re0 = /=\?([\S]*?)\?([\S]*?)\?([\S]*?)\?=/gm;
				var decoded = str.replace(re0, function(m0, charset, encoder, block) {
					if (encoder == 'Q')
						return EncoderQp.decode(block);
					else
					if (encoder == 'B')
						return EncoderB64.decode(block);
					
					return m0;
				});
				
				return decoded;
			},
			
			encode: function (str) {
				return '=?UTF-8?Q?'+ EncoderQp.encode(str) + '=?=';
			},
		};
	
	Encoders = {
		decode: function(str, contentEncoding) {
			if (contentEncoding.toLowerCase().startsWith('quoted-printable'))
				return EncoderQp.decode(str);

			if (contentEncoding.toLowerCase().startsWith('base64'))
				return EncoderB64.decode(str);
			
			return str;
		},
		encode: function(str, contentEncoding) {
			if (contentEncoding.toLowerCase().startsWith('quoted-printable'))
				return EncoderQp.encode(str);

			if (contentEncoding.toLowerCase().startsWith('base64'))
				return EncoderB64.encode(str);
			
			return str;
		},
	};
	
	EncoderB64 = {
		decode: function(str)
		{
			return Utf.toString(Base64.decode(str));
		},
		
		encode: function(str)
		{
			return Base64.encode(Utf.toBytes(str));
		},
	};
	
	EncoderQp = {
		is : function (str) {
			return str && str.indexOf('=?') >= 0;
		},
		decode : function(str) {
		  // From: http://phpjs.org/functions
		  // +   original by: Ole Vrijenhoek
		  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
		  // +   reimplemented by: Theriault
		  // +   improved by: Brett Zamir (http://brett-zamir.me)
		  // +   bugfixed by: Theriault
		  // *     example 1: quoted_printable_decode('a=3Db=3Dc');
		  // *     returns 1: 'a=b=c'
		  // *     example 2: quoted_printable_decode('abc  =20\r\n123  =20\r\n');
		  // *     returns 2: 'abc   \r\n123   \r\n'
		  // *     example 3: quoted_printable_decode('012345678901234567890123456789012345678901234567890123456789012345678901234=\r\n56789');
		  // *     returns 3: '01234567890123456789012345678901234567890123456789012345678901234567890123456789'
		  // *     example 4: quoted_printable_decode("Lorem ipsum dolor sit amet=23, consectetur adipisicing elit");
		  // *     returns 4: 'Lorem ipsum dolor sit amet#, consectetur adipisicing elit'
		  // Removes softline breaks
		  var
		  	TJP_NoSlashR_IsMessingThingsUp = /\r/gm,
		  	RFC2045Decode1 = /=\n/gm,
		    // Decodes all equal signs followed by two hex digits
		    RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
		    // the RFC states against decoding lower case encodings, but following apparent PHP behavior
		    // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
		    RFC2045Decode2OUT = function (sMatch, sHex) {
		      return String.fromCharCode(parseInt(sHex, 16));
		    },
		    TJP_PutSlashRBack = /\n/gm;
		    
		  return str
	  		.replace(TJP_NoSlashR_IsMessingThingsUp, '')
	  		.replace(RFC2045Decode1, '')
	  		.replace(RFC2045Decode2IN, RFC2045Decode2OUT)
	  		.replace(TJP_PutSlashRBack, '\r\n');
		},
		encode : function(str) {
		  //  discuss at: http://phpjs.org/functions/quoted_printable_encode/
		  // original by: Theriault
		  // improved by: Brett Zamir (http://brett-zamir.me)
		  // improved by: Theriault
		  //   example 1: quoted_printable_encode('a=b=c');
		  //   returns 1: 'a=3Db=3Dc'
		  //   example 2: quoted_printable_encode('abc   \r\n123   \r\n');
		  //   returns 2: 'abc  =20\r\n123  =20\r\n'
		  //   example 3: quoted_printable_encode('0123456789012345678901234567890123456789012345678901234567890123456789012345');
		  //   returns 3: '012345678901234567890123456789012345678901234567890123456789012345678901234=\r\n5'

		  var hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
		    RFC2045Encode1IN = / \r\n|\r\n|[^!-<>-~ ]/gm,
		    RFC2045Encode1OUT = function(sMatch) {
		      // Encode space before CRLF sequence to prevent spaces from being stripped
		      // Keep hard line breaks intact; CRLF sequences
		      if (sMatch.length > 1) {
		        return sMatch.replace(' ', '=20');
		      }
		      // Encode matching character
		      var chr = sMatch.charCodeAt(0);
		      return '=' + hexChars[((chr >>> 4) & 15)] + hexChars[(chr & 15)];
		    };
		  // Split lines to 75 characters; the reason it's 75 and not 76 is because softline breaks are preceeded by an equal sign; which would be the 76th character.
		  // However, if the last line/string was exactly 76 characters, then a softline would not be needed. PHP currently softbreaks anyway; so this function replicates PHP.
		  RFC2045Encode2IN = /.{1,72}(?!\r\n)[^=]{0,3}/g,
		  RFC2045Encode2OUT = function(sMatch) {
		    if (sMatch.substr(sMatch.length - 2) === '\r\n') {
		      return sMatch;
		    }
		    return sMatch + '=\r\n';
		  };
		  str = str.replace(RFC2045Encode1IN, RFC2045Encode1OUT)
		    .replace(RFC2045Encode2IN, RFC2045Encode2OUT);
		  // Strip last softline break
		  return str.substr(0, str.length - 3);
		},			
	};
});