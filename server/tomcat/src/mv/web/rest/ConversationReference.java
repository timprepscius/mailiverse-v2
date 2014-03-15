package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/ConversationReference/*")
public class ConversationReference extends Rest {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ConversationReference() {
        super("ConversationReference");
        // TODO Auto-generated constructor stub
    }
}
