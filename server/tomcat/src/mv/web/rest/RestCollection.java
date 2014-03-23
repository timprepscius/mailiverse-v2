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
import mv.core.util.ExternalException;
import mv.core.util.Streams;
import mv.db.DbFactory;
import mv.db.RecordDb;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;


/**
 * Servlet implementation class Rest
 */
public class RestCollection extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	String clazz;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public RestCollection(String clazz) 
    {
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
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
			String field = request.getParameter("field");
			if (field != null && field.equals("undefined"))
				field = null;
			
			String id = request.getParameter("id");
			boolean onlyIds = request.getParameterMap().containsKey("onlyIds");
			boolean onlyCount = request.getParameterMap().containsKey("onlyCount");
			String orderBy = request.getParameter("orderBy");
			String orderDirectionStr = request.getParameter("orderDirection");
			Integer orderDirection = orderDirectionStr != null ? Integer.parseInt(orderDirectionStr) : null;
			String offsetStr = request.getParameter("offset");
			Integer offset = offsetStr != null ? Integer.parseInt(offsetStr) : null;
			String limitStr = request.getParameter("limit");
			Integer limit = limitStr != null ? Integer.parseInt(limitStr) : null;
			
			String insertedAfter = request.getParameter("insertedAfter");
			db = DbFactory.instantiateRecordDb();

			String user = db.getSessionUserId(request.getHeader("X-Session"));
			if (user == null)
				throw new ExternalException("Unknown session");
			
			String result =
				db.getObjectCollectionWithClassAndFieldId(
					user, clazz, field, id, 
					orderBy, orderDirection, 
					offset, limit, 
					insertedAfter, 
					onlyIds,
					onlyCount
				);
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
			String json = Streams.readFullyString(new InflaterInputStream(request.getInputStream()), "UTF-8");
			System.out.println("doPost: " + json);
			
			db = DbFactory.instantiateRecordDb();
			String user = db.getSessionUserId(request.getHeader("X-Session"));
			if (user == null)
				throw new ExternalException("Unknown session");

			String results = db.putObjectsWithClazz(user, clazz, json);
			
			response.setContentType("text/json; charset=UTF-8");
			response.getWriter().println(results);
			
		}
		finally
		{
			DbCloser.close(db);
		}
	}

	@Override
	protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		RecordDb db = null;
		try
		{
			System.out.println("doDelete" + request);
			for (Entry<String, String[]> kv : request.getParameterMap().entrySet())
				for (String v : kv.getValue())
					System.out.println(kv.getKey() + ":" + v);
			String json = Streams.readFullyString(request.getInputStream(), "UTF-8");
			System.out.println(json);
		
			db = DbFactory.instantiateRecordDb();
			String user = db.getSessionUserId(request.getHeader("X-Session"));
			if (user == null)
				throw new ExternalException("Unknown session");

//			db.deleteObjectWithClazz(clazz, request.getParameterValues("objectId"));
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
