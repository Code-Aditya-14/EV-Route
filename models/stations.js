const mongoose = require('mongoose')

const StationsSchema = new mongoose.Schema(
    {
        ID : {
            type: String,
            required: true,
            unique: true
        },
        username: {
			type: String,
			required: true,
			unique: true
		},
        password: { 
			type: String, 
			required: true 
		},
        title : {
            type: String, 
			required: true 
        },
        town : {
            type: String,
            required: true
        },
        state : {
            type: String,
            required: true
        },
        NoOfPoints : {
            type: Number,
            required: true
        },
        consumerN : {
            type : [String]
        },
        consumerPh : {
            type : [String]
        },
        consumerE : {
            type : [String]
        },
        Timing : {
            type : [Date]
        }
    }, 
    {
        collection: 'stations'
    }
)

const model = mongoose.model('StationsSchema', StationsSchema)
module.exports = model