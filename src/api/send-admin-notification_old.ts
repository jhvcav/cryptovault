//src/api/send-admin-notification.ts
import nodemailer from 'nodemailer';

// Interface pour les données du membre
interface MemberData {
  username: string;
  last_name: string;
  first_name: string;
  email: string;
  phone?: string;
  referrer_name?: string;
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
                <td style="padding: 12px 0; font-weight: bold; color: #555; width: 30%;">👤 Nom :</td>
                <td style="padding: 12px 0; color: #333;">${memberData.last_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555; width: 30%;">👤 Prénom:</td>
                <td style="padding: 12px 0; color: #333;">${memberData.first_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-weight: bold; color: #555; width: 30%;">👤 Nom contact:</td>
                <td style="padding: 12px 0; color: #333;">${memberData.referrer_name}</td>
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

// Export par défaut pour Next.js API routes (si utilisé)
export default sendAdminNotificationHandler;