const jwt = require('jsonwebtoken');


exports.authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) return res.status(401).json({msg: 'No token, authorization denied'});

    try {
        const body = req.body;
        const bearer = token.split(' ');
        const bearerToken = bearer[1];

        // Verify token
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        // Find the scanner from payload
        const user = decoded;

        req.user = user;
        next();

    } catch (error) {
        console.log(error);
        res.status(403).json({msg: 'Token is not valid'});
    }
}
