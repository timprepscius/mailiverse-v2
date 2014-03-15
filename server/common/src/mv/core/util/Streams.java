package mv.core.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class Streams {

	public static String readFullyString (InputStream inputStream, String encoding) throws IOException 
	{
	    return Strings.toString(readFullyBytes(inputStream), encoding);
	}

	public static byte[] readFullyBytes (InputStream inputStream) throws IOException 
	{
	    ByteArrayOutputStream baos = new ByteArrayOutputStream();
	    byte[] buffer = new byte[1024];
	    int length = 0;
	    while ((length = inputStream.read(buffer)) != -1) 
	        baos.write(buffer, 0, length);
	
	    return baos.toByteArray();
	}
	
	public static void writeBoundedArray(OutputStream dos, byte[] bytes) throws IOException
	{
		dos.write(intToByteArray(bytes.length));
		dos.write(bytes);
	}
	
	public static byte[] readBoundedArray(InputStream dis) throws IOException
	{
		int size = readInt(dis);
		if (size > dis.available())
			throw new IOException("read size greater than max read size");
		
		byte[] bytes = new byte[size];
		dis.read(bytes, 0, size);
		return bytes;
	}
	
	public static byte[] readBoundedArray3(InputStream dis) throws IOException
	{
		int size = readInt3(dis);
		if (size > dis.available())
			throw new IOException("read size greater than max read size");
		
		byte[] bytes = new byte[size];
		dis.read(bytes, 0, size);
		return bytes;
	}

	public static int readInt(byte[] block, int offset)
	{
        int b1 = block[offset++] & 0xFF;
        int b2 = block[offset++] & 0xFF;
        int b3 = block[offset++] & 0xFF;
        int b4 = block[offset++] & 0xFF;
        return ((b1 << 24) | (b2 << 16) | (b3 << 8) | b4);
	}
	
	public static int readInt3(byte[] block, int offset)
	{
        int b2 = block[offset++] & 0xFF;
        int b3 = block[offset++] & 0xFF;
        int b4 = block[offset++] & 0xFF;
        return ((b2 << 16) | (b3 << 8) | b4);
	}

	public static int readInt(InputStream bis) throws IOException
	{
		byte[] i = new byte[4];
		bis.read(i);
		return readInt(i,0);
	}
	
	public static int readInt3(InputStream bis) throws IOException
	{
		byte[] i = new byte[3];
		bis.read(i);
		return readInt3(i,0);
	}

	public static byte[] intToByteArray(int val)
	{
		return new byte[] {
			(byte)(val >> 24),
			(byte)(val >> 16),
			(byte)(val >> 8),
			(byte)(val)
		};
	}

	public static void writeInt(OutputStream bos, int val) throws IOException 
	{
		bos.write(intToByteArray(val));
	}
}
