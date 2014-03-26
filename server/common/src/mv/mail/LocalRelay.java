/**
 * Author: Timothy Prepscius
 * License: GPLv3 Affero + keep my name in the code!
 */
package mv.mail;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Scanner;

import javax.mail.Authenticator;
import javax.mail.Message.RecipientType;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

import org.json.JSONArray;
import org.json.JSONObject;

import mv.Constants;
import mv.core.util.LogOut;
import mv.mail.MimeMessageRetainMessageId;
import mv.mail.SMTPAuthenticator;

public class LocalRelay
{
	LogOut log = new LogOut(LocalRelay.class);
	
	public LocalRelay () throws Exception
	{
	}
	
	public String[] toArray(JSONArray j)
	{
		if (j == null)
			return new String[0];
		
		ArrayList<String> a = new ArrayList<String>(j.length());
		for (int i=0; i<j.length(); ++i)
			a.add(j.getString(i));
		
		return a.toArray(new String[0]);
	}

	public JSONObject[] toMapArray(JSONArray j)
	{
		if (j == null)
			return new JSONObject[0];
		
		ArrayList<String> a = new ArrayList<String>(j.length());
		for (int i=0; i<j.length(); ++i)
			a.add(j.getString(i));
		
		return a.toArray(new JSONObject[0]);
	}

	public <T> T jget(JSONObject o, String key)
	{
		return o.has(key) ? (T)o.get(key) : null;
	}
	
	public void onMail (String user, String json) throws Exception
	{
		log.debug("LocalRelay.onMail");
		
		log.debug("after decrypt");
		
		JSONObject map = new JSONObject(json);
		String password = (String)map.get("password");
		
        Properties props = new Properties();
        props.put("mail.smtp.user", user);
        props.put("mail.smtp.host", Constants.LOCAL_SMTP_HOST);
        props.put("mail.smtp.port", Constants.LOCAL_SMTP_PORT);
        props.put("mail.smtp.auth", "true");

        // props.put("mail.smtp.starttls.enable","true");        
        
        props.put("mail.smtp.socketFactory.port", Constants.LOCAL_SMTP_PORT);
        // props.put("mail.debug", "true");
		
        Authenticator auth = 
        	new SMTPAuthenticator(
        		user,
        		password
        	);
        
		log.debug("setting properties");		
        Session session = Session.getInstance(props, auth);
        MimeMessageRetainMessageId message = new MimeMessageRetainMessageId(session);
        
        String version = map.getString("version");
        String messageId = map.getString("messageId");
        String fromName = jget(map, "fromName");
        String from = fromName != null ? ("\"" + fromName + "\" <" + user + ">") : user;
        JSONArray tos = jget(map,"to");
        JSONArray ccs = jget(map,"cc");
        JSONArray bccs = jget(map,"bcc");
        String subject = jget(map,"subject");
        String content = jget(map, "content");
        String encryptedContent = jget(map,"encryptedContent");
        
        for (String address : toArray(tos))
        	message.addRecipients(RecipientType.TO, address);
        
        for (String address : toArray(ccs))
        	message.addRecipients(RecipientType.CC, address);
        	
        for (String address : toArray(bccs))
        	message.addRecipients(RecipientType.BCC, address);

        message.setFrom(new InternetAddress(from));
		if (subject != null)
			message.setSubject(subject);
			
		System.out.println(content);
		
        message.setSentDate(new Date());
        
        if (content != null)
        {
        	MimeMessage parsed = new MimeMessage(Session.getInstance(new Properties()), new ByteArrayInputStream(content.getBytes()));
        	message.setContent(parsed.getContent(), parsed.getContentType());
        }
        else
		if (encryptedContent != null)
		{
			MimeBodyPart versionPart = new MimeBodyPart();
			versionPart.setContent("\r\nVersion: 1", "application/pgp-encrypted");
			
			MimeBodyPart encryptedPart = new MimeBodyPart();
			encryptedPart.setContent(encryptedContent, "application/octet-stream");
			
	        MimeMultipart multiPart = new MimeMultipart("encrypted");
	        multiPart.addBodyPart(versionPart);
	        multiPart.addBodyPart(encryptedPart);

			message.setContent(multiPart);
		}
        
        message.setMessageID(messageId);
        
		log.debug("Sending mail");		
        Transport.send(message);
        log.debug("Done sending mail");
	}
}
