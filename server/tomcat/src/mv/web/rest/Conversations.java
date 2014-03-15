package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/Conversations/*")
public class Conversations extends RestCollection {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Conversations() {
        super("Conversation");
        // TODO Auto-generated constructor stub
    }
}
