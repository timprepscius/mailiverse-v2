package mv.db;

import mv.db.mongo.RecordDbMongo;

public class DbFactory
{
	public static RecordDb instantiateRecordDb ()
	{
		return new RecordDbMongo();
	}
}
