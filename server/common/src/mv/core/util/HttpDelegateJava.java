/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

import java.io.BufferedOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

public class HttpDelegateJava extends HttpDelegate
{
	@Override
	public Pair<byte[], String[][]> execute(String action, String url, String[][] headers, boolean binaryInput, boolean binaryOutput, byte[] contents) throws Exception
	{
		URLConnection urlConnection = new URL(url).openConnection();

		HttpURLConnection httpCon = (HttpURLConnection) urlConnection;
		
		httpCon.setRequestMethod(action);
		if (headers != null)
		{
			for (String[] s : headers)
			{
				httpCon.setRequestProperty(s[0], s[1]);
			}
		}
		
		if (contents != null)
		{
			httpCon.setDoOutput(true);
			httpCon.setRequestProperty("CONTENT-LENGTH", "" + contents.length);

			BufferedOutputStream os = new BufferedOutputStream(urlConnection.getOutputStream());
			os.write(contents);
			os.close();
		}				

		byte[] bytes = Streams.readFullyBytes(urlConnection.getInputStream());
	
		ArrayList<String[]> responseHeaders = new ArrayList<String[]>();
		for (Entry<String, List<String>> i : httpCon.getHeaderFields().entrySet())
		{
			for (String j : i.getValue())
			{
				String key = i.getKey();
				String value = j;

				if (key == null)
				{
					key = value;
					value = null;
				}
				
				responseHeaders.add(new String[] { key, value });
			}
		}
		
		String[][] rh = new String[responseHeaders.size()][];
		int j=0;
		for (String[] i : responseHeaders)
			rh[j++] = i;
		
		return Pair.create(bytes, rh);
	}
}
