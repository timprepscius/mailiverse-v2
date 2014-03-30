package mv.web.rest;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;

/**
 * Servlet implementation class Rest
 */
@WebServlet("/rest/KeyCrypto/*")
public class KeyCrypto extends Rest {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public KeyCrypto() {
        super("KeyCrypto");
        // TODO Auto-generated constructor stub
    }
}
