const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendConnectionRequestEmail = async (toEmail, fromUserName, fromUserId) => {
  try {
    await resend.emails.send({
      from: 'BrewNet <notifications@brewnet.in>',
      to: toEmail,
      subject: 'New Connection Request on BrewNet! ☕',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513;">New Connection Request!</h2>
          <p>Hello! 👋</p>
          <p><strong>${fromUserName}</strong> would like to connect with you on BrewNet.</p>
          <p>Click the button below to view their profile and respond to this request:</p>
          <!--<a href="http://localhost:3000/profile/${fromUserId}" -->
          <!-- TODO: Change the link to the actual profile page -->
          <a href="https://brewnet.in/profile/${fromUserId}"
             style="display: inline-block; 
                    background-color: #8B4513; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;">
            View Profile & Respond
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            - The BrewNet Team ☕
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendConnectionAcceptedEmail = async (toEmail, acceptedByName, acceptedByUserId) => {
  try {
    await resend.emails.send({
      from: 'BrewNet <notifications@brewnet.in>',
      to: toEmail,
      subject: 'Connection Accepted on BrewNet! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B4513;">Connection Accepted!</h2>
          <p>Great news! 🎉</p>
          <p><strong>${acceptedByName}</strong> has accepted your connection request on BrewNet.</p>
          <p>You can now start chatting and plan your coffee meetup!</p>
          <!--<a href="http://localhost:3000/chat/${acceptedByUserId}" -->
          <a href="https://brewnet.in/chat/${acceptedByUserId}"
             style="display: inline-block; 
                    background-color: #8B4513; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;">
            Start Chat
          </a>
          <p style="margin-top: 10px;">
            <!--<a href="http://localhost:3000/profile/${acceptedByUserId}" -->
            <a href="https://brewnet.in/profile/${acceptedByUserId}"
               style="color: #8B4513; text-decoration: underline;">
              View ${acceptedByName}'s Profile
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            - The BrewNet Team ☕
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail
}; 