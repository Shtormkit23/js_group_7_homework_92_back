const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    message: {
        type: String,
        required: [true, "Поле message обязательно для заполнения"],
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;