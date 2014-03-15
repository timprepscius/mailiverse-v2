package mv.core.util;


public class DbCloser 
{
	static LogNull log = new LogNull(DbCloser.class);
	
	public static void close(DbClosable closable)
	{
		try
		{
			if (closable != null)
			{
				log.debug("closing", closable);
				closable.close();
			}
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}
}
