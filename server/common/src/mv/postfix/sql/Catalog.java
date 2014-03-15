/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.postfix.sql;

import java.io.IOException;

import mv.core.util.SqlCatalog;


public final class Catalog extends SqlCatalog
{
	public int FAILURE_TIMEOUT_SECONDS = 60;
	
	public final String 
		CREATE_TABLES = "create_tables.sql",
		ADD_USER = "add_user.sql",
		REMOVE_USER = "remove_user.sql",
		CHANGE_PASSWORD = "change_password.sql";

	public Catalog ()
	{
		CONNECTION_STRING = "jdbc:mysql://localhost/postfix";
		USER = "postfix";
		PASSWORD = "postfix";
	}
}
