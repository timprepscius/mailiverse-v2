/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

public class Base64
{
	public static String encode(byte[] bytes)
	{
		return Strings.toString(org.bouncycastle.util.encoders.Base64.encode(bytes));
	}
	
	public static byte[] decode(String b64)
	{
		return org.bouncycastle.util.encoders.Base64.decode(Strings.toBytes(b64));
	}

	public static byte[] encodeBytes(byte[] bytes)
	{
		return org.bouncycastle.util.encoders.Base64.encode(bytes);
	}

	public static byte[] decodeBytes(byte[] b64)
	{
		return org.bouncycastle.util.encoders.Base64.decode(b64);
	}
}
