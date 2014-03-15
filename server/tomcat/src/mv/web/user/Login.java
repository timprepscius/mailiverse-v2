package mv.web.user;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


import mv.core.util.DbCloser;
import mv.core.util.Pair;
import mv.db.DbFactory;
import mv.db.ExternalDataFactory;
import mv.db.RecordDb;


/**
 * Servlet implementation class Login
 */
@WebServlet("/user/Login")
public class Login extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Login() {
        super();
        // TODO Auto-generated constructor stub
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
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doCors(response);
		
		RecordDb db = null;
		try
		{
			String user = request.getParameter("user");
			String verification = request.getParameter("verification");
		
			db = DbFactory.instantiateRecordDb();
			Pair<String, String> r = db.getLogin(user,verification);
			System.out.println("Login " + r);
			request.getSession().setAttribute("user", r.first);
			
			response.setContentType("text/json; charset=UTF-8");
			response.getWriter().println(r.second);
		}
		finally
		{
			DbCloser.close(db);
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
