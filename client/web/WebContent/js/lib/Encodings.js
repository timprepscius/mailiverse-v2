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
			if (!contentEncoding)
			{
				var numCharsNeedingEncoding = 0;
				_.each(str, function(c) {
					if (c.charCodeAt(0) >= (1 << 8))
						numCharsNeedingEncoding++;
				});
				
				if (numCharsNeedingEncoding > str.length/2)
				{
					contentEncoding = 'base64';
				}
				else
				if (numCharsNeedingEncoding > 0)
				{
					contentEncoding = 'quoted-printable';
				}
				else
				{
					contentEncoding = '7bit';
				}
			}
			
			var results = {};
			results.encoding = contentEncoding;
			
			if (contentEncoding.toLowerCase().startsWith('quoted-printable'))
				results.block = EncoderQp.encode(str);
			else
			if (contentEncoding.toLowerCase().startsWith('base64'))
				results.block = EncoderB64.encode(str);
			else
			if (contentEncoding.toLowerCase().startsWith('7bit'))
				results.block = str;
			else
			{
				alert('woah');
			}
			
			return results;
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
		  str = str.replace(/\r/gm, '');
			
		  var bytes = [];
		  for (var i=0; i<str.length; ++i)
		  {
			  if (str[i] == '=' && str[i+1]=='\n')
			  {
				  i+=1;
			  }
			  else
			  if (str[i] == '=')
			  {
				  bytes.push(parseInt(str[i+1] + str[i+2], 16));
				  i+=2;
			  }
			  else
			  {
				  bytes.push(str.charCodeAt(i));
			  }
		  }
		  
		  return Utf.toString(bytes);
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