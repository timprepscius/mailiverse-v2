/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

public abstract class HttpDelegate
{
	public static final String GET = "GET";
	public static final String PUT = "PUT";
	public static final String POST = "POST";
	public static final String DELETE = "DELETE";
	
	public abstract Pair<byte[], String[][]> execute (String action, String url, String[][] headers, boolean binaryInput, boolean binaryOutput, byte[] contents) throws Exception;
}
