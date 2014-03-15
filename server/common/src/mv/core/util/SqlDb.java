package mv.core.util;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import mv.core.util.LogOut;



public class SqlDb 
{
	protected SqlCatalog catalog;
	protected LogOut log = new LogOut(SqlDb.class);
	
	public SqlDb (SqlCatalog catalog)
	{
		try
		{
			Class.forName("com.mysql.jdbc.Driver");
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}

		this.catalog = catalog;
	}
	
	public Connection openConnection () throws RuntimeException
	{
		try
		{
			log.debug("Connecting to", catalog.CONNECTION_STRING);
			return DriverManager.getConnection(catalog.CONNECTION_STRING, catalog.USER, catalog.PASSWORD);		
		}
		catch (Exception e)
		{
			e.printStackTrace();
			throw new RuntimeException(e);
		}
	}
	
	public void closeConnection (Connection connection)
	{
		try
		{
			if (connection != null)
				connection.close();
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
	}
	
	public void log (Statement sql)
	{
		log.debug (sql);
	}
}
