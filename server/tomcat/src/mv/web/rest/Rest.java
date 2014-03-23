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
public class Rest extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	String clazz;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Rest(String clazz) {
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
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	}
	
    /**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		doCors(response);
		
		RecordDb db = null;
		try
		{
			String urlPath = request.getPathInfo();
			String id = urlPath.substring(urlPath.lastIndexOf("/")+1);
			db = DbFactory.instantiateRecordDb();
			String user = db.getSession(request.getHeader("X-Session"));
			
			String result = db.getObjectWithClassAndId(user, clazz, id);
			System.out.println("response: " + result);
			
			response.setContentType("text/json; charset=UTF-8");
			
			if (result == null)
				throw new ServletException("Bad id");
			
			response.getWriter().println(result);
		}
		finally
		{
			DbCloser.close(db);
		}
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
			String results = db.putObjectWithClazz(user, clazz, json);
			
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
	protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		RecordDb db = null;
		try
		{
			System.out.println("doDelete" + request);
			String user = (String) request.getSession().getAttribute("user");
		
			db = DbFactory.instantiateRecordDb();
			String urlPath = request.getPathInfo();
			String id = urlPath.substring(urlPath.lastIndexOf("/")+1);
			db.deleteObjectWithClazz(user, clazz, id);
			
			response.getWriter().println("{ }");
		}
		finally
		{
			DbCloser.close(db);
		}
	}

	@Override
	protected void doOptions (HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doCors(response);
		super.doOptions(request, response);
	}
	
}
