/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */
package mv.web.util;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import mv.Constants;
import mv.core.util.LogOut;
import mv.core.util.Streams;
import mv.db.DbFactory;
import mv.db.RecordDb;
import mv.mail.LocalRelay;


/**
 * Servlet implementation class Send
 */
@WebServlet("/util/Send")
public class Send extends HttpServlet 
{
	LogOut log = new LogOut(Send.class);
	private static final long serialVersionUID = 1L;
	LocalRelay localRelay;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Send() throws Exception 
    {
        super();
        
        log.debug("send constructing");
        try
        {
			localRelay = new LocalRelay();
        }
        catch (Exception e)
        {
        	log.exception(e);
        	throw e;
        }
    }

    void doCors(HttpServletResponse response)
	{
        log.debug("send doCors");
        
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
		response.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Content-Size");
	}
    
	/**
	 * @see HttpServlet#doPut(HttpServletRequest, HttpServletResponse)
	 */
	protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		doCors(response);
        log.debug("doPut");
		if (request.getContentLength() > Constants.MAXIMUM_MAIL_SIZE)
			throw new ServletException("Content size too large");
		
		String json = Streams.readFullyString(request.getInputStream(), "UTF-8");
		if (json.length() != request.getContentLength())
			throw new ServletException("Content size mismatch");

		RecordDb db = null;
		try
		{
			db = DbFactory.instantiateRecordDb();

			String user = db.getSessionUserId(request.getHeader("X-Session"));
			String userAddress = db.getLoginProperty(user, "address");
		
	        log.debug("localRelay");
			localRelay.onMail(userAddress, json);
			response.getOutputStream().println("Ok");
		}
		catch (Throwable e)
		{
			log.debug(e.toString());
			e.printStackTrace(System.out);
			throw new ServletException("Local mail relay failed: " + e.getMessage());
		}
	}

	@Override
	protected void doOptions (HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doCors(response);
		super.doOptions(request, response);
	}
}
