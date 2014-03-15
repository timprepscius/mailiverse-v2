package mv.db;

public interface ExternalData {

	public void addUser (String name, String password);
	public void removeUser (String name);
	
	public void setUserPassword (String name, String password);
}
