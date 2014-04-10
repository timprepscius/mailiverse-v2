package mv.core.util;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

public class Run {
	static public byte[] runCommand(String cmd) throws IOException {
		// The actual procedure for process execution:

		// Execute a command and get its process handle
		Process proc = Runtime.getRuntime().exec(cmd);

		// Get the handle for the processes InputStream
		InputStream in = new BufferedInputStream(proc.getInputStream());
		ByteArrayOutputStream bos = new ByteArrayOutputStream();

		// Read to Temp Variable, Check for null then
		// add to (ArrayList)list
		int c = 0;
		while ((c = in.read()) != -1)
			bos.write(c);

		// Wait for process to terminate and catch any Exceptions.
		try {
			proc.waitFor();
		} catch (InterruptedException e) {
			System.err.println("Process was interrupted");
		}

		// Note: proc.exitValue() returns the exit value.
		// (Use if required)

		in.close();
		bos.close(); // Done.

		return bos.toByteArray();
	}
}
