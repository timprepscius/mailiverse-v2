package mv.mail;

import mv.core.util.ExternalException;

public class InvalidUserNames {
	
	public static void testIllegalUserName(String userName) throws RuntimeException
	{
		// http://www.ietf.org/rfc/rfc2142.txt
		final String[] illegalStartsWith = {
			"info",
			"marketing",
			"sales",
			"support",
			
			"abuse",
			"noc",
			"security",

			"postmaster",
			"hostmaster",
			"usenet",
			"news",
			"webmaster",
			"www",
			"uucp",
			"ftp",
			
			"admin",
			"system",
			"root",
			"test",
			"root",
			"hostma",
			"web",
			"post",
			"mail",
		};

		final String[] illegalParts = {
			"postmaster",
			"webmaster",
			"root",
			"admin",
			"system",
		};
		
		String username = userName.toLowerCase();
		for (String illegal : illegalParts)
		{
			if (username.indexOf(illegal) != -1)
				throw new ExternalException("Illegal username");
		}
		
		for (String illegal : illegalStartsWith)
		{
			if (username.startsWith(illegal))
				throw new ExternalException("Illegal username");
		}
	}

}
