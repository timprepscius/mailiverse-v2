package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/User/*")
public class User extends Rest {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public User() {
        super("User");
        // TODO Auto-generated constructor stub
    }    
}
