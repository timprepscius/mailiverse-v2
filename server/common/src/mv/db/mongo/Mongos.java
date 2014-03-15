package mv.db.mongo;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import mv.core.util.DbException;
import mv.core.util.Maps;
import mv.core.util.Strings;


import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

public class Mongos
{
	@SuppressWarnings("unchecked")
	public static <T> T get(DBObject o, String ... keys)
	{
		Object q = o;
		for (int i=0; i<keys.length-1; ++i)
			q = ((DBObject)q).get(keys[i]);
		
		return (T)((DBObject)q).get(keys[keys.length-1]);
	}

	public static Double forceDouble(DBObject o, String ... keys)
	{
		for (int i=0; i<keys.length-1; ++i)
			o = (DBObject)o.get(keys[i]);
		
		Object value = o.get(keys[keys.length-1]);
		if (value instanceof Double)
			return (Double)value;
		
		return Double.parseDouble(value.toString());
	}

	public static Integer forceInteger(DBObject o, String ... keys)
	{
		for (int i=0; i<keys.length-1; ++i)
			o = (DBObject)o.get(keys[i]);
		
		Object value = o.get(keys[keys.length-1]);
		if (value instanceof Integer)
			return (Integer)value;
		
		return Integer.parseInt(value.toString());
	}

	public static void put(DBObject o, Object ... keys)
	{
		for (int i=0; i<keys.length-2; ++i)
			o = (DBObject)o.get((String)keys[i]);
		
		o.put((String) keys[keys.length-2], keys[keys.length-1]);
	}
	
	public static void putWithPath (DBObject o, String path, Object value)
	{
		ArrayList<String> keys = Strings.splitNonRegex(path, ".");
		
		for (int i=0; i<keys.size()-1; ++i)
		{
			String key = keys.get(i);
			if (!o.containsField(key))
				o.put(key, new BasicDBObject());
			
			o = (DBObject)o.get(key);
		}
		
		o.put((String) keys.get(keys.size()-1), value);
	}
	
	public static Integer inc(DBObject o, String ... keys)
	{
		for (int i=0; i<keys.length-1; ++i)
			o = (DBObject)o.get(keys[i]);
		
		String lastKey = keys[keys.length-1];
		Integer lastValue = (Integer)o.get(lastKey)+1;
		o.put(lastKey, lastValue);
		
		return lastValue;
	}

	public static Integer incBy(DBObject o, Object ... keys)
	{
		for (int i=0; i<keys.length-2; ++i)
			o = (DBObject)o.get((String)keys[i]);
		
		String lastKey = (String)keys[keys.length-2];
		Integer lastValue = (Integer)o.get(lastKey)+ (Integer)keys[keys.length-1];
		o.put(lastKey, lastValue);
		
		return lastValue;
	}
	
	public static Integer dec(DBObject o, String ... keys)
	{
		for (int i=0; i<keys.length-1; ++i)
			o = (DBObject)o.get(keys[i]);
		
		String lastKey = keys[keys.length-1];
		Integer lastValue = (Integer)o.get(lastKey)-1;
		o.put(lastKey, lastValue);
		
		return lastValue;
	}

	public static Integer decBy(DBObject o, Object ... keys)
	{
		for (int i=0; i<keys.length-2; ++i)
			o = (DBObject)o.get((String)keys[i]);
		
		String lastKey = (String)keys[keys.length-2];
		Integer lastValue = (Integer)o.get(lastKey) - (Integer)keys[keys.length-1];
		o.put(lastKey, lastValue);
		
		return lastValue;
	}
	
	public static BasicDBObject toDBObjectAA(Object[][] items)
	{
		BasicDBObject m = new BasicDBObject ();
		Maps.applyToMapAA(m, items);
		
		return m;
	}
	
	public static BasicDBObject toDBObject(Object ... items)
	{
		BasicDBObject m = new BasicDBObject ();

		int i;
		for (i=1; i<items.length; i+=2)
		{
			m.put((String)items[i-1], items[i]);
		}
		
		return m;
	}	
	
	public static BasicDBObject toDBObjectDeep(Object[][] items)
	{
		BasicDBObject m = new BasicDBObject ();
		for (Object o : items)
		{
			Object[] kv = (Object[])o;
			String k = (String)kv[0];
			Object v = kv[1];
			
			if (v.getClass().isArray())
			{
				v = toDBObjectDeep((Object[][])v);
			}
			
			m.put(k, v);
		}
		
		return m;
	}

	@SuppressWarnings("rawtypes")
	public static BasicDBList toDBList(Iterable i)
	{
		BasicDBList l = new BasicDBList();
		for (Object o : i)
			l.add(o);
		
		return l;
	}
	
	public static BasicDBList toDBList(Object ... i)
	{
		BasicDBList l = new BasicDBList();
		for (Object o : i)
			l.add(o);
		
		return l;
	}

	public static BasicDBList toDBList(Object[][] i)
	{
		BasicDBList l = new BasicDBList();
		for (Object[] o : i)
			l.add(new BasicDBObject((String)o[0], o[1]));
		
		return l;
	}

	@SuppressWarnings("rawtypes")
	public static List<DBObject> allWith(Iterable c, Object ... index)
	{
		List<DBObject> l = new ArrayList<DBObject>();
		
		for (Object __o : c)
		{
			DBObject _o = (DBObject)__o;
			DBObject o = _o;
			
			for (int i=0; i<index.length-2; ++i)
				o = (DBObject)o.get((String)index[i]);

			if (o.get((String)index[index.length-2]).equals(index[index.length-1]))
				l.add(_o);
		}
		return l;
	}
	
	public static List<String> allKeysWith(DBObject c, Object ... index)
	{
		List<String> l = new ArrayList<String>();
		
		for (String k : c.keySet())
		{
			DBObject _o = (DBObject)c.get(k);
			DBObject o = _o;
			
			for (int i=0; i<index.length-2; ++i)
				o = (DBObject)o.get((String)index[i]);

			if (o.get((String)index[index.length-2]).equals(index[index.length-1]))
				l.add(k);
		}
		return l;
	}

	@SuppressWarnings("rawtypes")
	public static List<DBObject> allNotWith(Iterable c, Object ... index)
	{
		List<DBObject> l = new ArrayList<DBObject>();
		
		for (Object __o : c)
		{
			DBObject _o = (DBObject)__o;
			DBObject o = _o;
			
			for (int i=0; i<index.length-2; ++i)
				o = (DBObject)o.get((String)index[i]);

			if (!o.get((String)index[index.length-2]).equals(index[index.length-1]))
				l.add(_o);
		}
		
		return l;
	}

	public static List<String> allKeysNotWith(DBObject c, Object ... index)
	{
		List<String> l = new ArrayList<String>();
		
		for (String k : c.keySet())
		{
			DBObject _o = (DBObject)c.get(k);
			DBObject o = _o;
			
			for (int i=0; i<index.length-2; ++i)
				o = (DBObject)o.get((String)index[i]);

			if (!o.get((String)index[index.length-2]).equals(index[index.length-1]))
				l.add(k);
		}
		
		return l;
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public static <T> List<T> allField (Iterable c, String f)
	{
		List<T> l = new ArrayList<T>();
		for (Object o : c)
		{
			DBObject dbo = (DBObject)o;
			l.add((T)dbo.get(f));
		}
		
		return l;
	}
	
	public static DBObject fromJSON (String json)
	{
		return (DBObject)JSON.parse(json);		
	}
	
	public static Map<Object, Object> mapByField (BasicDBList l, String f)
	{
		Map<Object,Object> m = new HashMap<Object,Object>();
		
		for (Object o : l)
		{
			DBObject dbo = (DBObject)o;
			m.put(dbo.get(f), o);
		}
		
		return m;
	}

	public static void checkThrowError(DB db) throws DbException 
	{
		String error = (String) db.getLastError().get("err");
		if (error != null)
			throw new DbException (error);
	}
}
