# Getting Started with FrootWatcher app

## Available Scripts

### `npm start`

Starts react app

### `npm run electron`
Starts electron app
**Note: Check the ways in public/main.js and src/App.js to be sure you are connected to the right server and to the right html**

### `npm build`
Builds final React app version

### `electron-packager D://IT/JavaScript/testingReactAndElectron/testingone FrootWatcher --platform=win32 --arch=x64`
Creates electron desktop app. Be sure you don't have node_modules in it. For MacOS change win32 to darwin. For MacOS you probably will need to do some more actions to make it stable.


## API configs

### Model
```javascript
const mongoose = require('mongoose');
const idvalidator = require('mongoose-id-validator');

const Schema = mongoose.Schema;

const BigBrotherSchema = new Schema({
   user: {
       type: Schema.Types.ObjectId,
   },
    startTime: String,
    stopTime: String,
    totalTime: String,
    startScreen: String,
    stopScreen: String,
    merchant: String
});
BigBrotherSchema.plugin(idvalidator);
const BigBrother = mongoose.model('BigBrother', BigBrotherSchema);
module.exports = BigBrother;
```

### Routers:
```javascript
const express = require('express');
const router = express.Router();
const moment = require('moment')
const BigBrother = require('./models/BigBrother');

    router.get('/', async(req, res) => {
        try {
            const jobs = await BigBrother.find()
            res.send(jobs)
        } catch (err) {
            res.status(400).send({ message: err });
        }
    })

    router.get('/:userId', async(req, res) => {
        try {
            const jobs = await BigBrother.find({user: req.params.userId}).populate("User")
            res.send(jobs)
        } catch (err) {
            res.status(400).send({ message: err });
        }
    })

    router.get('/:userId/lastJob', async(req, res) => {
        try {
            const lastJob = await BigBrother.findOne({user: req.params.userId, stopScreen: null})
            if (lastJob) {
                res.send(lastJob)
            } else {
                res.send({message: "ok"})
            }
        } catch (err) {
            res.status(400).send({ message: err });
        }
    })

    router.delete("/:id", async (req, res) => {
        try {
            await BigBrother.findByIdAndRemove(req.param.id)
            res.send({message: "ok"})
        } catch(err) {
            res.status(400).send({ message: err });
        }
    })

    router.post('/', async (req, res) => {

        try {

            const lastJob = await BigBrother.findOne({user: req.body.user, stopScreen: null})
            if (lastJob) {

                lastJob.stopScreen = req.body.image
                const duration = moment.duration(moment().valueOf() - lastJob.startTime)
                lastJob.totalTime = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`
                lastJob.startTime = moment(lastJob.startTime, "x").format("DD-MM-YYYY_HH:mm:ss")
                lastJob.stopTime = moment().format("DD-MM-YYYY_HH:mm:ss")

                lastJob.save({ validateBeforeSave: false });
            }
            else {
                const bBrother = await new BigBrother()
                bBrother.startScreen = req.body.image
                bBrother.startTime = moment().valueOf()
                bBrother.merchant = req.body.merchant
                bBrother.user = req.body.user
                bBrother.save({ validateBeforeSave: false });

            }

            res.send({message: "success"});
        } catch (err) {
            res.status(400).send({ message: "err" });
        }
    });

module.exports = router;
```

## Additional info

If you need more details on Api side please take a look at the working project [on gitlab attractor school page](https://git.attractor-school.com/esdp_froot.kz/esdp_froot.kz).
