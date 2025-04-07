const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sabarim6369@gmail.com',
    pass: 'yifi jcyj uawz wmdv',
  },
});

exports.sendreport = async (req, res) => {
  const { name, title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="background-color: #FF6B6B; color: white; padding: 20px 30px;">
          <h2 style="margin: 0;">🚨 New Report Submitted</h2>
        </div>
        <div style="padding: 30px;">
          <p><strong>Name:</strong> ${name || 'Anonymous'}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #FF6B6B;">
            ${description.replace(/\n/g, '<br/>')}
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #888;">Submitted via Report System</p>
        </div>
      </div>
    </div>
  `;
  const recipients = ['sabarim6369@gmail.com', 'hellothogts@gmail.com',"saravanakarthiek14@gmail.com"];

  const mailOptions = {
    from: 'sabarim6369@gmail.com',
    to: recipients.join(','),
    subject: `New Report: ${title}`,
    html: htmlContent,
  };
  

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Report sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send report', error });
  }
};
