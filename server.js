const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Stations = require('./models/stations')
// const nodemailer = require('./nodemailer.config')
require('dotenv').config()

const DB = process.env.DB;
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(`DB connection successful`);
}).catch((err) => console.log(err));

const JWT_SECRET = "hfkadhskjh95093ufhaoihgav%";

const app = express()
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, 'static')))
app.use('/login', express.static(path.join(__dirname, 'static/login.html')))
app.use('/booking', express.static(path.join(__dirname, 'static/booking.html')))
app.use('/details', express.static(path.join(__dirname, 'static/details.html')))
app.use('/enquiry', express.static(path.join(__dirname, 'static/enquiry.html')))

// apis
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body
    if (!username || typeof username !== 'string') {
        return res.json({ status: 'error', idx: '1', error: 'Invalid username/password' });
    }
    if (!password || typeof password !== 'string') {
        return res.json({ status: 'error', idx: '1', error: 'Invalid username/password' });
    }

    const user = await Stations.findOne({ username }).lean()
    if (!user) {
        return res.json({ status: 'error', idx: '1', error: 'Invalid username/password' })
    }

    if (password == user.password) {
        // the username, password combination is successful

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                ID: user.ID
            },
            JWT_SECRET,
            {
                expiresIn: 3600,
            },
        )
        console.log(token)
        return res.json({ status: 'ok', data: token, ID: user.ID })
    }
    res.json({ status: 'error', idx: '1', error: 'Invalid username/password' });
})

let bookings = [];

app.post('/api/book', async (req, res) => {
    const { name, phone, email, evstation, startTime, endTime } = req.body
    const user = await Stations.findOne({ ID: evstation }).lean()
    if (!user) {
        return res.json({ status: 'error', idx: '1', error: 'Please Select an EV-Station' })
    }



    // console.log(user)

    const date1 = new Date(startTime);
    const date2 = new Date();
    if (!startTime || date1 - date2 <= 0) {
        return res.json({ status: 'failed', idx: '3', error: 'Future time should selected' });
    }
    bookings.push({ name, phone, email, evstation, startTime, endTime });

    return res.json({ status: 'ok' })

    // try {
    //     var cnt = 0;
    //     console.log(cnt)
    //     console.log(user.Timing)
    //     for (var i = 0; i < (user.Timing).length; i++) {
    //         const timedif = Math.abs(user.Timing[i] - timing);
    //         console.log(timedif);
    //         if (timedif < 1000 * 60 * 60) {
    //             cnt++;
    //         }
    //     }
    //     console.log(cnt, user.NoOfPoints)
    //     if (cnt >= user.NoOfPoints) {
    //         return res.json({ status: 'failed', idx: '10', error: 'Slots already booked.' });
    //     }
    //     else {
    //         const result = await Stations.updateOne(
    //             {
    //                 ID: evstation
    //             },
    //             {
    //                 $push: {
    //                     consumerN: name,
    //                     consumerPh: phone,
    //                     consumerE: email,
    //                     Timing: timing
    //                 }
    //             }
    //         );
    //         console.log(result)
    //         if (result.acknowledged === true) {
    //             return res.json({ status: 'ok' })
    //         }
    //         return res.json({ status: 'failed', idx: '10', error: 'Slots already booked' });
    //     }
    // } catch (err) {
    //     return res.json({ status: 'failed', idx: '10', error: err });
    // }
})

async function checkAvailability(evstation, startTime, endTime, booking) {
    const users = await Stations.findOne({ ID: evstation }).lean()
    const stDate = new Date(startTime);
    const enDate = new Date(endTime);
    if (users) {
        const timings = users.Timing;
        const timingCounts = new Map();

        timings.forEach(timing => {
            // Convert the timing to a string to use as the Map key
            const timestampString = timing.toString();

            if (timingCounts.has(timestampString)) {
                // If the timestamp exists in the Map, increment its count
                timingCounts.set(timestampString, timingCounts.get(timestampString) + 1);
            } else {
                // If the timestamp doesn't exist in the Map, set its count to 1
                timingCounts.set(timestampString, 1);
                
            }
        });

        console.log(timingCounts)
        let curTime = new Date(stDate)
        while (curTime < enDate) {
            const strTime = curTime.toString();
            console.log(strTime)
            // console.log(curTime, timingCounts.get(curTime))
            if (timingCounts.get(strTime) === undefined || (timingCounts.get(strTime) < users.NoOfPoints)) {
                console.log(timingCounts.get(strTime), users.NoOfPoints)
                try {
                    const result = await Stations.updateOne(
                        {
                            ID: booking.evstation
                        },
                        {
                            $push: {
                                consumerN: booking.name,
                                consumerPh: booking.phone,
                                consumerE: booking.email,
                                Timing: curTime
                            }
                        }
                    );
                    // console.log(result)
                    // nodemailer.bookingConfirmationEmail(booking.name, booking.email, curTime);
                } catch (error) {
                    console.error('Error occurred:', error);
                }
                break;
            }

            curTime.setHours(curTime.getHours() + 1);
        }
        return "-1";
    }

}

setInterval(() => {
    bookings.sort((a, b) => {
        if (a.startTime !== b.startTime) {
            return a.startTime - b.startTime;
        }
        let durA = a.endTime - a.startTime;
        let durB = b.endTime - b.startTime;
        return durA - durB;
    })
    console.log(bookings)
    for (var i = 0; i < bookings.length; i++) {
        console.log(bookings)
        let time = checkAvailability(bookings[i].evstation, bookings[i].startTime, bookings[i].endTime, bookings[i]);
        console.log(time)
        if (time == "-1") {
            // noSlotMail(booking.name, booking.email)
            continue;
        }
        
    }
    bookings = []
}, 30000);
// 10000

app.post('/api/getDetails', async (req, res) => {
    const { ID } = req.body
    try {
        const user = await Stations.findOne({ ID }).lean()
        return res.json({ status: 'ok', name: user.consumerN, phone: user.consumerPh, email: user.consumerE, timing: user.Timing })
    } catch (err) {
        return res.json({ status: 'failed', idx: '10', error: 'Invalid Charging station' });
    }
})

var port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server at ${port}`)
})