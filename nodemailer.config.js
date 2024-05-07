const nodemailer = require('nodemailer')
require('dotenv').config()

const user = process.env.email;
const pass = process.env.password;

var transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass
    }
});

module.exports.bookingConfirmationEmail = (name, email, time) => {
    const timing = new Date(time);
    transport.sendMail({
        from: user,
        to: email,
        subject: `Booking Confirmation`,
        html: `<h2>Hello ${name}</h2>
        <p>Your slot has been booked at the requested charging station at ${timing.toLocaleString()}</p>
        <h5>Regards</h5>`
        
    }).catch(err => console.log(err));
}

