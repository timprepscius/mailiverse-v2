mv (aka: mailiverse.v2)

==

This project is a PGP mail service which caches using AES to provide a UI of the standard, "click on
folder, see conversations instantaineously, etc etc."

It uses Backbone for the model/view architecture.  The backone syncronization code is overridden before
ajax is performed to encrypt and decrypt the models as they are transfered.

My hope is that, anyone will be able to change the look and feel of the application by changing the
css and the templates from which the user interface is built.  (look in client/web/WebContent/templates
and client/web/WebContent/css).

My hope is also to demonstrate how any service built using backbone can easily use encryption, with
almost no modifications in existing code.

===

Progress:

03/15/2014 - Initial git push.
 * Decrypts mail sent using gpg/applemail.
 * Decrypts mail which have the ---- PGP * END ---- blocks.
 * Checks signatures of ---- PGP * END ---- blocks.
 * Checks signatures of gpg/applemail
      Marks only sections of mail which are signed with a green lock.
 * There are cases of multipart/signed which fail.  (see example mail 2)
 * Encrypts mail with text & html blocks using PGP.  Correctly deciphered by gpg/applemail. 
      However, only tested with small messages.  Problems may arise with \r\n messages, etc, encodings.
 * Signs mail with text & html blocks using PGP.  Correctly deciphered by gpg/applemail.
      Again, only small messages.
 * Looks up PGP keys using the mit pgp server.
 * Keys which are ONLY found from server are Orange, keys which have been used to check a signature are Green.
 * Decodes QP inlines in the subject, haven't applied this to mail bodies yet.   

Todo:
 * QP all around.
 * Re-enable web worker.
 * Backbone paging of conversations.
 * ... 
 * infinite
 * ...

===

Build and deploy:

Requirements: ----
 * "Ant"
The automated build uses Ant.

 * The setup assumes that you have public/privatekey ssh access to the root account of the target computer.
There is a script "get_rsa_pub" which will copy your public key for the setup scripts to use.

 * The setup scripts use apt-get, so.. ubuntu.


Build: -----
 1. cd server
 2. ./build

Setup: -----
(assuming you have root access to the target machine:
 1. cd setup
 2. ./setup-server target-machine-name

Deploy: -----
 1. cd deploy
 2. echo "target-machine-name" > config.domain
 3. ./server-deploy

===

Encryption:

The encryption is broken into three segments, user authentication and key retrieval via PBE 
(SHA-256, 32768 iterations), caching via AES-256, and mail encryption via PGP (2048) bit.

To view the user authentication look at:
client/web/WebContent/js/view/SignupView.js && LoginView.js

To view the AES-256 encryption look at:
client/web/WebContent/js/mech/BackboneEncryption.js  

To view the PGP encryption look at:
client/web/WebContent/js/mech/MailReceiver.js && MailSender.js

===

Backbone:

At this point in development, the entire source tree is fluid.
I feel that, as I deal with paging infinite conversations, I will probably need to make changes to the model view architecture.

Having said that, I believe I have followed conventions, and have created a source tree with a very low learning curve.

The AppView contains the MainView, the MainView contains the Folders/Conversations etc.



