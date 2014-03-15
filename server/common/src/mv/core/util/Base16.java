///////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2013 Timothy Prepscius
//
// This is a viewable source license.  No copying or modification or use is
// permitted.
//
// If you would like to participate in its development, or
// if you would like a different license, please contact the author.
///////////////////////////////////////////////////////////////////////////////

package mv.core.util;

public class Base16 
{
	static String decoder = "0123456789abcdef";
	static byte[] encoder = null;
	
	static void initialize ()
	{
		if (encoder != null)
			return;
		
		encoder = new byte[0xFF];
		for (int i=0; i<decoder.length(); ++i)
			encoder[decoder.charAt(i)] = (byte)i;
	}
	
	public static byte[] decode (String value)
	{
		initialize();
		
		byte[] bytes = new byte[value.length() / 2];
		
		int i=0, j=0;
		while (i<value.length())
		{
			int nibbleHi = (int)encoder[(int)value.charAt(i++)];
			int nibbleLo = (int)encoder[(int)value.charAt(i++)];
			
			bytes[j++] = (byte) ((nibbleHi << 4) | (nibbleLo));
		}
		
		return bytes;
	}

	public static String encode (byte[] bytes)
	{
		String result = "";
		
		int i=0;
		while (i<bytes.length)
		{
			int b = bytes[i++] & 0xFF;
			int nibbleLo = b & 0x0F;
			int nibbleHi = b >> 4;
		
			result += decoder.charAt(nibbleHi);
			result += decoder.charAt(nibbleLo);
		}
		
		return result;
	}
}
