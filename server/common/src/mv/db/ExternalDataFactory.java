package mv.db;

import mv.postfix.ExternalDataPostfix;

public class ExternalDataFactory {

	public static ExternalData createInstance ()
	{
		return new ExternalDataPostfix();
	}
}
