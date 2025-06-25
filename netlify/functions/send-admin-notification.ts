//src/api/send-admin-notification.ts
import nodemailer from 'nodemailer';

// Interface pour les données du membre
interface MemberData {
  username: string;
  email: string;
  phone?: string;
  registrationDate: string;
  registrationIP?: string;
}

// Interface pour la requête
interface ApiRequest {
  body: {
    memberData: MemberData;
  };
}

// Interface pour la réponse
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
}

// Fonction principale exportée
export const sendAdminNotificationHandler = async (req: ApiRequest, res: ApiResponse) => {
  try {
    const { memberData } = req.body;

    // Validation des données
    if (!memberData || !memberData.username || !memberData.email) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        required: ['memberData.username', 'memberData.email'] 
      });
    }

    // Configuration SMTP Ionos
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.fr',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Vérifier la configuration SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Variables SMTP manquantes');
      return res.status(500).json({ 
        error: 'Configuration SMTP manquante',
        details: 'Vérifiez SMTP_USER et SMTP_PASS dans .env' 
      });
    }

    // Contenu de l'email
    const mailOptions = {
      from: '"CryptocaVault" <jean@jhc-developpement.fr>',
      to: 'jean@jhc-developpement.fr',
      subject: '🌟 Nouvelle inscription communauté RMR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Nouvelle Inscription</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Communauté RMR-M</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📋 Informations du nouveau membre</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
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

          <div style="text-align: center; padding: 20px; border-top: 2px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Email automatique envoyé par la plateforme CryptocaVault<br>
              <small>jhc-developpement.fr</small>
            </p>
          </div>
        </div>
      `
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);

    return res.status(200).json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error.message 
    });
  }
};

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  console.log('📧 Netlify Function appelée');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));

  // Headers CORS pour toutes les réponses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Gérer les requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Permettre seulement les requêtes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Récupérer l'IP du client
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    event.headers['cf-connecting-ip'] ||
                    context.clientContext?.ip || 
                    '127.0.0.1';
    
    console.log('🌐 IP du client:', clientIP);

    // Parser les données
    let memberData;
    try {
      const body = JSON.parse(event.body);
      memberData = body.memberData;
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON format',
          details: parseError.message
        })
      };
    }

    // Validation des données
    if (!memberData || !memberData.username || !memberData.email) {
      console.error('❌ Données manquantes:', memberData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Données manquantes',
          required: ['memberData.username', 'memberData.email'],
          received: memberData
        })
      };
    }

    console.log('📧 Nouvelle inscription:', {
      username: memberData.username,
      email: memberData.email,
      phone: memberData.phone || 'Non renseigné',
      ip: clientIP
    });

    // Vérifier les variables d'environnement
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Variables SMTP manquantes');
      console.log('SMTP_USER présent:', !!process.env.SMTP_USER);
      console.log('SMTP_PASS présent:', !!process.env.SMTP_PASS);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration SMTP manquante',
          details: 'Variables SMTP_USER et SMTP_PASS non configurées'
        })
      };
    }

    // Configuration SMTP
    console.log('🔧 Configuration SMTP...');
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.fr',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test de connexion SMTP
    console.log('🔍 Test connexion SMTP...');
    try {
      await transporter.verify();
      console.log('✅ Connexion SMTP vérifiée');
    } catch (verifyError) {
      console.error('❌ Erreur connexion SMTP:', verifyError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Connexion SMTP échouée',
          details: verifyError.message,
          code: verifyError.code
        })
      };
    }

    // Contenu de l'email
    const mailOptions = {
      from: `"CryptocaVault Notifications" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
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
                <td style="padding: 12px 0; color: #333;">${clientIP}</td>
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
- Adresse IP: ${clientIP}

Cette inscription est maintenant visible dans votre panel d'administration.
      `
    };

    // Envoyer l'email
    console.log('📤 Envoi email...');
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé avec succès:', info.messageId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email de notification envoyé avec succès',
          messageId: info.messageId,
          recipient: process.env.SMTP_USER,
          ip: clientIP,
          timestamp: new Date().toISOString()
        })
      };

    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Erreur lors de l\'envoi de l\'email',
          details: emailError.message,
          code: emailError.code,
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    console.error('❌ Erreur Netlify Function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur interne',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export par défaut pour Next.js API routes (si utilisé)
export default sendAdminNotificationHandler;