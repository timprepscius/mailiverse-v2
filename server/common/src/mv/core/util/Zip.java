/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */

package mv.core.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.DataFormatException;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;

public class Zip
{
	public static byte[] deflate (byte[] data) throws IOException
	{
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		DeflaterOutputStream zos = new DeflaterOutputStream (bos);
		zos.write(data);
		zos.close();
		
		return bos.toByteArray();
	}

	public static byte[] inflate (byte[] data) throws IOException
	{
		try
		{
			byte[] buffer = new byte[2048];
			Inflater inflater = new Inflater(true);
			inflater.setInput(Arrays.copyOf(data, 2, data.length-6));
			
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			int size;
			while ((size = inflater.inflate(buffer))!=0)
				bos.write(buffer, 0, size);
			
			return bos.toByteArray();
		}
		catch (DataFormatException e)
		{
			throw new IOException(e);
		}
	}
}
