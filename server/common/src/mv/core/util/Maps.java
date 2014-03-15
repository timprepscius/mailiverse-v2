package mv.core.util;

import java.util.HashMap;
import java.util.Map;

public class Maps
{	
	@SuppressWarnings("unchecked")
	public static <K, V> void applyToMapAA(Map<K, V> m, Object[][] items)
	{
		for (Object[] p : items)
		{
			m.put((K)p[0], (V)p[1]);
		}
	}
	
	public static <K,V> Map<K,V> toMapAA(Object[][] items)
	{
		Map<K,V> m = new HashMap<K,V> ();
		applyToMapAA(m, items);
		
		return m;
	}
	
	@SuppressWarnings("unchecked")
	public static <K, V> Map<K, V> toMap(Object ... items)
	{
		Map<K,V> m = new HashMap<K,V> ();

		int i;
		for (i=1; i<items.length; i+=2)
		{
			m.put((K)items[i-1], (V)items[i]);
		}
		
		return m;
	}
}
