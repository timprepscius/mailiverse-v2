/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

public class LogNull
{
	LogOut out;
	
	public LogNull (Class<?> clazz)
	{
		out = new LogOut(clazz);
	}
	
	public LogNull(String string) {
		out = new LogOut(string);
	}

	public final void debug (Object...arguments)
	{
//		out.debug(arguments);
	}
	
	public final void debugPart (Object...arguments)
	{
//		out.debugPart(arguments);
	}
	
	public final void debugFlush ()
	{
//		out.debugFlush();
	}
	
	public final void error (Object...arguments)
	{
		out.println(arguments);
	}
	
	public final String format (String format, Object...args)
	{
		return out.format(format,  args);
	}
	
	public final void trace (Object...args)
	{
		
	}
	
	public void exception (Exception e)
	{
		out.exception(e);
	}

	public void println(String string) {
	}
}
