package mv.core.util;

import java.io.IOException;
import java.util.ArrayList;

public class SqlCatalog
{
	public String CONNECTION_STRING = null;
	public String USER = null, PASSWORD = null;
	
	public String getSingle (String name) throws IOException 
	{
		return Streams.readFullyString(getClass().getResourceAsStream(name), "UTF-8");
	}
	
	public String[] getMulti (String name) throws IOException
	{
		String[] sqls = getSingle(name).split(";");
		ArrayList<String> valid = new ArrayList<String>();
		for (String sql : sqls)
			if (!sql.trim().isEmpty())
				valid.add(sql);
		
		return valid.toArray(new String[0]);
	}	

}
