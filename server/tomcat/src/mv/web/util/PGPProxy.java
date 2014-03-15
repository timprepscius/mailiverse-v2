/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */
package mv.web.util;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import mv.core.util.Streams;

/**
 * Servlet implementation class Random
 */
@WebServlet("/util/PGPProxy")
public class PGPProxy extends HttpServlet 
{
	private static final long serialVersionUID = 1L;
	
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public PGPProxy() 
    {
        super();
    }

    void doCors(HttpServletResponse response)
	{
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	}
    
    protected String getPublicKeyFromDb (String email) throws Exception
    {
    	return null;
    }
        
    /**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doCors(response);

		String queryString = request.getQueryString();
		String urlString = "http://pgp.mit.edu:11371/pks/lookup" + 
			((queryString != null) ?
				("?" + queryString) : "");
		
    	HttpURLConnection connection = (HttpURLConnection) new URL(urlString).openConnection();
    	String result = Streams.readFullyString(connection.getInputStream(), "UTF-8");
    	response.getWriter().write(result);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

	@Override
	protected void doOptions (HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doCors(response);
		super.doOptions(request, response);
	}
}
