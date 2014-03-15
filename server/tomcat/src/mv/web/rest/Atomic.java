package mv.web.rest;

import java.io.IOException;
import java.util.Map.Entry;
import java.util.zip.InflaterInputStream;
import java.util.zip.ZipInputStream;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


import mv.core.util.DbCloser;
import mv.core.util.Streams;
import mv.db.DbFactory;
import mv.db.RecordDb;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;


/**
 * Servlet implementation class Rest
 */
public class Atomic extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	String clazz;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Atomic(String clazz) {
        super();
        this.clazz = clazz;
        // TODO Auto-generated constructor stub
    }

    String getUserFromToken (String token)
    {
    	return token;
    }
    
	void doCors(HttpServletResponse response)
	{
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, PUT");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	}
	


	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		RecordDb db = null;
		try
		{
			System.out.println("doPost " + clazz + " " + request);
			for (Entry<String, String[]> kv : request.getParameterMap().entrySet())
				for (String v : kv.getValue())
					System.out.println(kv.getKey() + ":" + v);
			String json = Streams.readFullyString(request.getInputStream(), "UTF-8");
			System.out.println("doPost: " + json);
			String user = (String) request.getSession().getAttribute("user");
			
			db = DbFactory.instantiateRecordDb();
			String results = db.putObjectsWithClazzes(user, json);
			
			response.setContentType("text/json; charset=UTF-8");
			response.getWriter().println(results);
			
		}
		finally
		{
			DbCloser.close(db);
		}
	}
	
	@Override
	protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		doPost(request, response);
	}

	@Override
	protected void doOptions (HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doCors(response);
		super.doOptions(request, response);
	}
	
}
