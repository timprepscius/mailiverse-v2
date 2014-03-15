package mv.core.util;


@SuppressWarnings("serial")
public
class DbException extends InternalException
{
	public DbException(String string) {
		super(string);
	}

	public DbException(Exception e) 
	{
		super(e);
	}
	
}

