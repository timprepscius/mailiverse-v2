define([], function() {
	
	EncoderQpInline = {
		is : function (str) {
			return str && str.indexOf('=?') >= 0;
		},
		
		decode: function (str) {
			var decoded = str.replace(/=\?.*?\?=/g, function(part) {
				var i = part.indexOf('Q?');
				var j = part.lastIndexOf('?=');
				if (i)
					return EncoderQp.decode(part.substr(i+2, j-(i+2)));
				
				return EncoderQp.decode(part);
			});
			return decoded;
		},
		
		encode: function (str) {
			return EncoderQp.encode(str);
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
		  var RFC2045Decode1 = /=\r\n/gm,
		    // Decodes all equal signs followed by two hex digits
		    RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
		    // the RFC states against decoding lower case encodings, but following apparent PHP behavior
		    // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
		    RFC2045Decode2OUT = function (sMatch, sHex) {
		      return String.fromCharCode(parseInt(sHex, 16));
		    };
		  return str.replace(RFC2045Decode1, '').replace(RFC2045Decode2IN, RFC2045Decode2OUT);
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