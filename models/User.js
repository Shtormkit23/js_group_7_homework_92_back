const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {nanoid} = require("nanoid");

const SALT_WORK_FACTOR = 10;

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, "Поле username обязательно для заполнения"],
        unique: true,
        validate: {
            validator: async (value) => {
                const user = await User.findOne({username: value});
                if (user) return false;
            },
            message: (props) => `Пользователь ${props.value} уже существует`
        }
    },
    email: {
        type: String,
        required: [true, "Поле email обязательно для заполнения"],
        unique: true,
        validate: {
            validator: async (value) => {
                const user = await User.findOne({email: value});
                if (user) return false;
            },
            message: (props) => `Почта ${props.value} уже используется`
        }
    },
    password: {
        type: String,
        required: [true, "Поле password обязательно для заполнения"],
        minlength: [8, "Минимальная длина пароля 8 символов"],
        validate: {
            validator: (value) => {
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/g.test(value);
            },
            message: "Пароль слишком простой"
        }
    },
    token: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "user",
        enum: ["user", "admin"]
    },
    facebookId: String,
    displayName: String
});

UserSchema.path("email").validate(value => {
    return /^[\w-.]+@(\b[a-z-]+\b)[^-].[a-z]{2,10}$/g.test(value);
}, "Введите правильный почтовый ящик");

UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
});

UserSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
});

UserSchema.methods.checkPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateToken = function() {
    this.token = nanoid();
};

const User = mongoose.model("User", UserSchema);

module.exports = User;