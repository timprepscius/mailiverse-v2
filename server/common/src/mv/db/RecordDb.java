package mv.db;

import mv.core.util.DbClosable;
import mv.core.util.Pair;

import com.mongodb.DBObject;

public abstract class RecordDb implements DbClosable
{
	abstract public int getAndIncrementAtomicCounter(String key);
	
	abstract public String getObjectWithClassAndId(String user, String clazz, String id);
	abstract public String putObjectWithClazz(String user, String clazz, String json);
	abstract public String putObjectsWithClazz(String user, String clazz, String json);
	abstract public String putObjectsWithClazzes(String user, String json);
	
	abstract public String getObjectCollectionWithClassAndFieldId(
		String user, String clazz, String field, String id, 
		String orderBy, Integer orderDirection, 
		Integer limitBegin, Integer limitSize, 
		String insertedAfterId,
		boolean onlyIds, boolean onlyCount
	);
	
	abstract public Pair<String, String> getLogin(String user, String password);
	abstract public Pair<String, String> createLogin(String user, String password, String json);

	abstract public String getLoginProperty(String toAddress, String property);

	abstract public String getLoginId(String toAddress);

	abstract public void deleteObjectWithClazz(String user, String clazz, String json);

	abstract public boolean hasLogin(String userAddress);

}
