const Admin = require('../models/adminModel');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const postmark = require("postmark");
const process = require("node:process");
const console = require("node:console");
const cssLocation = "./templates/tailwind_output.css";
const {compileTemplateWithTailwind} = require("../helper");

const client = new postmark.ServerClient(process.env.POSTMARK_EMAIL_KEY);

// @desc Auth admin
// @route POST /api/v1/admin/auth
exports.checkAdmin = async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({msg: 'Please enter all fields'});
        }

        const admin = await Admin.findOne({username}).exec();

        if (!admin) return res.status(400).json({msg: 'Admin does not exist'});
        if (admin.activatedEmail === false) return res.status(400).json({msg: 'Email not verified'});

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(400).json({msg: 'Invalid credentials'});
        console.log(admin);

        jwt.sign(
            {...admin, role: admin.role, id: admin.id},
            process.env.JWT_SECRET,
            {expiresIn: '365d'},
            (err, token) => {
                if (err) throw err;

                return res.json({
                    token,
                    admin: {
                        ...admin.toJSON(),
                        id: admin.id,
                    }
                });
            }
        );

    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);

            return res.status(400).json({
                success: false,
                error: messages
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Internal Server Error'
            });
        }
    }
}

// @desc Auth admin confirm email
// @route POST /api/v1/admin/auth/confirm-code
exports.checkAdminVerification = async (req, res, next) => {
    try {
        const {username, code} = req.body;

        if (!username || !code) {
            return res.status(400).json({msg: 'Please enter all fields'});
        }

        Admin.findOne({username})
            .then(async (user) => {
                if (!user) return res.status(400).json({msg: 'Admin does not exist'});

                const userNew = await Admin.findByIdAndUpdate(user._id, {
                    activatedEmail: true
                }, {new: true});

                jwt.sign(
                    {id: user.id},
                    process.env.JWT_SECRET,
                    {expiresIn: '7d'},
                    (err, token) => {
                        if (err) throw err;
                        res.json({
                            token,
                            admin: {
                                id: userNew.id,
                                firstName: userNew.firstName,
                                lastName: userNew.lastName,
                                username: userNew.username,
                                country: userNew.country,
                                gender: userNew.gender,
                                userType: userNew.userType,
                                image: userNew.image,
                                organization: userNew.organization,
                                phone: userNew.phone,
                                activatedEmail: userNew.activatedEmail,
                                activatedPhone: userNew.activatedPhone,
                                accountActive: userNew.accountActive,
                                createdAt: userNew.createdAt
                            }
                        });
                    }
                );
            });

    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);

            return res.status(400).json({
                success: false,
                error: messages
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Internal Server Error'
            });
        }
    }
}

// @desc Auth admin confirm email
// @route POST /api/v1/admin/create
exports.createAdmin = async (req, res, next) => {
    try {
        const {firstName, lastName, name, email, role} = req.body;
        console.log(req.body);
        const newAdmin = new Admin({
            firstName, lastName,
            name,
            email,
            role,
            activated: false,
        });
        const savedAdmin = await newAdmin.save();
        return res.status(201).json(savedAdmin);
    } catch (e) {
        console.log(e);
        return res.status(500).send('Internal Server Error');
    }
}

// @desc Activate admin account
// @route POST /api/v1/admin/invite/:id
exports.sendAdminInvite = async (req, res, next) => {

    try {
        const {id} = req.params;
        const {host} = req.body;
        console.log(id);
        const admin = await Admin.findById(id).exec();
        const actionCode = jwt.sign({admin}, process.env.JWT_SECRET, {expiresIn: '24h'});
        const url = `${host  || 'https://lexstayz-admin.vercel.app'}/register?oob=${actionCode}`
        const message = compileTemplateWithTailwind(
            './templates/admin_invite.html',
            cssLocation,
            {firstName: admin.firstName, lastName: admin.lastName, role: admin.role, url: url},
        )
        const emailSend = await client.sendEmail(
            {
                "From": "thelexstayzteam@fadorteclimited.com",
                "To": admin.email,
                "Subject": "Admin Invite",
                "HtmlBody": message,
                "MessageStream": "outbound"
            }
        )
        return res.status(200).json({
            success: true,
            message: 'Invitation sent successfully',
            actionCode: actionCode,
            url: `https://lexstayz-admin.vercel.app/register?oob=${actionCode}`
        });
    } catch (e) {
        console.log(e);
        return res.status(500).send('Internal Server Error');
    }
}


// @desc Process admin invite
// @route GET /api/v1/admin/invite/:id
exports.processAdminInvite = async (req, res, next) => {
    try {
        const admin = jwt.verify(req.params.id, process.env.JWT_SECRET);
        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid token or token expired'
        });
    }
};

// @desc Activate admin account
// @route POST /api/v1/admins/activate
exports.activateAdmin = async (req, res, next) => {
    try {
        const {username, email, password} = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({msg: 'Please enter all required fields.'});
        }

        const admin = await Admin.findOne({email});

        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }

        if (admin.password) {
            return res.status(400).json({
                success: false,
                error: 'Account is already activated'
            });
        }
        const salt = await bcrypt.genSalt(10);

        const hash = await bcrypt.hash(password, salt);
        admin.username = username;
        admin.password = hash;
        admin.activated = true;
        await admin.save();

        const message = compileTemplateWithTailwind(
            './templates/admin_registration_complete.html',
            cssLocation,
            {firstName: admin.firstName, lastName: admin.lastName, role: admin.role},
        )
        const emailSend = await client.sendEmail(
            {
                "From": "thelexstayzteam@fadorteclimited.com",
                "To": admin.email,
                "Subject": "Admin Registration Activated",
                "HtmlBody": message,
                "MessageStream": "outbound"
            }
        )

        return res.status(200).json({
            success: true,
            message: 'Account activated',
            data: admin,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
};
