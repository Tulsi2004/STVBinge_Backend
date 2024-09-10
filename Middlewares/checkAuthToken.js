const jwt = require('jsonwebtoken');

function checkAuthToken(req, res, next) {
    const authToken = req.cookies.authToken;
    const refreshToken = req.cookies.refreshToken;

    //check auth token
    //check refresh 
    //auth token is not expired -> user logged in

    //user not logged in
    //if auth token is expired but refresh token is not -> regenerate authtoken and refresh token 
    //if auth token is expired and refresh token is expired -> redirect to login page


    if (!authToken || !refreshToken) {
        return res.status(401).json({ message: 'Authentication failed: No authToken or refreshToken provided' , ok : false });
    }

    jwt.verify(authToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            // Auth token has expired


            //check refresh token
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (refreshErr, refreshDecoded) => {
                if (refreshErr) {
                    // Both tokens are invalid, send an error message and prompt for login
                    return res.status(401).json({ message: 'Authentication failed: Both tokens are invalid', ok: false });
                }
                else{
                    // Generate new auth and refresh tokens
                    const newAuthToken = jwt.sign({ userId: refreshDecoded.userId }, process.env.JWT_SECRET_KEY, { expiresIn: '50m' });
                    const newRefreshToken = jwt.sign({ userId: refreshDecoded.userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '60m' });


                    // Set the new tokens as cookies in the response
                    res.cookie('authToken', newAuthToken, { httpOnly: true });
                    res.cookie('refreshToken', newRefreshToken, { httpOnly: true });

                    // Continue processing the request with the new auth token
                    req.userId = refreshDecoded.userId;
                    req.ok = true;
                    next();
                }

            })
            //1. expired
            //2. not expired

        }
        else{
            // Auth token is valid, continue with the request
            req.userId = decoded.userId;
            next();
        }

    })

}

module.exports = checkAuthToken;