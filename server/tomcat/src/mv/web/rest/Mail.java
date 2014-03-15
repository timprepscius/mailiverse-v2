package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/Mail/*")
public class Mail extends Rest {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Mail() {
        super("Mail");
        // TODO Auto-generated constructor stub
    }
}
