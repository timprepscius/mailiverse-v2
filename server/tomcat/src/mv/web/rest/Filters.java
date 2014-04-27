package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/Filters")
public class Filters extends RestCollection {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Filters() {
        super("Filter");
    }
}
