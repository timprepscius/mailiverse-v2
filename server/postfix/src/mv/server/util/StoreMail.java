package mv.server.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.security.NoSuchProviderException;
import java.security.SecureRandom;
import java.security.Security;
import java.util.Date;
import java.util.Iterator;

import org.bouncycastle.bcpg.ArmoredOutputStream;
import org.bouncycastle.bcpg.CompressionAlgorithmTags;
import org.bouncycastle.openpgp.PGPCompressedDataGenerator;
import org.bouncycastle.openpgp.PGPEncryptedData;
import org.bouncycastle.openpgp.PGPEncryptedDataGenerator;
import org.bouncycastle.openpgp.PGPException;
import org.bouncycastle.openpgp.PGPLiteralData;
import org.bouncycastle.openpgp.PGPLiteralDataGenerator;
import org.bouncycastle.openpgp.PGPPublicKey;
import org.bouncycastle.openpgp.PGPPublicKeyRing;
import org.bouncycastle.openpgp.PGPPublicKeyRingCollection;
import org.bouncycastle.openpgp.PGPUtil;
import org.bouncycastle.openpgp.operator.jcajce.JcePGPDataEncryptorBuilder;
import org.bouncycastle.openpgp.operator.jcajce.JcePublicKeyKeyEncryptionMethodGenerator;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;


import mv.core.util.Base64;
import mv.core.util.LogNull;
import mv.core.util.LogOut;
import mv.core.util.Streams;
import mv.db.DbFactory;
import mv.db.RecordDb;
import mv.db.mongo.Mongos;

public class StoreMail 
{
	static PGPPublicKey readPublicKey(InputStream input) throws IOException, PGPException
	{
		PGPPublicKeyRingCollection pgpPub = new PGPPublicKeyRingCollection(
				PGPUtil.getDecoderStream(input));

		//
		// we just loop through the collection till we find a key suitable for encryption, in the real
		// world you would probably want to be a bit smarter about this.
		//

		Iterator keyRingIter = pgpPub.getKeyRings();
		while (keyRingIter.hasNext())
		{
			PGPPublicKeyRing keyRing = (PGPPublicKeyRing)keyRingIter.next();

			Iterator keyIter = keyRing.getPublicKeys();
			while (keyIter.hasNext())
			{
				PGPPublicKey key = (PGPPublicKey)keyIter.next();

				if (key.isEncryptionKey())
				{
					return key;
				}
			}
		}

		throw new IllegalArgumentException("Can't find encryption key in key ring.");
	}	

	static byte[] compressFile(byte[] in, int algorithm) throws IOException
	{
		ByteArrayOutputStream bOut = new ByteArrayOutputStream();
		PGPCompressedDataGenerator comData = new PGPCompressedDataGenerator(algorithm);
		writeFileToLiteralData(comData.open(bOut), PGPLiteralData.BINARY,
				in);
		comData.close();
		return bOut.toByteArray();
	}

	static void writeFileToLiteralData(
		OutputStream out,
		char fileType,
		byte[] bytes
	) throws IOException
	{
		PGPLiteralDataGenerator lData = new PGPLiteralDataGenerator();
		OutputStream pOut = lData.open(out, fileType, "encryptedMail", bytes.length, new Date());
		pOut.write(bytes);
		pOut.close();
	}


	static byte[] encryptFile(
		byte[] in,
		PGPPublicKey encKey,
		boolean armor,
		boolean withIntegrityCheck
	) throws IOException, NoSuchProviderException
	{
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		OutputStream out = bos;
		if (armor)
		{
			out = new ArmoredOutputStream(out);
		}

		try
		{
			byte[] bytes = compressFile(in, CompressionAlgorithmTags.ZIP);

			PGPEncryptedDataGenerator encGen = new PGPEncryptedDataGenerator(
					new JcePGPDataEncryptorBuilder(PGPEncryptedData.CAST5).setWithIntegrityPacket(withIntegrityCheck).setSecureRandom(new SecureRandom()).setProvider("BC"));

			encGen.addMethod(new JcePublicKeyKeyEncryptionMethodGenerator(encKey).setProvider("BC"));

			OutputStream cOut = encGen.open(out, bytes.length);

			cOut.write(bytes);
			cOut.close();

			if (armor)
			{
				out.close();
			}
		}
		catch (PGPException e)
		{
			System.err.println(e);
			if (e.getUnderlyingException() != null)
			{
				e.getUnderlyingException().printStackTrace();
			}
		}
		
		return bos.toByteArray();
	}	
	
	/**
	 * @param args
	 * @throws IOException 
	 * @throws PGPException 
	 * @throws NoSuchProviderException 
	 */
	public static void main(String[] args) throws IOException, PGPException, NoSuchProviderException 
	{
		LogNull log = new LogNull(StoreMail.class);

		for (int i=0; i<args.length; ++i)
			log.println(args[i]);
				
		Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());

		boolean wasSent = args[0].equals("SENT");
		
		String toAddress = args[1];
		log.println("using " + toAddress);

		byte[] bytes = Streams.readFullyBytes(System.in);

		RecordDb db = DbFactory.instantiateRecordDb();
		
		String userId = db.getLoginId(toAddress);
		log.println("found " + userId);
		
		String publicKeyString = db.getLoginProperty(userId, "publicKey");
		String owner = db.getLoginProperty(userId, "syncOwner");
		log.println("properties " + publicKeyString + " " + owner);

		PGPPublicKey key = readPublicKey(new ByteArrayInputStream(publicKeyString.getBytes()));
		log.println("read public key");

		// this string is 
		byte[] encrypted = encryptFile(bytes, key, true, true);
		String encryptedString = new String(encrypted, "UTF-8");
		log.println("successfully encrypted to " + encryptedString);
		
		db.putObjectsWithClazz(owner, "Original", Mongos.toDBObject("sent", wasSent, "data", encryptedString).toString());
	}

}
