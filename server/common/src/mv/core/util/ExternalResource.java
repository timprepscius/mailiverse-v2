/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

import java.io.FileInputStream;
import java.io.InputStream;

public class ExternalResource
{
	static LogNull log = new LogNull(ExternalResource.class);
	
	static protected String prefix;
	
	static {
		prefix = System.getProperty("user.home") + "/resources/";
	}
	
	public static byte[] get(String key) throws Exception
	{
		String path = prefix + key;
		log.debug("get", path);
		return Streams.readFullyBytes(new FileInputStream(path));
	}

	public static InputStream getResourceAsStream(Class<?> c, String key) throws Exception
	{
		String path = prefix + c.getPackage().getName() + "/" + key;
		log.debug("getResourceAsStream", path);
		return new FileInputStream(path);
	}

	public static String getTrimmedString(String key) throws Exception
	{
		return Strings.toString(get(key)).trim();
	}

	public static String getTrimmedString(String key, String defaultValue) throws Exception
	{
		try
		{
			return Strings.toString(get(key)).trim();
		}
		catch (Exception e)
		{
			return defaultValue;
		}
	}

}
