package mv;

import java.io.UnsupportedEncodingException;

import mv.core.util.Base16;
import mv.core.util.Base64;

public class Test {

	public static void main (String[] args) throws UnsupportedEncodingException
	{
		String s = "RGFuacOrbCBCb3MgKOi/nOa0iyk=";
		byte[] b = Base64.decode(s);
		System.out.println(Base16.encode(b));
		
		String d = new String(b, "UTF-8");
		System.out.println(d);
		
		String v = javax.mail.internet.MimeUtility.decodeText("Dominik =?ISO-8859-1?Q?Sch=FCrmann?= <dominik@dominikschuermann.de>");
		System.out.println(v);
		
	}
	
}
