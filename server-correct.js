// server-correct.js
import http from 'http';
import { parse } from 'url';
import { config } from 'dotenv';

// Import dynamique asynchrone de nodemailer
let nodemailer = null;
let isNodemailerReady = false;

async function initNodemailer() {
  try {
    console.log('🔄 Initialisation de nodemailer...');
    
    const nodemailerModule = await import('nodemailer');
    console.log('🔍 Structure de nodemailerModule:', Object.keys(nodemailerModule));
    
    // La bonne méthode est createTransport, pas createTransporter !
    if (nodemailerModule.default && typeof nodemailerModule.default.createTransport === 'function') {
      nodemailer = nodemailerModule.default;
      console.log('✅ Nodemailer importé via .default');
    } else if (typeof nodemailerModule.createTransport === 'function') {
      nodemailer = nodemailerModule;
      console.log('✅ Nodemailer importé directement');
    } else {
      throw new Error('createTransport non trouvé');
    }
    
    isNodemailerReady = true;
    console.log('✅ Nodemailer prêt, type createTransport:', typeof nodemailer.createTransport);
    
  } catch (error) {
    console.error('❌ Erreur initialisation nodemailer:', error.message);
    isNodemailerReady = false;
  }
}

// Charger les variables d'environnement
config();

const PORT = process.env.PORT || 3001;

// Helper pour parser le JSON du body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Helper pour répondre en JSON
const jsonResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify(data));
};

// Serveur HTTP
const server = http.createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    });
    res.end();
    return;
  }

  try {
    // Route de santé
    if (pathname === '/health' && method === 'GET') {
      jsonResponse(res, 200, {
        status: 'OK',
        message: 'Serveur backend fonctionnel',
        timestamp: new Date().toISOString(),
        env: {
          smtp_configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
        },
        nodemailer_ready: isNodemailerReady,
        nodemailer_type: nodemailer ? typeof nodemailer.createTransport : 'null'
      });
      return;
    }

    // Route pour l'envoi d'email admin
    if (pathname === '/api/send-admin-notification' && method === 'POST') {
      console.log('📧 Requête email reçue');
      
      const body = await parseBody(req);
      const { memberData } = body;

      // Validation des données
      if (!memberData || !memberData.username || !memberData.email) {
        console.error('❌ Données manquantes:', memberData);
        jsonResponse(res, 400, {
          error: 'Données manquantes',
          required: ['memberData.username', 'memberData.email'],
          received: memberData
        });
        return;
      }

      console.log('📧 Nouvelle inscription à traiter:', {
        username: memberData.username,
        email: memberData.email,
        phone: memberData.phone || 'Non renseigné'
      });

      // Vérifier si nodemailer est prêt
      if (!isNodemailerReady || !nodemailer) {
        console.error('❌ Nodemailer non disponible');
        
        // Log détaillé pour notification manuelle
        console.log('📧 NOTIFICATION ADMIN - NOUVELLE INSCRIPTION:');
        console.log('==========================================');
        console.log('👤 Utilisateur:', memberData.username);
        console.log('📧 Email:', memberData.email);
        console.log('📞 Téléphone:', memberData.phone || 'Non renseigné');
        console.log('📅 Date:', new Date(memberData.registrationDate).toLocaleString('fr-FR'));
        console.log('🌐 IP:', memberData.registrationIP || 'Inconnue');
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('==========================================');
        
        jsonResponse(res, 500, {
          error: 'Service email indisponible',
          details: 'Nodemailer non initialisé',
          memberData: {
            username: memberData.username,
            email: memberData.email,
            phone: memberData.phone || 'Non renseigné',
            registrationDate: new Date(memberData.registrationDate).toLocaleString('fr-FR'),
            registrationIP: memberData.registrationIP || 'Inconnue'
          }
        });
        return;
      }

      // Vérifier les variables d'environnement SMTP
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Variables SMTP manquantes');
        jsonResponse(res, 500, {
          error: 'Configuration SMTP manquante',
          details: 'Vérifiez SMTP_USER et SMTP_PASS dans .env'
        });
        return;
      }

      // Configuration SMTP - UTILISATION DE createTransport (pas createTransporter)
      console.log('🔧 Configuration SMTP avec createTransport...');
      const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.fr',
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Transporter créé avec succès');

      // Test de connexion SMTP
      console.log('🔍 Test de connexion SMTP...');
      try {
        await transporter.verify();
        console.log('✅ Connexion SMTP vérifiée avec succès');
      } catch (verifyError) {
        console.error('❌ Erreur de connexion SMTP:', verifyError.message);
        console.error('Code d\'erreur:', verifyError.code);
        
        jsonResponse(res, 500, {
          error: 'Impossible de se connecter au serveur SMTP',
          details: verifyError.message,
          code: verifyError.code,
          smtp_config: {
            host: 'smtp.ionos.fr',
            port: 587,
            user: process.env.SMTP_USER
          }
        });
        return;
      }

      // Contenu de l'email
      const mailOptions = {
        from: `"CryptocaVault Notifications" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER, // Email à vous-même
        subject: '🌟 Nouvelle inscription communauté RMR',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Nouvelle Inscription</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Communauté RMR-M</p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📋 Informations du nouveau membre</h3>
              
              <table style="width: 100%; border-collapse: collapse; background: white;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; font-weight: bold; color: #555; width: 30%;">👤 Nom d'utilisateur:</td>
                  <td style="padding: 12px 0; color: #333;">${memberData.username}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; font-weight: bold; color: #555;">📧 Email:</td>
                  <td style="padding: 12px 0; color: #333;">${memberData.email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; font-weight: bold; color: #555;">📞 Téléphone:</td>
                  <td style="padding: 12px 0; color: #333;">${memberData.phone || 'Non renseigné'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0; font-weight: bold; color: #555;">📅 Date d'inscription:</td>
                  <td style="padding: 12px 0; color: #333;">${new Date(memberData.registrationDate).toLocaleString('fr-FR')}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; color: #555;">🌐 Adresse IP:</td>
                  <td style="padding: 12px 0; color: #333;">${memberData.registrationIP || 'Inconnue'}</td>
                </tr>
              </table>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #1976d2; font-weight: 500;">
                <strong>📋 Action requise :</strong> Cette inscription est maintenant visible dans votre panel d'administration.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; border-top: 2px solid #eee; color: #666; font-size: 14px;">
              <p style="margin: 0;">
                Email automatique envoyé par CryptocaVault<br>
                <small>${new Date().toLocaleString('fr-FR')}</small>
              </p>
            </div>
          </div>
        `,
        text: `
🌟 Nouvelle inscription communauté RMR

Informations du nouveau membre :
- Nom d'utilisateur: ${memberData.username}
- Email: ${memberData.email}
- Téléphone: ${memberData.phone || 'Non renseigné'}
- Date d'inscription: ${new Date(memberData.registrationDate).toLocaleString('fr-FR')}
- Adresse IP: ${memberData.registrationIP || 'Inconnue'}

Cette inscription est maintenant visible dans votre panel d'administration.
        `
      };

      // Envoyer l'email
      console.log('📤 Envoi de l\'email de notification...');
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ 🎉 EMAIL ENVOYÉ AVEC SUCCÈS ! 🎉');
        console.log('📧 Message ID:', info.messageId);
        console.log('📧 Destinataire:', process.env.SMTP_USER);
        console.log('📧 Sujet: 🌟 Nouvelle inscription communauté RMR');

        jsonResponse(res, 200, {
          success: true,
          message: 'Email de notification envoyé avec succès',
          messageId: info.messageId,
          recipient: process.env.SMTP_USER,
          timestamp: new Date().toISOString()
        });

      } catch (emailError) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
        console.error('Code d\'erreur:', emailError.code);
        console.error('Message complet:', emailError.message);
        
        jsonResponse(res, 500, {
          error: 'Erreur lors de l\'envoi de l\'email de notification',
          details: emailError.message,
          code: emailError.code,
          timestamp: new Date().toISOString()
        });
      }
      return;
    }

    // Route non trouvée
    jsonResponse(res, 404, {
      error: 'Route non trouvée',
      method: method,
      path: pathname,
      available_routes: [
        'GET /health',
        'POST /api/send-admin-notification'
      ]
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    jsonResponse(res, 500, {
      error: 'Erreur serveur interne',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialiser nodemailer puis démarrer le serveur
initNodemailer().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
    console.log(`📧 Route email: http://localhost:${PORT}/api/send-admin-notification`);
    console.log(`🏥 Route santé: http://localhost:${PORT}/health`);
    console.log(`📁 Variables env: SMTP_USER=${!!process.env.SMTP_USER}, SMTP_PASS=${!!process.env.SMTP_PASS}`);
    console.log(`📧 Nodemailer: ${isNodemailerReady ? 'PRÊT ✅' : 'ERREUR ❌'}`);
    
    if (isNodemailerReady) {
      console.log('🎯 Prêt à envoyer des emails de notification !');
    }
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée:', reason);
});