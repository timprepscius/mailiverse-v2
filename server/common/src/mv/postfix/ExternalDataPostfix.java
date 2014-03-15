package mv.postfix;

import java.sql.Connection;
import java.sql.PreparedStatement;
import mv.core.util.LogOut;
import mv.core.util.SqlDb;
import mv.db.ExternalData;
import mv.postfix.sql.Catalog;

public class ExternalDataPostfix extends SqlDb implements ExternalData 
{
	Catalog catalog;
	LogOut log = new LogOut (ExternalDataPostfix.class);
	
	public ExternalDataPostfix() 
	{
		super(new Catalog());
		catalog = (Catalog) super.catalog;
		// ensureTables();
	}

	public void ensureTables()
	{
		Connection connection = openConnection();
		try
		{
			for (String sql : catalog.getMulti(catalog.CREATE_TABLES))
			{
				PreparedStatement statement = connection.prepareStatement (sql);
				log(statement);
				statement.executeUpdate();
			}
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
		finally
		{
			closeConnection(connection);
		}
	}
	
	@Override
	public void addUser(String name, String password) 
	{
		Connection connection = openConnection();

		try
		{
			PreparedStatement statement = connection.prepareStatement (catalog.getSingle(catalog.ADD_USER));
			statement.setString(1, name);
			statement.setString(2, password);
			
			statement.executeUpdate();
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
		finally
		{
			closeConnection(connection);
		}
	}
	
	@Override
	public void removeUser (String name)
	{
		Connection connection = openConnection();

		try
		{
			PreparedStatement statement = connection.prepareStatement (catalog.getSingle(catalog.REMOVE_USER));
			statement.setString(1, name);
			
			statement.executeUpdate();
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
		finally
		{
			closeConnection(connection);
		}
		
	}

	@Override
	public void setUserPassword(String name, String password)
	{
		Connection connection = openConnection();

		try
		{
			PreparedStatement statement = connection.prepareStatement (catalog.getSingle(catalog.CHANGE_PASSWORD));
			statement.setString(1, password);
			statement.setString(2, name);
			
			statement.executeUpdate();
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
		finally
		{
			closeConnection(connection);
		}
	}
	
}
