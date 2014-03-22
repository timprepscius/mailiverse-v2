package mv.db.mongo;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import mv.core.util.DbException;
import mv.core.util.ExternalResource;
import mv.core.util.Pair;
import mv.db.RecordDb;

import org.bson.types.ObjectId;


import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.util.JSON;


public class RecordDbMongo extends RecordDb
{
	private static class S 
	{
		public static String 
			DEFAULT_MONGO_HOST = "127.0.0.1",
			DEFAULT_MONGO_PORT = "27017",

			_GT = "$gt",
		
			syncOwner = "syncOwner",
			syncVersion = "syncVersion",
			syncId = "syncId",

			n = "n",
			count = "count",
			query = "query",
			_id = "_id",
			
			UNIQUE = "unique",
			DROPDUPS = "dropdups";
	};
	
	private Mongo mongo;
	private DB db;
	
	public RecordDbMongo ()
	{
		link();
	}
	
	private void link()
	{
		try
		{
			String mongoHost= ExternalResource.getTrimmedString("mongo-host", S.DEFAULT_MONGO_HOST);
			String mongoPort = ExternalResource.getTrimmedString("mongo-port", S.DEFAULT_MONGO_PORT);
		
			mongo = new Mongo(mongoHost, Integer.parseInt(mongoPort));
			db = mongo.getDB("mv");
		}
		catch (Exception e)
		{
			throw new DbException(e);
		}
	}
	
	public void close ()
	{
		db = null;
		mongo.close();
		mongo = null;
	}
	
	private void ensureTable (String clazz)
	{
		db.getCollection(clazz).ensureIndex(
			Mongos.toDBObject(S.syncOwner, true, S.syncId, true),
			Mongos.toDBObject (
				S.UNIQUE, true,
				S.DROPDUPS, true
			)
		);	
		
		db.getCollection(clazz).ensureIndex(
			Mongos.toDBObject(S.syncOwner, true, S.syncVersion, true)
		);	
		Mongos.checkThrowError(db);
	}


	private void ensureTableIndex (String clazz, String index)
	{
		db.getCollection(clazz).ensureIndex(
			Mongos.toDBObject(S.syncOwner, true, index, true)
		);	
		Mongos.checkThrowError(db);
	}
	
	public DBObject putObjectWithClazz(String owner, String clazz, BasicDBObject o)
	{
		long version = getAndIncrementAtomicCounter(clazz);

		BasicDBObject dbObject = (BasicDBObject) o;
		dbObject.put(S.syncOwner, owner);
		dbObject.put(S.syncVersion, version);
		
		Object objectId = Mongos.get(dbObject, S.syncId);
		if (objectId == null)
		{
			objectId = new ObjectId().toString();
			dbObject.put(S.syncId, objectId);
		}
		
		db.getCollection(clazz).update(Mongos.toDBObject(S.syncOwner, owner, S.syncId, objectId), dbObject, true, false);
		Mongos.checkThrowError(db);
			
		System.out.println(dbObject.toString());

		DBObject r = Mongos.toDBObject(S.syncId, objectId.toString(), S.syncVersion, version );
		return r;
	}
	
	@Override
	public String putObjectWithClazz(String user, String clazz, String json) {
		return JSON.serialize(putObjectWithClazz(user, clazz, (BasicDBObject)JSON.parse(json)));
	}
	
	@Override
	public String putObjectsWithClazz(String owner, String clazz, String json) 
	{
		ensureTable (clazz);

		BasicDBList response = new BasicDBList();

		Object parse = JSON.parse(json);
		BasicDBList dbList = (parse instanceof BasicDBList) ? (BasicDBList)parse : Mongos.toDBList(parse) ;
		for (Object o : dbList)
		{
			response.add(putObjectWithClazz(owner, clazz, (BasicDBObject)o));
		}
		
		return JSON.serialize(response);
	}
	
	public int getOutstandingObjectsWithClass (String user, String clazz, long version)
	{
		DBObject q = Mongos.toDBObject(S.syncOwner, user, S.syncVersion, Mongos.toDBObject(S._GT, version));
		long r = db.getCollection(clazz).count(q);
		
		System.out.println("c: " + clazz + " q:" + q + " r:" + r);
		Mongos.checkThrowError(db);
		return (int)r;
	}
	
	public DBObject getObjectWithClassAndId_Mongo(String owner, String clazz, String objectId) 
	{
		DBObject q = Mongos.toDBObject(S.syncOwner, owner, S.syncId, objectId);
		DBCursor c = db.getCollection(clazz).find(q).limit(1);
		if (c.count()>0)
		{
			BasicDBObject d = (BasicDBObject) c.next();
			d.removeField(S._id);
			return d;
		}
		
		throw new NullPointerException();
	}

	@Override
	public String getObjectWithClassAndId(String owner, String clazz, String objectId) 
	{
		DBObject result = getObjectWithClassAndId_Mongo(owner, clazz, objectId);
		return JSON.serialize(result);
	}
	
	@Override
	public String getObjectCollectionWithClassAndFieldId(
		String owner, String clazz,
		String field, String objectId, 
		String orderBy, Integer orderDirection, 
		Integer limitBegin, Integer limitSize, String insertedAfterId,
		boolean onlyIds,
		boolean onlyCount
	)
	{
		if (field != null)
			ensureTableIndex(clazz, field);
		
		Object afterVersion = null;
		if (insertedAfterId != null)
		{
			afterVersion = getObjectWithClassAndId_Mongo(owner, clazz, insertedAfterId).get("syncVersion");
		}
		
		DBObject q = Mongos.toDBObject(S.syncOwner, owner);
		if (field!=null)
			q.put(field, objectId);
		
		if (afterVersion != null)
			q.put("syncVersion", Mongos.toDBObject(S._GT, afterVersion));
		
		if (onlyCount)
			return JSON.serialize(Mongos.toDBObject("count", db.getCollection(clazz).count(q)));
		
		DBCursor c = db.getCollection(clazz).find(q);

		if (orderBy != null)
		{
			if (orderDirection == null)
				orderDirection = 1;
			
			c = c.sort(Mongos.toDBObject(orderBy, orderDirection));
		}
		
		if (limitBegin != null)
			c = c.skip(limitBegin);

		if (limitSize != null)
			c = c.limit(limitSize);
			
		List<DBObject> objects = c.toArray();
		List<BasicDBObject> result = new ArrayList<BasicDBObject>();
		for (DBObject o : objects)
		{
			if (!onlyIds)
			{
				BasicDBObject d = (BasicDBObject) o;
				d.removeField(S._id);
				result.add(d);
			}
			else
			{
				BasicDBObject d = new BasicDBObject();
				d.put(S.syncId, o.get(S.syncId));
				d.put(S.syncOwner, o.get(S.syncOwner));
				d.put(S.syncVersion, o.get(S.syncVersion));
				result.add(d);
			}
		}
		
		return JSON.serialize(result);
	}
	
	@Override
	public Pair<String, String> getLogin(String user, String verification) 
	{
		DBObject q = Mongos.toDBObject("address", user, "verification", verification);
		DBCursor c = db.getCollection("Login").find(q).limit(1);
		if (c.count()>0)
		{
			BasicDBObject d = (BasicDBObject) c.next();
			d.removeField(S._id);
			return new Pair<String,String>((String)d.get("syncId"), JSON.serialize(d));
		}
		
		throw new DbException("Unknown user " + user);
	}
	
	@Override
	public Pair<String, String> createLogin(String user, String verification, String json) 
	{
		BasicDBObject u = (BasicDBObject) JSON.parse(json);
		
		if (user.indexOf('@')<1)
			throw new RuntimeException("invalid user");
		
		u.put("address", user);
		u.put("syncId", "syncId_" + user);
		u.put("verification", verification);
		putObjectWithClazz(u.getString("syncId"), "Login", u);
		putObjectWithClazz(u.getString("syncId"), "User", Mongos.toDBObject("syncId", "user"));
		
		return getLogin(user, verification);
	}
	
	@Override
	public int getAndIncrementAtomicCounter(String key) 
	{
		db.getCollection("counters").insert(
		   Mongos.toDBObject(S._id, key, "seq", 1)
		);
		
		DBObject c = 
			db.getCollection("counters").findAndModify (
				Mongos.toDBObject(S._id, key),
				Mongos.toDBObject("$inc", Mongos.toDBObject("seq",1))
			);
			
		return (Integer) c.get("seq");
	}
	
	@Override
	public String getLoginProperty(String user, String property) {
		DBObject q = Mongos.toDBObject(S.syncId, user);
		DBCursor c = db.getCollection("Login").find(q).limit(1);
		if (c.count()>0)
		{
			BasicDBObject d = (BasicDBObject) c.next();
			d.removeField(S._id);
			return (String)d.get(property);
		}
		
		throw new DbException("Unknown login " + user);
	}
	
	@Override
	public String getLoginId(String toAddress) 
	{
		DBObject q = Mongos.toDBObject("address", toAddress);
		DBCursor c = db.getCollection("Login").find(q).limit(1);
		if (c.count()>0)
		{
			BasicDBObject d = (BasicDBObject) c.next();
			d.removeField(S._id);
			return (String)d.get(S.syncId);
		}
		
		throw new DbException("Unknown login " + toAddress);
	}
	
	@Override
	public boolean hasLogin(String toAddress) 
	{
		DBObject q = Mongos.toDBObject("address", toAddress);
		return db.getCollection("Login").count(q) > 0;
	}

	
	public String putObjectsWithClazzes(String user, String json) {
		BasicDBList l = new BasicDBList();
		
		BasicDBList a = (BasicDBList) JSON.parse(json);
		for (Object o_ : a)
		{
			DBObject o = (DBObject) o_;
			String mode = (String) o.get("mode");
			String clazz = (String) o.get("class");
			String object = (String) o.get("object");
			
			if (mode.equals("single"))
				l.add(putObjectWithClazz(user, clazz, object));
			else
			if (mode.equals("multi"))
				l.add(putObjectsWithClazz(user, clazz, object));
		}
		
		return l.toString();
	}
	
	@Override
	public void deleteObjectWithClazz(String user, String clazz, String objectId) {
		DBObject q = Mongos.toDBObject(S.syncOwner, user, S.syncId, objectId);
		DBObject o = db.getCollection(clazz).findOne(q);
		if (o == null)
			throw new DbException("object not found");
		
		db.getCollection(clazz).remove(o);
	}
}
