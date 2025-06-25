// scripts/test-email.js (Version ES Modules)
import nodemailer from 'nodemailer';

const testConnection = async () => {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.ionos.fr',
    port: 587,
    secure: false,
    auth: {
      user: 'jean@jhc-developpement.fr',
      pass: 'VOTRE_MOT_DE_PASSE' // ← Remplacez par votre vrai mot de passe
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Test de connexion SMTP Ionos...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');
    
    console.log('🔄 Envoi d\'un email de test...');
    
    // Test d'envoi
    const info = await transporter.sendMail({
      from: '"Test CryptocaVault" <jean@jhc-developpement.fr>',
      to: 'jean@jhc-developpement.fr',
      subject: '🧪 Test SMTP Ionos - CryptocaVault',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
            <h1 style="margin: 0;">🧪 Test SMTP</h1>
            <p style="margin: 10px 0 0 0;">Configuration Ionos réussie !</p>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">✅ Configuration testée :</h3>
            <ul style="color: #666;">
              <li><strong>Serveur SMTP :</strong> smtp.ionos.fr</li>
              <li><strong>Port :</strong> 587</li>
              <li><strong>Sécurité :</strong> STARTTLS</li>
              <li><strong>Email :</strong> jean@jhc-developpement.fr</li>
            </ul>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            Si vous recevez cet email, votre configuration SMTP fonctionne parfaitement !<br>
            Vous pouvez maintenant activer les notifications d'inscription.
          </p>
        </div>
      `
    });
    
    console.log('✅ Email de test envoyé avec succès !');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Vérifiez votre boîte mail : jean@jhc-developpement.fr`);
    
  } catch (error) {
    console.error('❌ Erreur SMTP:', error.message);
    
    // Suggestions de dépannage
    if (error.code === 'EAUTH') {
      console.log('\n🔍 Problème d\'authentification détecté :');
      console.log('   - Vérifiez votre mot de passe email');
      console.log('   - Créez un mot de passe d\'application dans Ionos');
      console.log('   - Vérifiez que l\'authentification SMTP est activée');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔍 Problème de connexion détecté :');
      console.log('   - Vérifiez votre connexion internet');
      console.log('   - Le port 587 est-il bloqué par un firewall ?');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔍 Timeout détecté :');
      console.log('   - Essayez avec le port 465 (secure: true)');
      console.log('   - Vérifiez les paramètres réseau');
    }
  }
};

// Exécuter le test
testConnection();