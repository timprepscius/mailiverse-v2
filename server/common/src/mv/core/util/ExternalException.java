package mv.core.util;

public class ExternalException extends RuntimeException 
{
	public ExternalException(Exception e) 
	{
		super(e);
	}

	public ExternalException(String e) 
	{
		super(e);
	}
}
