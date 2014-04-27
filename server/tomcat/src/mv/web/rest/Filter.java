package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/Filter/*")
public class Filter extends Rest {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Filter() {
        super("Filter");
        // TODO Auto-generated constructor stub
    }
}
