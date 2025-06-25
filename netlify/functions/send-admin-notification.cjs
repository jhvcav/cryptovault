// netlify/functions/send-admin-notification.cjs
// Version CommonJS avec extension .cjs pour forcer la compatibilité

exports.handler = async (event, context) => {
  console.log('🔍 CJS Function appelée - Method:', event.httpMethod);
  console.log('🔍 Timestamp:', new Date().toISOString());
  
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('📧 Parsing request body...');
    
    let memberData;
    try {
      const body = JSON.parse(event.body || '{}');
      memberData = body.memberData;
      console.log('✅ Body parsed successfully:', memberData);
    } catch (parseError) {
      console.error('❌ Parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'JSON parse error',
          details: parseError.message
        })
      };
    }

    // Récupération IP
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    event.headers['cf-connecting-ip'] ||
                    '127.0.0.1';

    console.log('✅ Données reçues:', {
      username: memberData?.username,
      email: memberData?.email,
      phone: memberData?.phone,
      ip: clientIP
    });

    // Variables d'environnement
    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    console.log('📧 SMTP configuré:', hasSmtp);
    console.log('📧 SMTP_USER présent:', !!process.env.SMTP_USER);

    // Validation des données
    if (!memberData || !memberData.username || !memberData.email) {
      console.error('❌ Données invalides:', memberData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Données manquantes ou invalides',
          required: ['memberData.username', 'memberData.email'],
          received: memberData
        })
      };
    }

    // LOG de l'inscription (TOUJOURS - même si email échoue)
    console.log('📧 NOUVELLE INSCRIPTION:');
    console.log('==========================================');
    console.log('👤 Utilisateur:', memberData.username);
    console.log('📧 Email:', memberData.email);
    console.log('📞 Téléphone:', memberData.phone || 'Non renseigné');
    console.log('🌐 IP:', clientIP);
    console.log('📅 Date:', new Date().toLocaleString('fr-FR'));
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('==========================================');

    // Tentative d'envoi d'email si SMTP configuré
    let emailResult = { success: false, message: 'SMTP non configuré' };
    
    if (hasSmtp) {
      try {
        console.log('📤 Chargement de nodemailer...');
        const nodemailer = require('nodemailer');
        
        console.log('📤 Configuration transporter...');
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

        console.log('📤 Test de connexion SMTP...');
        await transporter.verify();
        console.log('✅ Connexion SMTP vérifiée');

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
                    <td style="padding: 12px 0; color: #333;">${new Date().toLocaleString('fr-FR')}</td>
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
- Adresse IP: ${clientIP}
- Date d'inscription: ${new Date().toLocaleString('fr-FR')}

Cette inscription est maintenant visible dans votre panel d'administration.
          `
        };

        console.log('📤 Envoi de l\'email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé avec succès:', info.messageId);
        
        emailResult = {
          success: true,
          messageId: info.messageId,
          recipient: process.env.SMTP_USER
        };

      } catch (emailError) {
        console.error('❌ Erreur email:', emailError);
        emailResult = {
          success: false,
          error: emailError.message
        };
      }
    }

    // Réponse de succès (inscription loggée même si email échoue)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Inscription traitée avec succès',
        memberData: {
          username: memberData.username,
          email: memberData.email,
          phone: memberData.phone || 'Non renseigné',
          ip: clientIP,
          timestamp: new Date().toISOString()
        },
        email: emailResult,
        smtpConfigured: hasSmtp,
        functionVersion: 'cjs-v1.0'
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur interne de la fonction',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};