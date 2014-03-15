package mv.core.util;

@SuppressWarnings("serial")
public class InternalException extends RuntimeException {

	public InternalException(Exception e) {
		super(e);
		// TODO Auto-generated constructor stub
	}
	
	public InternalException(String what) {
		super(what);
	}

}
