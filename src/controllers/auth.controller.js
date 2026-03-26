const AuthService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/jwt');

exports.signup = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await AuthService.signup(email, password);
    const token = generateToken(user);

    res.status(201).json({
        success: true,
        token
    });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await AuthService.login(email, password);

    const token = generateToken(user);

    res.json({
        success: true,
        token
    });
});
